<script setup lang="ts">
import { computed } from 'vue'

export interface RadarPoint {
  label: string
  value: number
}

const props = withDefaults(
  defineProps<{
    data: RadarPoint[]
    size?: number
  }>(),
  { size: 260 },
)

const center = 130
const radius = 82
const angleStep = (Math.PI * 2) / Math.max(1, props.data.length)

function pointAt(index: number, ratio: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + index * angleStep
  return {
    x: center + Math.cos(angle) * radius * ratio,
    y: center + Math.sin(angle) * radius * ratio,
  }
}

function polygon(ratio: number): string {
  return props.data
    .map((_, index) => {
      const point = pointAt(index, ratio)
      return `${point.x},${point.y}`
    })
    .join(' ')
}

const dataPolygon = computed(() => {
  return props.data
    .map((item, index) => {
      const point = pointAt(index, Math.min(1, Math.max(0.04, item.value / 100)))
      return `${point.x},${point.y}`
    })
    .join(' ')
})

const labels = computed(() =>
  props.data.map((item, index) => {
    const point = pointAt(index, 1.2)
    const anchor = point.x < center - 8 ? 'end' : point.x > center + 8 ? 'start' : 'middle'
    return { ...item, x: point.x, y: point.y, anchor }
  }),
)

const dots = computed(() =>
  props.data.map((item, index) => {
    const point = pointAt(index, Math.min(1, Math.max(0.04, item.value / 100)))
    return { ...point, value: item.value, label: item.label }
  }),
)
</script>

<template>
  <div class="radar-wrap" :style="{ maxWidth: `${size}px` }">
    <svg viewBox="0 0 260 250" role="img" aria-label="四项能力雷达图">
      <g class="radar-grid">
        <polygon v-for="ratio in [0.25, 0.5, 0.75, 1]" :key="ratio" :points="polygon(ratio)" />
        <line
          v-for="(_, index) in data"
          :key="`axis-${index}`"
          :x1="center"
          :y1="center"
          :x2="pointAt(index, 1).x"
          :y2="pointAt(index, 1).y"
        />
      </g>
      <polygon class="radar-area" :points="dataPolygon" />
      <circle v-for="(dot, index) in dots" :key="`dot-${index}`" class="radar-dot" :cx="dot.x" :cy="dot.y" r="4" />
      <g class="radar-labels">
        <text
          v-for="(label, index) in labels"
          :key="`label-${index}`"
          :x="label.x"
          :y="label.y"
          :text-anchor="label.anchor"
          dominant-baseline="middle"
        >
          {{ label.label }}
        </text>
        <text
          v-for="(dot, index) in dots"
          :key="`value-${index}`"
          class="radar-value"
          :x="dot.x"
          :y="dot.y - 9"
          text-anchor="middle"
        >
          {{ Math.round(dot.value) }}
        </text>
      </g>
    </svg>
  </div>
</template>
