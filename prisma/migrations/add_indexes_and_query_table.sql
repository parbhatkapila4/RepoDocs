-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_sourceCodeEmbeddings_projectId" ON "SourceCodeEmbiddings"("projectId");
CREATE INDEX IF NOT EXISTS "idx_sourceCodeEmbeddings_fileName" ON "SourceCodeEmbiddings"("fileName");

-- Create vector index for similarity search (HNSW index for better performance)
CREATE INDEX IF NOT EXISTS "idx_sourceCodeEmbeddings_embedding_hnsw" 
ON "SourceCodeEmbiddings" 
USING hnsw ("summaryEmbedding" vector_cosine_ops);

-- Add indexes for project lookups
CREATE INDEX IF NOT EXISTS "idx_project_userId_deletedAt" ON "Project"("userId", "deletedAt");
CREATE INDEX IF NOT EXISTS "idx_project_deletedAt" ON "Project"("deletedAt");

-- Create table for tracking codebase queries
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

-- Add index for query history lookups
CREATE INDEX IF NOT EXISTS "idx_codebaseQueries_projectId_createdAt" 
ON "CodebaseQueries"("projectId", "createdAt" DESC);

-- Add index for readme lookups
CREATE INDEX IF NOT EXISTS "idx_readme_projectId" ON "Readme"("projectId");

-- Add index for docs lookups
CREATE INDEX IF NOT EXISTS "idx_docs_projectId" ON "Docs"("projectId");

-- Add composite index for faster user project queries
CREATE INDEX IF NOT EXISTS "idx_project_userId_createdAt" ON "Project"("userId", "createdAt" DESC);

