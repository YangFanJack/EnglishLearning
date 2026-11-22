<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBankStore } from '@/stores/bank'
import { useExamStore } from '@/stores/exam'
import { useSettingsStore } from '@/stores/settings'
import { SECTION_META } from '@/types'
import { stopSpeech } from '@/core/tts'
import { pushToast } from '@/core/toast'
import Icon from '@/components/Icon.vue'
import Timer from '@/components/Timer.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import Modal from '@/components/Modal.vue'

const bank = useBankStore()
const exam = useExamStore()
const settings = useSettingsStore()
const router = useRouter()

const loading = ref(true)
const exitOpen = ref(false)
const finishOpen = ref(false)
const sectionDoneOpen = ref(false)
const activeQuestionIndex = ref(0)
let timerId: number | undefined
let redirected = false

const session = computed(() => exam.session)
const state = computed(() => exam.currentSection)
const unit = computed(() => exam.currentUnit)
const meta = computed(() => exam.currentSectionMeta)
const totalMs = computed(() => (session.value?.config.durationSec ?? 0) * 1000)
const isFinalAdvance = computed(() => Boolean(exam.isLastSection && exam.nextLabel === '交卷'))
const progressText = computed(() =>
  exam.isTimeBased ? `自适应 · 剩余 ${Math.ceil(exam.remainingMs / 60000)} 分钟` : `${exam.totalAnswered} / 约 ${exam.totalTarget} 题`,
)
const nextSectionName = computed(() => {
  const nextIndex = (session.value?.currentSectionIndex ?? 0) + 1
  const next = session.value?.sections[nextIndex]
  return next ? SECTION_META[next.section].name : ''
})

const activeQuestion = computed(() => {
  const questions = unit.value?.questions ?? []
  return questions[Math.min(activeQuestionIndex.value, Math.max(0, questions.length - 1))] ?? null
})

const unitAnswerCount = computed(() => {
  if (!state.value || !unit.value) return 0
  return unit.value.questions.filter((question) => Boolean(state.value?.answers[question.id])).length
})

const sectionTabs = computed(() =>
  (session.value?.sections ?? []).map((sectionState, index) => ({
    index,
    section: sectionState.section,
    meta: SECTION_META[sectionState.section],
    active: index === session.value?.currentSectionIndex,
    done: sectionState.submitted,
  })),
)

const palette = computed(() =>
  (state.value?.units ?? []).map((item, index) => {
    const answered = item.questions.filter((question) => Boolean(state.value?.answers[question.id])).length
    const flagged = item.questions.some((question) => Boolean(state.value?.flags[question.id]))
    return {
      id: item.id,
      index,
      answered,
      total: item.questions.length,
      flagged,
      current: index === state.value?.currentUnitIndex,
      complete: answered === item.questions.length,
    }
  }),
)

function selectedFor(questionId: string): number | null {
  return state.value?.answers[questionId]?.selected ?? null
}

function flaggedFor(questionId: string): boolean {
  return Boolean(state.value?.flags[questionId])
}

function selectOption(questionId: string, optionIndex: number): void {
  exam.answer(questionId, optionIndex)
}

function goResult(): void {
  if (redirected) return
  const record = exam.lastRecord
  if (!record) {
    router.replace('/exam')
    return
  }
  redirected = true
  router.replace(`/exam/result/${record.id}`)
}

function handleNext(): void {
  if (isFinalAdvance.value) {
    finishOpen.value = true
    return
  }
  if (exam.nextLabel === '完成本节' && !settings.settings.autoNextSection) {
    sectionDoneOpen.value = true
    return
  }
  exam.advance()
}

function goNextSection(): void {
  sectionDoneOpen.value = false
  exam.submitSection()
}

function confirmFinish(): void {
  finishOpen.value = false
  if (exam.isTimeBased) exam.finishExam()
  else exam.submitSection()
}

function handleSkip(): void {
  if (!state.value || !unit.value) return
  exam.skipCurrentUnit()
}

function handleExit(): void {
  stopSpeech()
  router.push('/')
}

function discardExam(): void {
  stopSpeech()
  exam.discardDraft()
  router.push('/exam')
}

function onKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  if (exitOpen.value || finishOpen.value || sectionDoneOpen.value) return
  if (!unit.value || !activeQuestion.value) return

  const key = event.key.toLowerCase()
  const optionMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 }
  if (key in optionMap) {
    const optionIndex = optionMap[key]
    if (optionIndex < activeQuestion.value.options.length) {
      event.preventDefault()
      selectOption(activeQuestion.value.id, optionIndex)
    }
    return
  }

  if (key === 'f') {
    event.preventDefault()
    exam.toggleFlag(activeQuestion.value.id)
    return
  }

  if (key === 'arrowright' || key === 'arrowdown') {
    event.preventDefault()
    activeQuestionIndex.value = Math.min(unit.value.questions.length - 1, activeQuestionIndex.value + 1)
    return
  }

  if (key === 'arrowleft' || key === 'arrowup') {
    event.preventDefault()
    activeQuestionIndex.value = Math.max(0, activeQuestionIndex.value - 1)
    return
  }

  if (key === 'enter') {
    event.preventDefault()
    if (exam.currentUnitComplete) {
      handleNext()
    } else if (activeQuestionIndex.value < unit.value.questions.length - 1) {
      activeQuestionIndex.value += 1
    }
  }
}

