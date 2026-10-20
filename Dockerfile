# Production Dockerfile for FastFood NestJS API
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install dumb-init to handle process signals cleanly
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Copy pre-compiled shared packages
COPY packages/ ./packages/

# Install ONLY production dependencies for the API (skips heavy devDependencies and compilers)
WORKDIR /app/apps/api
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci --omit=dev --no-audit

# Copy the pre-compiled NestJS JavaScript distribution
COPY apps/api/dist ./dist

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
