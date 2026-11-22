import { describe, expect, it } from 'vitest'
import {
  THETA_MAX,
  THETA_MIN,
  cefrFromTheta,
  clampTheta,
  normalizeTheta,
  probabilityCorrect,
  selectUnit,
  thetaFromLevel,
  updateTheta,
} from '@/core/adaptive'
import type { Unit } from '@/types'

function unit(id: string, difficulty: Unit['difficulty'], topic = 'general'): Unit {
  return {
    id,
    section: 'vocabulary',
    level: 'B1',
    difficulty,
    topic,
    tags: [topic],
    questions: [],
  }
}

describe('adaptive model', () => {
  it('gives a 50% chance when ability equals difficulty', () => {
    expect(probabilityCorrect(3, 3)).toBeCloseTo(0.5, 6)
    expect(probabilityCorrect(4, 2)).toBeGreaterThan(0.8)
    expect(probabilityCorrect(2, 4)).toBeLessThan(0.2)
  })

  it('raises theta after a correct answer and lowers it after a wrong answer', () => {
    const correct = updateTheta(2.5, 3, true)
    const wrong = updateTheta(2.5, 3, false)
    expect(correct).toBeGreaterThan(2.5)
    expect(wrong).toBeLessThan(2.5)
  })

  it('clamps theta to the supported range', () => {
    expect(clampTheta(-10)).toBe(THETA_MIN)
    expect(clampTheta(10)).toBe(THETA_MAX)
    expect(updateTheta(THETA_MAX, 1, true)).toBe(THETA_MAX)
  })

  it('maps theta to CEFR levels at the documented thresholds', () => {
    expect(cefrFromTheta(1.0)).toBe('A1')
    expect(cefrFromTheta(1.5)).toBe('A2')
    expect(cefrFromTheta(2.5)).toBe('B1')
    expect(cefrFromTheta(3.5)).toBe('B2')
    expect(cefrFromTheta(4.5)).toBe('C1')
    expect(thetaFromLevel('C1')).toBe(5)
  })

  it('normalizes theta into a 0-1 range', () => {
    expect(normalizeTheta(THETA_MIN)).toBe(0)
    expect(normalizeTheta(THETA_MAX)).toBe(1)
    expect(normalizeTheta(2.75)).toBeCloseTo(0.5, 6)
  })

  it('selects an unused unit near the current ability', () => {
    const pool = [unit('a', 1), unit('b', 3), unit('c', 5)]
    const selected = selectUnit(pool, 2.9, { usedIds: new Set(['a']), randomSeed: 'test' })
    expect(selected).toBeDefined()
    expect(['b', 'c']).toContain(selected?.id)
  })

  it('returns undefined when every unit has been used', () => {
    const pool = [unit('a', 1), unit('b', 3)]
    const selected = selectUnit(pool, 2.5, { usedIds: new Set(['a', 'b']), randomSeed: 'test' })
    expect(selected).toBeUndefined()
  })
})
