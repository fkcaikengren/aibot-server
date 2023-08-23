import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { encryptPassword, makeSalt } from 'src/utils/crypto.util';
import { Balance } from '../balance/balance.entity';
import { Order } from '../order/order.entity';

@Entity('users')
export class User {
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
  nickname: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  avatar: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  email: string;

  @Column({ type: 'char', length: 11, default: '' })
  phone: string;

  // 加密后的密码
  @Column({ type: 'varchar', length: 100, select: false })
  password: string;

  // 加密盐
  @Column({ type: 'varchar', length: 30, select: false })
  salt: string;

  // 新用户
  @Column({ type: 'boolean', default: 1 })
  new: boolean;

  @Column('simple-enum', { enum: ['admin', 'visitor'], default: 'visitor' })
  role: string;

  // 封锁账号
  @Column('simple-enum', { enum: ['active', 'locked'], default: 'active' })
  status: string;

  @OneToMany(() => Balance, (balance) => balance.user)
  balances: Balance[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @BeforeInsert()
  encrypt() {
    const salt = makeSalt(); // 制作密码盐
    this.salt = salt;
    this.password = encryptPassword(this.password, salt); // 加密密码
  }
}
