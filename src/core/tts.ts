import type { SpeakerTurn } from '@/types'

let cachedVoices: SpeechSynthesisVoice[] = []
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported()) return Promise.resolve([])
  if (cachedVoices.length > 0) return Promise.resolve(cachedVoices)
  if (voicesPromise) return voicesPromise

  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis
    const finish = () => {
      cachedVoices = synth.getVoices()
      resolve(cachedVoices)
    }
    const initial = synth.getVoices()
    if (initial.length > 0) {
      cachedVoices = initial
      resolve(initial)
      return
    }
    let settled = false
    const onChange = () => {
      if (settled) return
      settled = true
      finish()
    }
    synth.addEventListener('voiceschanged', onChange, { once: true })
    window.setTimeout(() => {
      if (settled) return
      settled = true
      finish()
    }, 1500)
  })
  return voicesPromise
}

export function englishVoices(voices = cachedVoices): SpeechSynthesisVoice[] {
  return voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'))
}

export function pickVoice(voiceURI?: string, voices = cachedVoices): SpeechSynthesisVoice | undefined {
  const english = englishVoices(voices)
  if (voiceURI) {
    const exact = english.find((voice) => voice.voiceURI === voiceURI)
    if (exact) return exact
  }
  return (
    english.find((voice) => /en[-_]US/i.test(voice.lang) && /natural|samantha|aria|jenny|google/i.test(voice.name)) ??
    english.find((voice) => /en[-_]US/i.test(voice.lang)) ??
    english.find((voice) => /en[-_]GB/i.test(voice.lang)) ??
    english[0]
  )
}

export interface SpeakOptions {
  voiceURI?: string
  rate?: number
  pitch?: number
  volume?: number
}

function createUtterance(text: string, options: SpeakOptions, voice?: SpeechSynthesisVoice): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = voice?.lang || 'en-US'
  utterance.rate = Math.min(1.6, Math.max(0.5, options.rate ?? 0.95))
  utterance.pitch = Math.min(2, Math.max(0.5, options.pitch ?? 1))
  utterance.volume = Math.min(1, Math.max(0, options.volume ?? 1))
  if (voice) utterance.voice = voice
  return utterance
}

export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!speechSupported() || !text.trim()) return Promise.resolve()
  stopSpeech()
  const synth = window.speechSynthesis
  const voice = pickVoice(options.voiceURI)
  const utterance = createUtterance(text, options, voice)
  return new Promise((resolve) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    synth.speak(utterance)
  })
}

export function speakTurns(turns: SpeakerTurn[], options: SpeakOptions = {}): Promise<void> {
  if (!speechSupported() || turns.length === 0) return Promise.resolve()
  stopSpeech()
  const synth = window.speechSynthesis
  const voices = englishVoices()
  const primary = pickVoice(options.voiceURI, voices)
  const secondary = voices.find((voice) => voice.voiceURI !== primary?.voiceURI && /en[-_]GB/i.test(voice.lang)) ?? voices.find((voice) => voice.voiceURI !== primary?.voiceURI)

  return new Promise((resolve) => {
    let remaining = turns.length
    const done = () => {
      remaining -= 1
      if (remaining <= 0) resolve()
    }
    for (const turn of turns) {
      const speakerIndex = turn.speaker.charCodeAt(0) % 2
      const voice = speakerIndex === 0 ? primary : secondary ?? primary
      const utterance = createUtterance(turn.text, {
        ...options,
        pitch: speakerIndex === 0 ? 1 : 0.88,
      }, voice)
      utterance.onend = done
      utterance.onerror = done
      synth.speak(utterance)
    }
    window.setTimeout(() => {
      if (!synth.speaking && !synth.pending) resolve()
    }, 800)
  })
}

export function stopSpeech(): void {
  if (!speechSupported()) return
  window.speechSynthesis.cancel()
}

export function pauseSpeech(): void {
  if (!speechSupported()) return
  window.speechSynthesis.pause()
}

export function resumeSpeech(): void {
  if (!speechSupported()) return
  window.speechSynthesis.resume()
}

export function isSpeaking(): boolean {
  return speechSupported() && window.speechSynthesis.speaking
}
