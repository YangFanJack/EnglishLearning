<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBankStore } from '@/stores/bank'
import { useHistoryStore } from '@/stores/history'
import { useWrongbookStore } from '@/stores/wrongbook'
import { useExamStore } from '@/stores/exam'
import { SECTIONS, SECTION_META } from '@/types'
import { currentMonthKey, monthLabel } from '@/core/scoring'
import { formatDate, greeting } from '@/core/format'
import { pushToast } from '@/core/toast'
import RadarChart from '@/components/RadarChart.vue'
import TrendChart from '@/components/TrendChart.vue'
import StatCard from '@/components/StatCard.vue'
import TagPill from '@/components/TagPill.vue'
import EmptyState from '@/components/EmptyState.vue'
import Icon from '@/components/Icon.vue'

const bank = useBankStore()
const history = useHistoryStore()
const wrongbook = useWrongbookStore()
const exam = useExamStore()
const router = useRouter()

const month = currentMonthKey()
const latest = computed(() => history.latest)
const monthBest = computed(() => history.bestForMonth(month))
const recent = computed(() => history.sorted.slice(0, 5))
const weakTags = computed(() => latest.value?.weakTags ?? [])
const trendPoints = computed(() => history.trend)

const radarData = computed(() =>
  SECTIONS.map((section) => {
    const result = latest.value?.sections.find((item) => item.section === section)
    return { label: SECTION_META[section].short, value: result ? Math.round(result.accuracy * 100) : 0 }
  }),
)

const sectionStats = computed(() =>
  SECTIONS.map((section) => ({
    section,
    meta: SECTION_META[section],
    count: bank.questions[section].length,
  })),
)

const averageScore = computed(() => {
  if (history.records.length === 0) return 0
  return Math.round(history.records.reduce((sum, record) => sum + record.score, 0) / history.records.length)
})

const bestScore = computed(() => (history.records.length > 0 ? Math.max(...history.records.map((record) => record.score)) : 0))

onMounted(() => {
  if (!bank.loaded && !bank.loading) {
    bank.load().catch((error) => {
      pushToast(error instanceof Error ? error.message : '题库加载失败', 'error')
    })
  }
})

async function quickStart(): Promise<void> {
  try {
    if (!bank.loaded) await bank.load()
    exam.startNew('quick')
    router.push('/exam/run')
  } catch (error) {
    pushToast(error instanceof Error ? error.message : '无法开始考试', 'error')
  }
}

function scoreTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}
</script>

