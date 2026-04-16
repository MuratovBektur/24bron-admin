import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { OwnerStaff } from '../../entities/owner-staff.entity';
import { UserRole } from '../../entities/user-role.entity';
import { Complex } from '../../entities/complex.entity';
import { UsersSeeder } from './users.seeder';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OwnerStaff, UserRole, Complex]),
    RolesModule,
  ],
  controllers: [UsersController],
  providers: [UsersSeeder, UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
