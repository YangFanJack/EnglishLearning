import type { Difficulty, Level, Unit } from '@/types'
import { Rng } from './random'

export const THETA_MIN = 0.5
export const THETA_MAX = 5
export const THETA_START = 2.5
export const THETA_K = 0.7

export function clampTheta(value: number): number {
  return Math.min(THETA_MAX, Math.max(THETA_MIN, value))
}

export function probabilityCorrect(theta: number, difficulty: number): number {
  return 1 / (1 + Math.exp(-(theta - difficulty)))
}

export function updateTheta(theta: number, difficulty: number, correct: boolean, k = THETA_K): number {
  const expected = probabilityCorrect(theta, difficulty)
  return clampTheta(theta + k * ((correct ? 1 : 0) - expected))
}

export function cefrFromTheta(theta: number): Level {
  if (theta < 1.5) return 'A1'
  if (theta < 2.5) return 'A2'
  if (theta < 3.5) return 'B1'
  if (theta < 4.5) return 'B2'
  return 'C1'
}

export function thetaFromLevel(level: Level): number {
  const map: Record<Level, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 }
  return map[level]
}

export function normalizeTheta(theta: number): number {
  return Math.min(1, Math.max(0, (theta - THETA_MIN) / (THETA_MAX - THETA_MIN)))
}

export function difficultyDistance(difficulty: Difficulty, theta: number): number {
  return Math.abs(difficulty - theta)
}

export interface SelectOptions {
  usedIds: Set<string>
  recentTopics?: string[]
  randomSeed?: string | number
}

export function selectUnit(pool: readonly Unit[], theta: number, options: SelectOptions): Unit | undefined {
  const available = pool.filter((unit) => !options.usedIds.has(unit.id))
  if (available.length === 0) return undefined

  const recent = new Set((options.recentTopics ?? []).filter(Boolean))
  const ranked = [...available].sort((a, b) => {
    const distance = difficultyDistance(a.difficulty, theta) - difficultyDistance(b.difficulty, theta)
    if (distance !== 0) return distance
    const aFresh = recent.has(a.topic) ? 1 : 0
    const bFresh = recent.has(b.topic) ? 1 : 0
    return aFresh - bFresh
  })

  const nearby = ranked.slice(0, Math.min(6, ranked.length))
  const fresh = nearby.filter((unit) => !recent.has(unit.topic))
  const candidates = fresh.length > 0 ? fresh : nearby
  const rng = new Rng(options.randomSeed ?? `${theta}:${available.length}:${options.usedIds.size}`)
  return rng.pick(candidates.slice(0, Math.min(3, candidates.length)))
}

export function nextSectionTheta(current: number, lastDifficulty: number, correct: boolean): number {
  return clampTheta(current + (correct ? 0.12 : -0.12) + (correct ? lastDifficulty - current : lastDifficulty - current) * 0.04)
}
