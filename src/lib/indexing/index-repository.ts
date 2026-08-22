import { log } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { getGenerateEmbeddings, getSummariseCode } from "@/lib/gemini";
import { generateReadmeFromCodebase } from "@/lib/gemini";
import { sanitizeTextForDb } from "@/lib/db-text";
import { loadGithubRepository, type RepoDocument } from "@/lib/github/tarball";
import {
  fetchBranchHeadSha,
  resolveGithubDefaultBranch,
} from "@/lib/github/refs";
import { getGitHubRepositoryInfo } from "@/lib/github/repo-info";
import {
  isGithubLoaderIgnoredPath,
  listGithubRepoPathsForPreindex,
} from "@/lib/github/preindex";

const HIGH_VALUE_PATTERNS = [
  /^readme/i,
  /^package\.json$/,
  /^tsconfig.*\.json$/,
  /^next\.config\./,
  /^nuxt\.config\./,
  /^vite\.config\./,
  /^webpack\.config\./,
  /\.config\.(ts|js|mjs)$/,
  /^src\/index\./,
  /^src\/main\./,
  /^src\/app\.(tsx?|jsx?)$/,
  /^app\/layout\./,
  /^app\/page\./,
  /^pages\/index\./,
  /^pages\/_app\./,
  /^index\.(ts|js|tsx|jsx)$/,
  /^lib\//,
  /^src\/lib\//,
  /^utils\//,
  /^src\/utils\//,
  /^prisma\/schema\.prisma$/,
  /^Dockerfile$/,
  /^docker-compose/,
  /^\.env\.example$/,
  /^Cargo\.toml$/,
  /^go\.mod$/,
  /^requirements\.txt$/,
  /^pyproject\.toml$/,
  /^Gemfile$/,
];

export function isHighValueFile(filePath: string): boolean {
  const normalised = filePath.replace(/\\/g, "/");
  return HIGH_VALUE_PATTERNS.some((re) => re.test(normalised));
}

const WORKER_BUDGET_MS = 45_000;
const BATCH_SIZE = 5;
const EMBEDDING_THROTTLE_MS = 500;

interface IndexResult {
  success: boolean;
  filesProcessed: number;
  successCount: number;
  failCount: number;
  needsResume: boolean;
  resumeAfter: string | null;
  phase: "fast" | "full";
}

