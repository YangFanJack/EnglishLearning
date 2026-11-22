<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBankStore } from '@/stores/bank'
import { useWrongbookStore } from '@/stores/wrongbook'
import { SECTIONS, SECTION_META } from '@/types'
import type { Section } from '@/types'
import { formatDateTime } from '@/core/format'
import { pushToast } from '@/core/toast'
import StatCard from '@/components/StatCard.vue'
import TagPill from '@/components/TagPill.vue'
import EmptyState from '@/components/EmptyState.vue'
import Modal from '@/components/Modal.vue'
import Icon from '@/components/Icon.vue'

const bank = useBankStore()
const wrongbook = useWrongbookStore()
const router = useRouter()

const sectionFilter = ref<'all' | Section>('all')
const statusFilter = ref<'active' | 'all' | 'mastered'>('active')
const clearOpen = ref(false)

const rows = computed(() =>
  wrongbook.list
    .map((entry) => ({
      entry,
      question: bank.question(entry.questionId),
    }))
    .filter((row) => Boolean(row.question))
    .filter((row) => sectionFilter.value === 'all' || row.question?.section === sectionFilter.value)
    .filter((row) => {
      if (statusFilter.value === 'all') return true
      if (statusFilter.value === 'mastered') return row.entry.mastered
      return !row.entry.mastered
    }),
)

const activeFiltered = computed(() =>
  rows.value.filter((row) => !row.entry.mastered).slice(0, 20).map((row) => row.entry.questionId),
)

const masteredCount = computed(() => wrongbook.list.filter((entry) => entry.mastered).length)
const sectionOptions = computed(() =>
  SECTIONS.map((section) => ({
    section,
    count: wrongbook.list.filter((entry) => bank.question(entry.questionId)?.section === section).length,
  })),
)

function startAll(): void {
  router.push('/practice/run?mode=wrong&count=20')
}

function startFiltered(): void {
  if (activeFiltered.value.length === 0) {
    pushToast('当前筛选下没有待巩固错题', 'info')
    return
  }
  const params = new URLSearchParams({
    mode: 'wrong',
    count: String(activeFiltered.value.length),
    ids: activeFiltered.value.join(','),
  })
  router.push(`/practice/run?${params.toString()}`)
}

function startOne(questionId: string): void {
  router.push(`/practice/run?mode=wrong&count=1&ids=${encodeURIComponent(questionId)}`)
}

function toggleMastered(questionId: string, mastered: boolean): void {
  wrongbook.markMastered(questionId, !mastered)
  pushToast(mastered ? '已移回待巩固' : '已标记为掌握', 'success')
}

function remove(questionId: string): void {
  wrongbook.remove(questionId)
  pushToast('已从错题本移除', 'info')
}

