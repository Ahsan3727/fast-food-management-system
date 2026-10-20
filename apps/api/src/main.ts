import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ── Security headers ──────────────────────────
  app.use(helmet());
  app.use(compression());

  // ── CORS ─────────────────────────────────────
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  // ── Global validation pipe ────────────────────
  // whitelist: strips unknown fields (prevents role/price injection)
  // forbidNonWhitelisted: throws on unknown fields
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── API versioning prefix ─────────────────────
  app.setGlobalPrefix('v1');

  const port = process.env.PORT ?? 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 FastFood API running on http://0.0.0.0:${port}/v1`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start FastFood API:', err);
  process.exit(1);
});
