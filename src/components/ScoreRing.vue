<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    score: number
    cefr?: string
    label?: string
    size?: number
  }>(),
  {
    cefr: '',
    label: '综合得分',
    size: 176,
  },
)

const radius = 68
const circumference = 2 * Math.PI * radius
const offset = computed(() => circumference * (1 - Math.min(100, Math.max(0, props.score)) / 100))
const tone = computed(() => {
  if (props.score >= 80) return 'excellent'
  if (props.score >= 60) return 'pass'
  return 'weak'
})
</script>

<template>
  <div class="score-ring" :class="`score-${tone}`" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg viewBox="0 0 160 160" aria-hidden="true">
      <circle class="score-track" cx="80" cy="80" :r="radius" />
      <circle
        class="score-progress"
        cx="80"
        cy="80"
        :r="radius"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        transform="rotate(-90 80 80)"
      />
    </svg>
    <div class="score-center">
      <strong>{{ score }}</strong>
      <span>/ 100</span>
      <em v-if="cefr">{{ cefr }}</em>
      <small>{{ label }}</small>
    </div>
  </div>
</template>
