<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useBankStore } from '@/stores/bank'
import { LEVELS, LEVEL_LABELS, SECTIONS, SECTION_META } from '@/types'
import type { Level, Question, QuestionFlag, Section } from '@/types'
import { loadFlags, saveFlags } from '@/core/storage'
import { formatNumber } from '@/core/format'
import { pushToast } from '@/core/toast'
import StatCard from '@/components/StatCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import Icon from '@/components/Icon.vue'

const bank = useBankStore()

const search = ref('')
const sectionFilter = ref<'all' | Section>('all')
const levelFilter = ref<'all' | Level>('all')
const page = ref(1)
const pageSize = 15
const flags = ref<QuestionFlag[]>(loadFlags())

const filtered = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return bank.allQuestions.filter((question) => {
    if (sectionFilter.value !== 'all' && question.section !== sectionFilter.value) return false
    if (levelFilter.value !== 'all' && question.level !== levelFilter.value) return false
    if (!keyword) return true
    const haystack = [question.stem, question.topic, question.explanation, ...question.options, ...question.tags].join(' ').toLowerCase()
    return haystack.includes(keyword)
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const pageItems = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const pageNumbers = computed(() => {
  const total = pageCount.value
  const current = page.value
  const start = Math.max(1, Math.min(current - 3, total - 6))
  const end = Math.min(total, start + 6)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const flaggedIds = computed(() => new Set(flags.value.map((flag) => flag.questionId)))

watch([search, sectionFilter, levelFilter], () => {
  page.value = 1
})

watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

function sectionName(section: Section): string {
  return SECTION_META[section].name
}

function report(question: Question): void {
  const reason = window.prompt('请描述这道题的问题（例如：答案有误、选项重复、原文缺失）')
  if (!reason?.trim()) return
  flags.value = [
    ...flags.value,
    { questionId: question.id, reason: reason.trim(), createdAt: Date.now() },
  ]
  saveFlags(flags.value)
  pushToast('题目反馈已保存在本机，可在设置页导出', 'success')
}

function resetFilters(): void {
  search.value = ''
  sectionFilter.value = 'all'
  levelFilter.value = 'all'
  page.value = 1
}

onMounted(async () => {
  if (!bank.loaded) {
    try {
      await bank.load()
    } catch (error) {
      pushToast(error instanceof Error ? error.message : '题库加载失败', 'error')
    }
  }
})
</script>

<template>
  <div class="stack-lg">
    <div class="page-head">
      <div>
        <span class="eyebrow"><Icon name="bank" :size="13" />Question Bank</span>
        <h2>题库浏览</h2>
        <p>查看全部题目、答案与解析。题库为原创或公开样题改编，可用于备课和错题定位。</p>
      </div>
      <span class="tag-pill"><Icon name="file-text" :size="12" />{{ formatNumber(bank.total) }} 题</span>
    </div>

    <section class="bank-stats">
      <StatCard label="题目总数" :value="formatNumber(bank.total)" hint="四部分合计" icon="bank" tone="teal" />
      <StatCard
        v-for="item in bank.stats"
        :key="item.section"
        :label="SECTION_META[item.section].name"
        :value="formatNumber(item.count)"
        :hint="`${item.units} 个题组 / 单题`"
        :icon="SECTION_META[item.section].icon"
        :tone="item.section === 'listening' ? 'teal' : item.section === 'vocabulary' ? 'amber' : item.section === 'grammar' ? 'indigo' : 'rose'"
      />
    </section>

    <div class="card card-pad">
      <div class="bank-toolbar">
        <div class="search-box">
          <Icon name="search" :size="16" />
          <input v-model="search" class="input" type="search" placeholder="搜索题干、选项、解析、标签…" />
        </div>
        <select v-model="sectionFilter" class="select" style="max-width: 150px">
          <option value="all">全部模块</option>
          <option v-for="section in SECTIONS" :key="section" :value="section">{{ SECTION_META[section].short }}</option>
        </select>
        <select v-model="levelFilter" class="select" style="max-width: 150px">
          <option value="all">全部等级</option>
          <option v-for="level in LEVELS" :key="level" :value="level">{{ LEVEL_LABELS[level] }}</option>
        </select>
        <button class="btn btn-ghost btn-sm" type="button" @click="resetFilters">
          <Icon name="refresh" :size="14" />
          重置
        </button>
        <span class="text-xs muted">{{ filtered.length }} 条结果</span>
      </div>

      <div v-if="pageItems.length > 0" class="bank-list">
        <article v-for="question in pageItems" :key="question.id" class="bank-item">
          <div class="bank-item-head">
            <span class="section-badge" :class="question.section">
              <Icon :name="SECTION_META[question.section].icon" :size="12" />
              {{ sectionName(question.section) }}
            </span>
            <span class="level-pill" :data-level="question.level">{{ question.level }}</span>
            <span class="meta-pill">{{ question.topic }}</span>
            <span v-if="question.source === 'adapted-public'" class="meta-pill source-pill">公开样题改编</span>
            <span v-if="flaggedIds.has(question.id)" class="meta-pill source-pill">已反馈</span>
            <button class="link-btn" type="button" style="margin-left: auto" @click="report(question)">题目报错</button>
            <span class="bank-id">{{ question.id }}</span>
          </div>

          <p class="bank-stem">{{ question.stem }}</p>

          <div class="bank-options">
            <span
              v-for="(option, index) in question.options"
              :key="index"
              class="bank-option"
              :class="{ 'is-answer': index === question.answer }"
            >
              {{ String.fromCharCode(65 + index) }}. {{ option }}
            </span>
          </div>

          <details class="bank-explanation">
            <summary class="link-btn">查看解析与标签</summary>
            <p>{{ question.explanation }}</p>
            <div class="row mt-2" style="flex-wrap: wrap">
              <span v-for="tag in question.tags" :key="tag" class="tag-pill">{{ tag }}</span>
              <span class="tag-pill">难度 {{ question.difficulty }}</span>
            </div>
            <p v-if="question.sourceNote" class="text-xs muted mt-2">{{ question.sourceNote }}</p>
          </details>
        </article>
      </div>

      <EmptyState v-else title="没有匹配的题目" text="换一个关键词或重置筛选条件。" icon="search">
        <button class="btn btn-secondary btn-sm" type="button" @click="resetFilters">重置筛选</button>
      </EmptyState>

      <div v-if="pageCount > 1" class="pagination">
        <button type="button" :disabled="page <= 1" @click="page -= 1">
          <Icon name="chevron-left" :size="14" />
        </button>
        <button
          v-for="number in pageNumbers"
          :key="number"
          type="button"
          :class="{ 'is-active': number === page }"
          @click="page = number"
        >
          {{ number }}
        </button>
        <button type="button" :disabled="page >= pageCount" @click="page += 1">
          <Icon name="chevron-right" :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>
