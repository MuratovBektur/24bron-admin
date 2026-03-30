import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from './entities/role.entity';

const ROLES_SEED: { name: RoleName; description: string }[] = [
  {
    name: RoleName.SUPER_ADMIN,
    description:
      'Полный доступ к платформе. Создаёт пользователей с любой ролью.',
  },
  {
    name: RoleName.ADMIN,
    description:
      'Помощник супер-админа. Создаёт owner, owner_assistant, client.',
  },
  {
    name: RoleName.OWNER,
    description: 'Владелец полей. Управляет своими площадками.',
  },
  {
    name: RoleName.OWNER_ASSISTANT,
    description:
      'Помощник владельца. Управляет бронированиями от имени owner-а.',
  },
  {
    name: RoleName.CLIENT,
    description: 'Обычный пользователь. Бронирует поля самостоятельно.',
  },
];

@Injectable()
export class RolesSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    for (const roleData of ROLES_SEED) {
      const exists = await this.rolesRepository.findOneBy({
        name: roleData.name,
      });
      if (!exists) {
        await this.rolesRepository.save(this.rolesRepository.create(roleData));
      }
    }
  }
}
