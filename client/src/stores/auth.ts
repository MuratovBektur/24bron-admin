import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiLogin, apiRefresh, apiGetMe, apiChangePassword, type LoginResponse } from '@/api/auth'

function readToken(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(readToken('access_token'))
  const refreshToken = ref<string | null>(readToken('refresh_token'))
  const user = ref<LoginResponse['user'] | null>(null)
  const userLoading = ref(false)

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

  async function fetchMe() {
    userLoading.value = true
    try {
      user.value = await apiGetMe()
    } finally {
      userLoading.value = false
    }
  }

  async function refresh() {
    if (!refreshToken.value) throw new Error('No refresh token')
    const data = await apiRefresh(refreshToken.value)
    const inLocal = !!localStorage.getItem('refresh_token')
    setTokens(data.access_token, data.refresh_token, inLocal)
  }

  async function changePassword(newPassword: string) {
    await apiChangePassword(newPassword)
    if (user.value) user.value.must_change_password = false
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

  return {
    accessToken,
    refreshToken,
    user,
    userLoading,
    isAuthenticated,
    login,
    fetchMe,
    refresh,
    changePassword,
    logout,
  }
})
