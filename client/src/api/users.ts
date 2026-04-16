import { api } from '.'
import type { Complex } from './complexes'

export type RoleName = 'owner' | 'owner_assistant' | 'client'

export interface UserRole {
  id: string
  name: string
}

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  is_active: boolean
  roles: UserRole[]
  created_at: string
}

export interface CreateUserDto {
  first_name: string
  last_name: string
  email: string
  password: string
  phone?: string
  role: RoleName
}

export interface UpdateUserDto {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  role?: RoleName
  is_active?: boolean
}

export const ROLE_LABELS: Record<RoleName, string> = {
  owner: 'Владелец',
  owner_assistant: 'Помощник владельца',
  client: 'Клиент',
}

export async function apiGetUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users')
  return data
}

export async function apiCreateUser(dto: CreateUserDto): Promise<User> {
  const { data } = await api.post<User>('/users', dto)
  return data
}

export async function apiUpdateUser(id: string, dto: UpdateUserDto): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}`, dto)
  return data
}

export async function apiAssignComplex(userId: string, complexId: string | null): Promise<Complex> {
  const { data } = await api.patch<Complex>(`/users/${userId}/assign-complex`, {
    complex_id: complexId,
  })
  return data
}

export async function apiGetOwnerComplex(userId: string): Promise<Complex | null> {
  const { data } = await api.get<Complex | null>(`/users/${userId}/complex`)
  return data
}
