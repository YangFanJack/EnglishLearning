<script setup lang="ts">
import { computed } from 'vue'

export interface TrendPoint {
  label: string
  value: number
  cefr?: string
}

const props = withDefaults(
  defineProps<{
    points: TrendPoint[]
  }>(),
  { points: () => [] },
)

const width = 620
const height = 220
const padX = 34
const padTop = 18
const padBottom = 34
const innerWidth = width - padX * 2
const innerHeight = height - padTop - padBottom

const chartPoints = computed(() =>
  props.points.map((point, index) => {
    const x = props.points.length <= 1 ? padX + innerWidth / 2 : padX + (index / (props.points.length - 1)) * innerWidth
    const y = padTop + (1 - Math.min(100, Math.max(0, point.value)) / 100) * innerHeight
    return { ...point, x, y }
  }),
)

const linePath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  return chartPoints.value.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
})

const areaPath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  const first = chartPoints.value[0]
  const last = chartPoints.value[chartPoints.value.length - 1]
  return `${linePath.value} L ${last.x} ${padTop + innerHeight} L ${first.x} ${padTop + innerHeight} Z`
})

const gridValues = [0, 25, 50, 75, 100]
</script>

<template>
  <div class="trend-chart">
    <svg v-if="points.length > 0" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="成绩趋势图">
      <g class="trend-grid">
        <line
          v-for="value in gridValues"
          :key="value"
          :x1="padX"
          :x2="width - padX"
          :y1="padTop + (1 - value / 100) * innerHeight"
          :y2="padTop + (1 - value / 100) * innerHeight"
        />
        <text
          v-for="value in gridValues"
          :key="`label-${value}`"
          :x="padX - 8"
          :y="padTop + (1 - value / 100) * innerHeight + 4"
          text-anchor="end"
        >
          {{ value }}
        </text>
      </g>
      <path class="trend-area" :d="areaPath" />
      <path class="trend-line" :d="linePath" />
      <g v-for="(point, index) in chartPoints" :key="`point-${index}`">
        <circle class="trend-dot" :cx="point.x" :cy="point.y" r="4.5">
          <title>{{ point.label }} · {{ point.value }} 分 {{ point.cefr ?? '' }}</title>
        </circle>
        <text
          v-if="points.length <= 8 || index % 2 === 0 || index === points.length - 1"
          class="trend-x-label"
          :x="point.x"
          :y="height - 12"
          text-anchor="middle"
        >
          {{ point.label }}
        </text>
      </g>
    </svg>
    <div v-else class="trend-empty">完成一次考试后，这里会显示成绩趋势。</div>
  </div>
</template>
