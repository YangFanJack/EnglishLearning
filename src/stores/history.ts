import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { ExamRecord } from '@/types'
import { loadHistory, saveHistory } from '@/core/storage'

export const useHistoryStore = defineStore('history', () => {
  const records = ref<ExamRecord[]>(loadHistory())

  const sorted = computed(() => [...records.value].sort((a, b) => b.finishedAt - a.finishedAt))
  const latest = computed(() => sorted.value[0] ?? null)
  const count = computed(() => records.value.length)

  const trend = computed(() => {
    return [...records.value]
      .sort((a, b) => a.finishedAt - b.finishedAt)
      .slice(-12)
      .map((record) => ({
        id: record.id,
        label: `${new Date(record.finishedAt).getMonth() + 1}/${new Date(record.finishedAt).getDate()}`,
        value: record.score,
        cefr: record.cefr,
      }))
  })

  const monthlyBest = computed(() => {
    const map = new Map<string, ExamRecord>()
    for (const record of records.value) {
      const existing = map.get(record.month)
      if (!existing || record.score > existing.score) map.set(record.month, record)
    }
    return [...map.values()].sort((a, b) => b.month.localeCompare(a.month))
  })

  function persist(): void {
    saveHistory(records.value)
  }

  function add(record: ExamRecord): void {
    records.value = [record, ...records.value.filter((item) => item.id !== record.id)].slice(0, 50)
    persist()
  }

  function remove(id: string): void {
    records.value = records.value.filter((record) => record.id !== id)
    persist()
  }

  function clear(): void {
    records.value = []
    persist()
  }

  function get(id: string): ExamRecord | undefined {
    return records.value.find((record) => record.id === id)
  }

  function bestForMonth(month: string): ExamRecord | undefined {
    return records.value
      .filter((record) => record.month === month)
      .sort((a, b) => b.score - a.score)[0]
  }

  function replaceAll(next: ExamRecord[]): void {
    records.value = Array.isArray(next) ? next.slice(0, 50) : []
    persist()
  }

  return {
    records,
    sorted,
    latest,
    count,
    trend,
    monthlyBest,
    add,
    remove,
    clear,
    get,
    bestForMonth,
    replaceAll,
  }
})
