import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { ValidationPipe } from './common/pipes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Apply global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Apply global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`✅ StreamTogether API is running on http://localhost:${port}`);
  logger.log(`📊 Health check available at http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
