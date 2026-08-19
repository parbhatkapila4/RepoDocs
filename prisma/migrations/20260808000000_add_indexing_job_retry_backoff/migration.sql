ALTER TABLE "IndexingJob"
  ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "IndexingJob"
  ADD COLUMN IF NOT EXISTS "nextAttemptAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "IndexingJob_status_nextAttemptAt_idx"
  ON "IndexingJob" ("status", "nextAttemptAt");
UPDATE "IndexingJob"
SET "status" = 'queued',
    "attempts" = 0,
    "nextAttemptAt" = NULL,
    "lockedAt" = NULL,
    "lockedBy" = NULL
WHERE "status" = 'failed';
