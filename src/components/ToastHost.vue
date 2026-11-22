<script setup lang="ts">
import { toasts, dismissToast } from '@/core/toast'
import Icon from './Icon.vue'

function iconFor(type: string): string {
  if (type === 'success') return 'check'
  if (type === 'error') return 'alert'
  return 'info'
}
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <transition-group name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast-${toast.type}`">
        <span class="toast-icon"><Icon :name="iconFor(toast.type)" :size="17" /></span>
        <span class="toast-text">{{ toast.text }}</span>
        <button class="toast-close" type="button" aria-label="关闭提示" @click="dismissToast(toast.id)">
          <Icon name="x" :size="14" />
        </button>
      </div>
    </transition-group>
  </div>
</template>
