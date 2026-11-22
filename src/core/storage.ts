import type { AppSettings, ExamSession, ExamRecord, QuestionFlag, WrongbookEntry } from '@/types'

export const STORAGE_KEYS = {
  settings: 'daien.settings.v1',
  history: 'daien.history.v1',
  wrongbook: 'daien.wrongbook.v1',
  draft: 'daien.examDraft.v1',
  flags: 'daien.flags.v1',
} as const

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  ttsVoiceURI: '',
  ttsRate: 0.95,
  defaultMode: 'standard',
  showTimer: true,
  autoNextSection: true,
}

function hasStorage(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  if (!hasStorage()) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  if (!hasStorage()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function loadSettings(): AppSettings {
  const stored = readJSON<Partial<AppSettings>>(STORAGE_KEYS.settings, {})
  return { ...DEFAULT_SETTINGS, ...stored }
}

export function saveSettings(settings: AppSettings): void {
  writeJSON(STORAGE_KEYS.settings, settings)
}

export function loadHistory(): ExamRecord[] {
  const records = readJSON<ExamRecord[]>(STORAGE_KEYS.history, [])
  return Array.isArray(records) ? records : []
}

export function saveHistory(records: ExamRecord[]): void {
  writeJSON(STORAGE_KEYS.history, records.slice(0, 50))
}

export function loadWrongbook(): Record<string, WrongbookEntry> {
  const entries = readJSON<Record<string, WrongbookEntry>>(STORAGE_KEYS.wrongbook, {})
  return entries && typeof entries === 'object' ? entries : {}
}

export function saveWrongbook(entries: Record<string, WrongbookEntry>): void {
  writeJSON(STORAGE_KEYS.wrongbook, entries)
}

export interface DraftFile {
  version: 1
  savedAt: number
  session: ExamSession
}

export function loadDraft(): DraftFile | null {
  const draft = readJSON<DraftFile | null>(STORAGE_KEYS.draft, null)
  if (!draft || draft.version !== 1 || !draft.session) return null
  return draft
}

export function saveDraft(session: ExamSession): void {
  writeJSON(STORAGE_KEYS.draft, { version: 1, savedAt: Date.now(), session } satisfies DraftFile)
}

export function clearDraft(): void {
  removeKey(STORAGE_KEYS.draft)
}

export function loadFlags(): QuestionFlag[] {
  const flags = readJSON<QuestionFlag[]>(STORAGE_KEYS.flags, [])
  return Array.isArray(flags) ? flags : []
}

export function saveFlags(flags: QuestionFlag[]): void {
  writeJSON(STORAGE_KEYS.flags, flags)
}

export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'))
    reader.readAsText(file)
  })
}
