import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { corsOrigins } from './common/cors.js';
import { PrismaExceptionFilter } from './common/prisma-exception.filter.js';
import { RedisIoAdapter } from './redis/redis-io.adapter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(
    new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter),
  );
  app.enableCors({ origin: corsOrigins() });

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
