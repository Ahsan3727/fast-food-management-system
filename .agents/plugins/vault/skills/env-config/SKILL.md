---
name: env-config
description: >-
  Use this skill when the user asks to set up, audit, or fix environment
  variables and configuration management in the fast-food management system.
  Covers .env files, Vite env vars, NestJS config validation, and secret
  handling across the monorepo.
---

# Environment Config Skill

This skill guides you through managing environment variables and configuration safely in the fast-food management system monorepo.

## Environment Variable Map

### `apps/api/.env`

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `PORT` | API server port |
| `MONGO_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `7d`) |
| `FIREBASE_PROJECT_ID` | Firebase Admin SDK config |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK config |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK config |
| `CORS_ORIGINS` | Comma-separated allowed origins |

### `apps/customer/.env` / `apps/rider/.env`

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | REST API base URL (e.g. `https://api.example.com/v1`) |
| `VITE_SOCKET_URL` | Socket.IO server URL |
| `VITE_MAPS_KEY` | Optional tile provider API key |

## Steps

### 1. Audit Existing Config

- Check each app for hardcoded URLs or secrets (see C4, R5).
- Confirm `VITE_API_URL` is used everywhere — not a hardcoded Render URL.
- Confirm `.env` files are in `.gitignore` and only `.env.example` is committed.

### 2. Add NestJS Config Validation (Fail Fast)

In `apps/api/src/config/`, use `@nestjs/config` with a Joi or Zod schema to validate all required vars on startup:

```ts
ConfigModule.forRoot({
  validationSchema: Joi.object({
    MONGO_URI: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    // ...
  }),
  validationOptions: { abortEarly: true },
});
```

### 3. Add a New Variable

1. Add to `.env.example` with a description comment.
2. Add validation in the NestJS config schema.
3. Add to GitHub Actions secrets for CI/CD.
4. Document in `docs/architecture.md`.

### 4. Verify

- Start the API without the variable set — confirm it fails fast with a clear error.
- Confirm `VITE_API_URL` resolves correctly in the built APK (check network tab on device).

## Security Rules

- Never commit real secrets — only `.env.example` with placeholder values.
- Never log env values at startup.
- `FIREBASE_PRIVATE_KEY` contains newlines — store as a single escaped string and parse with `.replace(/\\n/g, '\n')`.
