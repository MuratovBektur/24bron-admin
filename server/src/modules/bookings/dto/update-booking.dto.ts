export class UpdateBookingDto {
  client_name?: string;
  client_phone?: string | null;
  start_time?: string;
  end_time?: string;
  price?: number;
  paid_amount?: number | null;
  pending_until?: string | null;
  notes?: string | null;
}
