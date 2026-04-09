import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ComplexesService } from './complexes.service';
import { CreateComplexDto } from './dto/create-complex.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface JwtRequest extends ExpressRequest {
  user: { userId: string; email: string; roles: string[] };
}

@Controller('complexes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplexesController {
  constructor(private readonly service: ComplexesService) {}

  @Get()
  @Roles('super_admin', 'admin')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('super_admin', 'admin')
  create(@Body() dto: CreateComplexDto, @Request() req: JwtRequest) {
    return this.service.create(dto, req.user.userId);
  }
}
