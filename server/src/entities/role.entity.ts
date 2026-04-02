import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

export enum RoleName {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OWNER = 'owner',
  OWNER_ASSISTANT = 'owner_assistant',
  CLIENT = 'client',
}

// Роли, которые admin может назначать (не может создавать super_admin и admin)
export const ADMIN_ASSIGNABLE_ROLES: RoleName[] = [
  RoleName.OWNER,
  RoleName.OWNER_ASSISTANT,
  RoleName.CLIENT,
];

// Роли, которые owner может назначать своим помощникам
export const OWNER_ASSIGNABLE_ROLES: RoleName[] = [RoleName.OWNER_ASSISTANT];

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: RoleName, unique: true })
  name!: RoleName;

  @Column({ nullable: true })
  description!: string;

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];
}
