import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { BankData, BankManifest, ListeningSet, Passage, Question, Section, Unit } from '@/types'
import { SECTIONS } from '@/types'
import { loadBank } from '@/core/bank'

export const useBankStore = defineStore('bank', () => {
  const manifest = ref<BankManifest | null>(null)
  const questions = ref<Record<Section, Question[]>>({
    listening: [],
    vocabulary: [],
    grammar: [],
    reading: [],
  })
  const units = ref<Record<Section, Unit[]>>({
    listening: [],
    vocabulary: [],
    grammar: [],
    reading: [],
  })
  const passages = ref<Record<string, Passage>>({})
  const listeningSets = ref<Record<string, ListeningSet>>({})
  const questionById = ref<Record<string, Question>>({})
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  const total = computed(() => {
    if (!manifest.value) return 0
    return SECTIONS.reduce((sum, section) => sum + (manifest.value?.counts[section] ?? 0), 0)
  })

  const allQuestions = computed(() => SECTIONS.flatMap((section) => questions.value[section]))

  const stats = computed(() => {
    return SECTIONS.map((section) => ({
      section,
      count: questions.value[section].length,
      units: units.value[section].length,
    }))
  })

  async function load(force = false): Promise<BankData> {
    if (loaded.value && !force) {
      return {
        manifest: manifest.value as BankManifest,
        questions: questions.value,
        units: units.value,
        passages: passages.value,
        listeningSets: listeningSets.value,
        questionById: questionById.value,
      }
    }
    loading.value = true
    error.value = ''
    try {
      const data = await loadBank(force)
      manifest.value = data.manifest
      questions.value = data.questions
      units.value = data.units
      passages.value = data.passages
      listeningSets.value = data.listeningSets
      questionById.value = data.questionById
      loaded.value = true
      return data
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : '题库加载失败'
      throw caught
    } finally {
      loading.value = false
    }
  }

  function question(id: string): Question | undefined {
    return questionById.value[id]
  }

  function passage(id: string): Passage | undefined {
    return passages.value[id]
  }

  function listeningSet(id: string): ListeningSet | undefined {
    return listeningSets.value[id]
  }

  return {
    manifest,
    questions,
    units,
    passages,
    listeningSets,
    questionById,
    loading,
    loaded,
    error,
    total,
    allQuestions,
    stats,
    load,
    question,
    passage,
    listeningSet,
  }
})
