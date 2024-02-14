import OpenAI from 'openai';
import { User } from './../modules/user/user.entity';
import { Order } from 'src/modules/order/order.entity';
import { Plan } from 'src/modules/plan/plan.entity';

export type LLModelType =
  | 'gpt-3.5-turbo'
  | 'gpt-4-0125-preview'
  | 'moonshot-v1-8k';

export interface EmailRegisterUserDto {
  nickname: string;
  email: string;
  password: string;
  emailCode: string;
  inviteCode?: string;
}

export interface EmailLoginUserDto {
  email: string;
  password: string;
}

export interface ChatGPTDto {
  // modelId: string;
  model: LLModelType;
  messages: OpenAI.Chat.ChatCompletionMessage[];
  maxTokens: number;
  temperature: number;
}

export interface BalanceDto {
  userId: string;
  llmId: string;
  amount: number;
}

export interface PromptDto {
  id: string;
  title: string;
  content: string;
}

export type UserDto = User;

export type PlanDto = Omit<Plan, 'llm' | 'orders'>;

export type UserSecureDto = Omit<User, 'password' | 'salt'>;

export type AuthUserDto = Pick<
  User,
  'id' | 'nickname' | 'avatar' | 'email' | 'phone' | 'new'
>;

export interface SaveOrderDto {
  paymentType: number;
  status: number;
  userId: string;
  planId: string;
}

export type OrderDto = Order;
