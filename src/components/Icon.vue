<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number | string
    strokeWidth?: number
  }>(),
  {
    size: 20,
    strokeWidth: 1.8,
  },
)

interface IconShape {
  paths: string[]
  circles?: Array<[number, number, number, boolean?]>
}

const icons: Record<string, IconShape> = {
  home: { paths: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5'] },
  exam: {
    paths: [
      'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2',
      'M9 3h6v4H9z',
      'm9 14 2 2 4-4',
    ],
  },
  practice: { paths: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'] },
  wrong: {
    paths: [
      'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
      'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z',
      'm9 7 6 6',
      'm15 7-6 6',
    ],
  },
  bank: {
    paths: ['M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z', 'M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6', 'M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6'],
  },
  history: { paths: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5', 'M12 7v5l3 2'] },
  settings: {
    paths: [
      'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
      'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.37.36.7.65.96.3.27.67.42 1.05.44H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.6Z',
    ],
  },
  info: { paths: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 11v5', 'M12 8h.01'] },
  headphones: { paths: ['M4 14v-2a8 8 0 0 1 16 0v2', 'M4 14h3v6H4z', 'M17 14h3v6h-3z'] },
  book: { paths: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z', 'M8 7h8', 'M8 11h5'] },
  list: { paths: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'] },
  chart: { paths: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'] },
  play: { paths: ['M7 4.5v15l13-7.5-13-7.5Z'] },
  pause: { paths: ['M8 5v14', 'M16 5v14'] },
  stop: { paths: ['M6 6h12v12H6z'] },
  flag: { paths: ['M4 21V4', 'M4 4h11l-1.5 4L15 12H4'] },
  check: { paths: ['m5 12 4.5 4.5L19 7'] },
  x: { paths: ['m6 6 12 12', 'm18 6-12 12'] },
  clock: { paths: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'] },
  volume: { paths: ['M11 5 6 9H3v6h3l5 4V5Z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M18 6a8.5 8.5 0 0 1 0 12'] },
  moon: { paths: ['M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z'] },
  sun: { paths: ['M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z', 'M12 1v2', 'M12 21v2', 'M4.2 4.2l1.4 1.4', 'M18.4 18.4l1.4 1.4', 'M1 12h2', 'M21 12h2', 'M4.2 19.8l1.4-1.4', 'M18.4 5.6l1.4-1.4'] },
  menu: { paths: ['M4 6h16', 'M4 12h16', 'M4 18h16'] },
  search: { paths: ['m20 20-4.2-4.2', 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z'] },
  filter: { paths: ['M3 5h18', 'M6 12h12', 'M10 19h4'] },
  download: { paths: ['M12 3v12', 'm7 10 5 5 5-5', 'M4 21h16'] },
  upload: { paths: ['M12 21V9', 'm7 14 5-5 5 5', 'M4 3h16'] },
  trash: { paths: ['M3 6h18', 'M8 6V4h8v2', 'M6 6l1 15h10l1-15', 'M10 11v6', 'M14 11v6'] },
  refresh: { paths: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'] },
  'arrow-left': { paths: ['M19 12H5', 'm11 18-6-6 6-6'] },
  'arrow-right': { paths: ['M5 12h14', 'm13 6 6 6-6 6'] },
  'chevron-left': { paths: ['m15 18-6-6 6-6'] },
  'chevron-right': { paths: ['m9 18 6-6-6-6'] },
  'chevron-down': { paths: ['m6 9 6 6 6-6'] },
  spark: { paths: ['M12 3v4', 'M12 17v4', 'M3 12h4', 'M17 12h4', 'm5.6 5.6 2.8 2.8', 'm15.6 15.6 2.8 2.8', 'm18.4 5.6-2.8 2.8', 'm8.4 15.6-2.8 2.8'] },
  target: { paths: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'] },
  award: { paths: ['M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z', 'm8.5 14-1.5 8 5-3 5 3-1.5-8'] },
  alert: { paths: ['M12 9v4', 'M12 17h.01', 'M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z'] },
  'file-text': { paths: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', 'M14 2v6h6', 'M8 13h8', 'M8 17h5'] },
  calendar: { paths: ['M3 5h18v16H3z', 'M8 3v4', 'M16 3v4', 'M3 10h18'] },
  zap: { paths: ['M13 2 4 14h7l-1 8 9-12h-7l1-8Z'] },
  'log-out': { paths: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'] },
  shield: { paths: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z', 'm9 12 2 2 4-4'] },
}

const shape = computed<IconShape>(() => icons[props.name] ?? icons.info)
const sizeValue = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<template>
  <svg
    :width="sizeValue"
    :height="sizeValue"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="icon"
  >
    <path v-for="(path, index) in shape.paths" :key="index" :d="path" />
    <circle
      v-for="(circle, index) in shape.circles ?? []"
      :key="`c-${index}`"
      :cx="circle[0]"
      :cy="circle[1]"
      :r="circle[2]"
      :fill="circle[3] ? 'currentColor' : 'none'"
    />
  </svg>
</template>
