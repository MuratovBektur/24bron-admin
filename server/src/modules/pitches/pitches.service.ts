import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pitch } from '../../entities/pitch.entity';
import { CreatePitchDto } from './dto/create-pitch.dto';
import { UpdatePitchDto } from './dto/update-pitch.dto';

@Injectable()
export class PitchesService {
  constructor(
    @InjectRepository(Pitch)
    private readonly repo: Repository<Pitch>,
  ) {}

  async create(complexId: string, dto: CreatePitchDto): Promise<Pitch> {
    const pitch = this.repo.create({
      ...dto,
      complex: { id: complexId },
    });
    return this.repo.save(pitch);
  }

  async update(id: string, dto: UpdatePitchDto): Promise<Pitch> {
    const pitch = await this.repo.findOne({ where: { id } });
    if (!pitch) throw new NotFoundException('Поле не найдено');
    Object.assign(pitch, dto);
    return this.repo.save(pitch);
  }

  async findByComplex(complexId: string): Promise<Pitch[]> {
    return this.repo.find({
      where: { complex: { id: complexId } },
      order: { created_at: 'ASC' },
    });
  }
}