async function init(): Promise<void> {
  try {
    if (!bank.loaded) await bank.load()
    if (!exam.session) {
      const restored = exam.resumeDraft()
      if (!restored) {
        router.replace('/exam')
        return
      }
    }
    if (exam.session?.status === 'finished') {
      goResult()
      return
    }
    loading.value = false
  } catch (error) {
    pushToast(error instanceof Error ? error.message : '考试初始化失败', 'error')
    router.replace('/exam')
  }
}

watch(
  () => unit.value?.id,
  () => {
    stopSpeech()
    const questions = unit.value?.questions ?? []
    const firstUnanswered = questions.findIndex((question) => !state.value?.answers[question.id])
    activeQuestionIndex.value = firstUnanswered >= 0 ? firstUnanswered : 0
  },
  { immediate: true },
)

watch(
  () => session.value?.status,
  (status) => {
    if (status === 'finished') goResult()
  },
)

onMounted(() => {
  init()
  window.addEventListener('keydown', onKeydown)
  timerId = window.setInterval(() => {
    if (exam.tick()) goResult()
  }, 500)
})

onBeforeUnmount(() => {
  if (timerId) window.clearInterval(timerId)
  window.removeEventListener('keydown', onKeydown)
  stopSpeech()
})
</script>

<template>
  <div class="exam-screen">
    <header class="exam-topbar">
      <div class="exam-brand">
        <span class="brand-mark">D</span>
        <span>岱恩机测</span>
      </div>

      <div class="exam-section-tabs">
        <div
          v-for="tab in sectionTabs"
          :key="tab.section"
          class="exam-section-tab"
          :class="{ 'is-active': tab.active, 'is-done': tab.done }"
        >
          <Icon :name="tab.meta.icon" :size="13" />
          {{ tab.meta.short }}
        </div>
      </div>

      <div class="exam-topbar-right">
        <span class="exam-progress-text">{{ progressText }}</span>
        <button v-if="exam.isTimeBased" class="btn btn-ghost btn-sm" type="button" @click="finishOpen = true">结束并判级</button>
        <Timer v-if="settings.settings.showTimer" :remaining-ms="exam.remainingMs" :total-ms="totalMs" />
        <button class="icon-btn" type="button" title="保存并退出" @click="exitOpen = true">
          <Icon name="log-out" :size="18" />
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading-screen">
      <span class="spinner" />
      <p class="text-sm muted">正在准备试卷…</p>
    </div>

    <div v-else-if="state && unit" class="exam-body">
      <div class="exam-main">
        <div class="unit-header">
          <span class="section-icon" :class="state.section">
            <Icon :name="meta?.icon ?? 'exam'" :size="19" />
          </span>
          <div class="unit-header-copy">
            <strong>{{ meta?.name }} · {{ unit.title || `第 ${state.currentUnitIndex + 1} 组` }}</strong>
            <span>{{ meta?.description }}</span>
          </div>
          <div class="unit-header-right">
            <span class="tag-pill">{{ unit.level }} · 难度 {{ unit.difficulty }}</span>
            <span class="tag-pill">{{ unitAnswerCount }}/{{ unit.questions.length }} 已答</span>
          </div>
        </div>

        <div v-if="state.section === 'listening'" class="unit-context">
          <AudioPlayer
            :turns="unit.turns"
            :script="unit.script"
            :max-plays="2"
            :plays="exam.playsFor(unit.id)"
            :allow-transcript="unitAnswerCount === unit.questions.length"
            :rate="settings.settings.ttsRate"
            :voice-uri="settings.settings.ttsVoiceURI"
            label="听力材料 · 最多播放 2 次"
            @play="exam.recordPlay(unit.id)"
          />
        </div>

        <div v-if="state.section === 'reading' && unit.passage" class="unit-context">
          <article class="passage-panel">
            <h3>{{ unit.passage.title }}</h3>
            <div class="passage-meta">
              <span class="level-pill" :data-level="unit.level">{{ unit.level }}</span>
              <span class="meta-pill">{{ unit.passage.topic }}</span>
              <span v-if="unit.passage.source === 'adapted-public'" class="meta-pill source-pill">公开样题改编</span>
            </div>
            <p class="passage-text">{{ unit.passage.text }}</p>
          </article>
        </div>

        <div class="unit-questions">
          <QuestionCard
            v-for="(question, index) in unit.questions"
            :key="question.id"
            :question="question"
            :selected="selectedFor(question.id)"
            :index="index + 1"
            :disabled="state.submitted"
            @select="selectOption(question.id, $event)"
          />
        </div>

        <div class="exam-actions">
          <button class="btn btn-ghost btn-sm" type="button" :disabled="state.currentUnitIndex <= 0" @click="exam.goPrevUnit()">
            <Icon name="chevron-left" :size="15" />
            上一组
          </button>
          <button
            class="btn btn-ghost btn-sm exam-flag-btn"
            type="button"
            :class="{ 'is-active': activeQuestion && flaggedFor(activeQuestion.id) }"
            @click="activeQuestion && exam.toggleFlag(activeQuestion.id)"
          >
            <Icon name="flag" :size="15" />
            标记
          </button>
          <span class="exam-kbd-hint">
            <span class="kbd">1-4</span> 选项
            <span class="kbd">F</span> 标记
            <span class="kbd">Enter</span> 下一组
          </span>
          <div class="exam-actions-right">
            <button class="btn btn-ghost btn-sm" type="button" @click="handleSkip">跳过</button>
            <button class="btn btn-primary" type="button" :disabled="!exam.currentUnitComplete" @click="handleNext">
              {{ exam.nextLabel }}
              <Icon name="arrow-right" :size="16" />
            </button>
          </div>
        </div>
      </div>

      <aside class="exam-aside">
        <div class="palette-card">
          <div class="palette-head">
            <strong>本部分题组</strong>
            <span>{{ state.units.length }} 组</span>
          </div>
          <div class="palette-grid">
            <button
              v-for="item in palette"
              :key="item.id"
              class="palette-item"
              :class="{ 'is-current': item.current, 'is-answered': item.complete, 'is-flagged': item.flagged }"
              type="button"
              :title="`第 ${item.index + 1} 组 · ${item.answered}/${item.total} 已答`"
              @click="exam.goToUnit(item.index)"
            >
              {{ item.index + 1 }}
            </button>
          </div>
          <div class="palette-legend">
            <span><i class="legend-dot current" />当前</span>
            <span><i class="legend-dot answered" />已完成</span>
            <span><i class="legend-dot flagged" />有标记</span>
          </div>
        </div>

        <div class="exam-side-note">
          本部分完成后将锁定，不能返回修改。听力每组最多播放 2 次；阅读材料与题目在同一页。
        </div>

        <button class="btn btn-ghost btn-sm exam-exit" type="button" @click="exitOpen = true">
          <Icon name="log-out" :size="15" />
          保存并退出
        </button>
      </aside>
    </div>

    <div v-else class="loading-screen">
      <span class="spinner" />
      <p class="text-sm muted">正在加载下一部分…</p>
    </div>

    <Modal :open="exitOpen" title="保存并退出？" subtitle="作答进度会保存在本机，下次可从“月度机测”继续。" width="460px" @close="exitOpen = false">
      <div class="notice">
        <Icon name="clock" :size="16" />
        <span>考试计时不会暂停。如果这是正式模考，建议完成后再退出。</span>
      </div>
      <template #footer>
        <button class="btn btn-ghost" type="button" @click="discardExam">放弃本次考试</button>
        <button class="btn btn-secondary" type="button" @click="exitOpen = false">继续考试</button>
        <button class="btn btn-primary" type="button" @click="handleExit">保存并退出</button>
      </template>
    </Modal>

    <Modal :open="sectionDoneOpen" title="本部分已完成" :subtitle="`${meta?.name ?? '本部分'}已完成，下一部分为${nextSectionName}。`" width="460px" @close="sectionDoneOpen = false">
      <div class="notice">
        <Icon name="check" :size="16" />
        <span>可以继续检查本部分答案，或进入下一部分。进入后本部分将不能修改。</span>
      </div>
      <template #footer>
        <button class="btn btn-secondary" type="button" @click="sectionDoneOpen = false">继续检查</button>
        <button class="btn btn-primary" type="button" @click="goNextSection">进入下一部分</button>
      </template>
    </Modal>

    <Modal
      :open="finishOpen"
      :title="exam.isTimeBased ? '结束并判级？' : '确认交卷？'"
      :subtitle="exam.isTimeBased ? '系统会根据当前作答估算 CEFR 等级，结束后不能再修改答案。' : '交卷后将立即生成成绩报告，不能再修改答案。'"
      width="460px"
      @close="finishOpen = false"
    >
      <div class="exam-summary">
        <div class="summary-row"><span>已作答</span><strong>{{ exam.totalAnswered }} 题</strong></div>
        <div class="summary-row"><span>预计总题量</span><strong>约 {{ exam.totalTarget }} 题</strong></div>
        <div class="summary-row"><span>剩余时间</span><strong>{{ Math.ceil(exam.remainingMs / 60000) }} 分钟</strong></div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" type="button" @click="finishOpen = false">继续检查</button>
        <button class="btn btn-primary" type="button" @click="confirmFinish">{{ exam.isTimeBased ? '确认结束' : '确认交卷' }}</button>
      </template>
    </Modal>
  </div>
</template>
