import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  ExamAnswer,
  ExamConfig,
  ExamMode,
  ExamRecord,
  ExamSession,
  Question,
  Section,
  SectionState,
  Unit,
} from '@/types'
import { SECTION_META } from '@/types'
import {
  activeSections,
  answeredCount,
  buildRecommendations,
  buildTagResults,
  currentMonthKey,
  isUnitComplete,
  makeExamConfig,
  overallScore,
  sectionResult,
  sectionTarget,
  sectionThetaFromAnswers,
  weakTagsFromResults,
} from '@/core/scoring'
import { clampTheta, selectUnit } from '@/core/adaptive'
import { createSeed } from '@/core/random'
import { clearDraft, loadDraft, saveDraft } from '@/core/storage'
import { pushToast } from '@/core/toast'
import { useBankStore } from './bank'
import { useHistoryStore } from './history'
import { useWrongbookStore } from './wrongbook'

export const useExamStore = defineStore('exam', () => {
  const session = ref<ExamSession | null>(null)
  const lastRecord = ref<ExamRecord | null>(null)
  const draftAvailable = ref(Boolean(loadDraft()))
  const now = ref(Date.now())

  const currentSection = computed<SectionState | null>(() => {
    const value = session.value
    if (!value) return null
    return value.sections[value.currentSectionIndex] ?? null
  })

  const currentUnit = computed<Unit | null>(() => {
    const state = currentSection.value
    if (!state || state.currentUnitIndex < 0) return null
    return state.units[state.currentUnitIndex] ?? null
  })

  const currentSectionMeta = computed(() => (currentSection.value ? SECTION_META[currentSection.value.section] : null))

  const remainingMs = computed(() => {
    if (!session.value) return 0
    return Math.max(0, session.value.endsAt - now.value)
  })

  const totalTarget = computed(() => session.value?.sections.reduce((sum, state) => sum + state.target, 0) ?? 0)
  const totalAnswered = computed(() => session.value?.sections.reduce((sum, state) => sum + answeredCount(state), 0) ?? 0)
  const overallProgress = computed(() => (totalTarget.value > 0 ? Math.min(1, totalAnswered.value / totalTarget.value) : 0))

  const currentUnitComplete = computed(() => {
    const state = currentSection.value
    const unit = currentUnit.value
    if (!state || !unit) return false
    return isUnitComplete(state, unit)
  })

  const isLastSection = computed(() => {
    const value = session.value
    if (!value) return true
    return value.currentSectionIndex >= value.sections.length - 1
  })

  const isTimeBased = computed(() => Boolean(session.value?.config.timeBased))

  const canAdvance = computed(() => currentUnitComplete.value)

  const nextLabel = computed(() => {
    const state = currentSection.value
    if (!state) return '下一题'
    if (isTimeBased.value) return '下一题'
    const atLastUnit = state.currentUnitIndex >= state.units.length - 1
    if (atLastUnit && answeredCount(state) >= state.target) return isLastSection.value ? '交卷' : '完成本节'
    return '下一组'
  })

  function refreshNow(): void {
    now.value = Date.now()
  }

  function saveDraftIfRunning(): void {
    if (session.value && session.value.status === 'running') {
      saveDraft(session.value)
      draftAvailable.value = true
    }
  }

  function ensureNextUnitFor(state: SectionState): Unit | null {
    const value = session.value
    if (!value || state.submitted) return null
    if (answeredCount(state) >= state.target) return null

    const bank = useBankStore()
    const pool = bank.units[state.section]
    if (pool.length === 0) return null

    const usedIds = new Set(state.units.map((unit) => unit.id))
    const recentTopics = state.units.slice(-3).map((unit) => unit.topic)
    const recentAnswers = Object.values(state.answers).filter((item) => item.selected !== null).slice(-5)
    const recentAccuracy = recentAnswers.length
      ? recentAnswers.filter((item) => item.correct).length / recentAnswers.length
      : 0.5
    const difficultyShift = recentAccuracy >= 0.7 ? 0.4 : recentAccuracy <= 0.4 ? -0.3 : 0
    const targetDifficulty = clampTheta(state.theta + difficultyShift)
    const unit = selectUnit(pool, targetDifficulty, {
      usedIds,
      recentTopics,
      randomSeed: createSeed(value.seed, state.section, state.units.length, answeredCount(state)),
    })
    if (!unit) return null
    state.units.push(unit)
    if (state.currentUnitIndex < 0) state.currentUnitIndex = 0
    return unit
  }

  function start(config: ExamConfig): void {
    const bank = useBankStore()
    if (!bank.loaded) throw new Error('题库尚未加载完成')

    const sections = activeSections(config).map<SectionState>((section) => ({
      section,
      theta: config.startTheta,
      target: sectionTarget(config, section),
      units: [],
      currentUnitIndex: -1,
      answers: {},
      plays: {},
      flags: {},
      submitted: false,
      startedAt: 0,
    }))

    const startedAt = Date.now()
    const value: ExamSession = {
      id: `exam-${startedAt}-${Math.random().toString(36).slice(2, 8)}`,
      config,
      bankVersion: bank.manifest?.version ?? 'unknown',
      startedAt,
      endsAt: startedAt + config.durationSec * 1000,
      status: 'running',
      sections,
      currentSectionIndex: 0,
      seed: config.seed,
    }
    value.sections[0].startedAt = startedAt
    session.value = value
    lastRecord.value = null
    ensureNextUnitFor(value.sections[0])
    saveDraftIfRunning()
    refreshNow()
  }

  function startNew(mode: ExamMode, section?: Section): void {
    const history = useHistoryStore()
    const latest = history.latest
    const startTheta = latest ? clampTheta(2.5 + (latest.theta - 2.5) * 0.8) : 2.5
    const config = makeExamConfig(mode, {
      section,
      startTheta,
      month: currentMonthKey(),
    })
    start(config)
  }

  function findQuestionInState(state: SectionState, questionId: string): Question | undefined {
    for (const unit of state.units) {
      const found = unit.questions.find((question) => question.id === questionId)
      if (found) return found
    }
    return undefined
  }

  function recomputeTheta(state: SectionState): void {
    const value = session.value
    if (!value) return
    state.theta = sectionThetaFromAnswers(state, value.config.startTheta)
  }

  function answer(questionId: string, selected: number | null): void {
    const state = currentSection.value
    if (!state || state.submitted) return
    const question = findQuestionInState(state, questionId)
    if (!question) return

    const existing = state.answers[questionId]
    const correct = selected !== null && selected === question.answer
    const answerValue: ExamAnswer = {
      questionId,
      section: state.section,
      selected,
      correct,
      timeMs: existing?.timeMs ?? 0,
      flagged: Boolean(state.flags[questionId]),
    }
    state.answers[questionId] = answerValue
    recomputeTheta(state)

    if (selected !== null && !correct) {
      useWrongbookStore().addWrong(questionId)
    }
    saveDraftIfRunning()
  }

  function toggleFlag(questionId: string): void {
    const state = currentSection.value
    if (!state || state.submitted) return
    state.flags[questionId] = !state.flags[questionId]
    const existing = state.answers[questionId]
    if (existing) existing.flagged = state.flags[questionId]
    saveDraftIfRunning()
  }

  function recordPlay(unitId: string): void {
    const state = currentSection.value
    if (!state || state.submitted) return
    state.plays[unitId] = (state.plays[unitId] ?? 0) + 1
    saveDraftIfRunning()
  }

  function playsFor(unitId: string): number {
    return currentSection.value?.plays[unitId] ?? 0
  }

  function fillUnanswered(state: SectionState): void {
    for (const unit of state.units) {
      for (const question of unit.questions) {
        if (state.answers[question.id]) continue
        state.answers[question.id] = {
          questionId: question.id,
          section: state.section,
          selected: null,
          correct: false,
          timeMs: 0,
          flagged: Boolean(state.flags[question.id]),
        }
      }
    }
  }

  function submitSection(): void {
    const value = session.value
    const state = currentSection.value
    if (!value || !state || state.submitted) return

    fillUnanswered(state)
    state.submitted = true
    state.finishedAt = Date.now()

    if (value.currentSectionIndex < value.sections.length - 1) {
      value.currentSectionIndex += 1
      const next = value.sections[value.currentSectionIndex]
      next.startedAt = Date.now()
      ensureNextUnitFor(next)
      pushToast(`已进入${SECTION_META[next.section].name}`, 'info')
      saveDraftIfRunning()
    } else {
      finishExam()
    }
  }

  function advance(): void {
    const state = currentSection.value
    if (!state || state.submitted) return
    if (!currentUnitComplete.value) {
      pushToast('请先完成本组题目，或点击“跳过”', 'info')
      return
    }

    if (state.currentUnitIndex < state.units.length - 1) {
      state.currentUnitIndex += 1
      saveDraftIfRunning()
      return
    }

    const added = ensureNextUnitFor(state)
    if (added) {
      state.currentUnitIndex = state.units.length - 1
      saveDraftIfRunning()
      return
    }
    submitSection()
  }

  function skipCurrentUnit(): void {
    const state = currentSection.value
    const unit = currentUnit.value
    if (!state || !unit || state.submitted) return
    for (const question of unit.questions) {
      if (!state.answers[question.id]) answer(question.id, null)
    }
    advance()
  }

  function goPrevUnit(): void {
    const state = currentSection.value
    if (!state || state.submitted || state.currentUnitIndex <= 0) return
    state.currentUnitIndex -= 1
    saveDraftIfRunning()
  }

  function goToUnit(index: number): void {
    const state = currentSection.value
    if (!state || state.submitted) return
    if (index < 0 || index >= state.units.length) return
    state.currentUnitIndex = index
    saveDraftIfRunning()
  }

  function finishExam(_options: { timeout?: boolean } = {}): void {
    const value = session.value
    if (!value || value.status === 'finished') return

    const bank = useBankStore()
    const history = useHistoryStore()
    const finishedAt = Date.now()

    for (const state of value.sections) {
      if (!state.startedAt) state.startedAt = finishedAt
      if (!state.submitted) {
        if (!value.config.timeBased) {
          let guard = 0
          while (answeredCount(state) < state.target && guard < 30) {
            const before = state.units.length
            const added = ensureNextUnitFor(state)
            if (!added || state.units.length === before) break
            guard += 1
          }
        }
        fillUnanswered(state)
        state.submitted = true
        state.finishedAt = finishedAt
      } else {
        fillUnanswered(state)
      }
    }

    value.status = 'finished'
    value.finishedAt = finishedAt

    const answers = value.sections.flatMap((state) =>
      state.units.flatMap((unit) =>
        unit.questions.map((question) => state.answers[question.id]).filter((answer): answer is ExamAnswer => Boolean(answer)),
      ),
    )
    const sectionResults = value.sections.map((state) => sectionResult(state))
    const overall = overallScore(sectionResults)
    const tagResults = buildTagResults(answers, bank.questionById)
    const weakTags = weakTagsFromResults(tagResults)

    const record: ExamRecord = {
      id: value.id,
      mode: value.config.mode,
      month: value.config.month,
      startedAt: value.startedAt,
      finishedAt,
      durationSec: Math.max(0, Math.round((finishedAt - value.startedAt) / 1000)),
      questionCount: overall.total,
      correctCount: overall.correct,
      accuracy: overall.accuracy,
      score: overall.score,
      cefr: overall.cefr,
      theta: overall.theta,
      sections: sectionResults,
      weakTags,
      tagResults,
      answers,
      config: value.config,
      bankVersion: value.bankVersion,
    }

    history.add(record)
    lastRecord.value = record
    clearDraft()
    draftAvailable.value = false
    refreshNow()
    pushToast('考试已完成，报告已生成', 'success')
  }

  function tick(): boolean {
    refreshNow()
    if (!session.value || session.value.status !== 'running') return false
    if (Date.now() >= session.value.endsAt) {
      finishExam({ timeout: true })
      return true
    }
    return false
  }

  function resumeDraft(): boolean {
    const draft = loadDraft()
    if (!draft) {
      draftAvailable.value = false
      return false
    }
    if (draft.session.status === 'finished') {
      clearDraft()
      draftAvailable.value = false
      return false
    }
    session.value = draft.session
    refreshNow()

    if (Date.now() >= draft.session.endsAt) {
      finishExam({ timeout: true })
      return true
    }

    const state = currentSection.value
    if (state && !state.submitted) {
      if (state.units.length === 0) ensureNextUnitFor(state)
      if (state.currentUnitIndex < 0) state.currentUnitIndex = 0
    }
    return true
  }

  function discardDraft(): void {
    clearDraft()
    draftAvailable.value = false
    session.value = null
  }

  function reset(): void {
    session.value = null
    lastRecord.value = null
    draftAvailable.value = false
  }

  function recommendationsFor(record: ExamRecord) {
    return buildRecommendations(record.sections, record.weakTags)
  }

  return {
    session,
    lastRecord,
    draftAvailable,
    now,
    currentSection,
    currentUnit,
    currentSectionMeta,
    remainingMs,
    totalTarget,
    totalAnswered,
    overallProgress,
    currentUnitComplete,
    isLastSection,
    isTimeBased,
    canAdvance,
    nextLabel,
    start,
    startNew,
    answer,
    toggleFlag,
    recordPlay,
    playsFor,
    advance,
    skipCurrentUnit,
    goPrevUnit,
    goToUnit,
    submitSection,
    finishExam,
    tick,
    resumeDraft,
    discardDraft,
    reset,
    recommendationsFor,
    refreshNow,
  }
})
