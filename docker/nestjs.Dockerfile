# ============================================================
# SamTerminal NestJS Service Dockerfile
# ============================================================
# Multi-stage build for optimized production image
# ============================================================

# Stage 1: Build
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install build dependencies (protobuf-dev includes well-known types like struct.proto)
RUN apk add --no-cache python3 make g++ protobuf protobuf-dev

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy all packages (needed for workspace resolution)
COPY packages/ ./packages/

# Copy proto files
COPY proto/ ./proto/

# Copy services
COPY services/ ./services/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build argument for service name
ARG SERVICE_NAME

# Build shared dependencies first
RUN pnpm --filter @samterminal/shared-deps build

# Generate prisma client if prisma schema exists
# Provide dummy DATABASE_URL since prisma generate only needs the schema, not a real connection
RUN if [ -f "services/nestjs/${SERVICE_NAME}/prisma/schema.prisma" ]; then \
      cd services/nestjs/${SERVICE_NAME} && \
      USER_DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate; \
    fi

# Generate proto files and build the target service
RUN pnpm --filter @samterminal/${SERVICE_NAME} proto:gen || true
RUN pnpm --filter @samterminal/${SERVICE_NAME} build

# Ensure prisma directory exists (even if empty) for consistent COPY
RUN mkdir -p services/nestjs/${SERVICE_NAME}/prisma

# Stage 2: Production
FROM node:22-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Build argument for service name
ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

# Copy built files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/nestjs/${SERVICE_NAME}/dist ./services/nestjs/${SERVICE_NAME}/dist
COPY --from=builder /app/services/nestjs/${SERVICE_NAME}/package.json ./services/nestjs/${SERVICE_NAME}/
COPY --from=builder /app/services/nestjs/${SERVICE_NAME}/node_modules ./services/nestjs/${SERVICE_NAME}/node_modules

# Copy proto files to root and to dist/proto/ (services reference proto from dist/ in Docker mode)
COPY --from=builder /app/proto ./proto/
COPY --from=builder /app/proto ./services/nestjs/${SERVICE_NAME}/dist/proto/

# Copy prisma schema and migrations (may be empty for services without prisma)
COPY --from=builder /app/services/nestjs/${SERVICE_NAME}/prisma ./services/nestjs/${SERVICE_NAME}/prisma/

# Copy entrypoint script
COPY docker/nestjs-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/services/nestjs/${SERVICE_NAME}

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main"]
