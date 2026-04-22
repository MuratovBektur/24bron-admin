import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pitch } from '../../entities/pitch.entity';
import { PitchesService } from './pitches.service';
import { PitchesController, PitchDetailController } from './pitches.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Pitch])],
  controllers: [PitchesController, PitchDetailController],
  providers: [PitchesService, RolesGuard],
})
export class PitchesModule {}
