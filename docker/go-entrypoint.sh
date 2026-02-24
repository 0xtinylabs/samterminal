#!/bin/sh
# ============================================================
# SamTerminal Go Service Entrypoint
# ============================================================

set -e

echo "Starting SamTerminal Go Service: ${SERVICE_NAME}"

# Map service-prefixed DATABASE_URL to standard DATABASE_URL
# Go services use TOKENDATA_DATABASE_URL, WALLETDATA_DATABASE_URL etc.
# but Prisma expects DATABASE_URL
if [ -z "${DATABASE_URL}" ]; then
    # Convert SERVICE_NAME to uppercase for env var lookup
    PREFIX=$(echo "${SERVICE_NAME}" | tr '[:lower:]' '[:upper:]')
    PREFIXED_VAR="${PREFIX}_DATABASE_URL"
    eval DB_URL=\$$PREFIXED_VAR
    if [ -n "${DB_URL}" ]; then
        export DATABASE_URL="${DB_URL}"
        echo "Mapped ${PREFIXED_VAR} to DATABASE_URL"
    fi
fi

# Run Prisma migrations if prisma directory exists
if [ -d "prisma" ] && [ -s "prisma-cli" ]; then
    echo "Running Prisma migrations..."
    ./prisma-cli migrate deploy --schema=prisma/schema.prisma
    echo "Migrations completed."
fi

# Execute the main command
exec "$@"
