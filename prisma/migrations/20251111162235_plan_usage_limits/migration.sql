-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "emailAddress" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 150,
    "plan" "public"."PlanType" NOT NULL DEFAULT 'FREE',
    "planUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "githubToken" TEXT,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SourceCodeEmbiddings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summaryEmbedding" vector,
    "sourceCode" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "Summary" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "SourceCodeEmbiddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Readme" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Readme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReadmeQna" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "updatedContent" TEXT NOT NULL,
    "readmeId" TEXT NOT NULL,

    CONSTRAINT "ReadmeQna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReadmeShare" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shareToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "readmeId" TEXT NOT NULL,

    CONSTRAINT "ReadmeShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Docs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocsQna" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "updatedContent" TEXT NOT NULL,
    "docsId" TEXT NOT NULL,

    CONSTRAINT "DocsQna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocsShare" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shareToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "docsId" TEXT NOT NULL,

    CONSTRAINT "DocsShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UsageQuota" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "readmeCount" INTEGER NOT NULL DEFAULT 0,
    "docsCount" INTEGER NOT NULL DEFAULT 0,
    "chatCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_emailAddress_key" ON "public"."User"("emailAddress");

-- CreateIndex
CREATE INDEX "Project_userId_deletedAt_idx" ON "public"."Project"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Project_userId_createdAt_idx" ON "public"."Project"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SourceCodeEmbiddings_projectId_idx" ON "public"."SourceCodeEmbiddings"("projectId");

-- CreateIndex
CREATE INDEX "SourceCodeEmbiddings_fileName_idx" ON "public"."SourceCodeEmbiddings"("fileName");

-- CreateIndex
CREATE UNIQUE INDEX "Readme_projectId_key" ON "public"."Readme"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadmeShare_shareToken_key" ON "public"."ReadmeShare"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "ReadmeShare_readmeId_key" ON "public"."ReadmeShare"("readmeId");

-- CreateIndex
CREATE UNIQUE INDEX "Docs_projectId_key" ON "public"."Docs"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "DocsShare_shareToken_key" ON "public"."DocsShare"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "DocsShare_docsId_key" ON "public"."DocsShare"("docsId");

-- CreateIndex
CREATE UNIQUE INDEX "UsageQuota_userId_periodStart_key" ON "public"."UsageQuota"("userId", "periodStart");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SourceCodeEmbiddings" ADD CONSTRAINT "SourceCodeEmbiddings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Readme" ADD CONSTRAINT "Readme_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReadmeQna" ADD CONSTRAINT "ReadmeQna_readmeId_fkey" FOREIGN KEY ("readmeId") REFERENCES "public"."Readme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReadmeShare" ADD CONSTRAINT "ReadmeShare_readmeId_fkey" FOREIGN KEY ("readmeId") REFERENCES "public"."Readme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Docs" ADD CONSTRAINT "Docs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocsQna" ADD CONSTRAINT "DocsQna_docsId_fkey" FOREIGN KEY ("docsId") REFERENCES "public"."Docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocsShare" ADD CONSTRAINT "DocsShare_docsId_fkey" FOREIGN KEY ("docsId") REFERENCES "public"."Docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageQuota" ADD CONSTRAINT "UsageQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
