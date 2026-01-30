import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import helmet from 'helmet';
import { appConfig, AppConfigType } from '@verified-prof/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  const config = app.get<AppConfigType>(appConfig.KEY);
  app.use(helmet());
  app.enableCors({
    origin: config.app.origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      validateCustomDecorators: true,
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(config.worker.port, '0.0.0.0');

  Logger.log(`🚀 Analyzer is running on: ${config.worker.url}`);
  Logger.log(`📊 Health check: ${config.worker.url}/health`);
}

bootstrap();
