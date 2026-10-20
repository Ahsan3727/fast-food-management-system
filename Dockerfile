# Multi-stage Dockerfile for NestJS API in pnpm monorepo
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools for native packages like argon2
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9.12.3

# Configure network resilience for cloud build environments (prevents ECONNRESET)
RUN pnpm config set network-concurrency 4 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

# Copy workspace configurations AND the pre-generated lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Fast, deterministic install from the locked dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages and NestJS API
RUN pnpm --filter @fastfood/shared-types build && \
    pnpm --filter @fastfood/utils build && \
    pnpm --filter @fastfood/api build

# ── Runner Stage ─────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Copy built node_modules, packages and api directly from builder (ZERO network downloads in runner!)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
