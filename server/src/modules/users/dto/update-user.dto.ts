import { RoleName } from '../../../entities/user-role.entity';

export class UpdateUserDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: RoleName;
  is_active?: boolean;
}
