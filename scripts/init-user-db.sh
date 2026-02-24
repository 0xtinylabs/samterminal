#!/bin/bash
# SamTerminal User Database Initialization Script
# Creates the unified database and schemas for notification, swap, transactions services

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-${DB_PASSWORD:-password}}"
DB_NAME="${DB_NAME:-samterminal_user}"

echo "=========================================="
echo "SamTerminal User Database Initialization"
echo "=========================================="
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Create database if it doesn't exist
echo "Creating database '$DB_NAME' if not exists..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

# Create schemas
echo "Creating schemas..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
-- Create schemas for each service
CREATE SCHEMA IF NOT EXISTS notification;
CREATE SCHEMA IF NOT EXISTS swap;
CREATE SCHEMA IF NOT EXISTS transactions;

-- Grant privileges
GRANT ALL ON SCHEMA notification TO $DB_USER;
GRANT ALL ON SCHEMA swap TO $DB_USER;
GRANT ALL ON SCHEMA transactions TO $DB_USER;
EOF

# Verify
echo ""
echo "Verifying schemas..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('notification', 'swap', 'transactions');"

echo ""
echo "=========================================="
echo "Database initialization complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with: USER_DATABASE_URL=postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
echo "  2. Run migrations: pnpm db:migrate"
echo "=========================================="
