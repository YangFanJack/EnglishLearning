<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useHistoryStore } from '@/stores/history'
import { useWrongbookStore } from '@/stores/wrongbook'
import { useBankStore } from '@/stores/bank'
import type { ExamMode, QuestionFlag } from '@/types'
import { loadFlags } from '@/core/storage'
import { englishVoices, loadVoices, speak, speechSupported, stopSpeech } from '@/core/tts'
import { MODE_META } from '@/core/scoring'
import { pushToast } from '@/core/toast'
import { useDataBackup } from '@/composables/useDataBackup'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'

const settings = useSettingsStore()
const history = useHistoryStore()
const wrongbook = useWrongbookStore()
const bank = useBankStore()
const { exportAll, importFromFile, clearAll } = useDataBackup()

const voices = ref<SpeechSynthesisVoice[]>([])
const loadingVoices = ref(false)
const clearOpen = ref(false)
const resetOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const flags = ref<QuestionFlag[]>(loadFlags())

const supported = speechSupported()
const voiceOptions = computed(() => englishVoices(voices.value))
const dataStats = computed(() => ({
  history: history.count,
  wrongbook: wrongbook.totalCount,
  flags: flags.value.length,
}))

const modeOptions: Array<{ value: ExamMode; label: string }> = [
  { value: 'standard', label: MODE_META.standard.name },
  { value: 'section', label: MODE_META.section.name },
]

function voiceLabel(voice: SpeechSynthesisVoice): string {
  return `${voice.name} (${voice.lang})${voice.default ? ' · 默认' : ''}`
}

function setTheme(theme: 'light' | 'dark' | 'auto'): void {
  settings.update({ theme })
}

function testVoice(): void {
  if (!supported) {
    pushToast('当前浏览器不支持语音朗读', 'error')
    return
  }
  speak('Welcome to the Daien English practice exam. This is a sample of the selected voice.', {
    voiceURI: settings.settings.ttsVoiceURI,
    rate: settings.settings.ttsRate,
  })
}

function triggerImport(): void {
  fileInput.value?.click()
}

async function handleImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const result = await importFromFile(file)
  if (!result.ok) pushToast(result.error ?? '导入失败', 'error')
  input.value = ''
  flags.value = loadFlags()
}

function resetSettings(): void {
  stopSpeech()
  settings.reset()
  resetOpen.value = false
  pushToast('设置已恢复默认', 'success')
}

function confirmClear(): void {
  stopSpeech()
  clearAll()
  flags.value = []
  clearOpen.value = false
}

onMounted(async () => {
  if (!supported) return
  loadingVoices.value = true
  try {
    voices.value = await loadVoices()
  } finally {
    loadingVoices.value = false
  }
})
</script>

