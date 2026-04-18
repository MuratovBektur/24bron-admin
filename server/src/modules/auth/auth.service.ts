import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../entities/user-role.entity';

export type ValidatedUser = Omit<User, 'password_hash'>;

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<ValidatedUser | null> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  private generateTokens(payload: JwtPayload) {
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '1d',
    });
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
    return { access_token, refresh_token };
  }

  login(user: ValidatedUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r: UserRole) => r.name),
    };
    return {
      ...this.generateTokens(payload),
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        roles: user.roles,
        must_change_password: user.must_change_password,
      },
    };
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException();
    if (newPassword.length < 6)
      throw new BadRequestException(
        'Пароль должен содержать минимум 6 символов',
      );
    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.must_change_password = false;
    await this.usersRepository.save(user);
  }

  async getMe(userId: string): Promise<ValidatedUser> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) throw new UnauthorizedException('User not found');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...result } = user;
    return result;
  }

  refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      return this.generateTokens({
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
