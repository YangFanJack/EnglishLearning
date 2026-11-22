<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useBankStore } from '@/stores/bank'
import { useSettingsStore } from '@/stores/settings'
import { useWrongbookStore } from '@/stores/wrongbook'
import { currentMonthKey, monthLabel } from '@/core/scoring'
import Icon from './Icon.vue'

interface NavItem {
  to: string
  label: string
  short: string
  icon: string
}

const navItems: NavItem[] = [
  { to: '/', label: '学习总览', short: '总览', icon: 'home' },
  { to: '/exam', label: '月度机测', short: '考试', icon: 'exam' },
  { to: '/practice', label: '分类练习', short: '练习', icon: 'practice' },
  { to: '/wrongbook', label: '错题本', short: '错题', icon: 'wrong' },
  { to: '/bank', label: '题库浏览', short: '题库', icon: 'bank' },
  { to: '/history', label: '历史记录', short: '历史', icon: 'history' },
  { to: '/settings', label: '设置', short: '设置', icon: 'settings' },
]

const mobileNav = navItems.filter((item) => ['/', '/exam', '/practice', '/wrongbook', '/history'].includes(item.to))

const route = useRoute()
const bank = useBankStore()
const settings = useSettingsStore()
const wrongbook = useWrongbookStore()
const mobileOpen = ref(false)

const month = currentMonthKey()
const title = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : '学习总览'))
const bankState = computed(() => {
  if (bank.loading) return 'loading'
  if (bank.error) return 'error'
  if (bank.loaded) return 'ready'
  return 'idle'
})

function isActive(item: NavItem): boolean {
  if (item.to === '/') return route.path === '/'
  return route.path.startsWith(item.to)
}

function closeMobile(): void {
  mobileOpen.value = false
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ 'is-open': mobileOpen }">
      <router-link class="brand" to="/" @click="closeMobile">
        <span class="brand-mark">D</span>
        <span class="brand-copy">
          <strong>岱恩机测</strong>
          <small>English Exam Lab</small>
        </span>
      </router-link>

      <nav class="side-nav" aria-label="主导航">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ 'is-active': isActive(item) }"
          @click="closeMobile"
        >
          <Icon :name="item.icon" :size="19" />
          <span>{{ item.label }}</span>
          <span v-if="item.to === '/wrongbook' && wrongbook.activeCount > 0" class="nav-badge">{{ wrongbook.activeCount }}</span>
        </router-link>
      </nav>

      <div class="sidebar-foot">
        <div class="bank-status">
          <span class="status-dot" :class="bankState" />
          <div class="bank-status-copy">
            <strong>{{ bank.loaded ? `${bank.total} 道题` : bank.error ? '题库加载失败' : '题库加载中…' }}</strong>
            <small>题库版本 {{ bank.manifest?.version ?? '—' }}</small>
          </div>
        </div>
        <router-link to="/about" class="nav-item nav-item-subtle" @click="closeMobile">
          <Icon name="info" :size="18" />
          <span>关于与声明</span>
        </router-link>
      </div>
    </aside>

    <div v-if="mobileOpen" class="sidebar-backdrop" @click="closeMobile" />

    <div class="app-main">
      <header class="topbar">
        <button class="icon-btn mobile-only" type="button" aria-label="打开菜单" @click="mobileOpen = true">
          <Icon name="menu" />
        </button>
        <div class="topbar-title">
          <h1>{{ title }}</h1>
          <p>{{ monthLabel(month) }} · 非官方练习系统</p>
        </div>
        <div class="topbar-actions">
          <span class="month-chip">
            <Icon name="calendar" :size="15" />
            {{ monthLabel(month) }}
          </span>
          <button
            class="icon-btn"
            type="button"
            :title="settings.resolvedTheme === 'dark' ? '切换到浅色' : '切换到深色'"
            @click="settings.toggleTheme()"
          >
            <Icon :name="settings.resolvedTheme === 'dark' ? 'sun' : 'moon'" />
          </button>
          <router-link class="btn btn-primary btn-sm topbar-cta" to="/exam">
            <Icon name="zap" :size="16" />
            开始考试
          </router-link>
        </div>
      </header>

      <main class="page">
        <slot />
      </main>

      <footer class="app-footer">
        岱恩英语机测练习系统 · 题库为原创或公开样题改编，非岱恩官方产品
      </footer>
    </div>

    <nav class="mobile-nav" aria-label="移动端导航">
      <router-link
        v-for="item in mobileNav"
        :key="item.to"
        :to="item.to"
        class="mobile-nav-item"
        :class="{ 'is-active': isActive(item) }"
      >
        <Icon :name="item.icon" :size="20" />
        <span>{{ item.short }}</span>
        <span v-if="item.to === '/wrongbook' && wrongbook.activeCount > 0" class="mobile-badge">{{ wrongbook.activeCount }}</span>
      </router-link>
    </nav>
  </div>
</template>
