import type { AppSettings, BackupFile, ExamRecord, WrongbookEntry } from '@/types'
import { downloadJSON, loadFlags, readTextFile, saveFlags, clearDraft } from '@/core/storage'
import { pushToast } from '@/core/toast'
import { useSettingsStore } from '@/stores/settings'
import { useHistoryStore } from '@/stores/history'
import { useWrongbookStore } from '@/stores/wrongbook'
import { useExamStore } from '@/stores/exam'

export function useDataBackup() {
  const settingsStore = useSettingsStore()
  const historyStore = useHistoryStore()
  const wrongbookStore = useWrongbookStore()
  const examStore = useExamStore()

  function exportAll(): void {
    const data: BackupFile = {
      app: 'daien-english-exam',
      version: 1,
      exportedAt: Date.now(),
      settings: settingsStore.settings,
      history: historyStore.records,
      wrongbook: wrongbookStore.entries,
      flags: loadFlags(),
    }
    const stamp = new Date().toISOString().slice(0, 10)
    downloadJSON(`daien-english-exam-backup-${stamp}.json`, data)
    pushToast('数据已导出为 JSON 文件', 'success')
  }

  async function importFromFile(file: File): Promise<{ ok: boolean; error?: string }> {
    try {
      const text = await readTextFile(file)
      const parsed = JSON.parse(text) as Partial<BackupFile>
      if (parsed.app !== 'daien-english-exam' || parsed.version !== 1) {
        return { ok: false, error: '文件不是本系统导出的备份，或版本不兼容。' }
      }
      if (!Array.isArray(parsed.history) || typeof parsed.wrongbook !== 'object' || !parsed.settings) {
        return { ok: false, error: '备份文件结构不完整。' }
      }

      const nextSettings: AppSettings = {
        ...settingsStore.settings,
        ...(parsed.settings as Partial<AppSettings>),
      }
      settingsStore.update(nextSettings)
      historyStore.replaceAll(parsed.history as ExamRecord[])
      wrongbookStore.replaceAll(parsed.wrongbook as Record<string, WrongbookEntry>)
      saveFlags(Array.isArray(parsed.flags) ? parsed.flags : [])
      pushToast('备份已导入', 'success')
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '导入失败' }
    }
  }

  function clearAll(): void {
    historyStore.clear()
    wrongbookStore.clear()
    examStore.reset()
    saveFlags([])
    clearDraft()
    pushToast('本地数据已清空', 'success')
  }

  return { exportAll, importFromFile, clearAll }
}
