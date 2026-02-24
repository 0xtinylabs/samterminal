-- CreateEnum
CREATE TYPE "DexPoolType" AS ENUM ('UNISWAP_V3', 'UNISWAP_V4');

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "volume24H" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "supply" TEXT NOT NULL,
    "circulatedSupply" TEXT NOT NULL DEFAULT '0',
    "imageURL" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usingEnds" INTEGER NOT NULL DEFAULT 0,
    "poolType" "DexPoolType" NOT NULL DEFAULT 'UNISWAP_V3',
    "poolAddress" TEXT,
    "pairAddress" TEXT,
    "poolABI" TEXT,
    "watchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "calculatedVolume24H" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "isFixedPrice" BOOLEAN NOT NULL DEFAULT false,
    "alwaysKeep" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blacklists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addresses" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blacklists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_key" ON "Token"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Blacklists_name_key" ON "Blacklists"("name");
