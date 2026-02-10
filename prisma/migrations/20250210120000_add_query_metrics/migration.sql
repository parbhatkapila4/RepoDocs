-- CreateTable
CREATE TABLE "QueryMetrics" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    "routeType" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "retrievalCount" INTEGER NOT NULL DEFAULT 0,
    "memoryHitCount" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QueryMetrics_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "QueryMetrics_projectId_idx" ON "QueryMetrics"("projectId");
-- CreateIndex
CREATE INDEX "QueryMetrics_projectId_createdAt_idx" ON "QueryMetrics"("projectId", "createdAt" DESC);
-- CreateIndex
CREATE INDEX "QueryMetrics_projectId_success_createdAt_idx" ON "QueryMetrics"("projectId", "success", "createdAt" DESC);
-- AddForeignKey
ALTER TABLE "QueryMetrics"
ADD CONSTRAINT "QueryMetrics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;