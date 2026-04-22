import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pitch } from './pitch.entity';

// Derived from paid_amount vs price: paid | partial | pending
export type BookingStatus = 'paid' | 'partial' | 'pending';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Pitch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pitch_id' })
  pitch!: Pitch;

  @Column()
  client_name!: string;

  @Column({ type: 'varchar', nullable: true })
  client_phone!: string | null;

  @Column({ type: 'timestamptz' })
  start_time!: Date;

  @Column({ type: 'timestamptz' })
  end_time!: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: BookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paid_amount!: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  pending_until!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
