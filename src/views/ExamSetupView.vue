<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBankStore } from '@/stores/bank'
import { useExamStore } from '@/stores/exam'
import { useHistoryStore } from '@/stores/history'
import { useSettingsStore } from '@/stores/settings'
import { SECTIONS, SECTION_META } from '@/types'
import type { ExamMode, Section } from '@/types'
import { MODE_META, monthLabel, currentMonthKey } from '@/core/scoring'
import { formatDateTime } from '@/core/format'
import { pushToast } from '@/core/toast'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'

const bank = useBankStore()
const exam = useExamStore()
const history = useHistoryStore()
const settings = useSettingsStore()
const router = useRouter()

const mode = ref<ExamMode>(settings.settings.defaultMode)
const selectedSection = ref<Section>('listening')
const discardOpen = ref(false)
const starting = ref(false)

const modes: Array<{ key: ExamMode; icon: string; name: string; description: string; meta: string }> = [
  {
    key: 'standard',
    icon: 'zap',
    name: MODE_META.standard.name,
    description: MODE_META.standard.description,
    meta: '自适应 · 20 分钟',
  },
  { key: 'section', icon: 'practice', name: MODE_META.section.name, description: MODE_META.section.description, meta: '20 题 · 25 分钟' },
]

const activeMeta = computed(() => MODE_META[mode.value])
const totalQuestions = computed(() => (activeMeta.value.timeBased ? '自适应' : String(mode.value === 'section' ? 20 : activeMeta.value.perSection * 4)))
const sectionList = computed(() => (mode.value === 'section' ? [selectedSection.value] : SECTIONS))
const latest = computed(() => history.latest)
const startThetaHint = computed(() => {
  if (!latest.value) return '首次测评从 A2/B1 边界开始'
  const theta = Math.min(5, Math.max(0.5, 2.5 + (latest.value.theta - 2.5) * 0.8))
  return `参考上次能力值，起始难度约 ${theta.toFixed(1)} / 5`
})
const month = currentMonthKey()

onMounted(() => {
  if (!bank.loaded && !bank.loading) {
    bank.load().catch((error) => pushToast(error instanceof Error ? error.message : '题库加载失败', 'error'))
  }
})

async function start(): Promise<void> {
  if (starting.value) return
  starting.value = true
  try {
    if (!bank.loaded) await bank.load()
    exam.startNew(mode.value, mode.value === 'section' ? selectedSection.value : undefined)
    router.push('/exam/run')
  } catch (error) {
    pushToast(error instanceof Error ? error.message : '无法开始考试', 'error')
  } finally {
    starting.value = false
  }
}

async function resume(): Promise<void> {
  try {
    if (!bank.loaded) await bank.load()
    const ok = exam.resumeDraft()
    if (!ok) {
      pushToast('没有可恢复的考试', 'info')
      return
    }
    if (exam.lastRecord && exam.session?.status === 'finished') {
      router.push(`/exam/result/${exam.lastRecord.id}`)
    } else {
      router.push('/exam/run')
    }
  } catch (error) {
    pushToast(error instanceof Error ? error.message : '恢复失败', 'error')
  }
}

function discard(): void {
  exam.discardDraft()
  discardOpen.value = false
  pushToast('已放弃上次未完成的考试', 'info')
}
</script>

