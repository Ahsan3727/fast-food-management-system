import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');
import { AppModule } from './app.module';
import { isOriginAllowed, parseCorsOrigins } from './common/cors';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // Behind Render's proxy, req.ip is the proxy's address unless we trust its
  // X-Forwarded-For. Without this the per-IP auth limit would count every
  // customer as one client. Set TRUST_PROXY_HOPS to the real number of proxies.
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? (isProduction ? 1 : 0));
  if (Number.isInteger(proxyHops) && proxyHops > 0) app.set('trust proxy', proxyHops);

  // ── Security headers ──────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  // ── CORS ─────────────────────────────────────
  // Only origins listed in CORS_ORIGINS (plus the Capacitor app origins) are allowed.
  // Requests without an Origin header (mobile native, curl, server-to-server) pass.
  const cors = parseCorsOrigins(process.env.CORS_ORIGINS, isProduction);
  if (cors.wildcardIgnored) {
    console.warn('⚠️  CORS_ORIGINS contains "*", which is ignored in production. List exact origins instead.');
  }
  console.log(`CORS allowed origins: ${cors.allowAll ? '* (non-production)' : [...cors.origins].join(', ')}`);

  app.enableCors({
    origin: (origin, callback) => callback(null, isOriginAllowed(origin, cors)),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Authorization', 'idempotency-key', 'Idempotency-Key'],
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
