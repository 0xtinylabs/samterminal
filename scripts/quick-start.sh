#!/bin/bash
# ============================================================
# SamTerminal Quick Start Script
# ============================================================
# Start SamTerminal with a single command
#
# Usage: ./scripts/quick-start.sh
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║               SamTerminal Quick Start                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker.${NC}"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker checked"

# Check .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠${NC}  .env file not found, creating from .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}⚠${NC}  Please update .env file with your API keys!"
    else
        echo -e "${RED}❌ .env.example file not found${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} Environment file checked"

# Select mode
echo ""
echo -e "${BLUE}Select setup mode:${NC}"
echo "  1) Production (Docker) - All services in containers"
echo "  2) Development - Only DB in container, services on host"
echo ""
read -p "Your choice [1/2]: " mode

case $mode in
    1)
        echo ""
        echo -e "${BLUE}🚀 Starting production mode...${NC}"
        echo ""

        # Build and start
        docker compose build
        docker compose up -d

        echo ""
        echo -e "${GREEN}✅ SamTerminal started successfully!${NC}"
        echo ""
        echo -e "${BLUE}Service Ports:${NC}"
        echo "  Main:         http://localhost:50060"
        echo "  Swap:         http://localhost:50059"
        echo "  Notification: http://localhost:50056"
        echo "  Transactions: http://localhost:50054"
        echo "  TokenData:    http://localhost:50061 (gRPC)"
        echo "  WalletData:   http://localhost:50062 (gRPC)"
        echo ""
        echo -e "${BLUE}To view logs:${NC} docker compose logs -f"
        echo -e "${BLUE}To stop:${NC} docker compose down"
        ;;
    2)
        echo ""
        echo -e "${BLUE}🚀 Starting development mode...${NC}"
        echo ""

        # Start database
        docker compose -f docker-compose.dev.yml up -d

        echo -e "${GREEN}✓${NC} Database started"
        echo ""

        # Detect package manager (prefer pnpm if available)
        if command -v pnpm &> /dev/null; then
            PKG_MANAGER="pnpm"
            PKG_RUN="pnpm"
        else
            PKG_MANAGER="npm"
            PKG_RUN="npm run"
            echo -e "${YELLOW}⚠${NC}  pnpm not found, using npm instead"
        fi

        # Install dependencies
        echo -e "${BLUE}📦 Installing dependencies with ${PKG_MANAGER}...${NC}"
        $PKG_MANAGER install

        # Build
        echo -e "${BLUE}🔨 Building...${NC}"
        $PKG_RUN proto:gen || true
        $PKG_RUN build

        echo ""
        echo -e "${GREEN}✅ Setup complete!${NC}"
        echo ""
        echo -e "${BLUE}Adminer (DB GUI):${NC} http://localhost:8080"
        echo "  Server: postgres"
        echo "  User: postgres"
        echo "  Password: postgres"
        echo ""
        echo -e "${BLUE}To start services:${NC} $PKG_RUN dev"
        ;;
    *)
        echo -e "${RED}Invalid selection${NC}"
        exit 1
        ;;
esac
