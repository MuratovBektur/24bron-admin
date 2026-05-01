export const BOOKING_CHANGED_EVENT = 'booking.changed';

export class BookingChangedEvent {
  constructor(
    public readonly pitchId: string,
    public readonly dates: string[],
  ) {}
}
