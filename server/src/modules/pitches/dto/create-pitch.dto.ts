import { PitchType, ParkingType } from '../../../entities/pitch.entity';

export class CreatePitchDto {
  name!: string;
  type!: PitchType;
  width!: number;
  length!: number;
  height?: number | null;
  price_per_hour!: number;
  has_locker_room?: boolean | null;
  has_shower?: boolean | null;
  has_lighting?: boolean | null;
  stands_count?: number | null;
  has_parking?: boolean | null;
  parking_type?: ParkingType | null;
  is_24h?: boolean;
  open_time?: string | null;
  close_time?: string | null;
  description?: string;
}
