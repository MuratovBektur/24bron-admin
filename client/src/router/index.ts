import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginPage from '@/pages/login/LoginPage.vue'
import NotFoundPage from '@/pages/not-found/NotFoundPage.vue'
import MainLayout from '@/layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/pages/home/HomePage.vue'),
        },
        {
          path: 'complexes',
          name: 'complexes',
          component: () => import('@/pages/complexes/ComplexesPage.vue'),
          meta: { roles: ['super_admin', 'admin'] },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/pages/users/UsersPage.vue'),
          meta: { roles: ['super_admin', 'admin'] },
        },
        {
          path: 'complexes/:id/pitches',
          name: 'complex-pitches',
          component: () => import('@/pages/pitches/PitchesPage.vue'),
          meta: { roles: ['super_admin', 'admin'] },
        },
      ],
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

    // Проверка ролей
    const requiredRoles = to.meta.roles as string[] | undefined
    if (requiredRoles?.length) {
      const userRoles = auth.user?.roles.map((r) => r.name) ?? []
      const hasRole = requiredRoles.some((r) => userRoles.includes(r))
      if (!hasRole) return { name: 'home' }
    }
  }
})

export default router
