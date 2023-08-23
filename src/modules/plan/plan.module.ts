import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './plan.entity';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { LLM } from '../llm/llm.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, LLM]), UserModule],
  exports: [PlanService],
  controllers: [PlanController],
  providers: [PlanService],
})
export class PlanModule {}
