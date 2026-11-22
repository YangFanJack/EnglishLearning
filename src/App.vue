<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import ToastHost from '@/components/ToastHost.vue'
import { useBankStore } from '@/stores/bank'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const bank = useBankStore()
const settings = useSettingsStore()

const isBare = computed(() => route.meta.bare === true)

onMounted(() => {
  settings.applyTheme()
  if (!bank.loaded && !bank.loading) {
    bank.load().catch(() => {
      // 错误由页面统一展示
    })
  }
})
</script>

<template>
  <AppShell v-if="!isBare">
    <router-view />
  </AppShell>
  <router-view v-else />
  <ToastHost />
</template>
