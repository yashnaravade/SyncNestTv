import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { ValidationPipe } from './common/pipes';
import { RedisIoAdapter } from './sync/redis-io.adapter';
import { SocketAuthService } from './sync/socket-auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Apply global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Apply global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  const socketAuthService = app.get(SocketAuthService);
  app.useWebSocketAdapter(new RedisIoAdapter(app, socketAuthService));

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`✅ SyncNest TV API is running on http://localhost:${port}`);
  logger.log(`📊 Health check available at http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
