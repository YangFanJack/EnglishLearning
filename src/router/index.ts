import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '学习总览' },
    },
    {
      path: '/exam',
      name: 'exam',
      component: () => import('@/views/ExamSetupView.vue'),
      meta: { title: '月度机测' },
    },
    {
      path: '/exam/run',
      name: 'exam-run',
      component: () => import('@/views/ExamRunView.vue'),
      meta: { title: '考试中', bare: true },
    },
    {
      path: '/exam/result/:id',
      name: 'exam-result',
      component: () => import('@/views/ExamResultView.vue'),
      meta: { title: '成绩报告' },
    },
    {
      path: '/practice',
      name: 'practice',
      component: () => import('@/views/PracticeView.vue'),
      meta: { title: '分类练习' },
    },
    {
      path: '/practice/run',
      name: 'practice-run',
      component: () => import('@/views/PracticeRunView.vue'),
      meta: { title: '练习中', bare: true },
    },
    {
      path: '/wrongbook',
      name: 'wrongbook',
      component: () => import('@/views/WrongbookView.vue'),
      meta: { title: '错题本' },
    },
    {
      path: '/bank',
      name: 'bank',
      component: () => import('@/views/BankView.vue'),
      meta: { title: '题库浏览' },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
      meta: { title: '历史记录' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: '设置' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: '关于系统' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '岱恩英语机测'
  document.title = `${title} · 岱恩英语机测练习系统`
})

export default router
