<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/types'
import Icon from './Icon.vue'

const props = withDefaults(
  defineProps<{
    question: Question
    selected?: number | null
    reveal?: boolean
    disabled?: boolean
    showExplanation?: boolean
    index?: number
    compact?: boolean
  }>(),
  {
    selected: null,
    reveal: false,
    disabled: false,
    showExplanation: true,
    index: 0,
    compact: false,
  },
)

const emit = defineEmits<{ select: [index: number] }>()

const letters = ['A', 'B', 'C', 'D', 'E', 'F']
const stemParts = computed(() => props.question.stem.split('___'))

function optionClass(index: number): Record<string, boolean> {
  return {
    'is-selected': props.selected === index,
    'is-correct': props.reveal && index === props.question.answer,
    'is-wrong': props.reveal && props.selected === index && index !== props.question.answer,
    'is-dimmed': props.reveal && index !== props.question.answer && props.selected !== index,
  }
}

function choose(index: number): void {
  if (props.disabled) return
  emit('select', index)
}

const answerLabel = computed(() => letters[props.question.answer] ?? '?')
const selectedLabel = computed(() => (props.selected === null || props.selected === undefined ? '未作答' : letters[props.selected] ?? '?'))
</script>

<template>
  <article class="question-card" :class="{ 'is-compact': compact }">
    <header class="question-head">
      <span v-if="index > 0" class="question-index">{{ String(index).padStart(2, '0') }}</span>
      <div class="question-meta">
        <span class="level-pill" :data-level="question.level">{{ question.level }}</span>
        <span class="meta-pill">{{ question.topic }}</span>
        <span v-if="question.source === 'adapted-public'" class="meta-pill source-pill">公开样题改编</span>
      </div>
    </header>

    <h3 class="question-stem">
      <template v-for="(part, partIndex) in stemParts" :key="partIndex">
        <span>{{ part }}</span>
        <span v-if="partIndex < stemParts.length - 1" class="stem-blank">___</span>
      </template>
    </h3>

    <div class="option-list" role="listbox" :aria-label="`第 ${index || 1} 题选项`">
      <button
        v-for="(option, optionIndex) in question.options"
        :key="optionIndex"
        type="button"
        class="option-item"
        :class="optionClass(optionIndex)"
        :disabled="disabled"
        :aria-pressed="selected === optionIndex"
        role="option"
        @click="choose(optionIndex)"
      >
        <span class="option-letter">{{ letters[optionIndex] }}</span>
        <span class="option-text">{{ option }}</span>
        <span v-if="reveal && optionIndex === question.answer" class="option-mark is-correct"><Icon name="check" :size="15" /></span>
        <span v-else-if="reveal && selected === optionIndex" class="option-mark is-wrong"><Icon name="x" :size="15" /></span>
      </button>
    </div>

    <div v-if="reveal && showExplanation" class="answer-panel">
      <div class="answer-summary">
        <span class="answer-chip" :class="selected === question.answer ? 'is-correct' : 'is-wrong'">
          <Icon :name="selected === question.answer ? 'check' : 'x'" :size="14" />
          你的答案：{{ selectedLabel }}
        </span>
        <span class="answer-chip is-correct">
          <Icon name="check" :size="14" />
          正确答案：{{ answerLabel }}
        </span>
      </div>
      <div class="explanation">
        <strong>解析</strong>
        <p>{{ question.explanation }}</p>
      </div>
      <p v-if="question.sourceNote" class="source-note">{{ question.sourceNote }}</p>
    </div>
  </article>
</template>
