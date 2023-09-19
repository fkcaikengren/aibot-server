import { Body, Controller, Get, Post, Request, Sse } from '@nestjs/common';
import { LLMService } from './llm.service';
import { ChatGPTDto } from 'src/dto/entities.dto';
import { NotCheckToken } from 'src/decorators/not-check-token.decorator';

@Controller('llms')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  @Get()
  listModels() {
    return this.llmService.findAll();
  }

  @Post('chat')
  @Sse()
  complete(@Body() chatParams: ChatGPTDto, @Request() req: any) {
    const { id } = req.user;
    return this.llmService.getChatGPTCompletion(chatParams, id);
  }

  @NotCheckToken()
  @Post('app_language_chat')
  @Sse()
  languageChat(@Body() messagesInChat: Pick<ChatGPTDto, 'messages'>) {
    return this.llmService.getAppChatGPTCompletion(messagesInChat);
  }
}
