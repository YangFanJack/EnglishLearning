import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ListeningBankFile, ReadingBankFile, SectionBankFile, BankManifest } from '@/types'

const dataDir = join(process.cwd(), 'public', 'data')
const read = <T>(name: string): T => JSON.parse(readFileSync(join(dataDir, name), 'utf8')) as T

const manifest = read<BankManifest>('manifest.json')
const vocabulary = read<SectionBankFile>('vocabulary.json')
const grammar = read<SectionBankFile>('grammar.json')
const listening = read<ListeningBankFile>('listening.json')
const reading = read<ReadingBankFile>('reading.json')

describe('question bank', () => {
  it('contains 1200 questions across four sections', () => {
    expect(manifest.total).toBe(1200)
    expect(manifest.counts.listening).toBe(300)
    expect(manifest.counts.vocabulary).toBe(300)
    expect(manifest.counts.grammar).toBe(300)
    expect(manifest.counts.reading).toBe(300)
    expect(vocabulary.questions).toHaveLength(300)
    expect(grammar.questions).toHaveLength(300)
    expect(listening.questions).toHaveLength(300)
    expect(reading.questions).toHaveLength(300)
  })

  it('has valid options and answers for every question', () => {
    const all = [...vocabulary.questions, ...grammar.questions, ...listening.questions, ...reading.questions]
    for (const question of all) {
      expect(question.options).toHaveLength(4)
      expect(new Set(question.options).size).toBe(4)
      expect(question.answer).toBeGreaterThanOrEqual(0)
      expect(question.answer).toBeLessThan(4)
      expect(question.explanation.length).toBeGreaterThan(5)
      expect(question.tags.length).toBeGreaterThan(0)
    }
  })

  it('uses unique question ids', () => {
    const ids = [
      ...vocabulary.questions,
      ...grammar.questions,
      ...listening.questions,
      ...reading.questions,
    ].map((question) => question.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('links every listening question to a complete set', () => {
    const setIds = new Set(listening.sets.map((set) => set.id))
    expect(setIds.size).toBe(300)
    const counts = new Map<string, number>()
    for (const question of listening.questions) {
      expect(question.setId).toBeTruthy()
      expect(setIds.has(question.setId as string)).toBe(true)
      counts.set(question.setId as string, (counts.get(question.setId as string) ?? 0) + 1)
    }
    for (const set of listening.sets) {
      expect(set.turns.length).toBeGreaterThanOrEqual(2)
      expect(set.script.length).toBeGreaterThan(20)
      expect(counts.get(set.id)).toBe(1)
    }
  })

  it('links every reading question to a passage with five questions', () => {
    const passageById = new Map(reading.passages.map((passage) => [passage.id, passage]))
    const passageIds = new Set(passageById.keys())
    expect(passageIds.size).toBe(60)
    for (const question of reading.questions) {
      expect(question.passageId).toBeTruthy()
      expect(passageIds.has(question.passageId as string)).toBe(true)
      const passage = passageById.get(question.passageId as string)
      const correct = question.options[question.answer]
      expect(passage?.text.toLowerCase().includes(correct.toLowerCase())).toBe(false)
    }
    const counts = new Map<string, number>()
    for (const question of reading.questions) {
      counts.set(question.passageId as string, (counts.get(question.passageId as string) ?? 0) + 1)
    }
    for (const passage of reading.passages) {
      expect(counts.get(passage.id)).toBe(5)
    }
  })

  it('uses varied stems and question types', () => {
    const all = [...vocabulary.questions, ...grammar.questions, ...listening.questions, ...reading.questions]
    expect(new Set(all.map((question) => question.stem)).size).toBeGreaterThanOrEqual(800)
    expect(new Set(listening.questions.map((question) => question.type)).size).toBeGreaterThanOrEqual(4)
    const readingTypes = new Set(reading.questions.map((question) => question.type))
    for (const type of ['gist', 'inference', 'vocabulary', 'purpose', 'attitude']) {
      expect(readingTypes.has(type)).toBe(true)
    }
  })
})
