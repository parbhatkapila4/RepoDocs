"use server";

import { auth } from "@clerk/nextjs/server";
import { kickIndexingWorker } from "./indexing-worker-kick";
import prisma from "./prisma";
import { getDbUserId } from "./get-db-user-id";
import { decryptSecret } from "./secret-crypto";
import { resolveGithubDefaultBranch, fetchBranchHeadSha } from "./github";
import { mirrorBaselineIfPending } from "./baseline-mirror";
import { isPaidPlan, upgradeMessage } from "./plan";
const WAKE_THROTTLE_MS = 15_000;
const lastWake = new Map<string, number>();

function nudgeWorkerIfDue(
  projectId: string,
  job: { status: string; nextAttemptAt: Date | null; lockedAt: Date | null }
): void {
  if (job.status !== "queued" || job.lockedAt) return;
  if (job.nextAttemptAt && job.nextAttemptAt.getTime() > Date.now()) return;

  const now = Date.now();
  const previous = lastWake.get(projectId) ?? 0;
  if (now - previous < WAKE_THROTTLE_MS) return;
  lastWake.set(projectId, now);

  void kickIndexingWorker();
}

export async function getIndexingStatus(projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!dbUser) {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);

      if (clerkUser.emailAddresses[0]?.emailAddress) {
        dbUser = await prisma.user.findUnique({
          where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
          select: { id: true },
        });
      }
    }

    if (!dbUser) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUser.id,
        deletedAt: null,
      },
      select: { id: true, user: { select: { plan: true } } },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }
    if (!isPaidPlan(project.user?.plan)) {
      return {
        status: "locked" as const,
        progress: 0,
        error: null,
        updatedAt: null,
        filesProcessed: 0,
        filesTotal: 0,
        phase: null,
        attempts: 0,
        nextAttemptAt: null,
        lockedAt: null,
      };
    }

    try {
      await mirrorBaselineIfPending(projectId);
    } catch (reconcileError) {
      console.error(
        "[getIndexingStatus] baseline reconcile failed:",
        reconcileError instanceof Error
          ? reconcileError.message
          : String(reconcileError)
      );
    }

    const job = await prisma.indexingJob.findUnique({
      where: { projectId },
      select: {
        status: true,
        progress: true,
        error: true,
        updatedAt: true,
        filesProcessed: true,
        filesTotal: true,
        phase: true,
        attempts: true,
        nextAttemptAt: true,
        lockedAt: true,
      },
    });

    if (!job) {
      return {
        status: "not_started" as const,
        progress: 0,
        error: null,
        updatedAt: null,
        filesProcessed: 0,
        filesTotal: 0,
        phase: null,
        attempts: 0,
        nextAttemptAt: null,
      };
    }

    nudgeWorkerIfDue(projectId, job);

    return {
      status: job.status,
      progress: job.progress,
      error: job.error,
      updatedAt: job.updatedAt,
      filesProcessed: job.filesProcessed,
      filesTotal: job.filesTotal,
      phase: job.phase,
      attempts: job.attempts,
      nextAttemptAt: job.nextAttemptAt,
      lockedAt: job.lockedAt,
    };
  } catch (error) {
    console.error("Error fetching indexing status:", error);
    throw error;
  }
}

export async function retryIndexingJob(projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!dbUser) {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);

      if (clerkUser.emailAddresses[0]?.emailAddress) {
        dbUser = await prisma.user.findUnique({
          where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
          select: { id: true },
        });
      }
    }

    if (!dbUser) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUser.id,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const owner = await prisma.user.findUnique({
      where: { id: dbUser.id },
      select: { plan: true },
    });
    if (!isPaidPlan(owner?.plan)) {
      throw new Error(upgradeMessage("indexing"));
    }

    const currentJob = await prisma.indexingJob.findUnique({
      where: { projectId },
      select: { status: true, lockedAt: true },
    });

    if (currentJob?.status === "processing") {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (currentJob.lockedAt && currentJob.lockedAt > fiveMinutesAgo) {
        throw new Error("Job is currently being processed. Please wait.");
      }
    }

    await prisma.indexingJob.upsert({
      where: { projectId },
      create: {
        projectId,
        status: "queued",
        progress: 0,
      },
      update: {
        status: "queued",
        progress: 0,
        error: null,
        attempts: 0,
        nextAttemptAt: null,
        lockedAt: null,
        lockedBy: null,
      },
    });

    void kickIndexingWorker();

    return {
      success: true,
      message: "Indexing job queued successfully",
    };
  } catch (error) {
    console.error("Error retrying indexing job:", error);
    throw error;
  }
}

