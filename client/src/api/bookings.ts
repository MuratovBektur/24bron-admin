import { api } from '.'

export type BookingStatus = 'paid' | 'partial' | 'pending'

export interface Booking {
  id: string
  client_name: string
  client_phone: string | null
  start_time: string
  end_time: string
  status: BookingStatus
  price: number
  paid_amount: number | null
  pending_until: string | null
  notes: string | null
  created_at: string
}

export interface CreateBookingDto {
  client_name: string
  client_phone?: string | null
  start_time: string
  end_time: string
  price: number
  paid_amount?: number | null
  pending_until?: string | null
  notes?: string | null
}

export interface UpdateBookingDto extends Partial<CreateBookingDto> {}

export async function apiGetBookings(pitchId: string, date?: string): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>(`/pitches/${pitchId}/bookings`, {
    params: date ? { date } : {},
  })
  return data
}

export async function apiCreateBooking(pitchId: string, dto: CreateBookingDto): Promise<Booking> {
  const { data } = await api.post<Booking>(`/pitches/${pitchId}/bookings`, dto)
  return data
}

export async function apiUpdateBooking(
  pitchId: string,
  id: string,
  dto: UpdateBookingDto,
): Promise<Booking> {
  const { data } = await api.patch<Booking>(`/pitches/${pitchId}/bookings/${id}`, dto)
  return data
}

export async function apiDeleteBooking(pitchId: string, id: string): Promise<void> {
  await api.delete(`/pitches/${pitchId}/bookings/${id}`)
}
