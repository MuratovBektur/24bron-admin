import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import {
  UserRole,
  ADMIN_ASSIGNABLE_ROLES,
} from '../../entities/user-role.entity';
import { Complex } from '../../entities/complex.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly rolesRepo: Repository<UserRole>,
    @InjectRepository(Complex)
    private readonly complexRepo: Repository<Complex>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({
      relations: ['roles'],
      order: { created_at: 'DESC' },
    });
  }

  async create(dto: CreateUserDto, createdById: string): Promise<User> {
    if (!ADMIN_ASSIGNABLE_ROLES.includes(dto.role)) {
      throw new BadRequestException('Недопустимая роль');
    }

    const exists = await this.usersRepo.findOneBy({ email: dto.email });
    if (exists)
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );

    const role = await this.rolesRepo.findOneBy({ name: dto.role });
    if (!role) throw new NotFoundException('Роль не найдена');

    const password_hash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      first_name: dto.first_name,
      last_name: dto.last_name,
      email: dto.email,
      phone: dto.phone,
      password_hash,
      is_active: true,
      roles: [role],
      created_by: { id: createdById },
    });

    return this.usersRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (dto.role !== undefined) {
      if (!ADMIN_ASSIGNABLE_ROLES.includes(dto.role)) {
        throw new BadRequestException('Недопустимая роль');
      }
      const role = await this.rolesRepo.findOneBy({ name: dto.role });
      if (!role) throw new NotFoundException('Роль не найдена');
      user.roles = [role];
    }

    if (dto.first_name !== undefined) user.first_name = dto.first_name;
    if (dto.last_name !== undefined) user.last_name = dto.last_name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.is_active !== undefined) user.is_active = dto.is_active;

    return this.usersRepo.save(user);
  }

  async assignComplex(
    userId: string,
    complexId: string | null,
  ): Promise<Complex> {
    if (complexId !== null) {
      const complex = await this.complexRepo.findOne({
        where: { id: complexId },
      });
      if (!complex) throw new NotFoundException('Комплекс не найден');

      const user = await this.usersRepo.findOneBy({ id: userId });
      if (!user) throw new NotFoundException('Пользователь не найден');

      complex.owner = user;
      return this.complexRepo.save(complex);
    }

    // снять назначение — найти комплекс у этого владельца
    const complex = await this.complexRepo.findOne({
      where: { owner: { id: userId } },
    });
    if (!complex) throw new NotFoundException('Комплекс не найден');
    complex.owner = null;
    return this.complexRepo.save(complex);
  }

  async getOwnerComplex(userId: string): Promise<Complex | null> {
    return this.complexRepo.findOne({
      where: { owner: { id: userId } },
    });
  }
}