export async function wakeIndexingWorkerForProject(projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!dbUser) {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);

      if (clerkUser.emailAddresses[0]?.emailAddress) {
        dbUser = await prisma.user.findUnique({
          where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
          select: { id: true },
        });
      }
    }

    if (!dbUser) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUser.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    void kickIndexingWorker();

    return { success: true as const };
  } catch (error) {
    console.error("Error waking indexing worker:", error);
    throw error;
  }
}

export async function cancelIndexingJob(projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!dbUser) {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);

      if (clerkUser.emailAddresses[0]?.emailAddress) {
        dbUser = await prisma.user.findUnique({
          where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
          select: { id: true },
        });
      }
    }

    if (!dbUser) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUser.id,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    await prisma.indexingJob.update({
      where: { projectId },
      data: {
        status: "failed",
        error: "Cancelled by user",
        lockedAt: null,
        lockedBy: null,
      },
    });

    return {
      success: true,
      message: "Indexing job cancelled",
    };
  } catch (error) {
    console.error("Error cancelling indexing job:", error);
    throw error;
  }
}

export type SetBaselineResult =
  | {
    success: true;
    indexedCommitSha: string;
    indexedBranch: string;
    indexedAt: string;
    alreadySet: boolean;
  }
  | { success: false; error: string };

function describeGithubFetchError(e: unknown): string {
  const status =
    (e as { status?: number })?.status ??
    (e as { response?: { status?: number } })?.response?.status;
  if (status === 401) {
    return "GitHub rejected the credentials. Add or refresh this project's access token, then try again.";
  }
  if (status === 403) {
    return "GitHub denied access - usually a rate limit, or a token without the 'repo' scope (private repos need it). Try again in a few minutes.";
  }
  if (status === 404) {
    return "Repository or its default branch wasn't found on GitHub. It may be private, renamed, or deleted.";
  }
  const msg = e instanceof Error ? e.message : "";
  return msg
    ? `Couldn't read the current HEAD from GitHub: ${msg}`
    : "Couldn't reach GitHub to read the current HEAD commit.";
}

export async function setProjectBaselineNow(
  projectId: string
): Promise<SetBaselineResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "You must be signed in." };

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) return { success: false, error: "User account not found." };

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: dbUserId, deletedAt: null },
      select: {
        id: true,
        repoUrl: true,
        githubToken: true,
        indexedCommitSha: true,
        indexedBranch: true,
        indexedAt: true,
      },
    });
    if (!project) {
      return {
        success: false,
        error: "Project not found, or you don't have access to it.",
      };
    }

    if (project.indexedCommitSha && project.indexedBranch) {
      return {
        success: true,
        indexedCommitSha: project.indexedCommitSha,
        indexedBranch: project.indexedBranch,
        indexedAt: (project.indexedAt ?? new Date()).toISOString(),
        alreadySet: true,
      };
    }

    const token =
      (project.githubToken ? decryptSecret(project.githubToken) : null) ||
      process.env.GITHUB_TOKEN ||
      undefined;

    const branch = await resolveGithubDefaultBranch(project.repoUrl, token);

    let sha: string;
    try {
      sha = await fetchBranchHeadSha(project.repoUrl, branch, token);
    } catch (githubError) {
      console.error("[setProjectBaselineNow] getRef failed:", githubError);
      return { success: false, error: describeGithubFetchError(githubError) };
    }

    const indexedAt = new Date();
    await prisma.project.update({
      where: { id: projectId },
      data: {
        indexedCommitSha: sha,
        indexedBranch: branch,
        indexedAt,
      },
    });

    return {
      success: true,
      indexedCommitSha: sha,
      indexedBranch: branch,
      indexedAt: indexedAt.toISOString(),
      alreadySet: false,
    };
  } catch (error) {
    console.error("Error setting project baseline:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to set the baseline. Please try again.",
    };
  }
}
