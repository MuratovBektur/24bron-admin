import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { UserRole, RoleName } from '../../entities/user-role.entity';

@Injectable()
export class UsersSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly rolesRepository: Repository<UserRole>,
  ) {}

  async onModuleInit() {
    const userCount = await this.usersRepository.count();
    if (userCount === 0) {
      // Создаем первого супер-админа
      const superAdminRole = await this.rolesRepository.findOneBy({
        name: RoleName.SUPER_ADMIN,
      });
      if (!superAdminRole) {
        throw new Error(
          'Super admin role not found. Ensure roles are seeded first.',
        );
      }

      const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
      const lastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';
      //   const phone = process.env.SUPER_ADMIN_PHONE || '+1234567890';
      const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
      const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

      const hashedPassword = await bcrypt.hash(password, 10);

      const superAdmin = this.usersRepository.create({
        first_name: firstName,
        last_name: lastName,
        // phone: phone,
        email: email,
        password_hash: hashedPassword,
        is_active: true,
        roles: [superAdminRole],
      });

      await this.usersRepository.save(superAdmin);
      console.log('Super admin user created successfully.');
    }
  }
}
