# ============================================================
# SamTerminal - Makefile
# ============================================================
# Single command setup and management
# ============================================================

.PHONY: help install dev dev-db dev-services build start stop restart logs clean test proto db-migrate db-reset db-fresh

# Default target
help:
	@echo "SamTerminal - Available Commands"
	@echo "============================"
	@echo ""
	@echo "Setup:"
	@echo "  make install       - Install all dependencies"
	@echo "  make setup         - Full setup (install + proto + build + db)"
	@echo ""
	@echo "Development:"
	@echo "  make dev           - Start in development mode (DB + services)"
	@echo "  make dev-db        - Start database only"
	@echo "  make dev-services  - Start services only (on host)"
	@echo ""
	@echo "Docker (Production):"
	@echo "  make build         - Build Docker images"
	@echo "  make start         - Start all containers"
	@echo "  make stop          - Stop all containers"
	@echo "  make restart       - Restart containers"
	@echo "  make logs          - Show container logs"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate    - Run Prisma migrations for all services"
	@echo "  make db-fresh      - Reset all databases and run migrations from scratch"
	@echo "  make db-reset      - Reset databases (CAUTION!)"
	@echo ""
	@echo "Other:"
	@echo "  make proto         - Generate proto files"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean build artifacts"

# ============================================================
# Setup
# ============================================================

install:
	@echo "📦 Installing dependencies..."
	pnpm install

setup: install proto build dev-db db-migrate
	@echo "✅ Setup complete!"
	@echo ""
	@echo "To start: make dev"

# ============================================================
# Development
# ============================================================

dev-db:
	@echo "🐘 Starting database..."
	docker compose -f docker-compose.dev.yml up -d
	@echo "⏳ Waiting for PostgreSQL to be ready..."
	@sleep 5
	@echo "✅ Database ready!"
	@echo ""
	@echo "Adminer: http://localhost:8080"
	@echo "  Server: postgres"
	@echo "  User: postgres"
	@echo "  Password: postgres"

dev-services:
	@echo "🚀 Starting services..."
	pnpm dev

dev: dev-db
	@echo ""
	@echo "🚀 Starting services..."
	@sleep 2
	pnpm dev

# ============================================================
# Docker Production
# ============================================================

build:
	@echo "🔨 Building Docker images..."
	docker compose build

start:
	@echo "🚀 Starting containers..."
	docker compose up -d
	@echo ""
	@echo "✅ SamTerminal started!"
	@echo ""
	@echo "Service Ports:"
	@echo "  Main:         http://localhost:50060"
	@echo "  Swap:         http://localhost:50059"
	@echo "  Notification: http://localhost:50056"
	@echo "  Transactions: http://localhost:50054"
	@echo "  TokenData:    http://localhost:50061 (gRPC), http://localhost:8081 (HTTP)"
	@echo "  WalletData:   http://localhost:50062 (gRPC), http://localhost:8082 (HTTP)"

stop:
	@echo "🛑 Stopping containers..."
	docker compose down

restart: stop start

logs:
	docker compose logs -f

logs-main:
	docker compose logs -f main

logs-swap:
	docker compose logs -f swap

# ============================================================
# Database
# ============================================================

db-migrate:
	@echo "🔄 Running migrations..."
	cd services/nestjs/swap && npx prisma migrate deploy || true
	cd services/nestjs/notification && npx prisma migrate deploy || true
	cd services/nestjs/transactions && npx prisma migrate deploy || true
	cd services/go/tokendata && go run github.com/steebchen/prisma-client-go migrate deploy || true
	cd services/go/walletdata && go run github.com/steebchen/prisma-client-go migrate deploy || true
	@echo "✅ Migrations complete!"

db-fresh:
	@echo "🔄 Resetting all databases..."
	docker compose -f docker-compose.dev.yml down -v
	docker compose -f docker-compose.dev.yml up -d
	@echo "⏳ Waiting for PostgreSQL..."
	@sleep 5
	@echo "🚀 Running NestJS migrations..."
	cd services/nestjs/swap && npx prisma migrate deploy || echo "⚠️  Swap migration failed"
	cd services/nestjs/notification && npx prisma migrate deploy || echo "⚠️  Notification migration failed"
	cd services/nestjs/transactions && npx prisma migrate deploy || echo "⚠️  Transactions migration failed"
	@echo "🚀 Running Go migrations..."
	cd services/go/tokendata && go run github.com/steebchen/prisma-client-go migrate deploy || echo "⚠️  TokenData migration failed"
	cd services/go/walletdata && go run github.com/steebchen/prisma-client-go migrate deploy || echo "⚠️  WalletData migration failed"
	@echo ""
	@echo "✅ All databases fresh and migrated!"

db-reset:
	@echo "⚠️  Resetting databases..."
	docker compose -f docker-compose.dev.yml down -v
	docker compose -f docker-compose.dev.yml up -d
	@sleep 5
	$(MAKE) db-migrate
	@echo "✅ Databases reset!"

# ============================================================
# Proto & Build
# ============================================================

proto:
	@echo "📝 Generating proto files..."
	pnpm proto:gen

# ============================================================
# Test
# ============================================================

test:
	@echo "🧪 Running tests..."
	pnpm test

test-cov:
	@echo "🧪 Running tests (coverage)..."
	pnpm test:cov

# ============================================================
# Cleanup
# ============================================================

clean:
	@echo "🧹 Cleaning up..."
	pnpm clean
	docker compose down -v --remove-orphans 2>/dev/null || true
	docker compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
	@echo "✅ Cleanup complete!"

# ============================================================
# Utilities
# ============================================================

status:
	@echo "📊 Container status:"
	docker compose ps

shell-postgres:
	docker compose exec postgres psql -U postgres

shell-redis:
	docker compose exec redis redis-cli
