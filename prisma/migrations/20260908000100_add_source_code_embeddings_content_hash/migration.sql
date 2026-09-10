ALTER TABLE "SourceCodeEmbeddings"
ADD COLUMN IF NOT EXISTS "contentHash" TEXT;
DELETE FROM "SourceCodeEmbeddings" s USING (
    SELECT "id",
      ROW_NUMBER() OVER (
        PARTITION BY "projectId",
        "fileName"
        ORDER BY ("summaryEmbedding" IS NOT NULL) DESC,
          "createdAt" DESC,
          "id" DESC
      ) AS rn
    FROM "SourceCodeEmbeddings"
  ) ranked
WHERE s."id" = ranked."id"
  AND ranked.rn > 1;
CREATE UNIQUE INDEX IF NOT EXISTS "SourceCodeEmbeddings_projectId_fileName_key" ON "SourceCodeEmbeddings"("projectId", "fileName");