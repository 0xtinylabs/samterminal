#!/bin/sh
# ============================================================
# SamTerminal NestJS Service Entrypoint
# ============================================================

set -e

echo "Starting SamTerminal NestJS Service: ${SERVICE_NAME}"

# Run Prisma migrations if prisma schema exists
if [ -f "prisma/schema.prisma" ]; then
    echo "Running Prisma migrations..."
    npx prisma migrate deploy
    echo "Migrations completed."
fi

# Execute the main command
exec "$@"
