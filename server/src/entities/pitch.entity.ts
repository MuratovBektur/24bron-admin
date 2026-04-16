import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Complex } from './complex.entity';

export enum PitchType {
  OPEN = 'open',
  COVERED = 'covered',
  FUTSAL = 'futsal',
}

export enum ParkingType {
  FREE = 'free',
  PAID = 'paid',
}

@Entity('pitches')
export class Pitch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: PitchType })
  type!: PitchType;

  @Column({ type: 'int' })
  width!: number;

  @Column({ type: 'int' })
  length!: number;

  @Column({ type: 'int', nullable: true })
  height!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_per_hour!: number;

  // null = инфраструктура не указана
  @Column({ type: 'boolean', nullable: true })
  has_locker_room!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  has_shower!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  has_lighting!: boolean | null;

  @Column({ type: 'int', nullable: true })
  stands_count!: number | null;

  @Column({ type: 'boolean', nullable: true })
  has_parking!: boolean | null;

  @Column({ type: 'enum', enum: ParkingType, nullable: true })
  parking_type!: ParkingType | null;

  @Column({ default: true })
  is_24h!: boolean;

  @Column({ type: 'varchar', length: 5, nullable: true })
  open_time!: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  close_time!: string | null;

  @Column({ nullable: true })
  description!: string;

  @Column({ default: false })
  is_active!: boolean;

  @ManyToOne(() => Complex, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complex_id' })
  complex!: Complex;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
