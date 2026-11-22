<script setup lang="ts">
import { computed } from 'vue'
import { formatClock } from '@/core/format'
import Icon from './Icon.vue'

const props = defineProps<{
  remainingMs: number
  totalMs: number
}>()

const percent = computed(() => {
  if (props.totalMs <= 0) return 0
  return Math.min(1, Math.max(0, props.remainingMs / props.totalMs))
})

const tone = computed(() => {
  if (props.remainingMs <= 60_000) return 'danger'
  if (props.remainingMs <= 5 * 60_000) return 'warning'
  return 'normal'
})
</script>

<template>
  <div class="timer" :class="`timer-${tone}`">
    <div class="timer-clock">
      <Icon name="clock" :size="17" />
      <span>{{ formatClock(remainingMs) }}</span>
    </div>
    <div class="timer-track">
      <span class="timer-fill" :style="{ width: `${percent * 100}%` }" />
    </div>
  </div>
</template>
