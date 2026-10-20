# Multi-stage Dockerfile for NestJS API in pnpm monorepo
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools for native packages like argon2
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@9.12.3

# Copy root workspace configurations
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies across packages and api
RUN pnpm install --frozen-lockfile=false

# Build shared packages and NestJS API
RUN pnpm --filter @fastfood/shared-types build && \
    pnpm --filter @fastfood/utils build && \
    pnpm --filter @fastfood/api build

# ── Runner Stage ─────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install build tools if needed for runtime bindings
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9.12.3

# Copy workspace configs and package files
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/package.json

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile=false

# Copy compiled code from builder
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
