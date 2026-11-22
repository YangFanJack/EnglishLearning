<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import Icon from './Icon.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    subtitle?: string
    width?: string
    closable?: boolean
  }>(),
  {
    title: '',
    subtitle: '',
    width: '560px',
    closable: true,
  },
)

const emit = defineEmits<{ close: [] }>()

function close(): void {
  if (props.closable) emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      document.body.classList.add('modal-open')
      window.addEventListener('keydown', onKeydown)
    } else {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKeydown)
    }
  },
)

onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="close">
        <div class="modal-card" :style="{ maxWidth: width }" role="dialog" aria-modal="true" :aria-label="title">
          <header class="modal-head">
            <div>
              <h2>{{ title }}</h2>
              <p v-if="subtitle">{{ subtitle }}</p>
            </div>
            <button v-if="closable" class="icon-btn" type="button" aria-label="关闭" @click="close">
              <Icon name="x" :size="18" />
            </button>
          </header>
          <div class="modal-body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="modal-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
