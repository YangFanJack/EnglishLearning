<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHistoryStore } from '@/stores/history'
import type { ExamMode, ExamRecord, Section } from '@/types'
import { SECTION_META } from '@/types'
import { MODE_META } from '@/core/scoring'
import { formatDateTime, formatDuration } from '@/core/format'
import { pushToast } from '@/core/toast'
import { useDataBackup } from '@/composables/useDataBackup'
import TrendChart from '@/components/TrendChart.vue'
import StatCard from '@/components/StatCard.vue'
import TagPill from '@/components/TagPill.vue'
import EmptyState from '@/components/EmptyState.vue'
import Modal from '@/components/Modal.vue'
import Icon from '@/components/Icon.vue'

const history = useHistoryStore()
const router = useRouter()
const { exportAll, importFromFile, clearAll } = useDataBackup()

const modeFilter = ref<'all' | ExamMode>('all')
const clearOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const records = computed(() =>
  history.sorted.filter((record) => modeFilter.value === 'all' || record.mode === modeFilter.value),
)

const averageScore = computed(() => {
  if (history.records.length === 0) return 0
  return Math.round(history.records.reduce((sum, record) => sum + record.score, 0) / history.records.length)
})

const best = computed(() => history.records.reduce<ExamRecord | null>((current, record) => (!current || record.score > current.score ? record : current), null))

const monthlyBest = computed(() => history.monthlyBest.slice(0, 6))

const trendPoints = computed(() => history.trend)

function scoreTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

function modeName(mode: ExamMode): string {
  return MODE_META[mode].name
}

function sectionName(section: Section | undefined): string {
  return section ? SECTION_META[section].short : ''
}

function view(record: ExamRecord): void {
  router.push(`/exam/result/${record.id}`)
}

function remove(record: ExamRecord): void {
  if (!window.confirm('删除这次考试记录？删除后无法恢复。')) return
  history.remove(record.id)
  pushToast('记录已删除', 'info')
}

function triggerImport(): void {
  fileInput.value?.click()
}

async function handleImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const result = await importFromFile(file)
  if (!result.ok) pushToast(result.error ?? '导入失败', 'error')
  input.value = ''
}

function confirmClear(): void {
  clearAll()
  clearOpen.value = false
}
</script>

