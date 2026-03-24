-- Run this in Neon SQL Editor. Safe to run multiple times (skips if already exists).
-- Create enum only if it doesn't exist
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type
  WHERE typname = 'IndexingJobStatus'
) THEN CREATE TYPE "IndexingJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');
END IF;
END $$;
-- Create table only if it doesn't exist
CREATE TABLE IF NOT EXISTS "IndexingJob" (
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
-- Create indexes only if they don't exist
CREATE UNIQUE INDEX IF NOT EXISTS "IndexingJob_projectId_key" ON "IndexingJob"("projectId");
CREATE INDEX IF NOT EXISTS "IndexingJob_status_lockedAt_idx" ON "IndexingJob"("status", "lockedAt");
CREATE INDEX IF NOT EXISTS "IndexingJob_projectId_idx" ON "IndexingJob"("projectId");
-- Add foreign key only if it doesn't exist
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_constraint
  WHERE conname = 'IndexingJob_projectId_fkey'
) THEN
ALTER TABLE "IndexingJob"
ADD CONSTRAINT "IndexingJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF;
END $$;