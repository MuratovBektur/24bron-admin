import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

// Связь owner → owner_assistant
// owner назначает своих помощников, которые управляют бронированиями от его имени
@Entity('owner_staff')
export class OwnerStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.staffMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => User, (user) => user.ownerRelations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assistant_id' })
  assistant: User;

  @CreateDateColumn()
  created_at: Date;
}