<template>
  <div class="stack-lg">
    <div class="page-head">
      <div>
        <span class="eyebrow"><Icon name="history" :size="13" />Records</span>
        <h2>历史记录</h2>
        <p>所有成绩保存在本机浏览器。建议定期导出 JSON 备份，换设备时可导入恢复。</p>
      </div>
      <div class="row">
        <button class="btn btn-secondary btn-sm" type="button" @click="exportAll">
          <Icon name="download" :size="15" />
          导出备份
        </button>
        <button class="btn btn-secondary btn-sm" type="button" @click="triggerImport">
          <Icon name="upload" :size="15" />
          导入备份
        </button>
        <input ref="fileInput" type="file" accept="application/json,.json" class="sr-only" @change="handleImport" />
        <button class="btn btn-ghost btn-sm" type="button" :disabled="history.count === 0" @click="clearOpen = true">
          <Icon name="trash" :size="15" />
          清空记录
        </button>
      </div>
    </div>

    <section class="grid grid-4">
      <StatCard label="考试次数" :value="history.count" hint="最多保留 50 次" icon="exam" tone="teal" />
      <StatCard label="最高分" :value="best ? `${best.score} 分` : '—'" :hint="best ? `${best.cefr} · ${formatDateTime(best.finishedAt)}` : '还没有记录'" icon="award" tone="amber" />
      <StatCard label="平均分" :value="history.count ? `${averageScore} 分` : '—'" hint="全部考试平均" icon="chart" tone="indigo" />
      <StatCard label="最新等级" :value="history.latest?.cefr ?? '—'" :hint="history.latest ? `最近得分 ${history.latest.score}` : '完成考试后显示'" icon="target" tone="rose" />
    </section>

    <section class="history-layout">
      <div class="stack">
        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>成绩趋势</h3>
              <p>最近 12 次考试总分</p>
            </div>
            <div class="segmented">
              <button type="button" :class="{ 'is-active': modeFilter === 'all' }" @click="modeFilter = 'all'">全部</button>
              <button type="button" :class="{ 'is-active': modeFilter === 'standard' }" @click="modeFilter = 'standard'">月考</button>
              <button type="button" :class="{ 'is-active': modeFilter === 'quick' }" @click="modeFilter = 'quick'">快速</button>
            </div>
          </div>
          <TrendChart :points="trendPoints" />
        </div>

        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>考试记录</h3>
              <p>{{ records.length }} 条符合当前筛选</p>
            </div>
          </div>

          <div v-if="records.length > 0" class="record-list">
            <article v-for="record in records" :key="record.id" class="record-row">
              <span class="record-score">{{ record.score }}</span>
              <div class="record-copy">
                <strong>{{ modeName(record.mode) }}{{ record.config.section ? ` · ${sectionName(record.config.section)}` : '' }}</strong>
                <span>{{ formatDateTime(record.finishedAt) }} · {{ record.questionCount }} 题 · 正确率 {{ Math.round(record.accuracy * 100) }}% · 用时 {{ formatDuration(record.durationSec) }}</span>
              </div>
              <div class="record-meta">
                <TagPill :tag="record.cefr" :tone="scoreTone(record.score)" />
                <button class="btn btn-secondary btn-sm" type="button" @click="view(record)">查看报告</button>
                <button class="icon-btn" type="button" title="删除" @click="remove(record)">
                  <Icon name="trash" :size="14" />
                </button>
              </div>
            </article>
          </div>
          <EmptyState v-else title="还没有考试记录" text="完成一次机测后，这里会保存成绩、CEFR 等级和逐题解析。" icon="history">
            <router-link class="btn btn-primary btn-sm" to="/exam">开始考试</router-link>
          </EmptyState>
        </div>
      </div>

      <aside class="stack">
        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>月度最佳</h3>
              <p>按月份取最高分</p>
            </div>
          </div>
          <div v-if="monthlyBest.length > 0" class="stack-sm">
            <div v-for="record in monthlyBest" :key="record.month" class="best-card">
              <span>{{ record.month }}</span>
              <strong>{{ record.score }} 分</strong>
              <span>{{ record.cefr }} · {{ formatDateTime(record.finishedAt) }}</span>
              <button class="link-btn mt-2" type="button" @click="view(record)">查看报告</button>
            </div>
          </div>
          <p v-else class="text-sm muted">还没有月度成绩。</p>
        </div>

        <div class="card card-pad">
          <div class="card-head">
            <div>
              <h3>数据管理</h3>
              <p>本地优先，不上传服务器</p>
            </div>
            <Icon name="shield" :size="18" class="muted" />
          </div>
          <div class="stack-sm">
            <button class="btn btn-secondary btn-block" type="button" @click="exportAll">
              <Icon name="download" :size="16" />
              导出全部数据
            </button>
            <button class="btn btn-secondary btn-block" type="button" @click="triggerImport">
              <Icon name="upload" :size="16" />
              导入备份文件
            </button>
            <button class="btn btn-danger btn-block" type="button" :disabled="history.count === 0" @click="clearOpen = true">
              <Icon name="trash" :size="16" />
              清空历史与错题
            </button>
          </div>
          <p class="text-xs muted mt-3">清空会同时删除成绩、错题本、题目反馈和未完成草稿。设置不会被重置。</p>
        </div>
      </aside>
    </section>

    <Modal :open="clearOpen" title="清空全部学习数据？" subtitle="历史成绩、错题本、题目反馈和考试草稿都会被删除。" width="460px" @close="clearOpen = false">
      <div class="notice notice-danger">
        <Icon name="alert" :size="16" />
        <span>此操作无法撤销。建议先点击“导出备份”保存 JSON 文件。</span>
      </div>
      <template #footer>
        <button class="btn btn-secondary" type="button" @click="clearOpen = false">取消</button>
        <button class="btn btn-danger" type="button" @click="confirmClear">确认清空</button>
      </template>
    </Modal>
  </div>
</template>
