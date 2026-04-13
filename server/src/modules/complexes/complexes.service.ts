import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complex } from '../../entities/complex.entity';
import { CreateComplexDto } from './dto/create-complex.dto';
import { UpdateComplexDto } from './dto/update-complex.dto';

const MAP_LINK_PREFIX = 'https://go.2gis.com/';

@Injectable()
export class ComplexesService {
  constructor(
    @InjectRepository(Complex)
    private readonly repo: Repository<Complex>,
  ) {}

  async create(dto: CreateComplexDto, userId: string): Promise<Complex> {
    this.validateMapLink(dto.map_link);
    const complex = this.repo.create({
      ...dto,
      created_by: { id: userId },
    });
    return this.repo.save(complex);
  }

  async update(id: string, dto: UpdateComplexDto): Promise<Complex> {
    if (dto.map_link !== undefined) {
      this.validateMapLink(dto.map_link);
    }
    const complex = await this.repo.findOne({ where: { id } });
    if (!complex) throw new NotFoundException('Комплекс не найден');
    Object.assign(complex, dto);
    return this.repo.save(complex);
  }

  async findAll(): Promise<Complex[]> {
    return this.repo.find({
      relations: ['created_by'],
      order: { created_at: 'DESC' },
    });
  }

  private validateMapLink(value: string): void {
    if (!value?.startsWith(MAP_LINK_PREFIX)) {
      throw new BadRequestException(
        `Ссылка на карту должна начинаться с ${MAP_LINK_PREFIX}`,
      );
    }
  }
}
