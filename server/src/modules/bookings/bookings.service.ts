import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../../entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
  ) {}

  private computeStatus(paidAmount: number | null, price: number): BookingStatus {
    if (paidAmount && paidAmount > 0) {
      return paidAmount >= price ? 'paid' : 'partial';
    }
    return 'pending';
  }

  async findByPitch(pitchId: string, date?: string): Promise<Booking[]> {
    const where: FindOptionsWhere<Booking> = { pitch: { id: pitchId } };

    if (date) {
      const from = new Date(`${date}T00:00:00.000Z`);
      const to = new Date(`${date}T23:59:59.999Z`);
      where.start_time = Between(from, to);
    }

    const bookings = await this.repo.find({ where, order: { start_time: 'ASC' } });

    // Filter out expired pending bookings
    const now = new Date();
    return bookings.filter(
      (b) => !(b.status === 'pending' && b.pending_until && b.pending_until < now),
    );
  }

  private async checkConflict(
    pitchId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<void> {
    const now = new Date();
    const qb = this.repo
      .createQueryBuilder('b')
      .where('b.pitch_id = :pitchId', { pitchId })
      .andWhere('b.start_time < :endTime', { endTime })
      .andWhere('b.end_time > :startTime', { startTime })
      .andWhere(
        "(b.status != 'pending' OR b.pending_until IS NULL OR b.pending_until > :now)",
        { now },
      );

    if (excludeId) {
      qb.andWhere('b.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    if (count > 0) {
      throw new ConflictException('Это время уже занято другим бронированием');
    }
  }

  async create(pitchId: string, dto: CreateBookingDto): Promise<Booking> {
    const startTime = new Date(dto.start_time);
    const endTime = new Date(dto.end_time);

    await this.checkConflict(pitchId, startTime, endTime);

    const paidAmount = dto.paid_amount ?? null;
    const booking = this.repo.create({
      client_name: dto.client_name,
      client_phone: dto.client_phone ?? null,
      start_time: startTime,
      end_time: endTime,
      price: dto.price,
      paid_amount: paidAmount,
      pending_until: dto.pending_until ? new Date(dto.pending_until) : null,
      status: this.computeStatus(paidAmount, dto.price),
      notes: dto.notes ?? null,
      pitch: { id: pitchId },
    });
    return this.repo.save(booking);
  }

  async update(pitchId: string, id: string, dto: UpdateBookingDto): Promise<Booking> {
    const booking = await this.repo.findOne({ where: { id }, relations: ['pitch'] });
    if (!booking) throw new NotFoundException('Бронирование не найдено');

    const newStart = dto.start_time ? new Date(dto.start_time) : booking.start_time;
    const newEnd = dto.end_time ? new Date(dto.end_time) : booking.end_time;

    if (dto.start_time || dto.end_time) {
      await this.checkConflict(booking.pitch.id, newStart, newEnd, id);
    }

    if (dto.client_name !== undefined) booking.client_name = dto.client_name;
    if (dto.client_phone !== undefined) booking.client_phone = dto.client_phone ?? null;
    if (dto.start_time !== undefined) booking.start_time = newStart;
    if (dto.end_time !== undefined) booking.end_time = newEnd;
    if (dto.notes !== undefined) booking.notes = dto.notes ?? null;
    if (dto.pending_until !== undefined)
      booking.pending_until = dto.pending_until ? new Date(dto.pending_until) : null;

    const newPrice = dto.price ?? Number(booking.price);
    if (dto.price !== undefined) booking.price = newPrice;

    const newPaid =
      dto.paid_amount !== undefined ? (dto.paid_amount ?? null) : booking.paid_amount;
    if (dto.paid_amount !== undefined) booking.paid_amount = newPaid;

    booking.status = this.computeStatus(
      newPaid !== null ? Number(newPaid) : null,
      newPrice,
    );

    return this.repo.save(booking);
  }

  async deleteById(id: string): Promise<{ deleted: true }> {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException('Бронирование не найдено');
    return { deleted: true };
  }
}
