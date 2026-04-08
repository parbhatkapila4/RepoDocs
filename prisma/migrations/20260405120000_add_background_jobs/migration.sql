DO $$
BEGIN
  CREATE TYPE "BackgroundJobKind" AS ENUM ('readme_regen', 'docs_regen');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "BackgroundJobStatus" AS ENUM ('running', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BackgroundJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" "BackgroundJobKind" NOT NULL,
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'running',
    "error" TEXT,
    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BackgroundJob_userId_projectId_kind_createdAt_idx" ON "BackgroundJob"("userId", "projectId", "kind", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "BackgroundJob_projectId_kind_status_idx" ON "BackgroundJob"("projectId", "kind", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BackgroundJob_userId_fkey'
  ) THEN
    ALTER TABLE "BackgroundJob"
    ADD CONSTRAINT "BackgroundJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BackgroundJob_projectId_fkey'
  ) THEN
    ALTER TABLE "BackgroundJob"
    ADD CONSTRAINT "BackgroundJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
