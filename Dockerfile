# Multi-stage Dockerfile optimized specifically for FastFood NestJS API
FROM node:20-slim AS builder

WORKDIR /app

# Build tools for native packages (e.g. argon2)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy root TypeScript config
COPY tsconfig.base.json ./

# Copy and build shared packages first
COPY packages/ ./packages/

WORKDIR /app/packages/shared-types
RUN npm install && npm run build

WORKDIR /app/packages/utils
RUN npm install && npm run build

# Install API dependencies using exact package-lock.json
WORKDIR /app/apps/api
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci

# Copy API source code and build NestJS
COPY apps/api/ ./
RUN npm run build

# ── Production Runtime Stage ─────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install lightweight init system to handle signals and zombies
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Copy compiled shared packages and API artifacts
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
