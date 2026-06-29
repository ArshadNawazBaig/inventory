import './load-env'; // MUST be first — populates process.env before the module graph (driver switch) imports
import 'reflect-metadata';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { APP } from '@stockflow/config';
import { AppLogger, RequestContextMiddleware, rootLogger } from './common';
import { AppConfigService } from './config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new AppLogger('Nest'));

  const config = app.get(AppConfigService);

  // Correlation id + per-request child logger — registered before guards/interceptors.
  const requestContext = new RequestContextMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) =>
    requestContext.use(req, res, next),
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI }); // /api/v1/... ; unversioned routes stay neutral
  app.enableShutdownHooks();

  const { corsOrigins } = config;
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins, credentials: true });
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('StockFlow API')
    .setDescription('Inventory Management SaaS — REST API')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.apiPort);
  rootLogger.info(
    { port: config.apiPort, env: config.nodeEnv },
    `${APP.name} API ready on http://localhost:${config.apiPort}/api (docs: /api/docs)`,
  );
}

void bootstrap();
