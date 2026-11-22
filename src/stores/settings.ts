import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { AppSettings, ExamMode } from '@/types'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/core/storage'

function resolveTheme(theme: AppSettings['theme']): 'light' | 'dark' {
  if (theme !== 'auto') return theme
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(loadSettings())
  const resolvedTheme = ref<'light' | 'dark'>(resolveTheme(settings.value.theme))

  function applyTheme(): void {
    resolvedTheme.value = resolveTheme(settings.value.theme)
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = resolvedTheme.value
      document.documentElement.style.colorScheme = resolvedTheme.value
    }
  }

  function update(patch: Partial<AppSettings>): void {
    settings.value = { ...settings.value, ...patch }
  }

  function reset(): void {
    settings.value = { ...DEFAULT_SETTINGS }
  }

  function setDefaultMode(mode: ExamMode): void {
    update({ defaultMode: mode })
  }

  function toggleTheme(): void {
    update({ theme: resolvedTheme.value === 'dark' ? 'light' : 'dark' })
  }

  watch(
    settings,
    (value) => {
      saveSettings(value)
      applyTheme()
    },
    { deep: true },
  )

  if (typeof window !== 'undefined') {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', () => {
      if (settings.value.theme === 'auto') applyTheme()
    })
  }

  applyTheme()

  const themeLabel = computed(() => (resolvedTheme.value === 'dark' ? '深色' : '浅色'))

  return {
    settings,
    resolvedTheme,
    themeLabel,
    update,
    reset,
    setDefaultMode,
    toggleTheme,
    applyTheme,
  }
})
