import { RoleName } from '../../../entities/user-role.entity';

export class CreateUserDto {
  first_name!: string;
  last_name!: string;
  email!: string;
  password!: string;
  phone?: string;
  role!: RoleName;
}
