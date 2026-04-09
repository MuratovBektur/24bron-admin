import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complex } from '../../entities/complex.entity';
import { ComplexesService } from './complexes.service';
import { ComplexesController } from './complexes.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Complex])],
  controllers: [ComplexesController],
  providers: [ComplexesService, RolesGuard],
})
export class ComplexesModule {}
