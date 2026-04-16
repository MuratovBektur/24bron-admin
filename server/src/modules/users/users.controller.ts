import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface JwtRequest extends ExpressRequest {
  user: { userId: string; email: string; roles: string[] };
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Request() req: JwtRequest) {
    return this.service.create(dto, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/assign-complex')
  assignComplex(
    @Param('id') userId: string,
    @Body() body: { complex_id: string | null },
  ) {
    return this.service.assignComplex(userId, body.complex_id);
  }

  @Get(':id/complex')
  getOwnerComplex(@Param('id') userId: string) {
    return this.service.getOwnerComplex(userId);
  }
}
