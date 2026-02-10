CREATE INDEX IF NOT EXISTS "idx_sourceCodeEmbeddings_projectId" ON "SourceCodeEmbiddings"("projectId");
CREATE INDEX IF NOT EXISTS "idx_sourceCodeEmbeddings_fileName" ON "SourceCodeEmbiddings"("fileName");

CREATE INDEX IF NOT EXISTS "idx_sourceCodeEmbeddings_embedding_hnsw" 
ON "SourceCodeEmbiddings" 
USING hnsw ("summaryEmbedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "idx_project_userId_deletedAt" ON "Project"("userId", "deletedAt");
CREATE INDEX IF NOT EXISTS "idx_project_deletedAt" ON "Project"("deletedAt");

CREATE TABLE IF NOT EXISTS "CodebaseQueries" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "projectId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sourcesCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CodebaseQueries_projectId_fkey" 
    FOREIGN KEY ("projectId") 
    REFERENCES "Project"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_codebaseQueries_projectId_createdAt" 
ON "CodebaseQueries"("projectId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_readme_projectId" ON "Readme"("projectId");

CREATE INDEX IF NOT EXISTS "idx_docs_projectId" ON "Docs"("projectId");

CREATE INDEX IF NOT EXISTS "idx_project_userId_createdAt" ON "Project"("userId", "createdAt" DESC);

