import api from './axios'

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
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export async function apiRefresh(refreshToken: string): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>('/auth/refresh', { refresh_token: refreshToken })
  return data
}

export async function apiGetMe(): Promise<LoginResponse['user']> {
  const { data } = await api.get<LoginResponse['user']>('/auth/me')
  return data
}
