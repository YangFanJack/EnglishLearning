import { describe, expect, it } from 'vitest'
import {
  MODE_META,
  buildRecommendations,
  buildTagResults,
  currentMonthKey,
  makeExamConfig,
  overallScore,
  scoreFromThetaAndAccuracy,
  sectionTarget,
  weakTagsFromResults,
} from '@/core/scoring'
import type { ExamAnswer, SectionResult } from '@/types'

function sectionResult(section: SectionResult['section'], theta: number, correct: number, total: number): SectionResult {
  return {
    section,
    theta,
    cefr: 'B1',
    correct,
    total,
    accuracy: total > 0 ? correct / total : 0,
    score: scoreFromThetaAndAccuracy(theta, total > 0 ? correct / total : 0),
    timeSec: 600,
  }
}

describe('exam configuration', () => {
  it('creates the documented question targets', () => {
    expect(makeExamConfig('quick').questionTarget).toBe(20)
    const adaptive = makeExamConfig('standard')
    expect(adaptive.questionTarget).toBe(400)
    expect(adaptive.durationSec).toBe(20 * 60)
    expect(adaptive.timeBased).toBe(true)
    expect(makeExamConfig('full').questionTarget).toBe(60)
    expect(makeExamConfig('section', { section: 'grammar' }).questionTarget).toBe(20)
    expect(makeExamConfig('section', { section: 'grammar' }).section).toBe('grammar')
  })

  it('keeps adaptive targets high enough to be driven by time', () => {
    const config = makeExamConfig('standard')
    expect(sectionTarget(config, 'listening')).toBe(100)
    expect(sectionTarget(config, 'vocabulary')).toBe(100)
    expect(sectionTarget(config, 'grammar')).toBe(100)
    expect(sectionTarget(config, 'reading')).toBe(100)
  })

  it('only activates the chosen section in section mode', () => {
    const config = makeExamConfig('section', { section: 'reading' })
    expect(sectionTarget(config, 'reading')).toBe(20)
    expect(sectionTarget(config, 'listening')).toBe(0)
  })

  it('formats the current month', () => {
    const date = new Date(2026, 10, 22)
    expect(currentMonthKey(date)).toBe('2026-11')
  })
})

describe('scoring', () => {
  it('keeps scores inside 0-100 and rewards accuracy', () => {
    expect(scoreFromThetaAndAccuracy(0.5, 0)).toBe(0)
    expect(scoreFromThetaAndAccuracy(5, 1)).toBe(100)
    const low = scoreFromThetaAndAccuracy(2.5, 0.4)
    const high = scoreFromThetaAndAccuracy(2.5, 0.9)
    expect(high).toBeGreaterThan(low)
    expect(low).toBeGreaterThanOrEqual(0)
  })

  it('weights ability and accuracy for the overall result', () => {
    const result = overallScore([
      sectionResult('listening', 2.5, 6, 10),
      sectionResult('vocabulary', 3.5, 8, 10),
      sectionResult('grammar', 3, 7, 10),
      sectionResult('reading', 4, 9, 10),
    ])
    expect(result.total).toBe(40)
    expect(result.correct).toBe(30)
    expect(result.accuracy).toBeCloseTo(0.75, 6)
    expect(result.theta).toBeCloseTo(3.25, 6)
    expect(result.score).toBeGreaterThan(50)
    expect(result.score).toBeLessThan(100)
  })

  it('aggregates tag results and identifies weak tags', () => {
    const answers: ExamAnswer[] = [
      { questionId: 'q1', section: 'grammar', selected: 0, correct: false, timeMs: 1000, flagged: false },
      { questionId: 'q2', section: 'grammar', selected: 1, correct: false, timeMs: 1000, flagged: false },
      { questionId: 'q3', section: 'grammar', selected: 2, correct: true, timeMs: 1000, flagged: false },
    ]
    const questionById = {
      q1: { tags: ['tense', 'present'], section: 'grammar' as const },
      q2: { tags: ['tense', 'past'], section: 'grammar' as const },
      q3: { tags: ['tense', 'articles'], section: 'grammar' as const },
    }
    const tags = buildTagResults(answers, questionById)
    const tense = tags.find((tag) => tag.tag === 'tense')
    expect(tense?.correct).toBe(1)
    expect(tense?.total).toBe(3)
    expect(weakTagsFromResults(tags)[0].tag).toBe('tense')
  })

  it('always produces at least one recommendation', () => {
    const recommendations = buildRecommendations([sectionResult('reading', 2.5, 5, 10)], [])
    expect(recommendations.length).toBeGreaterThan(0)
    expect(recommendations[0].title).toBeTruthy()
  })

  it('documents every mode', () => {
    for (const mode of Object.keys(MODE_META) as Array<keyof typeof MODE_META>) {
      expect(MODE_META[mode].name).toBeTruthy()
      expect(MODE_META[mode].perSection).toBeGreaterThan(0)
      expect(MODE_META[mode].durationSec).toBeGreaterThan(0)
    }
  })
})