<template>
  <div class="stack-lg">
    <section class="home-hero">
      <div class="hero-copy">
        <span class="eyebrow">
          <Icon name="spark" :size="13" />
          {{ greeting() }} · {{ monthLabel(month) }}
        </span>
        <h2>用一场自适应机测，<em>摸清你的英语水位</em></h2>
        <p>
          听力、词汇、语法、阅读四项分模块自适应出题，答对升难度、答错回调。
          题目为原创或公开样题改编，适合每月自测与考前热身。
        </p>
        <div class="hero-actions">
          <router-link class="btn btn-primary btn-lg" to="/exam">
            <Icon name="exam" :size="18" />
            开始本月机测
          </router-link>
          <button class="btn btn-secondary btn-lg" type="button" @click="quickStart">
            <Icon name="zap" :size="18" />
            快速定级
          </button>
        </div>
        <div class="hero-meta">
          <span class="tag-pill"><Icon name="target" :size="12" />自适应难度</span>
          <span class="tag-pill"><Icon name="headphones" :size="12" />浏览器语音</span>
          <span class="tag-pill"><Icon name="shield" :size="12" />数据仅存本地</span>
        </div>
      </div>

      <div class="hero-panel">
        <span class="hero-panel-label">能力画像</span>
        <RadarChart :data="radarData" :size="220" />
        <div class="hero-panel-foot">
          <template v-if="latest">
            <strong>{{ latest.score }} 分</strong>
            <span>·</span>
            <span>{{ latest.cefr }} · {{ formatDate(latest.finishedAt) }}</span>
          </template>
          <span v-else>完成一次考试后生成能力雷达</span>
        </div>
      </div>
    </section>

    <section class="quick-grid">
      <router-link class="quick-card" to="/exam">
        <span class="section-icon listening"><Icon name="exam" :size="19" /></span>
        <span class="quick-copy">
          <strong>标准月考</strong>
          <span>40 题 · 约 40 分钟</span>
        </span>
        <Icon class="quick-arrow" name="chevron-right" :size="17" />
      </router-link>
      <router-link class="quick-card" to="/practice">
        <span class="section-icon vocabulary"><Icon name="practice" :size="19" /></span>
        <span class="quick-copy">
          <strong>分类练习</strong>
          <span>按模块 / 等级 / 考点</span>
        </span>
        <Icon class="quick-arrow" name="chevron-right" :size="17" />
      </router-link>
      <router-link class="quick-card" to="/wrongbook">
        <span class="section-icon grammar"><Icon name="wrong" :size="19" /></span>
        <span class="quick-copy">
          <strong>错题本</strong>
          <span>{{ wrongbook.activeCount }} 道待巩固</span>
        </span>
        <Icon class="quick-arrow" name="chevron-right" :size="17" />
      </router-link>
      <router-link class="quick-card" to="/bank">
        <span class="section-icon reading"><Icon name="bank" :size="19" /></span>
        <span class="quick-copy">
          <strong>题库浏览</strong>
          <span>{{ bank.total || '—' }} 道题可查</span>
        </span>
        <Icon class="quick-arrow" name="chevron-right" :size="17" />
      </router-link>
    </section>

    <section class="grid grid-4">
      <StatCard label="题库总量" :value="bank.total ? `${bank.total} 题` : '加载中'" hint="听力 / 词汇 / 语法 / 阅读" icon="bank" tone="teal" />
      <StatCard label="本月最佳" :value="monthBest ? `${monthBest.score} 分` : '—'" :hint="monthBest ? `CEFR ${monthBest.cefr}` : '本月尚未考试'" icon="award" tone="amber" />
      <StatCard label="历史平均" :value="history.count ? `${averageScore} 分` : '—'" :hint="`共 ${history.count} 次记录`" icon="chart" tone="indigo" />
      <StatCard label="待巩固错题" :value="wrongbook.activeCount" hint="连续答对 2 次自动掌握" icon="wrong" tone="rose" />
    </section>

    <section class="home-grid">
      <div class="stack">
        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>成绩趋势</h3>
              <p>最近 12 次考试总分</p>
            </div>
            <router-link class="link-btn" to="/history">全部记录</router-link>
          </div>
          <TrendChart :points="trendPoints" />
        </div>

        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>最近考试</h3>
              <p>点击查看完整成绩报告</p>
            </div>
            <router-link class="link-btn" to="/exam">再考一次</router-link>
          </div>

          <div v-if="recent.length > 0" class="recent-list">
            <router-link v-for="record in recent" :key="record.id" class="recent-item" :to="`/exam/result/${record.id}`">
              <span class="recent-score">{{ record.score }}</span>
              <span class="recent-copy">
                <strong>{{ record.mode === 'section' ? '专项测评' : record.mode === 'quick' ? '快速定级' : record.mode === 'full' ? '完整模考' : '标准月考' }}</strong>
                <span>{{ formatDate(record.finishedAt) }} · {{ record.questionCount }} 题 · 正确率 {{ Math.round(record.accuracy * 100) }}%</span>
              </span>
              <span class="recent-meta">
                <TagPill :tag="record.cefr" :tone="scoreTone(record.score)" />
                <Icon name="chevron-right" :size="16" class="muted" />
              </span>
            </router-link>
          </div>
          <EmptyState v-else title="还没有考试记录" text="完成一次标准月考后，这里会显示成绩与趋势。" icon="exam">
            <router-link class="btn btn-primary btn-sm" to="/exam">开始第一次考试</router-link>
          </EmptyState>
        </div>
      </div>

      <div class="stack">
        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>薄弱考点</h3>
              <p>来自最近一次考试</p>
            </div>
            <Icon name="target" :size="18" class="muted" />
          </div>
          <div v-if="weakTags.length > 0" class="weak-list">
            <div v-for="tag in weakTags" :key="`${tag.section}-${tag.tag}`" class="weak-item">
              <span class="weak-item-copy">
                <strong>{{ tag.tag }}</strong>
                <span>{{ SECTION_META[tag.section].short }} · {{ tag.correct }}/{{ tag.total }} 正确</span>
              </span>
              <span class="weak-meter"><span :style="{ width: `${Math.round(tag.accuracy * 100)}%` }" /></span>
            </div>
          </div>
          <p v-else-if="latest" class="muted text-sm">本次考试没有明显薄弱点，保持节奏。</p>
          <p v-else class="muted text-sm">完成考试后，这里会按考点统计正确率。</p>
          <router-link v-if="weakTags.length > 0" class="btn btn-secondary btn-sm btn-block mt-3" to="/practice">
            针对薄弱点练习
          </router-link>
        </div>

        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>题库构成</h3>
              <p>四部分独立自适应</p>
            </div>
            <span class="tag-pill">{{ bank.manifest?.version ?? '—' }}</span>
          </div>
          <div class="mini-section-grid">
            <div v-for="item in sectionStats" :key="item.section" class="mini-section">
              <span class="section-badge" :class="item.section">
                <Icon :name="item.meta.icon" :size="12" />
                {{ item.meta.short }}
              </span>
              <strong>{{ item.count }}</strong>
              <span>道题</span>
            </div>
          </div>
          <div class="row mt-4">
            <span class="muted text-xs">历史最高 {{ bestScore || '—' }} 分</span>
            <router-link class="link-btn" to="/about" style="margin-left: auto">题型说明</router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
