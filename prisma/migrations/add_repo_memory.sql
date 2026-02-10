-- RepoMemory table for persistent codebase memory (Feature 1)
-- Vector dimension 768 matches getGenerateEmbeddings in gemini.ts

CREATE TABLE IF NOT EXISTS "RepoMemory" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "projectId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" vector(768),
  "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "lastRetrievedAt" TIMESTAMP(3),
  CONSTRAINT "RepoMemory_projectId_fkey"
    FOREIGN KEY ("projectId")
    REFERENCES "Project"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_repoMemory_projectId" ON "RepoMemory"("projectId");
CREATE INDEX IF NOT EXISTS "idx_repoMemory_type" ON "RepoMemory"("type");

CREATE INDEX IF NOT EXISTS "idx_repoMemory_embedding_hnsw"
ON "RepoMemory"
USING hnsw ("embedding" vector_cosine_ops);
