import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginPage from '@/pages/login/LoginPage.vue'
import HomePage from '@/pages/home/HomePage.vue'
import NotFoundPage from '@/pages/not-found/NotFoundPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
    },
  ],
})

router.beforeEach(async (to) => {
  const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token')

  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }

  if (to.name === 'login' && token) {
    return { name: 'home' }
  }

  // Загружаем данные пользователя при первом посещении защищённого маршрута
  if (to.meta.requiresAuth && token) {
    const auth = useAuthStore()
    if (!auth.user) {
      try {
        await auth.fetchMe()
      } catch {
        auth.logout()
        return { name: 'login' }
      }
    }
  }
})

export default router
