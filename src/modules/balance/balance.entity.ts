import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { LLM } from '../llm/llm.entity';

@Entity('balances')
export class Balance {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  llmId: string;

  @ManyToOne(() => User, (user) => user.balances)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => LLM, (llm) => llm.balances)
  @JoinColumn({ name: 'llmId' })
  llm: LLM;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'integer',
    default: 0,
  })
  total: number; //对于chatgpt的tokens, 上次充值的

  @Column({
    type: 'integer',
    default: 0,
  })
  used: number; //对于chatgpt的tokens，上次充值中已用的
}
