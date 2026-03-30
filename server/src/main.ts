import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const globalPrefix = 'api';
  const PORT = 5000;

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(globalPrefix);

  await app.listen(PORT);
}
void bootstrap();
