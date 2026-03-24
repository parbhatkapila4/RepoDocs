-- CreateEnum
CREATE TYPE "IndexingJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');
-- CreateTable
CREATE TABLE "IndexingJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "status" "IndexingJobStatus" NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    CONSTRAINT "IndexingJob_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "IndexingJob_projectId_key" ON "IndexingJob"("projectId");
-- CreateIndex
CREATE INDEX "IndexingJob_status_lockedAt_idx" ON "IndexingJob"("status", "lockedAt");
-- CreateIndex
CREATE INDEX "IndexingJob_projectId_idx" ON "IndexingJob"("projectId");
-- AddForeignKey
ALTER TABLE "IndexingJob"
ADD CONSTRAINT "IndexingJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;