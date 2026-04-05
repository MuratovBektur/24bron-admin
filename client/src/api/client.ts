import router from '@/router'
import { useAuthStore } from '@/stores/auth'

const API_BASE = '/api'

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number }
    if (typeof payload.exp !== 'number') return true
    // считаем истёкшим за 10 секунд до реального истечения
    return Date.now() / 1000 >= payload.exp - 10
  } catch {
    return true
  }
}

// Один промис рефреша на все одновременные запросы
let refreshPromise: Promise<void> | null = null

function buildHeaders(token: string | null, extra: HeadersInit = {}): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra as Record<string, string>),
  }
}

async function forceLogout(): Promise<never> {
  const auth = useAuthStore()
  auth.logout()
  await router.push({ name: 'login' })
  throw new Error('Session expired')
}

export async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
  const auth = useAuthStore()

  // Проактивный рефреш: access_token истёк, но refresh_token ещё жив
  if (auth.accessToken && isTokenExpired(auth.accessToken)) {
    if (auth.refreshToken && !isTokenExpired(auth.refreshToken)) {
      refreshPromise ??= auth.refresh().finally(() => {
        refreshPromise = null
      })
      try {
        await refreshPromise
      } catch {
        return forceLogout()
      }
    } else {
      return forceLogout()
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(auth.accessToken, options.headers as HeadersInit),
  })

  // Реактивный рефреш: сервер вернул 401
  if (res.status === 401 && auth.refreshToken && !isTokenExpired(auth.refreshToken)) {
    refreshPromise ??= auth.refresh().finally(() => {
      refreshPromise = null
    })
    try {
      await refreshPromise
    } catch {
      return forceLogout()
    }
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: buildHeaders(auth.accessToken, options.headers as HeadersInit),
    })
  }

  if (res.status === 401) return forceLogout()

  return res
}
