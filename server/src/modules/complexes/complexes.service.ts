import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complex } from '../../entities/complex.entity';
import { CreateComplexDto } from './dto/create-complex.dto';

@Injectable()
export class ComplexesService {
  constructor(
    @InjectRepository(Complex)
    private readonly repo: Repository<Complex>,
  ) {}

  async create(dto: CreateComplexDto, userId: string): Promise<Complex> {
    const complex = this.repo.create({
      ...dto,
      created_by: { id: userId },
    });
    return this.repo.save(complex);
  }

  async findAll(): Promise<Complex[]> {
    return this.repo.find({
      relations: ['created_by'],
      order: { created_at: 'DESC' },
    });
  }
}
