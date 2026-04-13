import { api } from '.'

export interface Complex {
  id: string
  name: string
  address: string
  map_link: string
  description: string | null
  phone: string | null
  is_active: boolean
  created_at: string
}

export interface CreateComplexDto {
  name: string
  address: string
  map_link: string
  description?: string
  phone?: string
}

export interface UpdateComplexDto {
  name?: string
  address?: string
  map_link?: string
  description?: string
  phone?: string
  is_active?: boolean
}

export async function apiGetComplexes(): Promise<Complex[]> {
  const { data } = await api.get<Complex[]>('/complexes')
  return data
}

export async function apiCreateComplex(dto: CreateComplexDto): Promise<Complex> {
  const { data } = await api.post<Complex>('/complexes', dto)
  return data
}

export async function apiUpdateComplex(id: string, dto: UpdateComplexDto): Promise<Complex> {
  const { data } = await api.patch<Complex>(`/complexes/${id}`, dto)
  return data
}
