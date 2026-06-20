-- CreateEnum
CREATE TYPE "TryOnRenderStatus" AS ENUM ('generating', 'completed', 'failed');

-- CreateTable
CREATE TABLE "TryOnRender" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "yachtId" TEXT,
    "userId" TEXT,
    "modelId" TEXT NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "view" TEXT NOT NULL,
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "colours" JSONB NOT NULL DEFAULT '{}',
    "geminiModel" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "rerollSeed" INTEGER NOT NULL DEFAULT 0,
    "lookVersion" INTEGER NOT NULL DEFAULT 0,
    "blobUrl" TEXT,
    "status" "TryOnRenderStatus" NOT NULL DEFAULT 'generating',
    "errorCode" TEXT,
    "excludedNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryOnRender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TryOnRender_cacheKey_key" ON "TryOnRender"("cacheKey");

-- CreateIndex
CREATE INDEX "TryOnRender_yachtId_idx" ON "TryOnRender"("yachtId");

-- CreateIndex
CREATE INDEX "TryOnRender_userId_idx" ON "TryOnRender"("userId");

-- CreateIndex
CREATE INDEX "TryOnRender_status_idx" ON "TryOnRender"("status");
