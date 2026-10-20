"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    // ── Security headers ──────────────────────────
    app.use((0, helmet_1.default)());
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
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    // ── API versioning prefix ─────────────────────
    app.setGlobalPrefix('v1');
    const port = process.env.PORT ?? 5000;
    await app.listen(port);
    console.log(`🚀 FastFood API running on http://localhost:${port}/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map