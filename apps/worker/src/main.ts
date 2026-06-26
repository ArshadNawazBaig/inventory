import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { APP } from '@stockflow/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Worker');
  logger.log(`${APP.name} worker started — awaiting jobs`);
  // Queue consumers (added in later phases) keep the process alive via BullMQ.
}

void bootstrap();
