# ============================================================
# SamTerminal Go Service Dockerfile
# ============================================================
# Multi-stage build for optimized production image
# ============================================================

# Stage 1: Build
FROM golang:1.24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make protobuf protobuf-dev

WORKDIR /app

# Build argument for service name
ARG SERVICE_NAME

# Copy go workspace files and all service modules
# go.work references all modules, so we need them all for dependency resolution
COPY services/go/ ./services/go/

WORKDIR /app/services/go/${SERVICE_NAME}

# Download dependencies
RUN go mod download

# Generate prisma client if schema exists
RUN if [ -f "prisma/schema.prisma" ]; then \
      go run github.com/steebchen/prisma-client-go generate; \
    fi

# Build the Prisma CLI binary for migrate deploy in production
# Creates placeholders if no prisma schema exists
RUN if [ -f "prisma/schema.prisma" ]; then \
      go build -o /app/prisma-cli github.com/steebchen/prisma-client-go; \
    else \
      touch /app/prisma-cli; \
      mkdir -p prisma; \
    fi

# Build service binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/service .

# Stage 2: Production
FROM alpine:3.19 AS production

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Build argument for service name
ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

# Copy binary from builder
COPY --from=builder /app/service ./service

# Copy Prisma CLI binary (may be placeholder for services without prisma)
COPY --from=builder /app/prisma-cli ./prisma-cli
RUN chmod +x ./prisma-cli 2>/dev/null || true

# Copy prisma schema and migrations
COPY --from=builder /app/services/go/${SERVICE_NAME}/prisma ./prisma/

# Copy entrypoint script
COPY docker/go-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Run as non-root user
RUN addgroup -g 1001 -S gouser && \
    adduser -S gouser -u 1001 -G gouser && \
    chown -R gouser:gouser /app

USER gouser

ENTRYPOINT ["/entrypoint.sh"]
CMD ["./service"]
