import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PitchesService } from './pitches.service';
import { CreatePitchDto } from './dto/create-pitch.dto';
import { UpdatePitchDto } from './dto/update-pitch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ComplexAccessGuard } from '../auth/complex-access.guard';
import { CheckComplexAccess } from '../auth/complex-access.decorator';

@Controller('complexes/:complexId/pitches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
export class PitchesController {
  constructor(private readonly service: PitchesService) {}

  @Get()
  @Roles('super_admin', 'admin', 'owner', 'owner_assistant')
  @CheckComplexAccess('complex')
  @UseGuards(JwtAuthGuard, RolesGuard, ComplexAccessGuard)
  findAll(@Param('complexId') complexId: string) {
    return this.service.findByComplex(complexId);
  }

  @Post()
  create(@Param('complexId') complexId: string, @Body() dto: CreatePitchDto) {
    return this.service.create(complexId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePitchDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteById(@Param('id') id: string) {
    return this.service.deleteById(id);
  }
}

@Controller('pitches')
@UseGuards(JwtAuthGuard, RolesGuard, ComplexAccessGuard)
@Roles('super_admin', 'admin', 'owner', 'owner_assistant')
@CheckComplexAccess('pitch')
export class PitchDetailController {
  constructor(private readonly service: PitchesService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
