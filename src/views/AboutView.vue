<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBankStore } from '@/stores/bank'
import { SECTIONS, SECTION_META } from '@/types'
import { pushToast } from '@/core/toast'
import Icon from '@/components/Icon.vue'
import StatCard from '@/components/StatCard.vue'

const bank = useBankStore()

const sectionCards = computed(() =>
  SECTIONS.map((section) => ({
    section,
    meta: SECTION_META[section],
    count: bank.questions[section].length,
  })),
)

onMounted(() => {
  if (!bank.loaded && !bank.loading) {
    bank.load().catch((error) => pushToast(error instanceof Error ? error.message : '题库加载失败', 'error'))
  }
})
</script>

<template>
  <div class="stack-lg">
    <section class="about-hero">
      <span class="eyebrow"><Icon name="info" :size="13" />About</span>
      <h2>岱恩英语机测练习系统</h2>
      <p>
        一个本地优先的英语机测练习工具，按岱恩语培公开介绍的 CEFR 分级与四维能力框架设计：
        听力、词汇、语法、阅读分别自适应出题，考后生成能力画像、薄弱考点和逐题解析。
        它不是岱恩官方产品，也不包含岱恩付费题库。
      </p>
      <div class="hero-meta">
        <span class="tag-pill"><Icon name="bank" :size="12" />{{ bank.total }} 道原创/改编题</span>
        <span class="tag-pill"><Icon name="target" :size="12" />CEFR A1–C1</span>
        <span class="tag-pill"><Icon name="headphones" :size="12" />浏览器 TTS</span>
        <span class="tag-pill"><Icon name="shield" :size="12" />无服务器 · 无账号</span>
      </div>
    </section>

    <section class="grid grid-4">
      <StatCard label="题库总量" :value="bank.total || '—'" hint="四部分合计" icon="bank" tone="teal" />
      <StatCard label="听力题组" :value="Object.keys(bank.listeningSets).length" hint="每组 2–4 题" icon="headphones" tone="amber" />
      <StatCard label="阅读材料" :value="Object.keys(bank.passages).length" hint="商务与日常主题" icon="book" tone="indigo" />
      <StatCard label="题库版本" :value="`v${bank.manifest?.version ?? '—'}`" :hint="bank.manifest?.builtAt ? `构建于 ${bank.manifest.builtAt}` : '等待加载'" icon="file-text" tone="rose" />
    </section>

    <section class="about-grid">
      <article class="about-section">
        <h3>四个模块</h3>
        <ul>
          <li v-for="item in sectionCards" :key="item.section">
            <strong>{{ item.meta.name }}</strong>：{{ item.meta.description }}（{{ item.count }} 题）
          </li>
        </ul>
      </article>

      <article class="about-section">
        <h3>自适应机制</h3>
        <p>
          每题标注 1–5 级难度。系统用 Rasch 模型估计当前能力值，答对后提高难度，答错后回调；
          下一题优先选择难度最接近当前能力值的题目。四个模块分别自适应，最终汇总为 CEFR 估算等级。
        </p>
      </article>

      <article class="about-section">
        <h3>计分方式</h3>
        <p>
          总分 = 70% 能力值折算 + 30% 正确率，范围 0–100。60 分显示合格，80 分显示优秀。
          该分数仅用于个人练习参考，不能替代岱恩官方测评或任何正式英语考试成绩。
        </p>
      </article>

      <article class="about-section">
        <h3>听力与阅读</h3>
        <p>
          听力使用浏览器 Web Speech API 朗读，不需要下载音频文件。考试中每组最多播放 2 次，练习模式不限次数。
          阅读材料与题目同页展示，支持商务邮件、通知、报告和短文。
        </p>
      </article>

      <article class="about-section">
        <h3>题库来源</h3>
        <p>
          题目由本项目原创编写，少量题目参考公开英语样题结构后改写，并在题目上标注“公开样题改编”。
          不复制岱恩官方题库、付费资料或未授权真题。题库结构支持继续扩充。
        </p>
      </article>

      <article class="about-section">
        <h3>数据与隐私</h3>
        <p>
          成绩、错题、设置和考试草稿都保存在浏览器 localStorage，不会上传到服务器。
          清理浏览器数据前，请在“历史记录”或“设置”中导出 JSON 备份。
        </p>
      </article>

      <article class="about-section">
        <h3>键盘快捷键</h3>
        <ul>
          <li><span class="kbd">1-4</span> / <span class="kbd">A-D</span> 选择选项</li>
          <li><span class="kbd">Enter</span> 下一题 / 下一组</li>
          <li><span class="kbd">F</span> 标记当前题</li>
          <li><span class="kbd">←</span> <span class="kbd">→</span> 在题组内切换当前题</li>
        </ul>
      </article>

      <article class="about-section">
        <h3>技术栈</h3>
        <p>
          Vue 3 + Vite + TypeScript + Pinia + Vue Router。纯静态单页应用，无后端依赖；
          题库以 JSON 文件按模块懒加载，可在 <code>scripts/content</code> 中继续扩充。
        </p>
      </article>
    </section>

    <section class="about-section">
      <h3>公开参考资料</h3>
      <div class="source-list">
        <div class="source-item">岱恩语培公开介绍页（dailyedu.com）：CEFR 分级、AI 自适应、听说读写能力框架、企业商务英语场景。</div>
        <div class="source-item">CEFR 欧洲语言共同参考框架（coe.int）：A1–C1 能力描述与等级划分。</div>
        <div class="source-item">公开英语样题与商务英语常见题型：仅用于结构参考，题目内容均重新编写。</div>
      </div>
    </section>

    <section class="disclaimer">
      <strong>非官方声明：</strong>
      本系统与岱恩教育、岱恩语培及其关联公司无隶属或合作关系。系统名称中的“岱恩”仅用于说明练习风格与目标场景。
      题库为原创或公开样题改编，不含岱恩官方真题；所有分数、CEFR 等级和薄弱点分析均为练习估算，不代表官方测评结果。
      如需参加公司正式考试，请以公司及岱恩官方通知为准。
    </section>
  </div>
</template>
