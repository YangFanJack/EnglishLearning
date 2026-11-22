import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { WrongbookEntry } from '@/types'
import { loadWrongbook, saveWrongbook } from '@/core/storage'

export const useWrongbookStore = defineStore('wrongbook', () => {
  const entries = ref<Record<string, WrongbookEntry>>(loadWrongbook())

  const list = computed(() => {
    return Object.values(entries.value).sort((a, b) => {
      if (a.mastered !== b.mastered) return a.mastered ? 1 : -1
      return b.lastAt - a.lastAt
    })
  })

  const activeCount = computed(() => list.value.filter((entry) => !entry.mastered).length)
  const totalCount = computed(() => list.value.length)
  const activeIds = computed(() => list.value.filter((entry) => !entry.mastered).map((entry) => entry.questionId))

  function persist(): void {
    saveWrongbook(entries.value)
  }

  function addWrong(questionId: string): void {
    const existing = entries.value[questionId]
    entries.value[questionId] = {
      questionId,
      wrongCount: (existing?.wrongCount ?? 0) + 1,
      correctStreak: 0,
      lastAt: Date.now(),
      mastered: false,
      note: existing?.note,
    }
    persist()
  }

  function markCorrect(questionId: string): void {
    const existing = entries.value[questionId]
    if (!existing) return
    const correctStreak = existing.correctStreak + 1
    entries.value[questionId] = {
      ...existing,
      correctStreak,
      lastAt: Date.now(),
      mastered: correctStreak >= 2 ? true : existing.mastered,
    }
    persist()
  }

  function markMastered(questionId: string, mastered = true): void {
    const existing = entries.value[questionId]
    if (!existing) return
    entries.value[questionId] = { ...existing, mastered, lastAt: Date.now() }
    persist()
  }

  function setNote(questionId: string, note: string): void {
    const existing = entries.value[questionId]
    if (!existing) return
    entries.value[questionId] = { ...existing, note }
    persist()
  }

  function remove(questionId: string): void {
    delete entries.value[questionId]
    persist()
  }

  function clear(): void {
    entries.value = {}
    persist()
  }

  function has(questionId: string): boolean {
    return Boolean(entries.value[questionId])
  }

  function replaceAll(next: Record<string, WrongbookEntry>): void {
    entries.value = next && typeof next === 'object' ? next : {}
    persist()
  }

  return {
    entries,
    list,
    activeCount,
    totalCount,
    activeIds,
    addWrong,
    markCorrect,
    markMastered,
    setNote,
    remove,
    clear,
    has,
    replaceAll,
  }
})
