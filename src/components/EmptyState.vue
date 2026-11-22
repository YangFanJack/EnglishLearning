<script setup lang="ts">
import Icon from './Icon.vue'

withDefaults(
  defineProps<{
    title: string
    text?: string
    icon?: string
  }>(),
  {
    text: '',
    icon: 'file-text',
  },
)
</script>

<template>
  <div class="empty-state">
    <span class="empty-icon"><Icon :name="icon" :size="28" /></span>
    <h3>{{ title }}</h3>
    <p v-if="text">{{ text }}</p>
    <div v-if="$slots.default" class="empty-actions">
      <slot />
    </div>
  </div>
</template>
