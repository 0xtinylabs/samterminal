-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swap";

-- CreateTable
CREATE TABLE "swap"."WalletOwner" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "appConnectionId" TEXT,
    "appConnectionDescription" TEXT,
    "dailySwaps" INTEGER NOT NULL DEFAULT 0,
    "weeklySwaps" INTEGER NOT NULL DEFAULT 0,
    "monthlySwaps" INTEGER NOT NULL DEFAULT 0,
    "yearlySwaps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swap"."Swap" (
    "id" TEXT NOT NULL,
    "fromTokenAddress" TEXT NOT NULL,
    "toTokenAddress" TEXT NOT NULL,
    "toWalletAddress" TEXT NOT NULL,
    "buyAmount" TEXT NOT NULL,
    "sellAmount" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "application" TEXT,
    "environment" TEXT,
    "walletOwnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Swap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swap"."SwapError" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "walletOwnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwapError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletOwner_walletAddress_key" ON "swap"."WalletOwner"("walletAddress");

-- AddForeignKey
ALTER TABLE "swap"."Swap" ADD CONSTRAINT "Swap_walletOwnerId_fkey" FOREIGN KEY ("walletOwnerId") REFERENCES "swap"."WalletOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap"."SwapError" ADD CONSTRAINT "SwapError_walletOwnerId_fkey" FOREIGN KEY ("walletOwnerId") REFERENCES "swap"."WalletOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
