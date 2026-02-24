-- SamTerminal User Database Initialization Script
-- Creates the unified user database with separate schemas for each service
-- Run this script before running Prisma migrations

-- Create database (run this as postgres superuser)
-- CREATE DATABASE samterminal_user;

-- Connect to samterminal_user database before running the rest
-- \c samterminal_user

-- Create schemas for each service
CREATE SCHEMA IF NOT EXISTS notification;
CREATE SCHEMA IF NOT EXISTS swap;
CREATE SCHEMA IF NOT EXISTS transactions;

-- Grant privileges (adjust username as needed)
GRANT ALL ON SCHEMA notification TO postgres;
GRANT ALL ON SCHEMA swap TO postgres;
GRANT ALL ON SCHEMA transactions TO postgres;

-- Verify schemas were created
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('notification', 'swap', 'transactions');
