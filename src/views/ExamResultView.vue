<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBankStore } from '@/stores/bank'
import { useHistoryStore } from '@/stores/history'
import { useExamStore } from '@/stores/exam'
import { SECTIONS, SECTION_META } from '@/types'
import type { Section } from '@/types'
import { MODE_META } from '@/core/scoring'
import { formatDateTime, formatDuration } from '@/core/format'
import { pushToast } from '@/core/toast'
import ScoreRing from '@/components/ScoreRing.vue'
import RadarChart from '@/components/RadarChart.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import TagPill from '@/components/TagPill.vue'
import EmptyState from '@/components/EmptyState.vue'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const router = useRouter()
const bank = useBankStore()
const history = useHistoryStore()
const exam = useExamStore()

const loading = ref(!bank.loaded)
const reviewFilter = ref<'all' | Section>('all')
const onlyWrong = ref(false)

const recordId = computed(() => String(route.params.id))
const record = computed(() => history.get(recordId.value) ?? (exam.lastRecord?.id === recordId.value ? exam.lastRecord : undefined))

const radarData = computed(() =>
  SECTIONS.map((section) => {
    const result = record.value?.sections.find((item) => item.section === section)
    return { label: SECTION_META[section].short, value: result ? Math.round(result.accuracy * 100) : 0 }
  }),
)

const weakTags = computed(() => record.value?.weakTags ?? [])
const strongTags = computed(
  () => record.value?.tagResults.filter((tag) => tag.total >= 2 && tag.accuracy >= 0.8).slice(0, 5) ?? [],
)
const recommendations = computed(() => (record.value ? exam.recommendationsFor(record.value) : []))

const availableSections = computed(() => SECTIONS.filter((section) => record.value?.sections.some((item) => item.section === section)))

const reviewItems = computed(() => {
  if (!record.value) return []
  return record.value.answers
    .filter((answer) => reviewFilter.value === 'all' || answer.section === reviewFilter.value)
    .filter((answer) => !onlyWrong.value || !answer.correct)
    .map((answer) => ({
      answer,
      question: bank.questionById[answer.questionId],
      sectionMeta: SECTION_META[answer.section],
    }))
    .filter((item) => Boolean(item.question))
})

const verdict = computed(() => {
  if (!record.value) return ''
  if (record.value.score >= 85) return '表现出色，能力稳定'
  if (record.value.score >= 70) return '基础扎实，继续拔高'
  if (record.value.score >= 60) return '达到合格线，仍有提升空间'
  return '基础需要补强，建议专项练习'
})

const verdictText = computed(() => {
  if (!record.value) return ''
  return `本次共作答 ${record.value.questionCount} 题，答对 ${record.value.correctCount} 题，正确率 ${Math.round(record.value.accuracy * 100)}%。CEFR 估算为 ${record.value.cefr}。`
})

const modeLabel = computed(() => {
  if (!record.value) return ''
  if (record.value.mode === 'section' && record.value.config.section) {
    return `专项测评 · ${SECTION_META[record.value.config.section].name}`
  }
  return MODE_META[record.value.mode].name
})

function scoreTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

function sectionResult(section: Section) {
  return record.value?.sections.find((item) => item.section === section)
}

function contextFor(item: { answer: { questionId: string }; question?: { section: Section; passageId?: string; setId?: string } }) {
  const question = item.question
  if (!question) return null
  if (question.section === 'reading' && question.passageId) {
    return { type: 'reading' as const, passage: bank.passage(question.passageId) }
  }
  if (question.section === 'listening' && question.setId) {
    return { type: 'listening' as const, set: bank.listeningSet(question.setId) }
  }
  return null
}

async function retake(): Promise<void> {
  if (!record.value) return
  try {
    if (!bank.loaded) await bank.load()
    exam.startNew(record.value.mode, record.value.config.section)
    router.push('/exam/run')
  } catch (error) {
    pushToast(error instanceof Error ? error.message : '无法开始考试', 'error')
  }
}

function practiceWeak(): void {
  const first = weakTags.value[0]
  if (first) {
    router.push(`/practice/run?section=${first.section}&count=10`)
  } else {
    router.push('/practice')
  }
}

