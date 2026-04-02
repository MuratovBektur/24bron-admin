import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { OwnerStaff } from '../../entities/owner-staff.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, OwnerStaff])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
