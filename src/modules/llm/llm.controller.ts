import { Body, Controller, Get, Post, Request, Sse } from '@nestjs/common';
import { LLMService } from './llm.service';
import { ChatGPTDto } from 'src/dto/entities.dto';

@Controller('llms')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  @Get()
  listModels() {
    return this.llmService.findAll();
  }

  @Post('chat')
  @Sse()
  complete(@Body() chat: ChatGPTDto, @Request() req: any) {
    const { id } = req.user;
    return this.llmService.getChatGPTCompletion(chat, id);
  }
}
