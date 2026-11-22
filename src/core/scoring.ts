import type {
  Difficulty,
  ExamAnswer,
  ExamConfig,
  ExamMode,
  Level,
  Section,
  SectionResult,
  SectionState,
  TagResult,
  Unit,
} from '@/types'
import { SECTIONS } from '@/types'
import { cefrFromTheta, clampTheta, normalizeTheta } from './adaptive'

export const MODE_META: Record<
  ExamMode,
  { name: string; description: string; durationSec: number; perSection: number; timeBased?: boolean }
> = {
  quick: {
    name: '快速定级',
    description: '每个部分 5 题，约 15 分钟，快速判断当前水平',
    durationSec: 15 * 60,
    perSection: 5,
  },
  standard: {
    name: '20 分钟自适应定级',
    description: '答满 20 分钟自动判级，答得越好后续题目越难',
    durationSec: 20 * 60,
    perSection: 100,
    timeBased: true,
  },
  full: {
    name: '完整模考',
    description: '每个部分 15 题，约 60 分钟，完整检验四项能力',
    durationSec: 60 * 60,
    perSection: 15,
  },
  section: {
    name: '专项测评',
    description: '只测一个部分，20 题，集中定位薄弱环节',
    durationSec: 25 * 60,
    perSection: 20,
  },
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(month: string): string {
  const [year, m] = month.split('-')
  return `${year} 年 ${Number(m)} 月`
}

export function makeExamConfig(
  mode: ExamMode,
  options: { section?: Section; startTheta?: number; month?: string; seed?: number } = {},
): ExamConfig {
  const meta = MODE_META[mode]
  const sections = mode === 'section' ? 1 : 4
  return {
    mode,
    section: mode === 'section' ? options.section ?? 'listening' : undefined,
    questionTarget: meta.perSection * sections,
    durationSec: meta.durationSec,
    startTheta: clampTheta(options.startTheta ?? 2.5),
    month: options.month ?? currentMonthKey(),
    seed: options.seed ?? Math.floor(Math.random() * 1_000_000_000),
    timeBased: Boolean(meta.timeBased),
  }
}

export function sectionTarget(config: ExamConfig, section: Section): number {
  if (config.mode === 'section') {
    return config.section === section ? config.questionTarget : 0
  }
  return Math.round(config.questionTarget / 4)
}

export function activeSections(config: ExamConfig): Section[] {
  if (config.mode === 'section' && config.section) return [config.section]
  return [...SECTIONS]
}

export function answeredCount(state: SectionState): number {
  return Object.keys(state.answers).length
}

export function unitQuestionsAnswered(state: SectionState, unit: Unit): number {
  return unit.questions.filter((question) => Boolean(state.answers[question.id])).length
}

export function isUnitComplete(state: SectionState, unit: Unit): boolean {
  return unit.questions.every((question) => Boolean(state.answers[question.id]))
}

export function sectionThetaFromAnswers(state: SectionState, startTheta: number): number {
  let theta = startTheta
  for (const unit of state.units) {
    for (const question of unit.questions) {
      const answer = state.answers[question.id]
      if (!answer) continue
      const expected = 1 / (1 + Math.exp(-(theta - question.difficulty)))
      theta = clampTheta(theta + 0.7 * ((answer.correct ? 1 : 0) - expected))
    }
  }
  return theta
}

export function scoreFromThetaAndAccuracy(theta: number, accuracy: number): number {
  const abilityScore = normalizeTheta(theta) * 100
  return Math.round(Math.min(100, Math.max(0, abilityScore * 0.7 + accuracy * 100 * 0.3)))
}

export function sectionResult(state: SectionState): SectionResult {
  const answers = Object.values(state.answers)
  const total = answers.length
  const correct = answers.filter((answer) => answer.correct).length
  const accuracy = total > 0 ? correct / total : 0
  const theta = state.theta
  return {
    section: state.section,
    theta,
    cefr: cefrFromTheta(theta),
    correct,
    total,
    accuracy,
    score: scoreFromThetaAndAccuracy(theta, accuracy),
    timeSec: Math.max(0, Math.round(((state.finishedAt ?? Date.now()) - state.startedAt) / 1000)),
  }
}

export function overallScore(sections: SectionResult[]): { score: number; theta: number; accuracy: number; cefr: Level; total: number; correct: number } {
  const total = sections.reduce((sum, section) => sum + section.total, 0)
  const correct = sections.reduce((sum, section) => sum + section.correct, 0)
  const accuracy = total > 0 ? correct / total : 0
  const theta = total > 0
    ? sections.reduce((sum, section) => sum + section.theta * section.total, 0) / total
    : 2.5
  return {
    score: scoreFromThetaAndAccuracy(theta, accuracy),
    theta,
    accuracy,
    cefr: cefrFromTheta(theta),
    total,
    correct,
  }
}

export function buildTagResults(answers: ExamAnswer[], questionById: Record<string, { tags: string[]; section: Section }>): TagResult[] {
  const map = new Map<string, TagResult>()
  for (const answer of answers) {
    const question = questionById[answer.questionId]
    if (!question) continue
    for (const tag of question.tags) {
      const key = `${question.section}:${tag}`
      const existing = map.get(key) ?? {
        tag,
        section: question.section,
        correct: 0,
        total: 0,
        accuracy: 0,
      }
      existing.total += 1
      if (answer.correct) existing.correct += 1
      existing.accuracy = existing.total > 0 ? existing.correct / existing.total : 0
      map.set(key, existing)
    }
  }
  return [...map.values()].sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
}

export function weakTagsFromResults(tagResults: TagResult[], limit = 6): TagResult[] {
  return tagResults.filter((item) => item.total >= 2 && item.accuracy < 0.6).slice(0, limit)
}

export interface Recommendation {
  title: string
  text: string
  section?: Section
  tag?: string
}

export function buildRecommendations(sections: SectionResult[], weakTags: TagResult[]): Recommendation[] {
  const recommendations: Recommendation[] = []
  for (const tag of weakTags.slice(0, 3)) {
    recommendations.push({
      title: `补强「${tag.tag}」`,
      text: `该考点正确率 ${Math.round(tag.accuracy * 100)}%，建议用专项练习连续做 10 题，并回看解析。`,
      section: tag.section,
      tag: tag.tag,
    })
  }

  const lowest = [...sections].sort((a, b) => a.accuracy - b.accuracy)[0]
  if (lowest && lowest.total > 0) {
    const name: Record<Section, string> = {
      listening: '听力',
      vocabulary: '词汇',
      grammar: '语法',
      reading: '阅读',
    }
    recommendations.push({
      title: `${name[lowest.section]}是当前短板`,
      text: `本部分正确率 ${Math.round(lowest.accuracy * 100)}%。建议先做 10 题专项练习，再回到标准月考检验。`,
      section: lowest.section,
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: '保持节奏',
      text: '四项能力较均衡。建议每周完成 1 次标准月考，并保持 2–3 次专项练习。',
    })
  }
  return recommendations
}

export function difficultyLabel(difficulty: Difficulty): string {
  return ['', '基础', '较易', '中等', '较难', '挑战'][difficulty] ?? '中等'
}

export function modeSectionSummary(config: ExamConfig): string {
  if (config.mode === 'section' && config.section) {
    return `专项 · ${config.section}`
  }
  return `${MODE_META[config.mode].name} · 四部分`
}
