-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "transactions";

-- CreateEnum
CREATE TYPE "transactions"."TransactionStatus" AS ENUM ('SUCCESS', 'FAIL', 'WAITING');

-- CreateTable
CREATE TABLE "transactions"."TransactionLog" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "connectionKey" TEXT NOT NULL,
    "connectionValue" TEXT NOT NULL,
    "transactionParams" JSONB,
    "transactionResultParams" JSONB,
    "errorMessage" TEXT,
    "transactionStatus" "transactions"."TransactionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionLog_txHash_key" ON "transactions"."TransactionLog"("txHash");
