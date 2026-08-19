CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS "RepoMemory" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "projectId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" vector(768),
  "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "lastRetrievedAt" TIMESTAMP(3),
  CONSTRAINT "RepoMemory_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RepoMemory_projectId_idx" ON "RepoMemory"("projectId");
CREATE INDEX IF NOT EXISTS "RepoMemory_type_idx" ON "RepoMemory"("type");
CREATE TABLE IF NOT EXISTS "CodebaseQueries" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "projectId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sourcesCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CodebaseQueries_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CodebaseQueries_projectId_createdAt_idx"
  ON "CodebaseQueries"("projectId", "createdAt" DESC);
DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod) INTO col_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'SourceCodeEmbeddings'
    AND a.attname = 'summaryEmbedding'
    AND a.attnum > 0;

  IF col_type IS NOT NULL AND col_type <> 'vector(768)' THEN
    ALTER TABLE "SourceCodeEmbeddings"
      ALTER COLUMN "summaryEmbedding" TYPE vector(768);
  END IF;
END $$;

DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod) INTO col_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'RepoMemory'
    AND a.attname = 'embedding'
    AND a.attnum > 0;

  IF col_type IS NOT NULL AND col_type <> 'vector(768)' THEN
    ALTER TABLE "RepoMemory"
      ALTER COLUMN "embedding" TYPE vector(768);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "SourceCodeEmbeddings_summaryEmbedding_hnsw_idx"
  ON "SourceCodeEmbeddings" USING hnsw ("summaryEmbedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "RepoMemory_embedding_hnsw_idx"
  ON "RepoMemory" USING hnsw ("embedding" vector_cosine_ops);
