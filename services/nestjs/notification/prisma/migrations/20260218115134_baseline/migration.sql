-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notification";

-- CreateEnum
CREATE TYPE "notification"."PlatformName" AS ENUM ('TELEGRAM', 'FARCASTER');

-- CreateTable
CREATE TABLE "notification"."User" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "connectionKey" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification"."Platform" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "platformId" TEXT NOT NULL,
    "platformName" "notification"."PlatformName" NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_ref_key" ON "notification"."User"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "User_connectionKey_key" ON "notification"."User"("connectionKey");

-- AddForeignKey
ALTER TABLE "notification"."Platform" ADD CONSTRAINT "Platform_userId_fkey" FOREIGN KEY ("userId") REFERENCES "notification"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
