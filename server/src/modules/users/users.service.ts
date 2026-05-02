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
  RoleName,
} from '../../entities/user-role.entity';
import { Complex } from '../../entities/complex.entity';
import { OwnerStaff } from '../../entities/owner-staff.entity';
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
    @InjectRepository(OwnerStaff)
    private readonly ownerStaffRepo: Repository<OwnerStaff>,
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

    const account_with_same_email = await this.usersRepo.findOneBy({
      email: dto.email,
    });
    if (account_with_same_email)
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );
    const account_with_same_phone = await this.usersRepo.findOneBy({
      phone: dto.phone,
    });
    if (account_with_same_phone)
      throw new BadRequestException(
        'Пользователь с таким телефоном уже существует',
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
      must_change_password: true,
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

  async getAssistantComplex(assistantId: string): Promise<Complex | null> {
    const staff = await this.ownerStaffRepo.findOne({
      where: { assistant: { id: assistantId } },
      relations: ['owner'],
    });
    if (!staff) return null;
    return this.complexRepo.findOne({
      where: { owner: { id: staff.owner.id } },
    });
  }

  async getOwnerStaff(userId: string, roles: string[]): Promise<User[]> {
    let ownerId = userId;

    if (roles.includes('owner_assistant') && !roles.includes('owner')) {
      const link = await this.ownerStaffRepo.findOne({
        where: { assistant: { id: userId } },
        relations: ['owner'],
      });
      if (!link) return [];
      ownerId = link.owner.id;
    }

    const links = await this.ownerStaffRepo.find({
      where: { owner: { id: ownerId } },
      relations: ['assistant', 'assistant.roles'],
    });
    return links.map((l) => l.assistant);
  }

  async createOwnerStaff(dto: CreateUserDto, ownerId: string): Promise<User> {
    const ownerComplex = await this.complexRepo.findOne({
      where: { owner: { id: ownerId } },
    });
    if (!ownerComplex)
      throw new BadRequestException(
        'У вас нет назначенного комплекса. Обратитесь к администратору.',
      );

    const emailExists = await this.usersRepo.findOneBy({ email: dto.email });
    if (emailExists)
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );

    if (dto.phone) {
      const phoneExists = await this.usersRepo.findOneBy({ phone: dto.phone });
      if (phoneExists)
        throw new BadRequestException(
          'Пользователь с таким телефоном уже существует',
        );
    }

    const role = await this.rolesRepo.findOneBy({
      name: RoleName.OWNER_ASSISTANT,
    });
    if (!role) throw new NotFoundException('Роль не найдена');

    const password_hash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      first_name: dto.first_name,
      last_name: dto.last_name,
      email: dto.email,
      phone: dto.phone,
      password_hash,
      is_active: true,
      must_change_password: true,
      roles: [role],
      created_by: { id: ownerId },
    });
    const saved = await this.usersRepo.save(user);

    const staffLink = this.ownerStaffRepo.create({
      owner: { id: ownerId },
      assistant: { id: saved.id },
    });
    await this.ownerStaffRepo.save(staffLink);

    const foundUser = await this.usersRepo.findOne({
      where: { id: saved.id },
      relations: ['roles'],
    });

    if (!foundUser) throw new NotFoundException('Юзер не найден');

    return foundUser
  }

  async updateOwnerStaff(
    assistantId: string,
    dto: UpdateUserDto,
    ownerId: string,
  ): Promise<User> {
    const link = await this.ownerStaffRepo.findOne({
      where: { owner: { id: ownerId }, assistant: { id: assistantId } },
    });
    if (!link) throw new NotFoundException('Сотрудник не найден');

    const user = await this.usersRepo.findOne({
      where: { id: assistantId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (dto.first_name !== undefined) user.first_name = dto.first_name;
    if (dto.last_name !== undefined) user.last_name = dto.last_name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.is_active !== undefined) user.is_active = dto.is_active;

    return this.usersRepo.save(user);
  }

  async removeOwnerStaff(assistantId: string, ownerId: string): Promise<void> {
    const link = await this.ownerStaffRepo.findOne({
      where: { owner: { id: ownerId }, assistant: { id: assistantId } },
    });
    if (!link) throw new NotFoundException('Сотрудник не найден');
    await this.ownerStaffRepo.remove(link);
  }
}
