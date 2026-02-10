"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";

/**
 * Get indexing status for a project
 * Safe to call frequently (polling from UI)
 */
export async function getIndexingStatus(projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify project ownership
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

    // Get indexing job status
    const job = await prisma.indexingJob.findUnique({
      where: { projectId },
      select: {
        status: true,
        progress: true,
        error: true,
        updatedAt: true,
        lockedAt: true,
      },
    });

    if (!job) {
      // No job exists yet
      return {
        status: "not_started" as const,
        progress: 0,
        error: null,
        updatedAt: null,
      };
    }

    return {
      status: job.status,
      progress: job.progress,
      error: job.error,
      updatedAt: job.updatedAt,
    };
  } catch (error) {
    console.error("Error fetching indexing status:", error);
    throw error;
  }
}

/**
 * Retry a failed indexing job or restart a completed one
 * 
 * IMPORTANT: This resets the job to queued status.
 * When the worker picks it up, indexing will restart from the beginning
 * (no resume/checkpoint capability).
 */
export async function retryIndexingJob(projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify project ownership
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

    // Check current job status
    const currentJob = await prisma.indexingJob.findUnique({
      where: { projectId },
      select: { status: true, lockedAt: true },
    });

    // Prevent retrying if currently processing (unless lease expired)
    if (currentJob?.status === "processing") {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (currentJob.lockedAt && currentJob.lockedAt > fiveMinutesAgo) {
        throw new Error("Job is currently being processed. Please wait.");
      }
    }

    // Reset job to queued
    // NOTE: When picked up, indexing will restart from the beginning
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
        lockedAt: null,
        lockedBy: null,
      },
    });

    return {
      success: true,
      message: "Indexing job queued successfully",
    };
  } catch (error) {
    console.error("Error retrying indexing job:", error);
    throw error;
  }
}

/**
 * Cancel an in-progress or queued indexing job
 */
export async function cancelIndexingJob(projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify project ownership (same pattern as above)
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

    // Mark as failed with cancellation message
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
