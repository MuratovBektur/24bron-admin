import {
  Body,
  Controller,
  Delete,
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

  @Get('my-staff')
  @Roles('owner', 'owner_assistant')
  getMyStaff(@Request() req: JwtRequest) {
    return this.service.getOwnerStaff(req.user.userId, req.user.roles ?? []);
  }

  @Post('my-staff')
  @Roles('owner')
  createStaff(@Body() dto: CreateUserDto, @Request() req: JwtRequest) {
    return this.service.createOwnerStaff(dto, req.user.userId);
  }

  @Patch('my-staff/:assistantId')
  @Roles('owner')
  updateStaff(
    @Param('assistantId') assistantId: string,
    @Body() dto: UpdateUserDto,
    @Request() req: JwtRequest,
  ) {
    return this.service.updateOwnerStaff(assistantId, dto, req.user.userId);
  }

  @Delete('my-staff/:assistantId')
  @Roles('owner')
  removeStaff(
    @Param('assistantId') assistantId: string,
    @Request() req: JwtRequest,
  ) {
    return this.service.removeOwnerStaff(assistantId, req.user.userId);
  }

  @Get(':id/complex')
  @Roles('super_admin', 'admin', 'owner', 'owner_assistant')
  getOwnerComplex(@Param('id') userId: string, @Request() req: JwtRequest) {
    const roles: string[] = req.user.roles ?? [];
    if (roles.includes('owner_assistant')) {
      return this.service.getAssistantComplex(req.user.userId);
    }
    // owner: enforce own id; admin/super_admin: use param as-is
    const resolvedId = roles.includes('owner') ? req.user.userId : userId;
    return this.service.getOwnerComplex(resolvedId);
  }
}
