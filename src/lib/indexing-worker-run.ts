import { log } from "./logger";
import prisma from "@/lib/prisma";
import { indexGithubRepository } from "@/lib/github";
import { decryptSecret } from "@/lib/secret-crypto";
import { retryAsync } from "@/lib/errors";
import { mirrorBaselineIfPending } from "@/lib/baseline-mirror";
import { isPaidPlan } from "@/lib/plan";

const JOB_LEASE_DURATION_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  6 * 60 * 60_000,
];

function backoffFor(attempt: number): number {
  return BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
}

export type IndexingWorkerHttpResult = {
  status: number;
  body: Record<string, unknown>;
};

async function findEligibleJob() {
  const now = new Date();
  const leaseExpiry = new Date(now.getTime() - JOB_LEASE_DURATION_MS);

  const candidates = await prisma.indexingJob.findMany({
    where: {
      OR: [
        {
          status: "queued",
          lockedAt: null,

          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        { status: "processing", lockedAt: { lt: leaseExpiry } },
      ],
    },
    take: 40,
    orderBy: { createdAt: "asc" },
    include: {
      project: {
        select: {
          repoUrl: true,
          githubToken: true,
          name: true,
          user: { select: { plan: true } },
          _count: { select: { sourceCodeEmbeddings: true } },
        },
      },
    },
  });

  const eligible = candidates.filter((c) => isPaidPlan(c.project.user?.plan));

  if (eligible.length === 0) return null;

  eligible.sort((a, b) => {
    const ea = a.project._count.sourceCodeEmbeddings;
    const eb = b.project._count.sourceCodeEmbeddings;
    if (ea !== eb) return ea - eb;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return eligible[0];
}

async function claimJob(jobId: string, workerId: string): Promise<boolean> {
  const now = new Date();
  const leaseExpiry = new Date(now.getTime() - JOB_LEASE_DURATION_MS);
  const res = await prisma.indexingJob.updateMany({
    where: {
      id: jobId,
      OR: [
        {
          status: "queued",
          lockedAt: null,
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        { status: "processing", lockedAt: { lt: leaseExpiry } },
      ],
    },
    data: {
      status: "processing",
      lockedAt: new Date(),
      lockedBy: workerId,
      updatedAt: new Date(),
    },
  });
  return res.count === 1;
}

async function processIndexingJob(
  job: {
    id: string;
    projectId: string;
    project: {
      repoUrl: string;
      githubToken: string | null;
      name: string;
    };
  },
  workerId: string,
) {
  const { projectId, project } = job;

  const onProgress = async (progress: number) => {
    const capped = Math.max(0, Math.min(progress, 100));
    try {
      await prisma.indexingJob.updateMany({
        where: { id: job.id, progress: { lt: capped } },
        data: { progress: capped, updatedAt: new Date() },
      });
    } catch {}
  };

  return indexGithubRepository(
    projectId,
    project.repoUrl,
    decryptSecret(project.githubToken) || undefined,
    onProgress,
  );
}

function generateWorkerId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const region = process.env.VERCEL_REGION || "local";
  return `worker-${region}-${timestamp}-${random}`;
}

export async function runIndexingWorkerOnce(): Promise<IndexingWorkerHttpResult> {
  const workerId = generateWorkerId();
  log.debug(`[Worker ${workerId}] Invoked at ${new Date().toISOString()}`);

  try {
    const job = await findEligibleJob();
    if (!job) {
      log.debug(`[Worker ${workerId}] No eligible jobs found`);
      return {
        status: 200,
        body: { status: "idle", message: "No jobs to process" },
      };
    }

    log.debug(
      `[Worker ${workerId}] Processing job ${job.id} for project ${job.projectId} (phase: ${job.phase})`,
    );
    const claimed = await claimJob(job.id, workerId);
    if (!claimed) {
      log.debug(
        `[Worker ${workerId}] Job ${job.id} was claimed by another worker; skipping`,
      );
      return {
        status: 200,
        body: { status: "contended", message: "Job already claimed" },
      };
    }

    try {
      const result = await processIndexingJob(job, workerId);

      if (result.needsResume) {
        await prisma.indexingJob.update({
          where: { id: job.id },
          data: {
            status: "queued",
            resumeAfter: result.resumeAfter,
            attempts: 0,
            nextAttemptAt: null,
            error: null,
            lockedAt: null,
            lockedBy: null,
            updatedAt: new Date(),
          },
        });
        log.debug(
          `[Worker ${workerId}] Job ${job.id} hit its time box; will resume from "${result.resumeAfter}"`,
        );
        const { kickIndexingWorker } = await import("./indexing-worker-kick");
        void kickIndexingWorker();
        return {
          status: 200,
          body: {
            status: "paused",
            jobId: job.id,
            projectId: job.projectId,
            resumeAfter: result.resumeAfter,
          },
        };
      }

      await prisma.indexingJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          progress: 100,
          phase: "full",
          resumeAfter: null,
          attempts: 0,
          nextAttemptAt: null,
          lockedAt: null,
          lockedBy: null,
          error: null,
          updatedAt: new Date(),
        },
      });
      try {
        const mirroredSha = await retryAsync(
          () => mirrorBaselineIfPending(job.projectId),
          { maxRetries: 3, initialDelay: 400 },
        );
        if (mirroredSha) {
          log.debug(
            `[Worker ${workerId}] Job ${job.id} mirrored baseline ${mirroredSha} -> project ${job.projectId}`,
          );
        }
      } catch (mirrorError) {
        console.error(
          `[Worker ${workerId}] Job ${job.id} completed but baseline mirror failed (will reconcile on next status read):`,
          mirrorError instanceof Error
            ? mirrorError.message
            : String(mirrorError),
        );
      }

      log.debug(`[Worker ${workerId}] Job ${job.id} completed successfully`);
      return {
        status: 200,
        body: { status: "success", jobId: job.id, projectId: job.projectId },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const attempts = (job.attempts ?? 0) + 1;
      const willRetry = attempts < MAX_ATTEMPTS;
      const retryInMs = backoffFor(attempts - 1);
      await prisma.indexingJob.update({
        where: { id: job.id },
        data: {
          status: willRetry ? "queued" : "failed",
          error: errorMessage,
          attempts,
          nextAttemptAt: willRetry ? new Date(Date.now() + retryInMs) : null,
          lockedAt: null,
          lockedBy: null,
          updatedAt: new Date(),
        },
      });

      if (willRetry) {
        console.error(
          `[Worker ${workerId}] Job ${job.id} failed (attempt ${attempts}/${MAX_ATTEMPTS}); retrying in ${Math.round(retryInMs / 1000)}s:`,
          errorMessage,
        );
      } else {
        console.error(
          `[Worker ${workerId}] Job ${job.id} failed permanently after ${attempts} attempts:`,
          errorMessage,
        );
      }

      return {
        status: 500,
        body: {
          status: willRetry ? "retrying" : "error",
          jobId: job.id,
          projectId: job.projectId,
          attempts,
          retryInMs: willRetry ? retryInMs : undefined,
          error: errorMessage,
        },
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Worker ${workerId}] Unexpected error:`, errorMessage);
    return { status: 500, body: { status: "error", error: errorMessage } };
  }
}
