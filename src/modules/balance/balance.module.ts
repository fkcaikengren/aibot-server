import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Balance } from './balance.entity';
import { LLM } from '../llm/llm.entity';
import { User } from '../user/user.entity';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Balance, User, LLM])],
  exports: [BalanceService],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
