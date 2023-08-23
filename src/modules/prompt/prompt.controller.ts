import { Controller, Get, Param } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { prompts } from './prompts';

@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Get('/:type')
  async listPrompts(@Param('type') type: string) {
    return prompts[type] || [];
  }

  // @Post()
  // async createMany(@Body() prompts: PromptDto[]) {
  //   await this.promptService.createMany(prompts);
  //   return { success: true };
  // }
}
