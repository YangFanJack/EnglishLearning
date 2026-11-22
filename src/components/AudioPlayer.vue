<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { SpeakerTurn } from '@/types'
import { loadVoices, speakTurns, speechSupported, stopSpeech } from '@/core/tts'
import { pushToast } from '@/core/toast'
import Icon from './Icon.vue'

const props = withDefaults(
  defineProps<{
    turns?: SpeakerTurn[]
    script?: string
    maxPlays?: number
    plays?: number
    reveal?: boolean
    allowTranscript?: boolean
    rate?: number
    voiceURI?: string
    compact?: boolean
    label?: string
  }>(),
  {
    turns: () => [],
    script: '',
    maxPlays: 2,
    plays: 0,
    reveal: false,
    allowTranscript: true,
    rate: 0.95,
    voiceURI: '',
    compact: false,
    label: '听力材料',
  },
)

const emit = defineEmits<{ play: [] }>()

const supported = speechSupported()
const speaking = ref(false)
const showTranscript = ref(false)
const voicesReady = ref(false)

const transcriptVisible = computed(() => props.reveal || (props.allowTranscript && showTranscript.value))

const turnsToSpeak = computed<SpeakerTurn[]>(() => {
  if (props.turns.length > 0) return props.turns
  if (props.script) return [{ speaker: 'Narrator', text: props.script }]
  return []
})

const remaining = computed(() => {
  if (props.maxPlays <= 0) return null
  return Math.max(0, props.maxPlays - props.plays)
})

const canPlay = computed(() => supported && !speaking.value && (props.maxPlays <= 0 || props.plays < props.maxPlays))

async function play(): Promise<void> {
  if (!supported) {
    pushToast('当前浏览器不支持语音朗读，请查看听力原文', 'error')
    showTranscript.value = true
    return
  }
  if (props.maxPlays > 0 && props.plays >= props.maxPlays) {
    pushToast('本题播放次数已用完', 'info')
    return
  }
  if (speaking.value) {
    stop()
    return
  }
  emit('play')
  speaking.value = true
  try {
    await speakTurns(turnsToSpeak.value, {
      rate: props.rate,
      voiceURI: props.voiceURI,
    })
  } finally {
    speaking.value = false
  }
}

function stop(): void {
  stopSpeech()
  speaking.value = false
}

onMounted(async () => {
  if (supported) {
    await loadVoices()
    voicesReady.value = true
  }
})

onBeforeUnmount(() => {
  stopSpeech()
})
</script>

<template>
  <section class="audio-player" :class="{ 'is-compact': compact }">
    <div class="audio-main">
      <button class="audio-play" type="button" :disabled="!canPlay && !speaking" :aria-label="speaking ? '停止播放' : '播放听力'" @click="play">
        <Icon :name="speaking ? 'stop' : 'play'" :size="22" />
      </button>
      <div class="audio-info">
        <div class="audio-title-row">
          <strong>{{ label }}</strong>
          <span v-if="remaining !== null" class="audio-count">剩余 {{ remaining }} 次</span>
          <span v-else class="audio-count">可重复播放</span>
        </div>
        <div class="audio-wave" :class="{ 'is-playing': speaking }" aria-hidden="true">
          <span v-for="index in 18" :key="index" :style="{ animationDelay: `${index * 55}ms` }" />
        </div>
      </div>
      <button v-if="speaking" class="btn btn-ghost btn-sm" type="button" @click="stop">停止</button>
    </div>

    <div v-if="!supported" class="audio-fallback">
      <Icon name="alert" :size="15" />
      当前浏览器不支持 TTS，请使用 Chrome / Edge，或展开原文作答。
    </div>

    <div class="audio-foot">
      <span class="audio-hint">
        <Icon name="headphones" :size="14" />
        {{ voicesReady ? '浏览器语音朗读 · 英式/美式音色由系统决定' : '正在准备语音…' }}
      </span>
      <button v-if="allowTranscript" class="link-btn" type="button" @click="showTranscript = !showTranscript">
        {{ showTranscript ? '收起原文' : '查看原文' }}
      </button>
      <span v-else-if="!reveal" class="text-xs muted">完成本组后可查看原文</span>
    </div>

    <transition name="fade">
      <div v-if="transcriptVisible" class="transcript">
        <div v-for="(turn, index) in turnsToSpeak" :key="index" class="transcript-turn">
          <span class="transcript-speaker">{{ turn.speaker }}</span>
          <span>{{ turn.text }}</span>
        </div>
      </div>
    </transition>
  </section>
</template>