<template>
  <div class="stack-lg">
    <div class="page-head">
      <div>
        <span class="eyebrow"><Icon name="calendar" :size="13" />{{ monthLabel(month) }}</span>
        <h2>月度机测</h2>
        <p>20 分钟自适应定级：答得越好，后续题目越难；时间到后系统自动估算 CEFR。</p>
      </div>
      <span class="tag-pill"><Icon name="info" :size="12" />非官方练习测评</span>
    </div>

    <div v-if="exam.draftAvailable" class="draft-banner">
      <Icon name="clock" :size="20" />
      <div class="draft-copy">
        <strong>发现未完成的考试</strong>
        <span>进度已自动保存在本机，可继续作答；若已超时，将按当前作答生成报告。</span>
      </div>
      <button class="btn btn-secondary btn-sm" type="button" @click="discardOpen = true">放弃</button>
      <button class="btn btn-primary btn-sm" type="button" @click="resume">继续考试</button>
    </div>

    <div v-if="bank.error" class="notice notice-danger">
      <Icon name="alert" :size="17" />
      <span>{{ bank.error }}。请确认已运行 <code>npm run bank:build</code>，或刷新页面重试。</span>
    </div>

    <div class="setup-grid">
      <div class="stack">
        <section class="card card-pad">
          <div class="card-head">
            <div>
              <h3>选择模式</h3>
              <p>推荐先做自适应定级；专项测评适合定位单点薄弱</p>
            </div>
            <span class="tag-pill">{{ activeMeta.timeBased ? '自适应' : `${totalQuestions} 题` }} · {{ Math.round(activeMeta.durationSec / 60) }} 分钟</span>
          </div>

          <div class="mode-grid">
            <button
              v-for="item in modes"
              :key="item.key"
              type="button"
              class="mode-card"
              :class="{ 'is-active': mode === item.key }"
              @click="mode = item.key"
            >
              <div class="mode-card-top">
                <span class="section-icon" :class="item.key === 'section' ? 'grammar' : 'listening'">
                  <Icon :name="item.icon" :size="19" />
                </span>
                <span class="mode-check"><Icon name="check" :size="13" /></span>
              </div>
              <h3>{{ item.name }}</h3>
              <p>{{ item.description }}</p>
              <div class="mode-meta">
                <span class="tag-pill">{{ item.meta }}</span>
                <span class="tag-pill">{{ item.key === 'section' ? '单模块' : '四模块' }}</span>
              </div>
            </button>
          </div>
        </section>

        <section v-if="mode === 'section'" class="card card-pad">
          <div class="card-head">
            <div>
              <h3>选择专项模块</h3>
              <p>只测一个部分，20 题集中定位薄弱点</p>
            </div>
          </div>
          <div class="section-choice-grid">
            <button
              v-for="section in SECTIONS"
              :key="section"
              type="button"
              class="section-choice"
              :class="{ 'is-active': selectedSection === section }"
              @click="selectedSection = section"
            >
              <span class="section-icon" :class="section">
                <Icon :name="SECTION_META[section].icon" :size="19" />
              </span>
              <span class="section-choice-copy">
                <strong>{{ SECTION_META[section].name }}</strong>
                <span>{{ SECTION_META[section].description }}</span>
              </span>
            </button>
          </div>
        </section>

        <section class="card card-pad">
          <div class="card-head">
            <div>
              <h3>考试结构</h3>
              <p>按部分顺序作答，每部分完成后锁定</p>
            </div>
          </div>
          <div class="grid grid-4">
            <div v-for="section in SECTIONS" :key="section" class="panel">
              <div class="row">
                <span class="section-icon" :class="section">
                  <Icon :name="SECTION_META[section].icon" :size="17" />
                </span>
                <div>
                  <strong class="text-sm">{{ SECTION_META[section].short }}</strong>
                  <p class="text-xs muted">{{ mode === 'section' ? (selectedSection === section ? '20 题' : '不考') : `${activeMeta.perSection} 题` }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside class="stack">
        <section class="card card-pad">
          <div class="card-head">
            <div>
              <h3>本次考试</h3>
              <p>{{ monthLabel(month) }}</p>
            </div>
            <span class="section-badge listening"><Icon name="target" :size="12" />自适应</span>
          </div>

          <div class="exam-summary">
            <div class="summary-row"><span>模式</span><strong>{{ activeMeta.name }}</strong></div>
            <div class="summary-row"><span>模块</span><strong>{{ mode === 'section' ? SECTION_META[selectedSection].name : '听力 / 词汇 / 语法 / 阅读' }}</strong></div>
            <div class="summary-row"><span>预计题量</span><strong>{{ activeMeta.timeBased ? '按作答时间动态决定' : `${totalQuestions} 题` }}</strong></div>
            <div class="summary-row"><span>限时</span><strong>{{ Math.round(activeMeta.durationSec / 60) }} 分钟</strong></div>
            <div class="summary-row"><span>起始难度</span><strong>{{ startThetaHint }}</strong></div>
          </div>

          <button class="btn btn-primary btn-lg btn-block mt-4" type="button" :disabled="starting || bank.loading" @click="start">
            <Icon name="play" :size="18" />
            {{ starting ? '正在准备…' : '开始考试' }}
          </button>
          <p class="text-xs muted mt-3">考试中途退出会自动保存草稿；听力使用浏览器 TTS，建议佩戴耳机。</p>
        </section>

        <section class="card card-pad">
          <div class="card-head">
            <div>
              <h3>计分说明</h3>
              <p>练习参考，不代表官方成绩</p>
            </div>
            <Icon name="info" :size="18" class="muted" />
          </div>
          <div class="stack-sm text-sm muted">
            <p>· 每题难度 1–5，答对升难度，答错回调。</p>
            <p>· 总分 = 70% 能力值折算 + 30% 正确率。</p>
            <p>· CEFR 等级：A1 / A2 / B1 / B2 / C1。</p>
            <p>· 60 分显示合格，80 分显示优秀。</p>
          </div>
        </section>

        <div v-if="latest" class="notice">
          <Icon name="history" :size="16" />
          <span>上次考试：{{ latest.score }} 分 · {{ latest.cefr }} · {{ formatDateTime(latest.finishedAt) }}</span>
        </div>
      </aside>
    </div>

    <Modal :open="discardOpen" title="放弃未完成的考试？" subtitle="当前作答记录将被删除，且无法恢复。" width="440px" @close="discardOpen = false">
      <p class="text-sm muted">如果只是想暂时离开，请选择“继续考试”，进度会自动保存。</p>
      <template #footer>
        <button class="btn btn-secondary" type="button" @click="discardOpen = false">取消</button>
        <button class="btn btn-danger" type="button" @click="discard">确认放弃</button>
      </template>
    </Modal>
  </div>
</template>