function clearAll(): void {
  wrongbook.clear()
  clearOpen.value = false
  pushToast('错题本已清空', 'success')
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
        <span class="eyebrow"><Icon name="wrong" :size="13" />Review Book</span>
        <h2>错题本</h2>
        <p>考试和练习中答错的题会自动收集。错题连续答对 2 次后自动标记为掌握。</p>
      </div>
      <div class="row">
        <button class="btn btn-secondary btn-sm" type="button" :disabled="wrongbook.activeCount === 0" @click="startAll">
          <Icon name="refresh" :size="15" />
          全部重练
        </button>
        <button class="btn btn-ghost btn-sm" type="button" :disabled="wrongbook.totalCount === 0" @click="clearOpen = true">
          <Icon name="trash" :size="15" />
          清空
        </button>
      </div>
    </div>

    <section class="grid grid-4">
      <StatCard label="待巩固" :value="wrongbook.activeCount" hint="未连续答对 2 次" icon="wrong" tone="rose" />
      <StatCard label="已掌握" :value="masteredCount" hint="可随时取消掌握" icon="check" tone="teal" />
      <StatCard label="累计错题" :value="wrongbook.totalCount" hint="含已掌握" icon="bank" tone="amber" />
      <StatCard label="当前筛选" :value="rows.length" hint="符合筛选条件的题目" icon="filter" tone="indigo" />
    </section>

    <div class="card card-pad">
      <div class="bank-toolbar">
        <button class="chip" :class="{ 'is-active': sectionFilter === 'all' }" type="button" @click="sectionFilter = 'all'">全部模块</button>
        <button
          v-for="item in sectionOptions"
          :key="item.section"
          class="chip"
          :class="{ 'is-active': sectionFilter === item.section }"
          type="button"
          @click="sectionFilter = item.section"
        >
          {{ SECTION_META[item.section].short }}
          <span class="text-xs">{{ item.count }}</span>
        </button>
        <span style="margin-left: auto" />
        <div class="segmented">
          <button type="button" :class="{ 'is-active': statusFilter === 'active' }" @click="statusFilter = 'active'">待巩固</button>
          <button type="button" :class="{ 'is-active': statusFilter === 'all' }" @click="statusFilter = 'all'">全部</button>
          <button type="button" :class="{ 'is-active': statusFilter === 'mastered' }" @click="statusFilter = 'mastered'">已掌握</button>
        </div>
        <button class="btn btn-secondary btn-sm" type="button" :disabled="activeFiltered.length === 0" @click="startFiltered">
          重练筛选结果
        </button>
      </div>

      <div v-if="rows.length > 0" class="wrong-list">
        <article v-for="row in rows" :key="row.entry.questionId" class="wrong-item">
          <span class="section-icon" :class="row.question?.section">
            <Icon :name="row.question ? SECTION_META[row.question.section].icon : 'file-text'" :size="18" />
          </span>
          <div class="wrong-copy">
            <strong>{{ row.question?.stem }}</strong>
            <div class="wrong-meta">
              <span class="section-badge" :class="row.question?.section">
                {{ row.question ? SECTION_META[row.question.section].short : '未知' }}
              </span>
              <span v-if="row.question" class="level-pill" :data-level="row.question.level">{{ row.question.level }}</span>
              <span class="tag-pill">错 {{ row.entry.wrongCount }} 次</span>
              <span class="tag-pill">连对 {{ row.entry.correctStreak }} 次</span>
              <TagPill :tag="row.entry.mastered ? '已掌握' : '待巩固'" :tone="row.entry.mastered ? 'success' : 'warning'" />
              <span class="text-xs muted">{{ formatDateTime(row.entry.lastAt) }}</span>
            </div>
          </div>
          <div class="wrong-actions">
            <button class="btn btn-secondary btn-sm" type="button" @click="startOne(row.entry.questionId)">重练</button>
            <button class="btn btn-ghost btn-sm" type="button" @click="toggleMastered(row.entry.questionId, row.entry.mastered)">
              {{ row.entry.mastered ? '取消掌握' : '标记掌握' }}
            </button>
            <button class="icon-btn" type="button" title="移除" @click="remove(row.entry.questionId)">
              <Icon name="trash" :size="15" />
            </button>
          </div>
        </article>
      </div>

      <EmptyState
        v-else
        :title="wrongbook.totalCount === 0 ? '错题本还是空的' : '当前筛选下没有题目'"
        :text="wrongbook.totalCount === 0 ? '完成一次考试或练习后，答错的题会自动出现在这里。' : '换一个模块或状态筛选试试。'"
        icon="wrong"
      >
        <router-link v-if="wrongbook.totalCount === 0" class="btn btn-primary btn-sm" to="/practice">去做练习</router-link>
        <button v-else class="btn btn-secondary btn-sm" type="button" @click="sectionFilter = 'all'; statusFilter = 'all'">重置筛选</button>
      </EmptyState>
    </div>

    <Modal :open="clearOpen" title="清空错题本？" subtitle="所有错题记录和掌握状态都会被删除，无法恢复。" width="440px" @close="clearOpen = false">
      <p class="text-sm muted">建议先导出备份：设置页和历史记录页都提供 JSON 导出。</p>
      <template #footer>
        <button class="btn btn-secondary" type="button" @click="clearOpen = false">取消</button>
        <button class="btn btn-danger" type="button" @click="clearAll">确认清空</button>
      </template>
    </Modal>
  </div>
</template>
