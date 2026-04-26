import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Один промис рефреша на все одновременные запросы
let refreshPromise: Promise<void> | null = null

// Request interceptor — добавляем access_token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — при 401 рефрешим токены и повторяем запрос
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (originalRequest.url === '/auth/login') {
      return Promise.reject(error)
    }

    const refreshToken =
      localStorage.getItem('refresh_token') ?? sessionStorage.getItem('refresh_token')

    if (!refreshToken) {
      return forceLogout()
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post('/api/auth/refresh', { refresh_token: refreshToken })
          .then(({ data }) => {
            const inLocal = !!localStorage.getItem('refresh_token')
            const storage = inLocal ? localStorage : sessionStorage
            storage.setItem('access_token', data.access_token)
            storage.setItem('refresh_token', data.refresh_token)
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      await refreshPromise

      const newToken =
        localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token')
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch {
      return forceLogout()
    }
  },
)

async function forceLogout(): Promise<never> {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
  await router.push({ name: 'login' })
  return Promise.reject(new Error('Session expired'))
}

export default api
