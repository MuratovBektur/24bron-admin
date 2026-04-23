import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import {
  COMPLEX_ACCESS_KEY,
  ComplexAccessType,
} from './complex-access.decorator';

interface AuthRequest extends Request {
  user?: { userId: string; roles: string[] };
}

@Injectable()
export class ComplexAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const type = this.reflector.getAllAndOverride<ComplexAccessType>(
      COMPLEX_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!type) return true;

    const req = context.switchToHttp().getRequest<AuthRequest>();
    const user = req.user;
    if (!user) return false;

    const roles = user.roles ?? [];

    if (roles.includes('super_admin') || roles.includes('admin')) return true;

    const userId = user.userId;
    const params = req.params as Record<string, string>;

    let complexId: string | null = null;

    if (type === 'complex') {
      complexId = params['complexId'] ?? null;
    } else {
      const pitchId = params['pitchId'] ?? params['id'];
      if (!pitchId) return false;
      const rows = await this.ds.query<{ complex_id: string }[]>(
        `SELECT complex_id FROM pitches WHERE id = $1 LIMIT 1`,
        [pitchId],
      );
      complexId = rows[0]?.complex_id ?? null;
    }

    if (!complexId) return false;

    if (roles.includes('owner')) {
      const rows = await this.ds.query<{ id: string }[]>(
        `SELECT id FROM complexes WHERE id = $1 AND owner_id = $2 LIMIT 1`,
        [complexId, userId],
      );
      if (rows.length > 0) return true;
    }

    if (roles.includes('owner_assistant')) {
      const rows = await this.ds.query<{ id: string }[]>(
        `SELECT c.id FROM complexes c
         JOIN owner_staff os ON os.owner_id = c.owner_id
         WHERE c.id = $1 AND os.assistant_id = $2 LIMIT 1`,
        [complexId, userId],
      );
      if (rows.length > 0) return true;
    }

    throw new ForbiddenException('Нет доступа к этому комплексу');
  }
}
