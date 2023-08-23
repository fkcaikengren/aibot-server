import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { LLMController } from './llm.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LLM } from './llm.entity';
import { Balance } from '../balance/balance.entity';
import { BalanceModule } from '../balance/balance.module';

@Module({
  imports: [TypeOrmModule.forFeature([LLM, Balance]), BalanceModule],
  exports: [LLMService],
  controllers: [LLMController],
  providers: [LLMService],
})
export class LLMModule {}
