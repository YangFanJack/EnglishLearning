<script setup lang="ts">
withDefaults(
  defineProps<{
    tag: string
    tone?: 'default' | 'success' | 'warning' | 'danger' | 'muted'
    count?: number | string
  }>(),
  {
    tone: 'default',
    count: undefined,
  },
)
</script>

<template>
  <span class="tag-pill" :class="`tag-${tone}`">
    {{ tag }}
    <em v-if="count !== undefined">{{ count }}</em>
  </span>
</template>
