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
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('pitches/:pitchId/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'owner', 'owner_assistant')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Get()
  findAll(@Param('pitchId') pitchId: string, @Query('date') date?: string) {
    return this.service.findByPitch(pitchId, date);
  }

  @Post()
  create(@Param('pitchId') pitchId: string, @Body() dto: CreateBookingDto) {
    return this.service.create(pitchId, dto);
  }

  @Patch(':id')
  update(@Param('pitchId') pitchId: string, @Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.service.update(pitchId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteById(@Param('id') id: string) {
    return this.service.deleteById(id);
  }
}
