import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prompt } from './prompt.entity';
import { PromptService } from './prompt.service';
import { PromptController } from './prompt.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Prompt])],
  exports: [PromptService],
  controllers: [PromptController],
  providers: [PromptService],
})
export class PromptModule {}
