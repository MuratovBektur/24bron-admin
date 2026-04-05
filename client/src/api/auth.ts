const API_BASE = '/api'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    roles: { id: string; name: string }[]
  }
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Неверный email или пароль')
  return res.json() as Promise<LoginResponse>
}

export async function apiRefresh(refreshToken: string): Promise<TokenPair> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error('Session expired')
  return res.json() as Promise<TokenPair>
}
