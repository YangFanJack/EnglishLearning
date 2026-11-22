<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBankStore } from '@/stores/bank'
import { useWrongbookStore } from '@/stores/wrongbook'
import { useSettingsStore } from '@/stores/settings'
import { LEVELS, SECTIONS, SECTION_META } from '@/types'
import type { Level, ListeningSet, Passage, Question, Section } from '@/types'
import { Rng } from '@/core/random'
import { stopSpeech } from '@/core/tts'
import { pushToast } from '@/core/toast'
import Icon from '@/components/Icon.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import ScoreRing from '@/components/ScoreRing.vue'
import EmptyState from '@/components/EmptyState.vue'

interface PracticeItem {
  question: Question
  passage?: Passage
  set?: ListeningSet
}

const bank = useBankStore()
const wrongbook = useWrongbookStore()
const settings = useSettingsStore()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const items = ref<PracticeItem[]>([])
const currentIndex = ref(0)
const selected = ref<number | null>(null)
const revealed = ref(false)
const correctCount = ref(0)
const wrongCount = ref(0)
const finished = ref(false)
const mode = ref<'normal' | 'wrong'>(route.query.mode === 'wrong' ? 'wrong' : 'normal')

const sectionFilter = computed<Section | undefined>(() => {
  const value = String(route.query.section ?? '')
  return SECTIONS.includes(value as Section) ? (value as Section) : undefined
})

const levelFilter = computed<Level | undefined>(() => {
  const value = String(route.query.level ?? '')
  return LEVELS.includes(value as Level) ? (value as Level) : undefined
})

const requestedCount = computed(() => {
  const value = Number(route.query.count)
  if (!Number.isFinite(value)) return 10
  return Math.min(50, Math.max(1, Math.round(value)))
})

const currentItem = computed(() => items.value[currentIndex.value])
const currentQuestion = computed(() => currentItem.value?.question)
const answeredCount = computed(() => correctCount.value + wrongCount.value)
const progress = computed(() => (items.value.length > 0 ? answeredCount.value / items.value.length : 0))
const score = computed(() => (items.value.length > 0 ? Math.round((correctCount.value / items.value.length) * 100) : 0))
const modeLabel = computed(() => {
  if (mode.value === 'wrong') return '错题重练'
  if (sectionFilter.value) return `${SECTION_META[sectionFilter.value].name}专项`
  return '混合练习'
})

function buildItems(): PracticeItem[] {
  const rng = new Rng(Date.now())
  if (mode.value === 'wrong') {
    const idsParam = String(route.query.ids ?? '')
    const ids = idsParam ? idsParam.split(',').filter(Boolean) : wrongbook.activeIds
    const questions = ids.map((id) => bank.question(id)).filter((question): question is Question => Boolean(question))
    return rng.shuffle(questions).slice(0, requestedCount.value).map((question) => ({
      question,
      passage: question.passageId ? bank.passage(question.passageId) : undefined,
      set: question.setId ? bank.listeningSet(question.setId) : undefined,
    }))
  }

  let units = sectionFilter.value ? [...bank.units[sectionFilter.value]] : SECTIONS.flatMap((section) => bank.units[section])
  if (levelFilter.value) units = units.filter((unit) => unit.level === levelFilter.value)
  units = rng.shuffle(units)

  const result: PracticeItem[] = []
  for (const unit of units) {
    for (const question of unit.questions) {
      result.push({
        question,
        passage: unit.passage,
        set: unit.section === 'listening' && question.setId ? bank.listeningSet(question.setId) : undefined,
      })
      if (result.length >= requestedCount.value) return result
    }
  }
  return result
}

function resetRun(): void {
  items.value = buildItems()
  currentIndex.value = 0
  selected.value = null
  revealed.value = false
  correctCount.value = 0
  wrongCount.value = 0
  finished.value = false
  stopSpeech()
}

function choose(index: number): void {
  if (!currentQuestion.value || revealed.value) return
  selected.value = index
  revealed.value = true
  const correct = index === currentQuestion.value.answer
  if (correct) {
    correctCount.value += 1
    wrongbook.markCorrect(currentQuestion.value.id)
  } else {
    wrongCount.value += 1
    wrongbook.addWrong(currentQuestion.value.id)
  }
}

function next(): void {
  if (currentIndex.value >= items.value.length - 1) {
    finished.value = true
    stopSpeech()
    return
  }
  currentIndex.value += 1
  selected.value = null
  revealed.value = false
  stopSpeech()
}

function exit(): void {
  stopSpeech()
  router.push('/practice')
}

function onKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  if (finished.value) return
  const key = event.key.toLowerCase()
  const optionMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 }
  if (!revealed.value && key in optionMap) {
    event.preventDefault()
    choose(optionMap[key])
    return
  }
  if (key === 'enter') {
    event.preventDefault()
    if (revealed.value) next()
  }
}

onMounted(async () => {
  try {
    if (!bank.loaded) await bank.load()
    resetRun()
  } catch (error) {
    pushToast(error instanceof Error ? error.message : '题库加载失败', 'error')
  } finally {
    loading.value = false
  }
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  stopSpeech()
})
</script>

<template>
  <div class="practice-screen">
    <header class="practice-topbar">
      <div class="exam-brand">
        <span class="brand-mark">D</span>
        <span>分类练习</span>
      </div>
      <span class="section-badge" :class="sectionFilter ?? 'listening'">
        <Icon name="practice" :size="12" />
        {{ modeLabel }}
      </span>
      <div class="practice-progress">
        <span>{{ Math.min(answeredCount + (revealed ? 0 : 1), items.length) }} / {{ items.length }}</span>
        <div class="progress">
          <span class="progress-fill" :style="{ width: `${progress * 100}%` }" />
        </div>
        <span>{{ correctCount }} 正确</span>
      </div>
      <button class="icon-btn" type="button" title="退出练习" @click="exit">
        <Icon name="log-out" :size="18" />
      </button>
    </header>

    <div v-if="loading" class="loading-screen">
      <span class="spinner" />
      <p class="text-sm muted">正在抽取练习题目…</p>
    </div>

    <div v-else-if="finished" class="practice-body">
      <div class="practice-result card card-pad">
        <ScoreRing :score="score" :label="modeLabel" :size="190" />
        <h2>{{ score >= 80 ? '这组练得不错' : score >= 60 ? '基本掌握，继续巩固' : '需要再练一组' }}</h2>
        <p class="muted text-sm">共 {{ items.length }} 题，答对 {{ correctCount }} 题，答错 {{ wrongCount }} 题。</p>
        <div class="row mt-3">
          <button class="btn btn-primary" type="button" @click="resetRun">
            <Icon name="refresh" :size="16" />
            再练一组
          </button>
          <button class="btn btn-secondary" type="button" @click="router.push('/wrongbook')">
            <Icon name="wrong" :size="16" />
            查看错题本
          </button>
          <button class="btn btn-ghost" type="button" @click="exit">返回练习</button>
        </div>
      </div>
    </div>

    <div v-else-if="currentItem && currentQuestion" class="practice-body">
      <div v-if="currentItem.set" class="unit-context">
        <AudioPlayer
          :turns="currentItem.set.turns"
          :script="currentItem.set.script"
          :max-plays="0"
          :rate="settings.settings.ttsRate"
          :voice-uri="settings.settings.ttsVoiceURI"
          :reveal="revealed"
          :allow-transcript="revealed"
          label="听力材料 · 可重复播放"
        />
      </div>

      <article v-if="currentItem.passage" class="passage-panel">
        <h3>{{ currentItem.passage.title }}</h3>
        <div class="passage-meta">
          <span class="level-pill" :data-level="currentItem.passage.level">{{ currentItem.passage.level }}</span>
          <span class="meta-pill">{{ currentItem.passage.topic }}</span>
        </div>
        <p class="passage-text">{{ currentItem.passage.text }}</p>
      </article>

      <QuestionCard
        :question="currentQuestion"
        :selected="selected"
        :index="currentIndex + 1"
        :reveal="revealed"
        :disabled="revealed"
        @select="choose"
      />

      <div v-if="revealed" class="practice-feedback" :class="selected === currentQuestion.answer ? 'is-correct' : 'is-wrong'">
        <Icon :name="selected === currentQuestion.answer ? 'check' : 'x'" :size="17" />
        <span>{{ selected === currentQuestion.answer ? '回答正确。' : '回答错误，已加入错题本。' }} 查看上方解析，确认考点后再进入下一题。</span>
      </div>

      <div class="practice-actions">
        <span class="text-xs muted">快捷键：<span class="kbd">1-4</span> 选择 · <span class="kbd">Enter</span> 下一题</span>
        <button class="btn btn-primary" type="button" :disabled="!revealed" @click="next">
          {{ currentIndex >= items.length - 1 ? '查看结果' : '下一题' }}
          <Icon name="arrow-right" :size="16" />
        </button>
      </div>
    </div>

    <div v-else class="practice-body">
      <EmptyState
        title="没有可练习的题目"
        text="当前筛选条件下没有题目，或错题本已清空。换一个模块或等级试试。"
        icon="practice"
      >
        <button class="btn btn-primary btn-sm" type="button" @click="exit">返回练习设置</button>
      </EmptyState>
    </div>
  </div>
</template>
