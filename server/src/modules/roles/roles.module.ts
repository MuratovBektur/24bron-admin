import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from '../../entities/user-role.entity';
import { RolesSeeder } from './roles.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole])],
  providers: [RolesSeeder],
  exports: [TypeOrmModule, RolesSeeder],
})
export class RolesModule {}