export async function indexGithubRepository(
  projectId: string,
  githubUrl: string,
  githubToken?: string,
  onProgress?: (progress: number) => Promise<void> | void,
): Promise<IndexResult> {
  const { retryAsync, logError } = await import("@/lib/errors");
  const { cache } = await import("@/lib/cache");
  const invocationStart = Date.now();
  const ilog = log.with({ projectId });

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    const job = await prisma.indexingJob.findUnique({
      where: { projectId },
    });

    const jobRow = job as
      | (typeof job & {
          phase?: string | null;
          resumeAfter?: string | null;
        })
      | null;

    const currentPhase: "fast" | "full" =
      (jobRow?.phase as "fast" | "full") ?? "fast";
    const resumeAfterFile: string | null = jobRow?.resumeAfter ?? null;

    let indexRef: string | undefined = jobRow?.lastCommitSha ?? undefined;

    if (!jobRow?.lastCommitSha) {
      try {
        const baselineToken = githubToken || process.env.GITHUB_TOKEN;
        const baselineBranch = await resolveGithubDefaultBranch(
          githubUrl,
          baselineToken,
        );
        const baselineSha = await retryAsync(
          () => fetchBranchHeadSha(githubUrl, baselineBranch, baselineToken),
          { maxRetries: 2, initialDelay: 500 },
        );
        if (baselineSha) {
          await prisma.indexingJob.update({
            where: { projectId },
            data: {
              lastCommitSha: baselineSha,
              indexedBranch: baselineBranch,
              updatedAt: new Date(),
            },
          });
          indexRef = baselineSha;
        }
      } catch (captureError) {
        logError(captureError, { projectId, stage: "baseline-capture" });
      }
    }

    const alreadyIndexed = await prisma.sourceCodeEmbeddings.findMany({
      where: { projectId },
      select: { fileName: true },
    });
    const indexedSet = new Set(alreadyIndexed.map((e) => e.fileName));

    if (alreadyIndexed.length > 0) {
      const treeListing = await listGithubRepoPathsForPreindex(
        githubUrl,
        githubToken || process.env.GITHUB_TOKEN,
        25_000,
      );
      if (treeListing && !treeListing.truncated) {
        const paths = treeListing.paths.filter(
          (p) => !isGithubLoaderIgnoredPath(p),
        );
        const notIndexed = paths.filter((p) => !indexedSet.has(p));
        if (notIndexed.length === 0 && paths.length > 0) {
          await generateReadmeIfNeeded(
            projectId,
            githubUrl,
            githubToken,
            retryAsync,
            logError,
          );
          await cache.invalidateProject(projectId);
          return {
            success: true,
            filesProcessed: 0,
            successCount: 0,
            failCount: 0,
            needsResume: false,
            resumeAfter: null,
            phase: "full",
          };
        }
      }
    }

    try {
      await prisma.indexingJob.update({
        where: { projectId },
        data: { updatedAt: new Date() },
      });
    } catch (progressError) {
      ilog.warn("[indexing] Failed to write initial heartbeat:", progressError);
    }
    if (onProgress) {
      try {
        await onProgress(2);
      } catch (callbackError) {
        ilog.warn("[indexing] onProgress(2) threw:", callbackError);
      }
    }

    const docs = await retryAsync(
      () =>
        loadGithubRepository(
          githubUrl,
          githubToken || process.env.GITHUB_TOKEN,
          indexRef,
        ),
      {
        maxRetries: 3,
        initialDelay: 2000,
        retryIf: (error: Error) => !error.message?.includes("authentication"),
      },
    );

    if (!docs || docs.length === 0) {
      throw new Error("No files found in repository");
    }

    const newDocs = docs.filter(
      (d: RepoDocument) => !indexedSet.has(d.metadata.source),
    );

    if (newDocs.length === 0) {
      await generateReadmeIfNeeded(
        projectId,
        githubUrl,
        githubToken,
        retryAsync,
        logError,
      );
      await cache.invalidateProject(projectId);
      return {
        success: true,
        filesProcessed: 0,
        successCount: 0,
        failCount: 0,
        needsResume: false,
        resumeAfter: null,
        phase: currentPhase,
      };
    }

    let filesToProcess: RepoDocument[];
    if (currentPhase === "fast") {
      const highValue = newDocs.filter((d) =>
        isHighValueFile(d.metadata.source),
      );
      const rest = newDocs.filter((d) => !isHighValueFile(d.metadata.source));
      filesToProcess = [...highValue, ...rest];
    } else {
      filesToProcess = [...newDocs];
    }

    if (resumeAfterFile) {
      const idx = filesToProcess.findIndex(
        (d) => d.metadata.source === resumeAfterFile,
      );
      if (idx >= 0) {
        filesToProcess = filesToProcess.slice(idx + 1);
      }
    }

    const knownTotal = alreadyIndexed.length + newDocs.length;
    await prisma.indexingJob.update({
      where: { projectId },
      data: {
        filesTotal: knownTotal,
        filesProcessed: alreadyIndexed.length,
        progress:
          knownTotal > 0
            ? Math.floor((alreadyIndexed.length / knownTotal) * 100)
            : 0,
        updatedAt: new Date(),
      },
    });
    if (onProgress) {
      try {
        await onProgress(8);
      } catch (callbackError) {
        ilog.warn("[indexing] onProgress(8) threw:", callbackError);
      }
    }

    let successCount = 0;
    let failCount = 0;
    let lastProcessed: string | null = null;
    let fastPhaseCompleted = false;
    const totalFiles = alreadyIndexed.length + newDocs.length;
    let warnedProgressCallback = false;
    let warnedProgressWrite = false;

    for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
      if (Date.now() - invocationStart > WORKER_BUDGET_MS) {
        await prisma.indexingJob.update({
          where: { projectId },
          data: {
            resumeAfter: lastProcessed,
            filesProcessed: indexedSet.size + successCount,
            progress: Math.floor(
              ((indexedSet.size + successCount) / totalFiles) * 100,
            ),
            updatedAt: new Date(),
          },
        });
        return {
          success: true,
          filesProcessed: successCount,
          successCount,
          failCount,
          needsResume: true,
          resumeAfter: lastProcessed,
          phase: currentPhase,
        };
      }

      const batch = filesToProcess.slice(i, i + BATCH_SIZE);

      for (const doc of batch) {
        if (Date.now() - invocationStart > WORKER_BUDGET_MS) break;
        try {
          const rawContent =
            typeof doc.pageContent === "string"
              ? doc.pageContent
              : String(doc.pageContent ?? "");

          const isBinary = rawContent.includes(String.fromCharCode(0));

          const summary = isBinary
            ? `Binary or non-text file at ${doc.metadata.source}; contents are not indexed.`
            : await retryAsync(() => getSummariseCode(doc), {
                maxRetries: 2,
                initialDelay: 500,
              });
          if (!summary) throw new Error("Empty summary generated");

          const embedding = await retryAsync(
            () => getGenerateEmbeddings(summary),
            { maxRetries: 2, initialDelay: 500 },
          );

          const row = await prisma.sourceCodeEmbeddings.create({
            data: {
              sourceCode: sanitizeTextForDb(
                isBinary ? "[binary file - contents not stored]" : rawContent,
              ),
              fileName: doc.metadata.source,
              Summary: sanitizeTextForDb(summary),
              projectId,
            },
          });

          await prisma.$executeRaw`
            UPDATE "SourceCodeEmbeddings"
            SET "summaryEmbedding" = ${embedding}::vector
            WHERE "id" = ${row.id}
          `;

          successCount++;
          lastProcessed = doc.metadata.source;

          await new Promise((r) => setTimeout(r, EMBEDDING_THROTTLE_MS));
        } catch (error) {
          logError(error, { file: doc.metadata.source, projectId });
          failCount++;
          lastProcessed = doc.metadata.source;
        }

        if (
          currentPhase === "fast" &&
          !fastPhaseCompleted &&
          !isHighValueFile(doc.metadata.source) &&
          successCount > 0
        ) {
          fastPhaseCompleted = true;
        }
      }

      const processed = indexedSet.size + successCount;
      const progressPercent = Math.floor((processed / totalFiles) * 100);
      if (onProgress) {
        try {
          await onProgress(progressPercent);
        } catch (callbackError) {
          if (!warnedProgressCallback) {
            warnedProgressCallback = true;
            ilog.warn(
              "[indexing] onProgress threw; suppressing further reports this run:",
              callbackError,
            );
          }
        }
      }

      try {
        await prisma.indexingJob.update({
          where: { projectId },
          data: {
            filesProcessed: processed,
            progress: progressPercent,
            updatedAt: new Date(),
          },
        });
      } catch (progressError) {
        if (!warnedProgressWrite) {
          warnedProgressWrite = true;
          ilog.warn(
            "[indexing] Progress write failed; suppressing further reports this run:",
            progressError,
          );
        }
      }

      if (i + BATCH_SIZE < filesToProcess.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (successCount === 0 && indexedSet.size === 0) {
      throw new Error(
        "Indexing produced no embeddings (every file failed). Check GEMINI_API_KEY or GOOGLE_GENAI_API_KEY, GitHub access for this repo, and server logs.",
      );
    }

    await generateReadmeIfNeeded(
      projectId,
      githubUrl,
      githubToken,
      retryAsync,
      logError,
    );
    await cache.invalidateProject(projectId);

    return {
      success: true,
      filesProcessed: successCount,
      successCount,
      failCount,
      needsResume: false,
      resumeAfter: null,
      phase: currentPhase,
    };
  } catch (error) {
    logError(error, { projectId, githubUrl });
    throw error;
  }
}

