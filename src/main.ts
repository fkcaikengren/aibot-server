import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', //设置origin, 浏览器不会阻止跨域获取资源
    credentials: false, //设置true, 配合前端设置withCredentials=true，服务端host可以获取浏览器origin的cookie
  });
  await app.listen(3001);
}
bootstrap();