function printReport(): void {
  window.print()
}

onMounted(async () => {
  if (!bank.loaded) {
    try {
      await bank.load()
    } catch (error) {
      pushToast(error instanceof Error ? error.message : '题库加载失败', 'error')
    }
  }
  loading.value = false
})
</script>

<template>
  <div v-if="loading" class="loading-screen">
    <span class="spinner" />
    <p class="text-sm muted">正在生成成绩报告…</p>
  </div>

  <EmptyState
    v-else-if="!record"
    title="没有找到这次考试记录"
    text="记录可能已被清除，或链接不完整。请从历史记录中打开报告。"
    icon="file-text"
  >
    <router-link class="btn btn-primary btn-sm" to="/history">查看历史记录</router-link>
    <router-link class="btn btn-secondary btn-sm" to="/exam">重新考试</router-link>
  </EmptyState>

  <div v-else class="stack-lg">
    <section class="result-hero">
      <div class="result-score-block">
        <ScoreRing :score="record.score" :cefr="record.cefr" />
        <span class="result-score-caption">{{ formatDateTime(record.finishedAt) }}</span>
      </div>

      <div class="result-summary">
        <span class="eyebrow"><Icon name="award" :size="13" />成绩报告</span>
        <h2>{{ verdict }}</h2>
        <p>{{ verdictText }}</p>
        <div class="hero-meta">
          <span class="tag-pill">{{ modeLabel }}</span>
          <span class="tag-pill">{{ record.month }}</span>
          <span class="tag-pill">用时 {{ formatDuration(record.durationSec) }}</span>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary btn-sm" type="button" @click="retake">
            <Icon name="refresh" :size="15" />
            再考一次
          </button>
          <button class="btn btn-secondary btn-sm" type="button" @click="practiceWeak">
            <Icon name="target" :size="15" />
            练薄弱点
          </button>
          <button class="btn btn-ghost btn-sm" type="button" @click="printReport">
            <Icon name="file-text" :size="15" />
            打印 / 存 PDF
          </button>
          <router-link class="btn btn-ghost btn-sm" to="/">
            <Icon name="home" :size="15" />
            返回首页
          </router-link>
        </div>
      </div>

      <div class="result-radar">
        <RadarChart :data="radarData" :size="230" />
        <span class="result-radar-label">四项正确率</span>
      </div>
    </section>

    <section class="result-section-grid">
      <article v-for="section in SECTIONS" :key="section" class="section-result-card">
        <div class="section-result-head">
          <span class="section-badge" :class="section">
            <Icon :name="SECTION_META[section].icon" :size="12" />
            {{ SECTION_META[section].short }}
          </span>
          <TagPill v-if="sectionResult(section)" :tag="sectionResult(section)!.cefr" :tone="scoreTone(sectionResult(section)!.score)" />
          <span v-else class="tag-pill tag-muted">未考</span>
        </div>
        <template v-if="sectionResult(section)">
          <div class="section-result-score">
            {{ sectionResult(section)!.score }}<small> / 100</small>
          </div>
          <div class="progress mt-2">
            <span class="progress-fill" :style="{ width: `${Math.round(sectionResult(section)!.accuracy * 100)}%` }" />
          </div>
          <div class="section-result-meta">
            <span>{{ sectionResult(section)!.correct }}/{{ sectionResult(section)!.total }} 正确</span>
            <span>能力值 {{ sectionResult(section)!.theta.toFixed(1) }}</span>
          </div>
        </template>
        <p v-else class="text-xs muted mt-3">本次未测试该模块</p>
      </article>
    </section>

    <section class="result-layout">
      <div class="card card-pad">
        <div class="card-head">
          <div>
            <h3>逐题解析</h3>
            <p>{{ reviewItems.length }} 道题符合当前筛选</p>
          </div>
          <span class="tag-pill">{{ record.correctCount }}/{{ record.questionCount }} 正确</span>
        </div>

        <div class="review-toolbar">
          <button class="chip" :class="{ 'is-active': reviewFilter === 'all' }" type="button" @click="reviewFilter = 'all'">全部</button>
          <button
            v-for="section in availableSections"
            :key="section"
            class="chip"
            :class="{ 'is-active': reviewFilter === section }"
            type="button"
            @click="reviewFilter = section"
          >
            {{ SECTION_META[section].short }}
          </button>
          <button class="chip" :class="{ 'is-active': onlyWrong }" type="button" @click="onlyWrong = !onlyWrong">
            <Icon name="x" :size="12" />
            只看错题
          </button>
        </div>

        <div v-if="reviewItems.length > 0" class="review-list">
          <article v-for="(item, index) in reviewItems" :key="item.answer.questionId" class="review-item">
            <div class="review-item-head">
              <span class="section-badge" :class="item.answer.section">
                <Icon :name="item.sectionMeta.icon" :size="12" />
                {{ item.sectionMeta.short }}
              </span>
              <strong>第 {{ index + 1 }} 题</strong>
              <span class="review-status">
                <TagPill :tag="item.answer.correct ? '正确' : '错误'" :tone="item.answer.correct ? 'success' : 'danger'" />
              </span>
            </div>
            <div class="review-item-body">
              <details v-if="contextFor(item)?.type === 'reading'" class="review-passage">
                <summary>展开阅读原文：{{ contextFor(item)?.passage?.title }}</summary>
                <p>{{ contextFor(item)?.passage?.text }}</p>
              </details>
              <div v-else-if="contextFor(item)?.type === 'listening'" class="mb-3">
                <AudioPlayer
                  :turns="contextFor(item)?.set?.turns"
                  :script="contextFor(item)?.set?.script"
                  :max-plays="0"
                  :rate="0.95"
                  label="听力原文"
                  reveal
                />
              </div>
              <QuestionCard
                v-if="item.question"
                :question="item.question"
                :selected="item.answer.selected"
                :index="index + 1"
                reveal
                disabled
              />
            </div>
          </article>
        </div>
        <EmptyState v-else title="没有符合条件的题目" text="试试切换筛选条件，或关闭“只看错题”。" icon="filter" />
      </div>

      <aside class="stack">
        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>学习建议</h3>
              <p>根据本次作答自动生成</p>
            </div>
            <Icon name="spark" :size="18" class="muted" />
          </div>
          <div class="recommendation-list">
            <div v-for="(item, index) in recommendations" :key="index" class="recommendation-item">
              <strong><Icon name="target" :size="13" />{{ item.title }}</strong>
              <p>{{ item.text }}</p>
            </div>
          </div>
        </div>

        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>薄弱考点</h3>
              <p>正确率低于 60% 且作答 ≥2 次</p>
            </div>
          </div>
          <div v-if="weakTags.length > 0" class="row" style="flex-wrap: wrap">
            <TagPill v-for="tag in weakTags" :key="`${tag.section}-${tag.tag}`" :tag="tag.tag" tone="danger" :count="`${tag.correct}/${tag.total}`" />
          </div>
          <p v-else class="text-sm muted">本次没有明显的薄弱考点。</p>

          <template v-if="strongTags.length > 0">
            <hr class="divider" />
            <h3 class="text-sm mb-2">优势考点</h3>
            <div class="row" style="flex-wrap: wrap">
              <TagPill v-for="tag in strongTags" :key="`strong-${tag.section}-${tag.tag}`" :tag="tag.tag" tone="success" :count="`${tag.correct}/${tag.total}`" />
            </div>
          </template>
        </div>

        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>考试信息</h3>
              <p>本机保存的记录</p>
            </div>
          </div>
          <div class="exam-summary">
            <div class="summary-row"><span>模式</span><strong>{{ modeLabel }}</strong></div>
            <div class="summary-row"><span>开始时间</span><strong>{{ formatDateTime(record.startedAt) }}</strong></div>
            <div class="summary-row"><span>用时</span><strong>{{ formatDuration(record.durationSec) }}</strong></div>
            <div class="summary-row"><span>能力值</span><strong>{{ record.theta.toFixed(2) }}</strong></div>
            <div class="summary-row"><span>题库版本</span><strong>{{ record.bankVersion }}</strong></div>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>
