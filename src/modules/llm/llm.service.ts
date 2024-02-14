import {
  HttpException,
  HttpStatus,
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ChatGPTDto, LLModelType } from 'src/dto/entities.dto';
import { Observable, Subscriber } from 'rxjs';
import { LLM } from './llm.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { calcTokens } from 'src/utils/string.util';
import { BalanceService } from '../balance/balance.service';
import { ConfigService } from '@nestjs/config';

type SimpleMessageEvent = string | MessageEvent;

@Injectable()
export class LLMService {
  /*
 
  {
    ...(httpAgentHost
      ? { httpAgent: new HttpsProxyAgent(httpAgentHost) }
      : {}),
    ...(httpsAgentHost
      ? { httpsAgent: new HttpsProxyAgent(httpsAgentHost) }
      : {}),
    responseType: 'stream',
  },
*/
  httpAgentHost = this.configService.get('HTTP_PROXY_AGENT');
  private readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    httpAgent: new HttpsProxyAgent(this.httpAgentHost),
  });

  private readonly moonshotClient = new OpenAI({
    apiKey: process.env.MOONSHOT_API_KEY,
    baseURL: 'https://api.moonshot.cn/v1',
  });

  constructor(
    @InjectRepository(LLM)
    private readonly llmRepository: Repository<LLM>,
    private readonly balanceService: BalanceService,
    private readonly configService: ConfigService,
  ) {}

  private getClientByModel(model: LLModelType) {
    switch (model) {
      case 'gpt-3.5-turbo':
        return this.openai;
      case 'gpt-4-0125-preview':
        return this.openai;
      case 'moonshot-v1-8k':
        return this.moonshotClient;
    }
  }

  private async chatCompletionWithObervable(
    { model, messages, maxTokens, temperature }: ChatGPTDto,
    {
      subscriber,
      completeCb,
    }: {
      subscriber: Subscriber<SimpleMessageEvent>;
      completeCb?: (result: string) => void;
    },
  ) {
    let resContent = completeCb ? '' : null;
    try {
      const client = this.getClientByModel(model);
      const res = await client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      });
      for await (const chunk of res) {
        const content = chunk.choices[0]?.delta?.content || '';
        subscriber.next({ data: content });
        if (typeof resContent === 'string') {
          resContent += content;
        }
      }

      subscriber.complete();
      if (typeof completeCb === 'function') {
        completeCb(resContent);
      }
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
      console.log('error ocurrs in llm --------');
      subscriber.error(error);
    }
  }

  // 记录tokens的chat
  getChatGPTCompletion(
    params: ChatGPTDto,
    userId: string,
  ): Observable<SimpleMessageEvent> {
    const { model, messages, maxTokens, temperature } = params;
    const atLeast = 500;
    return new Observable((subscriber) => {
      /* ChatGPT3.5/Moonshot 免费 start */
      if (model === 'gpt-3.5-turbo') {
        this.chatCompletionWithObervable(
          {
            model,
            messages,
            maxTokens,
            temperature,
          },
          { subscriber },
        );
        return;
      } else if (model === 'moonshot-v1-8k') {
        this.chatCompletionWithObervable(
          {
            model,
            messages,
            maxTokens,
            temperature,
          },
          { subscriber },
        );
        return;
      }
      /* end */

      this.findBalance(userId, model)
        .then((llmWithBalance) => {
          if (!llmWithBalance || !llmWithBalance.balances[0]) {
            subscriber.error(
              new HttpException(
                '请求失败，模型错误 (Failed, something wrong with model)',
                HttpStatus.FORBIDDEN,
              ),
            );
            return;
          }
          const balance = llmWithBalance.balances[0];
          const modelId = llmWithBalance.id;
          // console.log(balance.total - balance.used);
          if (balance.total - balance.used < atLeast) {
            subscriber.error(
              new HttpException(
                `你的tokens少于${atLeast}个 (Your tokens is less than ${atLeast})`,
                HttpStatus.FORBIDDEN,
              ),
            );
            return;
          }
          const reqContent = messages.reduce(
            (acc, msg) => acc + msg.content,
            '',
          );
          this.chatCompletionWithObervable(
            {
              model,
              messages,
              maxTokens,
              temperature,
            },
            {
              subscriber,
              completeCb: (resContent) => {
                // 修改消耗的tokens
                const completeTokens =
                  calcTokens(resContent) + calcTokens(reqContent, 0.9);
                // console.log('completeTokens--------: ', completeTokens);
                // 更新数据库中的used
                this.balanceService.updateUsed(userId, modelId, completeTokens);
              },
            },
          );
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }

  // 应用接口（不记录tokens的chat）
  getAppChatGPTCompletion(
    messagesInChat: Pick<ChatGPTDto, 'messages'>,
  ): Observable<SimpleMessageEvent> {
    const { messages } = messagesInChat;
    return new Observable((subscriber) => {
      this.chatCompletionWithObervable(
        {
          model: 'gpt-3.5-turbo',
          messages,
          maxTokens: 2000,
          temperature: 0.6,
        },
        {
          subscriber,
        },
      );
    });
  }

  // 找到模型和对应用户的balance
  async findBalance(userId: string, llmName: string) {
    if (!userId || !llmName) return null;
    return this.llmRepository
      .createQueryBuilder('llm')
      .select(['llm.id', 'llm.name'])
      .leftJoinAndSelect('llm.balances', 'balance')
      .where('balance.userId = :userId and llm.name = :llmName', {
        userId,
        llmName,
      })
      .getOne();
  }

  async findAll() {
    const llms = await this.llmRepository.createQueryBuilder('llms').getMany();
    return llms;
  }
}
