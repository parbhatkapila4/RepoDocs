CREATE TABLE IF NOT EXISTS "ChatThread" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'default',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "threadId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "status" TEXT NOT NULL DEFAULT 'complete',

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChatThread_userId_projectId_archived_lastMessageAt_idx"
    ON "ChatThread" ("userId", "projectId", "archived", "lastMessageAt" DESC);

CREATE INDEX IF NOT EXISTS "ChatThread_projectId_lastMessageAt_idx"
    ON "ChatThread" ("projectId", "lastMessageAt" DESC);

CREATE INDEX IF NOT EXISTS "ChatMessage_threadId_createdAt_idx"
    ON "ChatMessage" ("threadId", "createdAt");

DO $$
BEGIN
    ALTER TABLE "ChatThread"
        ADD CONSTRAINT "ChatThread_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "ChatThread"
        ADD CONSTRAINT "ChatThread_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "ChatMessage"
        ADD CONSTRAINT "ChatMessage_threadId_fkey"
        FOREIGN KEY ("threadId") REFERENCES "ChatThread" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
