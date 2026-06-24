ALTER TABLE "Project"
ADD COLUMN "indexedCommitSha" TEXT,
    ADD COLUMN "indexedBranch" TEXT,
    ADD COLUMN "indexedAt" TIMESTAMP(3);
ALTER TABLE "IndexingJob"
ADD COLUMN "indexedBranch" TEXT;
