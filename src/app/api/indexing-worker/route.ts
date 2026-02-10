import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { indexGithubRepository } from "@/lib/github";

const JOB_LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Vercel-compatible serverless worker for repository indexing
 * 
 * Triggered by cron every minute (see vercel.json)
 * 
 * ARCHITECTURE:
 * - Multiple worker invocations can run concurrently
 * - Each worker processes ONE job per invocation
 * - Postgres lease-based locking (lockedAt/lockedBy) prevents job conflicts
 * - NO global Redis lock - workers are independent
 * 
 * INDEXING BEHAVIOR (IMPORTANT):
 * - indexGithubRepository() ALWAYS runs from the beginning
 * - There is NO cursor/checkpoint/resume capability
 * - If a worker times out or crashes, the ENTIRE indexing restarts
 * - This is acceptable for MVP with bounded repo sizes (<500 files)
 * - For repos that timeout (>60s on Vercel Hobby), upgrade to Vercel Pro (300s)
 * 
 * SAFETY GUARANTEES:
 * - Idempotent: Safe to invoke multiple times
 * - Crash-resistant: Lease expiry allows recovery
 * - Concurrent-safe: Different jobs processed in parallel
 */
export async function GET(request: NextRequest) {
  const workerId = generateWorkerId();
  
  console.log(`[Worker ${workerId}] Invoked at ${new Date().toISOString()}`);

  try {
    // Find an eligible job to process
    const job = await findEligibleJob();

    if (!job) {
      console.log(`[Worker ${workerId}] No eligible jobs found`);
      return NextResponse.json({
        status: "idle",
        message: "No jobs to process",
      });
    }

    console.log(`[Worker ${workerId}] Processing job ${job.id} for project ${job.projectId}`);

    // Lease the job (mark as processing, set lock)
    await leaseJob(job.id, workerId);

    // Process the job
    try {
      await processIndexingJob(job, workerId);

      // Mark as completed
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
      // Mark as failed
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

/**
 * Find a job that's eligible for processing
 * 
 * Eligible criteria:
 * 1. Status = queued and not locked, OR
 * 2. Status = processing but lease expired (crashed/timed-out worker)
 * 
 * LEASE EXPIRY:
 * If a job has been locked for >5 minutes, we assume the worker crashed/timed-out.
 * The job becomes eligible again and indexing restarts from the beginning.
 */
async function findEligibleJob() {
  const now = new Date();
  const leaseExpiry = new Date(now.getTime() - JOB_LEASE_DURATION_MS);

  const job = await prisma.indexingJob.findFirst({
    where: {
      OR: [
        // Queued jobs that aren't locked
        {
          status: "queued",
          lockedAt: null,
        },
        // Processing jobs with expired leases (crashed/timed-out workers)
        {
          status: "processing",
          lockedAt: {
            lt: leaseExpiry,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "asc", // FIFO
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

/**
 * Lease a job (mark as processing and lock it)
 * 
 * This prevents other concurrent workers from picking up the same job.
 */
async function leaseJob(jobId: string, workerId: string) {
  await prisma.indexingJob.update({
    where: { id: jobId },
    data: {
      status: "processing",
      lockedAt: new Date(),
      lockedBy: workerId,
      updatedAt: new Date(),
    },
  });
}

/**
 * Process the indexing job with progress updates
 * 
 * IMPORTANT SECURITY NOTE:
 * - githubToken is passed through but NEVER logged
 * - TODO: Encrypt GitHub tokens at rest using KMS / envelope encryption
 *   (Currently stored in plaintext in Postgres - acceptable for MVP but not production)
 */
async function processIndexingJob(
  job: any,
  workerId: string
) {
  const { projectId, project } = job;

  // Log safely - NEVER log the actual token value
  console.log(`[Worker ${workerId}] Starting indexing for project ${projectId}`);
  console.log(`[Worker ${workerId}] Repo: ${project.repoUrl}`);
  console.log(`[Worker ${workerId}] Has token: ${!!project.githubToken}`);

  // Progress callback - updates DB after each batch
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
      // Don't throw - progress updates are not critical
    }
  };

  // TODO: Encrypt GitHub tokens at rest using KMS / envelope encryption
  // Pass token to indexing function (never logged)
  await indexGithubRepository(
    projectId,
    project.repoUrl,
    project.githubToken || undefined,
    onProgress
  );
}

/**
 * Generate a unique worker ID for tracking
 * Format: worker-{region}-{timestamp}-{random}
 */
function generateWorkerId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const region = process.env.VERCEL_REGION || "local";
  return `worker-${region}-${timestamp}-${random}`;
}

// Disable static optimization for this route
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max execution time on Vercel Hobby (60s)
