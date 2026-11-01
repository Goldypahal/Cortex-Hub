-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'PROMPT_PACK';

-- AlterTable
ALTER TABLE "entitlements" ADD COLUMN     "licenseKeyPrefix" TEXT;

-- AlterTable
ALTER TABLE "sandbox_runs" ADD COLUMN     "userId" TEXT,
ADD COLUMN     "workspaceId" TEXT;

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "sandbox_runs_sessionToken_createdAt_idx" ON "sandbox_runs"("sessionToken", "createdAt");
