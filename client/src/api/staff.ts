import { api } from '.'
import type { User } from './users'

export type { User as StaffMember }

export interface CreateStaffDto {
  first_name: string
  last_name: string
  email: string
  password: string
  phone?: string
}

export interface UpdateStaffDto {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  is_active?: boolean
}

export async function apiGetMyStaff(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users/my-staff')
  return data
}

export async function apiCreateStaffMember(dto: CreateStaffDto): Promise<User> {
  const { data } = await api.post<User>('/users/my-staff', dto)
  return data
}

export async function apiUpdateStaffMember(id: string, dto: UpdateStaffDto): Promise<User> {
  const { data } = await api.patch<User>(`/users/my-staff/${id}`, dto)
  return data
}

export async function apiRemoveStaffMember(id: string): Promise<void> {
  await api.delete(`/users/my-staff/${id}`)
}
