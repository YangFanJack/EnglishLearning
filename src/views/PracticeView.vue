<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBankStore } from '@/stores/bank'
import { useWrongbookStore } from '@/stores/wrongbook'
import { LEVELS, LEVEL_LABELS, SECTIONS, SECTION_META } from '@/types'
import type { Level, Section } from '@/types'
import { pushToast } from '@/core/toast'
import Icon from '@/components/Icon.vue'

const bank = useBankStore()
const wrongbook = useWrongbookStore()
const router = useRouter()
const route = useRoute()

const section = ref<'all' | Section>('all')
const level = ref<'all' | Level>('all')
const count = ref(10)

const sectionCounts = computed(() =>
  SECTIONS.map((item) => ({
    section: item,
    meta: SECTION_META[item],
    count: bank.questions[item].length,
    levelCounts: LEVELS.map((levelItem) => ({
      level: levelItem,
      count: bank.questions[item].filter((question) => question.level === levelItem).length,
    })),
  })),
)

const estimatedPool = computed(() => {
  let total = 0
  const sections = section.value === 'all' ? SECTIONS : [section.value]
  for (const item of sections) {
    total += bank.questions[item].filter((question) => level.value === 'all' || question.level === level.value).length
  }
  return total
})

function start(): void {
  const params = new URLSearchParams()
  params.set('count', String(count.value))
  if (section.value !== 'all') params.set('section', section.value)
  if (level.value !== 'all') params.set('level', level.value)
  router.push(`/practice/run?${params.toString()}`)
}

function startSection(item: Section): void {
  router.push(`/practice/run?section=${item}&count=10`)
}

function startWrong(): void {
  router.push('/practice/run?mode=wrong&count=10')
}

onMounted(async () => {
  if (!bank.loaded) {
    try {
      await bank.load()
    } catch (error) {
      pushToast(error instanceof Error ? error.message : '题库加载失败', 'error')
    }
  }

  const querySection = String(route.query.section ?? '')
  if (SECTIONS.includes(querySection as Section)) section.value = querySection as Section
  const queryLevel = String(route.query.level ?? '')
  if (LEVELS.includes(queryLevel as Level)) level.value = queryLevel as Level
  const queryCount = Number(route.query.count)
  if ([10, 20, 30].includes(queryCount)) count.value = queryCount
})
</script>

<template>
  <div class="stack-lg">
    <div class="page-head">
      <div>
        <span class="eyebrow"><Icon name="practice" :size="13" />Practice Lab</span>
        <h2>分类练习</h2>
        <p>按模块、等级自由组合，答完立即判分并显示解析。练习模式不限时，听力可重复播放。</p>
      </div>
      <span class="tag-pill"><Icon name="bank" :size="12" />{{ bank.total }} 题可选</span>
    </div>

    <div v-if="bank.error" class="notice notice-danger">
      <Icon name="alert" :size="17" />
      <span>{{ bank.error }}</span>
    </div>

    <div class="practice-layout">
      <section class="card card-pad">
        <div class="card-head">
          <div>
            <h3>组一套练习</h3>
            <p>默认从当前筛选池随机抽题</p>
          </div>
          <span class="tag-pill">{{ estimatedPool }} 题可用</span>
        </div>

        <div class="filter-block">
          <div>
            <label class="text-xs muted">模块</label>
            <div class="filter-row mt-2">
              <button class="chip" :class="{ 'is-active': section === 'all' }" type="button" @click="section = 'all'">全部</button>
              <button
                v-for="item in SECTIONS"
                :key="item"
                class="chip"
                :class="{ 'is-active': section === item }"
                type="button"
                @click="section = item"
              >
                <Icon :name="SECTION_META[item].icon" :size="12" />
                {{ SECTION_META[item].short }}
              </button>
            </div>
          </div>

          <div>
            <label class="text-xs muted">等级</label>
            <div class="filter-row mt-2">
              <button class="chip" :class="{ 'is-active': level === 'all' }" type="button" @click="level = 'all'">全部</button>
              <button
                v-for="item in LEVELS"
                :key="item"
                class="chip"
                :class="{ 'is-active': level === item }"
                type="button"
                @click="level = item"
              >
                {{ LEVEL_LABELS[item] }}
              </button>
            </div>
          </div>

          <div>
            <label class="text-xs muted">题量</label>
            <div class="row mt-2">
              <div class="segmented">
                <button v-for="value in [10, 20, 30]" :key="value" type="button" :class="{ 'is-active': count === value }" @click="count = value">
                  {{ value }} 题
                </button>
              </div>
              <span class="text-xs muted">预计 {{ Math.max(1, Math.min(count, estimatedPool)) }} 题</span>
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-lg btn-block mt-5" type="button" :disabled="estimatedPool === 0" @click="start">
          <Icon name="play" :size="18" />
          开始练习
        </button>
      </section>

      <aside class="stack">
        <div class="practice-start-card">
          <div class="card-head">
            <div>
              <h3>错题重练</h3>
              <p>从错题本抽取 10 题，连续答对 2 次自动掌握</p>
            </div>
            <span class="section-icon grammar"><Icon name="wrong" :size="19" /></span>
          </div>
          <div class="row-between mb-3">
            <span class="text-sm muted">待巩固</span>
            <strong>{{ wrongbook.activeCount }} 题</strong>
          </div>
          <button class="btn btn-secondary btn-block" type="button" :disabled="wrongbook.activeCount === 0" @click="startWrong">
            <Icon name="refresh" :size="16" />
            {{ wrongbook.activeCount === 0 ? '暂无错题' : '开始错题重练' }}
          </button>
        </div>

        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>练习说明</h3>
              <p>适合碎片时间</p>
            </div>
            <Icon name="info" :size="18" class="muted" />
          </div>
          <div class="stack-sm text-sm muted">
            <p>· 练习模式立即显示对错与解析。</p>
            <p>· 听力题可无限次播放，可查看原文。</p>
            <p>· 答错的题会自动进入错题本。</p>
            <p>· 错题连续答对 2 次后标记为已掌握。</p>
          </div>
        </div>
      </aside>
    </div>

    <section class="card card-pad">
      <div class="card-head">
        <div>
          <h3>按模块快速开始</h3>
          <p>每个模块抽 10 题，混合等级</p>
        </div>
      </div>
      <div class="grid grid-4">
        <button v-for="item in sectionCounts" :key="item.section" class="quick-card" type="button" @click="startSection(item.section)">
          <span class="section-icon" :class="item.section">
            <Icon :name="item.meta.icon" :size="19" />
          </span>
          <span class="quick-copy">
            <strong>{{ item.meta.name }}</strong>
            <span>{{ item.count }} 题 · {{ item.meta.description }}</span>
          </span>
          <Icon class="quick-arrow" name="chevron-right" :size="17" />
        </button>
      </div>
    </section>
  </div>
</template>
