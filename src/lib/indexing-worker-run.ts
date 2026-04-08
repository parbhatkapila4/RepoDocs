import prisma from "@/lib/prisma";
import { indexGithubRepository } from "@/lib/github";

const JOB_LEASE_DURATION_MS = 5 * 60 * 1000;

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
        { status: "queued", lockedAt: null },
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
          _count: { select: { sourceCodeEmbeddings: true } },
        },
      },
    },
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const ea = a.project._count.sourceCodeEmbeddings;
    const eb = b.project._count.sourceCodeEmbeddings;
    if (ea !== eb) return ea - eb;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return candidates[0];
}

async function leaseJob(jobId: string, workerId: string) {
  await prisma.indexingJob.update({
    where: { id: jobId },
    data: {
      status: "processing",
      progress: 1,
      lockedAt: new Date(),
      lockedBy: workerId,
      updatedAt: new Date(),
    },
  });
}

async function processIndexingJob(job: {
  id: string;
  projectId: string;
  project: {
    repoUrl: string;
    githubToken: string | null;
    name: string;
  };
}, workerId: string) {
  const { projectId, project } = job;

  const onProgress = async (progress: number) => {
    try {
      await prisma.indexingJob.update({
        where: { id: job.id },
        data: { progress: Math.min(progress, 100), updatedAt: new Date() },
      });
    } catch {
    }
  };

  return indexGithubRepository(
    projectId,
    project.repoUrl,
    project.githubToken || undefined,
    onProgress
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
  console.log(`[Worker ${workerId}] Invoked at ${new Date().toISOString()}`);

  try {
    const job = await findEligibleJob();
    if (!job) {
      console.log(`[Worker ${workerId}] No eligible jobs found`);
      return { status: 200, body: { status: "idle", message: "No jobs to process" } };
    }

    console.log(
      `[Worker ${workerId}] Processing job ${job.id} for project ${job.projectId} (phase: ${job.phase})`
    );
    await leaseJob(job.id, workerId);

    try {
      const result = await processIndexingJob(job, workerId);

      if (result.needsResume) {
        await prisma.indexingJob.update({
          where: { id: job.id },
          data: {
            status: "queued",
            resumeAfter: result.resumeAfter,
            lockedAt: null,
            lockedBy: null,
            updatedAt: new Date(),
          },
        });
        console.log(
          `[Worker ${workerId}] Job ${job.id} paused for budget; will resume from "${result.resumeAfter}"`
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
          lockedAt: null,
          lockedBy: null,
          error: null,
          updatedAt: new Date(),
        },
      });

      console.log(`[Worker ${workerId}] Job ${job.id} completed successfully`);
      return {
        status: 200,
        body: { status: "success", jobId: job.id, projectId: job.projectId },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await prisma.indexingJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          error: errorMessage,
          lockedAt: null,
          lockedBy: null,
          updatedAt: new Date(),
        },
      });
      console.error(`[Worker ${workerId}] Job ${job.id} failed:`, errorMessage);
      return {
        status: 500,
        body: {
          status: "error",
          jobId: job.id,
          projectId: job.projectId,
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
