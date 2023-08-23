import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Plan } from '../plan/plan.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'varchar',
    length: 100,
  })
  code: string; //订单号

  @Column('simple-enum', { enum: [1, 2, 3, 4, 5], default: 3 })
  paymentType: number; //  '支付方式：1微信、2支付宝、3线下（转账）、4借记卡、5信用卡',

  @Column('simple-enum', { enum: [1, 2], default: 1 })
  status: number; // '状态：1未付款、2已付款、3退款中、4已退款',

  @Column({
    type: 'float',
    default: 0.0,
  })
  amount: number; //总金额

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'varchar',
    length: 36,
  })
  userId: string;

  @ManyToOne(() => Plan, (plan) => plan.orders)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({
    type: 'varchar',
    length: 36,
  })
  planId: string;
}
