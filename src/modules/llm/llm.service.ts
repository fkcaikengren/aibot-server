import {
  HttpException,
  HttpStatus,
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ChatGPTDto } from 'src/dto/entities.dto';
import { Observable } from 'rxjs';
import { LLM } from './llm.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { calcTokens } from 'src/utils/string.util';
import { BalanceService } from '../balance/balance.service';
import { ConfigService } from '@nestjs/config';

type SimpleMessageEvent = string | MessageEvent;

@Injectable()
export class LLMService {
  private readonly configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  private readonly openai = new OpenAIApi(this.configuration);

  constructor(
    @InjectRepository(LLM)
    private readonly llmRepository: Repository<LLM>,
    private readonly balanceService: BalanceService,
    private readonly configService: ConfigService,
  ) {}

  getChatGPTCompletion(
    params: ChatGPTDto,
    userId: string,
  ): Observable<SimpleMessageEvent> {
    const { model, messages, maxTokens, temperature } = params;
    const atLeast = 500;
    return new Observable((subscriber) => {
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
          const httpAgentHost = this.configService.get('HTTP_PROXY_AGENT');
          const httpsAgentHost = this.configService.get('HTTPS_PROXY_AGENT');
          this.openai
            .createChatCompletion(
              {
                model,
                messages,
                max_tokens: maxTokens,
                temperature,
                stream: true,
              },
              {
                ...(httpAgentHost
                  ? { httpAgent: new HttpsProxyAgent(httpAgentHost) }
                  : {}),
                ...(httpsAgentHost
                  ? { httpsAgent: new HttpsProxyAgent(httpsAgentHost) }
                  : {}),
                responseType: 'stream',
              },
            )
            .then((res) => {
              let resContent = '';
              // @ts-ignore
              res.data.on('data', (data) => {
                // data是二进制数据
                // console.log(data.toString());
                const lines = data
                  .toString()
                  .split('\n')
                  .filter((line) => line.trim() !== '');
                for (const line of lines) {
                  const message = line.replace(/^data: /, '');

                  if (message === '[DONE]') {
                    // 流结束
                    subscriber.complete();
                    // 修改消耗的tokens
                    const completeTokens =
                      calcTokens(resContent) + calcTokens(reqContent, 0.9);
                    // console.log('completeTokens--------: ', completeTokens);
                    // 更新数据库中的used
                    this.balanceService.updateUsed(
                      userId,
                      modelId,
                      completeTokens,
                    );
                    return;
                  }
                  try {
                    const parsed = JSON.parse(message);
                    const content = parsed.choices[0].delta.content;
                    resContent += content;
                    subscriber.next({ data: content });
                  } catch (err) {
                    console.log(err);
                  }
                }
              });
            })
            .catch((error) => {
              if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
              } else {
                console.log(error.message);
              }
              console.log('error ocurrs in llm --------');
              subscriber.error(error);
            });
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }

  // 找到模型和对应用户的balance
  async findBalance(userId: string, llmName: string) {
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
