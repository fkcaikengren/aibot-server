import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { LLM } from '../llm/llm.entity';
import { Order } from '../order/order.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'varchar',
    length: 30,
  })
  name: string; //套餐名

  @Column({
    type: 'integer',
    default: 0,
  })
  tokens: number; //token数

  @Column({
    type: 'float',
    default: 0.0,
  })
  originalPrice: number; //原价

  @Column({
    type: 'float',
    default: 0.0,
  })
  price: number; //售价

  @Column({
    type: 'integer',
    default: -1,
  })
  period: number; //有效日期（时间戳）

  @Column({
    type: 'boolean',
    default: 0,
  })
  outdated: boolean; //是否废弃

  @Column({
    type: 'boolean',
    default: 0,
  })
  onlyNew: boolean; //仅限新用户

  @ManyToOne(() => LLM)
  @JoinColumn({ name: 'llmId' }) //@JoinColumn() 会在这个entity的table中加入llmId作为外键
  llm: LLM;

  @Column({
    type: 'varchar',
    length: 36,
  })
  llmId: string;

  @OneToMany(() => Order, (order) => order.plan)
  orders: Order[];
}