<template>
  <div class="stack-lg">
    <div class="page-head">
      <div>
        <span class="eyebrow"><Icon name="settings" :size="13" />Preferences</span>
        <h2>设置</h2>
        <p>调整外观、语音与考试默认项。所有设置保存在本机浏览器。</p>
      </div>
      <span class="tag-pill"><Icon name="shield" :size="12" />本地优先</span>
    </div>

    <div class="settings-grid">
      <section class="settings-section">
        <h3>外观</h3>
        <p>深色模式适合夜间练习，跟随系统会自动切换。</p>

        <div class="setting-row">
          <div class="setting-copy">
            <strong>主题</strong>
            <span>当前：{{ settings.themeLabel }}</span>
          </div>
          <div class="setting-control">
            <div class="segmented">
              <button type="button" :class="{ 'is-active': settings.settings.theme === 'light' }" @click="setTheme('light')">浅色</button>
              <button type="button" :class="{ 'is-active': settings.settings.theme === 'dark' }" @click="setTheme('dark')">深色</button>
              <button type="button" :class="{ 'is-active': settings.settings.theme === 'auto' }" @click="setTheme('auto')">跟随系统</button>
            </div>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h3>语音朗读</h3>
        <p>听力题使用浏览器内置 TTS，不依赖网络音频文件。建议使用 Chrome 或 Edge。</p>

        <div v-if="!supported" class="notice notice-warning mb-3">
          <Icon name="alert" :size="16" />
          <span>当前浏览器不支持 Web Speech API，听力题将显示原文作为降级方案。</span>
        </div>

        <div class="setting-row">
          <div class="setting-copy">
            <strong>英语音色</strong>
            <span>{{ loadingVoices ? '正在加载系统音色…' : `${voiceOptions.length} 个英语音色可用` }}</span>
          </div>
          <div class="setting-control">
            <select v-model="settings.settings.ttsVoiceURI" class="select" :disabled="!supported || voiceOptions.length === 0">
              <option value="">自动选择</option>
              <option v-for="voice in voiceOptions" :key="voice.voiceURI" :value="voice.voiceURI">{{ voiceLabel(voice) }}</option>
            </select>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-copy">
            <strong>语速</strong>
            <span>当前 {{ settings.settings.ttsRate.toFixed(2) }}×，考试中建议 0.9–1.0</span>
          </div>
          <div class="setting-control">
            <input v-model.number="settings.settings.ttsRate" class="input" type="range" min="0.6" max="1.3" step="0.05" />
          </div>
        </div>

        <div class="voice-test mt-3">
          <Icon name="volume" :size="17" class="muted" />
          <span class="text-xs muted" style="flex: 1">试听当前音色与语速</span>
          <button class="btn btn-secondary btn-sm" type="button" :disabled="!supported" @click="testVoice">
            <Icon name="play" :size="14" />
            试听
          </button>
        </div>
      </section>

      <section class="settings-section">
        <h3>考试默认项</h3>
        <p>只影响新开始的考试，不会修改历史记录。</p>

        <div class="setting-row">
          <div class="setting-copy">
            <strong>默认模式</strong>
            <span>进入月度机测时预选的模式</span>
          </div>
          <div class="setting-control">
            <select v-model="settings.settings.defaultMode" class="select">
              <option v-for="mode in modeOptions" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
            </select>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-copy">
            <strong>显示倒计时</strong>
            <span>考试页顶部显示剩余时间</span>
          </div>
          <div class="setting-control">
            <label class="switch">
              <input v-model="settings.settings.showTimer" type="checkbox" />
              <span class="switch-track" />
            </label>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-copy">
            <strong>自动进入下一部分</strong>
            <span>完成当前部分后直接开始下一部分</span>
          </div>
          <div class="setting-control">
            <label class="switch">
              <input v-model="settings.settings.autoNextSection" type="checkbox" />
              <span class="switch-track" />
            </label>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h3>数据与备份</h3>
        <p>数据只保存在当前浏览器。换设备或清理浏览器前，请先导出备份。</p>

        <div class="grid grid-2 mb-3">
          <div class="panel">
            <span class="text-xs muted">考试记录</span>
            <strong class="stat-value">{{ dataStats.history }}</strong>
          </div>
          <div class="panel">
            <span class="text-xs muted">错题本</span>
            <strong class="stat-value">{{ dataStats.wrongbook }}</strong>
          </div>
          <div class="panel">
            <span class="text-xs muted">题目反馈</span>
            <strong class="stat-value">{{ dataStats.flags }}</strong>
          </div>
          <div class="panel">
            <span class="text-xs muted">题库版本</span>
            <strong class="stat-value" style="font-size: 18px">v{{ bank.manifest?.version ?? '—' }}</strong>
          </div>
        </div>

        <div class="stack-sm">
          <button class="btn btn-secondary btn-block" type="button" @click="exportAll">
            <Icon name="download" :size="16" />
            导出全部数据
          </button>
          <button class="btn btn-secondary btn-block" type="button" @click="triggerImport">
            <Icon name="upload" :size="16" />
            导入备份
          </button>
          <input ref="fileInput" type="file" accept="application/json,.json" class="sr-only" @change="handleImport" />
          <button class="btn btn-secondary btn-block" type="button" @click="resetOpen = true">
            <Icon name="refresh" :size="16" />
            恢复默认设置
          </button>
          <button class="btn btn-danger btn-block" type="button" @click="clearOpen = true">
            <Icon name="trash" :size="16" />
            清空学习数据
          </button>
        </div>
      </section>
    </div>

    <div class="notice">
      <Icon name="info" :size="16" />
      <span>本系统为个人练习工具，题库为原创或公开样题改编，不代表岱恩官方测评。数据不会上传到任何服务器。</span>
    </div>

    <Modal :open="resetOpen" title="恢复默认设置？" subtitle="主题、语音和考试默认项会恢复初始值，成绩与错题不受影响。" width="440px" @close="resetOpen = false">
      <template #footer>
        <button class="btn btn-secondary" type="button" @click="resetOpen = false">取消</button>
        <button class="btn btn-primary" type="button" @click="resetSettings">恢复默认</button>
      </template>
    </Modal>

    <Modal :open="clearOpen" title="清空学习数据？" subtitle="历史成绩、错题本、题目反馈和考试草稿都会被删除。" width="460px" @close="clearOpen = false">
      <div class="notice notice-danger">
        <Icon name="alert" :size="16" />
        <span>此操作无法撤销，建议先导出备份。</span>
      </div>
      <template #footer>
        <button class="btn btn-secondary" type="button" @click="clearOpen = false">取消</button>
        <button class="btn btn-danger" type="button" @click="confirmClear">确认清空</button>
      </template>
    </Modal>
  </div>
</template>
