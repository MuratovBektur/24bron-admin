import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { OwnerStaff } from '../../entities/owner-staff.entity';
import { UserRole } from '../../entities/user-role.entity';
import { UsersSeeder } from './users.seeder';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OwnerStaff, UserRole]),
    RolesModule,
  ],
  providers: [UsersSeeder],
  exports: [TypeOrmModule],
})
export class UsersModule {}
