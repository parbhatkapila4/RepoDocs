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
