import { api } from '.'

export interface Complex {
  id: string
  name: string
  address: string
  description: string | null
  phone: string | null
  is_active: boolean
  created_at: string
}

export interface CreateComplexDto {
  name: string
  address: string
  description?: string
  phone?: string
}

export async function apiGetComplexes(): Promise<Complex[]> {
  const { data } = await api.get<Complex[]>('/complexes')
  return data
}

export async function apiCreateComplex(dto: CreateComplexDto): Promise<Complex> {
  const { data } = await api.post<Complex>('/complexes', dto)
  return data
}
