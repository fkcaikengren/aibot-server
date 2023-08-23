import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Plan } from '../plan/plan.entity';
import { Order } from './order.entity';
import { UserModule } from '../user/user.module';
import { PlanModule } from '../plan/plan.module';
import { BalanceModule } from '../balance/balance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, Plan]),
    UserModule,
    PlanModule,
    BalanceModule,
  ],
  exports: [OrderService],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
