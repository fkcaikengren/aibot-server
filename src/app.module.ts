import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store'; //依赖redis
import type { RedisClientOptions } from 'redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './modules/user/user.entity';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { LLMModule } from './modules/llm/llm.module';
import { JwtModule } from '@nestjs/jwt';
import { AllExceptionsFilter } from './filters/all-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { BalanceModule } from './modules/balance/balance.module';
import { LLM } from './modules/llm/llm.entity';
import { Balance } from './modules/balance/balance.entity';
import { PlanModule } from './modules/plan/plan.module';
import { Plan } from './modules/plan/plan.entity';
import { PromptModule } from './modules/prompt/prompt.module';
import { Prompt } from './modules/prompt/prompt.entity';
import { Order } from './modules/order/order.entity';
import { OrderModule } from './modules/order/order.module';
import { RolesGuard } from './modules/auth/roles.guard';

function getEnvFilePath() {
  const mode = process.env.NODE_ENV || 'prod';
  const envFilePath =
    mode === 'prod'
      ? ['.env.production.local', '.env.production', '.env']
      : ['.env.development.local', '.env.development', '.env'];

  return envFilePath;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: getEnvFilePath() }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return {
          type: 'mysql',
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          database: config.get('DB_DATABASE'),
          username: config.get('DB_USERNAME'),
          password: config.get('DB_PASSWORD'),
          logging: config.get('DB_LOGGING'),
          synchronize: config.get('DB_SYNCHRONIZE'),
          timezone: '+08:00',
          entities: [User, LLM, Balance, Plan, Order, Prompt], //表
        };
      },
      inject: [ConfigService],
    }),

    //注册Cache Module, 定义module的provider
    CacheModule.register<RedisClientOptions>({
      isGlobal: true,
      // https://github.com/dabroek/node-cache-manager-redis-store/issues/40
      // @ts-ignore
      store: async () =>
        await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'aibot-network',
            port: parseInt(process.env.REDIS_PORT) || 6379,
          },
          password: process.env.REDIS_PASSWORD,
        }),
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET, //安装 @nestjs/config 环境变量
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),

    AuthModule,
    UserModule,
    LLMModule,
    BalanceModule,
    PlanModule,
    OrderModule,
    PromptModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
