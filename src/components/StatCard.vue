<script setup lang="ts">
import Icon from './Icon.vue'

withDefaults(
  defineProps<{
    label: string
    value: string | number
    hint?: string
    icon?: string
    tone?: 'default' | 'teal' | 'amber' | 'rose' | 'indigo'
  }>(),
  {
    hint: '',
    icon: 'chart',
    tone: 'default',
  },
)
</script>

<template>
  <div class="stat-card" :class="`tone-${tone}`">
    <span class="stat-icon"><Icon :name="icon" :size="19" /></span>
    <div class="stat-copy">
      <span class="stat-label">{{ label }}</span>
      <strong class="stat-value">{{ value }}</strong>
      <span v-if="hint" class="stat-hint">{{ hint }}</span>
    </div>
  </div>
</template>
