import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiLogin, apiRefresh, type LoginResponse } from '@/api/auth'

// Токены могут лежать в localStorage (постоянный вход) или sessionStorage (временный)
function readToken(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(readToken('access_token'))
  const refreshToken = ref<string | null>(readToken('refresh_token'))
  const user = ref<LoginResponse['user'] | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)

  function setTokens(access: string, refresh: string, remember: boolean) {
    accessToken.value = access
    refreshToken.value = refresh

    const storage = remember ? localStorage : sessionStorage
    storage.setItem('access_token', access)
    storage.setItem('refresh_token', refresh)
  }

  async function login(email: string, password: string, remember: boolean) {
    const data = await apiLogin(email, password)
    setTokens(data.access_token, data.refresh_token, remember)
    user.value = data.user
  }

  async function refresh() {
    if (!refreshToken.value) throw new Error('No refresh token')
    const data = await apiRefresh(refreshToken.value)
    // сохраняем в тот же storage где лежит текущий refresh_token
    const inLocal = !!localStorage.getItem('refresh_token')
    setTokens(data.access_token, data.refresh_token, inLocal)
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
  }

  return { accessToken, refreshToken, user, isAuthenticated, login, refresh, logout }
})
