import { PitchType, ParkingType } from '../../../entities/pitch.entity';

export class UpdatePitchDto {
  name?: string;
  type?: PitchType;
  width?: number;
  length?: number;
  height?: number | null;
  price_per_hour?: number;
  has_locker_room?: boolean | null;
  has_shower?: boolean | null;
  has_lighting?: boolean | null;
  stands_count?: number | null;
  has_parking?: boolean | null;
  parking_type?: ParkingType | null;
  description?: string;
  is_active?: boolean;
}
