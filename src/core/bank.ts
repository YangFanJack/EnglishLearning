import type {
  BankData,
  BankManifest,
  ListeningBankFile,
  ListeningSet,
  Passage,
  Question,
  ReadingBankFile,
  Section,
  SectionBankFile,
  Unit,
} from '@/types'
import { SECTIONS } from '@/types'

let cache: BankData | null = null
let loading: Promise<BankData> | null = null

const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(`题库文件加载失败：${path} (${response.status})`)
  }
  return (await response.json()) as T
}

function mergeTags(...groups: Array<string[] | undefined>): string[] {
  return [...new Set(groups.flatMap((group) => group ?? []).filter(Boolean))]
}

function byDifficultyThenId(a: Unit, b: Unit): number {
  return a.difficulty - b.difficulty || a.id.localeCompare(b.id)
}

function buildListeningUnits(sets: ListeningSet[], questions: Question[]): Unit[] {
  const grouped = new Map<string, Question[]>()
  for (const question of questions) {
    if (!question.setId) continue
    const list = grouped.get(question.setId) ?? []
    list.push(question)
    grouped.set(question.setId, list)
  }

  const units: Unit[] = []
  for (const set of sets) {
    const setQuestions = grouped.get(set.id) ?? []
    if (setQuestions.length === 0) continue
    units.push({
      id: `unit-${set.id}`,
      section: 'listening',
      level: set.level,
      difficulty: set.difficulty,
      topic: set.topic,
      tags: mergeTags(set.tags, ...setQuestions.map((question) => question.tags)),
      questions: setQuestions,
      script: set.script,
      turns: set.turns,
      title: set.title,
    })
  }
  return units.sort(byDifficultyThenId)
}

function buildReadingUnits(passages: Passage[], questions: Question[]): Unit[] {
  const grouped = new Map<string, Question[]>()
  for (const question of questions) {
    if (!question.passageId) continue
    const list = grouped.get(question.passageId) ?? []
    list.push(question)
    grouped.set(question.passageId, list)
  }

  const units: Unit[] = []
  for (const passage of passages) {
    const passageQuestions = grouped.get(passage.id) ?? []
    if (passageQuestions.length === 0) continue
    units.push({
      id: `unit-${passage.id}`,
      section: 'reading',
      level: passage.level,
      difficulty: passage.difficulty,
      topic: passage.topic,
      tags: mergeTags(passage.tags, ...passageQuestions.map((question) => question.tags)),
      questions: passageQuestions,
      passage,
      title: passage.title,
    })
  }
  return units.sort(byDifficultyThenId)
}

function buildSingleUnits(section: Section, questions: Question[]): Unit[] {
  return questions
    .map((question) => ({
      id: `unit-${question.id}`,
      section,
      level: question.level,
      difficulty: question.difficulty,
      topic: question.topic,
      tags: mergeTags(question.tags),
      questions: [question],
      title: question.topic,
    }))
    .sort(byDifficultyThenId)
}

export async function loadBank(force = false): Promise<BankData> {
  if (cache && !force) return cache
  if (loading && !force) return loading

  loading = (async () => {
    const manifest = await fetchJSON<BankManifest>('data/manifest.json')
    const [vocabulary, grammar, listening, reading] = await Promise.all([
      fetchJSON<SectionBankFile>('data/vocabulary.json'),
      fetchJSON<SectionBankFile>('data/grammar.json'),
      fetchJSON<ListeningBankFile>('data/listening.json'),
      fetchJSON<ReadingBankFile>('data/reading.json'),
    ])

    const questions: Record<Section, Question[]> = {
      listening: listening.questions,
      vocabulary: vocabulary.questions,
      grammar: grammar.questions,
      reading: reading.questions,
    }

    const questionById: Record<string, Question> = {}
    for (const section of SECTIONS) {
      for (const question of questions[section]) {
        questionById[question.id] = question
      }
    }

    const passages: Record<string, Passage> = {}
    for (const passage of reading.passages) {
      passages[passage.id] = passage
    }

    const listeningSets: Record<string, ListeningSet> = {}
    for (const set of listening.sets) {
      listeningSets[set.id] = set
    }

    const units: Record<Section, Unit[]> = {
      listening: buildListeningUnits(listening.sets, listening.questions),
      vocabulary: buildSingleUnits('vocabulary', vocabulary.questions),
      grammar: buildSingleUnits('grammar', grammar.questions),
      reading: buildReadingUnits(reading.passages, reading.questions),
    }

    const data: BankData = {
      manifest,
      questions,
      units,
      passages,
      listeningSets,
      questionById,
    }
    cache = data
    return data
  })()

  try {
    return await loading
  } catch (error) {
    loading = null
    throw error
  }
}

export function getCachedBank(): BankData | null {
  return cache
}

export function unitsForSection(bank: BankData, section: Section): Unit[] {
  return bank.units[section]
}

export function findUnitForQuestion(bank: BankData, questionId: string): Unit | undefined {
  for (const section of SECTIONS) {
    for (const unit of bank.units[section]) {
      if (unit.questions.some((question) => question.id === questionId)) return unit
    }
  }
  return undefined
}

export function bankTotals(bank: BankData): { total: number; listeningSets: number; passages: number } {
  return {
    total: SECTIONS.reduce((sum, section) => sum + bank.questions[section].length, 0),
    listeningSets: Object.keys(bank.listeningSets).length,
    passages: Object.keys(bank.passages).length,
  }
}
