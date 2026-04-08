CREATE TYPE "IndexingPhase" AS ENUM ('fast', 'full');
ALTER TABLE "IndexingJob"
ADD COLUMN "phase" "IndexingPhase" NOT NULL DEFAULT 'fast';
ALTER TABLE "IndexingJob"
ADD COLUMN "filesTotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "IndexingJob"
ADD COLUMN "filesProcessed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "IndexingJob"
ADD COLUMN "lastCommitSha" TEXT;
ALTER TABLE "IndexingJob"
ADD COLUMN "resumeAfter" TEXT;