import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { indexGithubRepository } from "@/lib/github";

const JOB_LEASE_DURATION_MS = 5 * 60 * 1000;
export async function GET(request: NextRequest) {
  const workerId = generateWorkerId();

  console.log(`[Worker ${workerId}] Invoked at ${new Date().toISOString()}`);

  try {
    const job = await findEligibleJob();

    if (!job) {
      console.log(`[Worker ${workerId}] No eligible jobs found`);
      return NextResponse.json({
        status: "idle",
        message: "No jobs to process",
      });
    }

    console.log(`[Worker ${workerId}] Processing job ${job.id} for project ${job.projectId}`);

    await leaseJob(job.id, workerId);

    try {
      await processIndexingJob(job, workerId);

      await prisma.indexingJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          progress: 100,
          lockedAt: null,
          lockedBy: null,
          error: null,
          updatedAt: new Date(),
        },
      });

      console.log(`[Worker ${workerId}] Job ${job.id} completed successfully`);

      return NextResponse.json({
        status: "success",
        jobId: job.id,
        projectId: job.projectId,
      });
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

      return NextResponse.json(
        {
          status: "error",
          jobId: job.id,
          projectId: job.projectId,
          error: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Worker ${workerId}] Unexpected error:`, errorMessage);

    return NextResponse.json(
      {
        status: "error",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

async function findEligibleJob() {
  const now = new Date();
  const leaseExpiry = new Date(now.getTime() - JOB_LEASE_DURATION_MS);

  const job = await prisma.indexingJob.findFirst({
    where: {
      OR: [
        {
          status: "queued",
          lockedAt: null,
        },
        {
          status: "processing",
          lockedAt: {
            lt: leaseExpiry,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      project: {
        select: {
          repoUrl: true,
          githubToken: true,
          name: true,
        },
      },
    },
  });

  return job;
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

async function processIndexingJob(
  job: any,
  workerId: string
) {
  const { projectId, project } = job;

  console.log(`[Worker ${workerId}] Starting indexing for project ${projectId}`);
  console.log(`[Worker ${workerId}] Repo: ${project.repoUrl}`);
  console.log(`[Worker ${workerId}] Has token: ${!!project.githubToken}`);

  const onProgress = async (progress: number) => {
    try {
      await prisma.indexingJob.update({
        where: { id: job.id },
        data: {
          progress: Math.min(progress, 100),
          updatedAt: new Date(),
        },
      });
      console.log(`[Worker ${workerId}] Job ${job.id} progress: ${progress}%`);
    } catch (error) {
      console.error(`[Worker ${workerId}] Failed to update progress:`, error);
    }
  };

  await indexGithubRepository(
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

export const dynamic = "force-dynamic";
export const maxDuration = 60;