type RetryAsyncFn = <T>(
  fn: () => Promise<T>,
  opts: {
    maxRetries?: number;
    initialDelay?: number;
    retryIf?: (error: Error) => boolean;
  },
) => Promise<T>;
type LogErrorFn = (error: unknown, context?: Record<string, unknown>) => void;

async function generateReadmeIfNeeded(
  projectId: string,
  githubUrl: string,
  githubToken: string | undefined,
  retryAsync: RetryAsyncFn,
  logError: LogErrorFn,
) {
  try {
    const allSummaries = await prisma.sourceCodeEmbeddings.findMany({
      where: { projectId },
      select: { Summary: true },
    });
    if (allSummaries.length === 0) return;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, repoUrl: true },
    });
    if (!project) return;

    const job = await prisma.indexingJob.findUnique({
      where: { projectId },
      select: { lastCommitSha: true },
    });

    const repoInfo = await getGitHubRepositoryInfo(githubUrl, githubToken);
    const summaries = allSummaries.map((s) => s.Summary);

    const { withGenerationStamp } = await import("@/lib/generated-stamp");
    const readmeContent = withGenerationStamp(
      await retryAsync(
        () => generateReadmeFromCodebase(project.name, summaries, repoInfo),
        { maxRetries: 2, initialDelay: 2000 },
      ),
      { repoUrl: project.repoUrl, commitSha: job?.lastCommitSha },
    );

    await prisma.readme.upsert({
      where: { projectId },
      update: {
        content: readmeContent,
        prompt: `Generated README for ${project.name} based on codebase analysis`,
        updatedAt: new Date(),
      },
      create: {
        content: readmeContent,
        prompt: `Generated README for ${project.name} based on codebase analysis`,
        projectId,
      },
    });
  } catch (err) {
    logError(err, { projectId, stage: "readme-generation" });
  }
}
