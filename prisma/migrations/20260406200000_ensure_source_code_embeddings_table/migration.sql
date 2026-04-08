CREATE EXTENSION IF NOT EXISTS vector;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'SourceCodeEmbiddings'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'SourceCodeEmbeddings'
  ) THEN
    ALTER TABLE "SourceCodeEmbiddings" RENAME TO "SourceCodeEmbeddings";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'SourceCodeEmbeddings'
  ) THEN
    CREATE TABLE "SourceCodeEmbeddings" (
      "id" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "summaryEmbedding" vector(768),
      "sourceCode" TEXT NOT NULL,
      "fileName" TEXT NOT NULL,
      "Summary" TEXT NOT NULL,
      "projectId" TEXT NOT NULL,
      CONSTRAINT "SourceCodeEmbeddings_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX "SourceCodeEmbeddings_projectId_idx" ON "SourceCodeEmbeddings"("projectId");
    CREATE INDEX "SourceCodeEmbeddings_fileName_idx" ON "SourceCodeEmbeddings"("fileName");
    ALTER TABLE "SourceCodeEmbeddings" ADD CONSTRAINT "SourceCodeEmbeddings_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
