import { api } from '.'

export type PitchType = 'open' | 'covered' | 'futsal'
export type ParkingType = 'free' | 'paid'

export interface Pitch {
  id: string
  name: string
  type: PitchType
  width: number
  length: number
  height: number | null
  price_per_hour: number
  has_locker_room: boolean | null
  has_shower: boolean | null
  has_lighting: boolean | null
  stands_count: number | null
  has_parking: boolean | null
  parking_type: ParkingType | null
  description: string | null
  is_active: boolean
  created_at: string
}

export interface CreatePitchDto {
  name: string
  type: PitchType
  width: number
  length: number
  height?: number | null
  price_per_hour: number
  has_locker_room?: boolean | null
  has_shower?: boolean | null
  has_lighting?: boolean | null
  stands_count?: number | null
  has_parking?: boolean | null
  parking_type?: ParkingType | null
  description?: string
}

export interface UpdatePitchDto extends Partial<CreatePitchDto> {
  is_active?: boolean
}

export async function apiGetPitches(complexId: string): Promise<Pitch[]> {
  const { data } = await api.get<Pitch[]>(`/complexes/${complexId}/pitches`)
  return data
}

export async function apiCreatePitch(complexId: string, dto: CreatePitchDto): Promise<Pitch> {
  const { data } = await api.post<Pitch>(`/complexes/${complexId}/pitches`, dto)
  return data
}

export async function apiUpdatePitch(
  complexId: string,
  id: string,
  dto: UpdatePitchDto,
): Promise<Pitch> {
  const { data } = await api.patch<Pitch>(`/complexes/${complexId}/pitches/${id}`, dto)
  return data
}
