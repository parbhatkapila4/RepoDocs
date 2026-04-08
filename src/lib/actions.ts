"use server";

import { after } from "next/server";
import { createProjectWithAuth } from "./queries";
import { kickIndexingWorker } from "./indexing-worker-kick";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { withPrismaRetry } from "./prisma-retry";
import { getDbUserId } from "./get-db-user-id";
import { isLikelyGitHubRateLimitMessage } from "./github-rate-limit-message";
import { githubCoreQuotaRecovered } from "./github-rate-limit-status";
import { getGitHubRepositoryInfo, type GitHubRepoInfo } from "./github";
import type { Project } from "@prisma/client";

export type CreateProjectResult =
  | { project: Project; error?: undefined }
  | { project: null; error: string };

const PLAN_LIMITS = {
  starter: { maxProjects: 3 },
  professional: { maxProjects: 10 },
  enterprise: { maxProjects: Infinity },
} as const;

function normalizePlanName(plan: string): keyof typeof PLAN_LIMITS {
  const planLower = plan.toLowerCase();
  if (planLower === "pro" || planLower === "professional") {
    return "professional";
  }
  if (planLower === "enterprise" || planLower === "ent") {
    return "enterprise";
  }
  return "starter";
}

export async function createProject(
  name: string,
  githubUrl: string,
  githubToken?: string
): Promise<CreateProjectResult> {
  try {
    const project = await createProjectWithAuth(name, githubUrl, githubToken);
    void kickIndexingWorker();
    return { project };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create project";
    return { project: null, error: message };
  }
}

export async function getCurrentUser() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    let user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        emailAddress: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        credits: true,
        plan: true,
      },
    });

    if (!user) {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);

      if (clerkUser.emailAddresses[0]?.emailAddress) {
        user = await prisma.user.upsert({
          where: {
            emailAddress: clerkUser.emailAddresses[0].emailAddress,
          },
          update: {
            imageUrl: clerkUser.imageUrl,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
          },
          create: {
            id: userId,
            emailAddress: clerkUser.emailAddresses[0].emailAddress,
            imageUrl: clerkUser.imageUrl,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
          },
          select: {
            id: true,
            emailAddress: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            credits: true,
            plan: true,
          },
        });
      }
    }

    if (user) {
      const normalizedPlan = user.plan
        ? normalizePlanName(user.plan)
        : "starter";
      return { ...user, plan: normalizedPlan };
    }
    return null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function getUserProjectCount() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return 0;
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!dbUser) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        if (clerkUser.emailAddresses[0]?.emailAddress) {
          dbUser = await prisma.user.findUnique({
            where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
            select: { id: true },
          });
        }
      } catch {
        return 0;
      }
    }

    if (!dbUser) {
      return 0;
    }

    const count = await prisma.project.count({
      where: {
        userId: dbUser.id,
        deletedAt: null,
      },
    });

    return count;
  } catch (error) {
    console.error("Error getting user project count:", error);
    return 0;
  }
}

export async function checkProjectLimit() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        canCreate: false,
        reason: "Not authenticated",
        currentCount: 0,
        maxProjects: 3,
        plan: "starter",
      };
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!dbUser) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        if (clerkUser.emailAddresses[0]?.emailAddress) {
          dbUser = await prisma.user.findUnique({
            where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
            select: { id: true },
          });
        }
      } catch {
        return {
          canCreate: false,
          reason: "User not found",
          currentCount: 0,
          maxProjects: 3,
          plan: "starter",
        };
      }
    }

    if (!dbUser) {
      return {
        canCreate: false,
        reason: "User not found",
        currentCount: 0,
        maxProjects: 3,
        plan: "starter",
      };
    }

    let plan: keyof typeof PLAN_LIMITS = "starter";
    try {
      const result = await prisma.$queryRaw<
        { plan: string }[]
      >`SELECT plan FROM "User" WHERE id = ${dbUser.id} LIMIT 1`;
      if (result && result[0]?.plan) {
        plan = normalizePlanName(result[0].plan);
      }
    } catch {
      plan = "starter";
    }

    const maxProjects = PLAN_LIMITS[plan]?.maxProjects ?? 3;

    const projectCount = await prisma.project.count({
      where: {
        userId: dbUser.id,
        deletedAt: null,
      },
    });

    if (maxProjects === Infinity) {
      return {
        canCreate: true,
        currentCount: projectCount,
        maxProjects: Infinity,
        plan,
      };
    }

    if (projectCount >= maxProjects) {
      return {
        canCreate: false,
        reason:
          plan === "starter"
            ? `You've reached the maximum of ${maxProjects} projects on the ${plan} plan. Please upgrade to Professional for 10 projects or Enterprise for unlimited.`
            : `You've reached the maximum of ${maxProjects} projects on the ${plan} plan. Please upgrade to Enterprise for unlimited projects.`,
        currentCount: projectCount,
        maxProjects,
        plan,
      };
    }

    return {
      canCreate: true,
      currentCount: projectCount,
      maxProjects,
      plan,
    };
  } catch (error) {
    console.error("Error checking project limit:", error);
    return {
      canCreate: true,
      reason: "Failed to check project limit",
      currentCount: 0,
      maxProjects: 3,
      plan: "starter",
    };
  }
}

async function isProjectWithinQuota(
  projectId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  let plan: keyof typeof PLAN_LIMITS = "starter";
  try {
    const result = await prisma.$queryRaw<
      { plan: string }[]
    >`SELECT plan FROM "User" WHERE id = ${userId} LIMIT 1`;
    if (result && result[0]?.plan) {
      plan = normalizePlanName(result[0].plan);
    }
  } catch {
    plan = "starter";
  }

  if (plan !== "starter") {
    return { allowed: true };
  }

  const maxProjects = PLAN_LIMITS[plan]?.maxProjects ?? 3;

  const userProjects = await prisma.project.findMany({
    where: {
      userId: userId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
    },
  });

  const projectIndex = userProjects.findIndex((p) => p.id === projectId);

  if (projectIndex !== -1 && projectIndex < maxProjects) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `This project exceeds your starter plan limit of ${maxProjects} projects. Please upgrade to Professional for 10 projects or Enterprise for unlimited.`,
  };
}

export async function updateUserCredits(credits: number) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        credits,
      },
      select: {
        id: true,
        emailAddress: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        credits: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error updating user credits:", error);
    throw new Error("Failed to update user credits");
  }
}

function isDatabaseUnreachable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1000", "P1017", "P1002"].includes(error.code);
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  const msg = error instanceof Error ? error.message : String(error);
  return /can't reach database|connection refused|timeout|ECONNREFUSED|ETIMEDOUT/i.test(
    msg
  );
}

export async function getUserProjects() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return [];
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!dbUser) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        if (clerkUser.emailAddresses[0]?.emailAddress) {
          dbUser = await prisma.user.findUnique({
            where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
            select: { id: true },
          });
        }
      } catch {
        return [];
      }
    }

    if (!dbUser) {
      return [];
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: dbUser.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        repoUrl: true,
        createdAt: true,
      },
    });

    return projects;
  } catch (error) {
    console.error("Error fetching user projects:", error);
    if (isDatabaseUnreachable(error)) {
      throw new Error(
        "Cannot reach the database. If you use Neon: resume the project in the Neon console, confirm DATABASE_URL uses the pooled connection string, and ensure sslmode=require. Then retry."
      );
    }
    return [];
  }
}

export async function fetchRepositoryInfo(
  repoUrl: string
): Promise<{ data: any } | { error: string }> {
  try {
    const repoInfo = await getGitHubRepositoryInfo(repoUrl);
    if (!repoInfo) return { error: "Repository not found" };
    return { data: repoInfo };
  } catch (error: any) {
    console.error("Error fetching repository information:", error);
    const status = error?.status ?? error?.response?.status;
    const msg = error?.message ?? "";
    if (
      status === 403 ||
      msg.toLowerCase().includes("rate limit") ||
      msg.toLowerCase().includes("quota exhausted")
    ) {
      const resetHeader = error?.response?.headers?.["x-ratelimit-reset"];
      let resetNote = "";
      if (resetHeader) {
        const secs = Math.max(0, Number(resetHeader) - Math.floor(Date.now() / 1000));
        resetNote = ` reset in ${secs}s`;
      }
      return {
        error: `GitHub API rate limit reached${resetNote}. Try again in a few minutes.`,
      };
    }
    return { error: "Failed to fetch repository information" };
  }
}

export async function deleteUserProject(projectId: string) {
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
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        if (clerkUser.emailAddresses[0]?.emailAddress) {
          dbUser = await prisma.user.findUnique({
            where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
            select: { id: true },
          });
        }
      } catch {
        throw new Error("User not found");
      }
    }

    if (!dbUser) {
      throw new Error("User not found");
    }

    const project = await prisma.project.update({
      where: {
        id: projectId,
        userId: dbUser.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return project;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw new Error("Failed to delete project");
  }
}

export async function getProjectReadme(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
      select: {
        id: true,
        content: true,
        prompt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return readme;
  } catch (error) {
    console.error("Error fetching project README:", error);
    throw new Error("Failed to fetch README");
  }
}

export async function regenerateProjectReadme(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const quotaCheck = await isProjectWithinQuota(projectId, dbUserId);
    if (!quotaCheck.allowed) {
      throw new Error(`UPGRADE_REQUIRED: ${quotaCheck.reason}`);
    }

    const sourceCodeEmbeddings = await prisma.sourceCodeEmbeddings.findMany({
      where: {
        projectId: projectId,
      },
      select: {
        Summary: true,
      },
    });

    if (sourceCodeEmbeddings.length === 0) {
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

      let repoInfo: Partial<GitHubRepoInfo> | null = null;
      try {
        repoInfo = await getGitHubRepositoryInfo(
          project.repoUrl,
          project.githubToken || undefined
        );
        if (!repoInfo) {
          repoInfo = await getGitHubRepositoryInfo(project.repoUrl);
        }
      } catch (repoError) {
        console.error("Error fetching repo info:", repoError);
      }

      if (!repoInfo) {
        repoInfo = {
          name: project.name,
          htmlUrl: project.repoUrl,
          description: null,
          language: null,
          stars: 0,
          forks: 0,
        };
      }

      const { generateReadmeFromCodebase } = await import("./gemini");
      const readmeContent = await generateReadmeFromCodebase(
        project.name,
        [],
        repoInfo
      );

      const readme = await prisma.readme.upsert({
        where: {
          projectId: projectId,
        },
        update: {
          content: readmeContent,
          prompt: `Generated demo/preview README for ${project.name} based on repository metadata. Indexing is in progress (takes 5-15 minutes) - please regenerate README after indexing completes for comprehensive documentation.`,
          updatedAt: new Date(),
        },
        create: {
          content: readmeContent,
          prompt: `Generated demo/preview README for ${project.name} based on repository metadata. Indexing is in progress (takes 5-15 minutes) - please regenerate README after indexing completes for comprehensive documentation.`,
          projectId: projectId,
        },
      });

      return readme;
    }

    const summaries = sourceCodeEmbeddings.map(
      (embedding) => embedding.Summary
    );

    let repoInfo: Partial<GitHubRepoInfo> | null = null;
    try {
      repoInfo = await getGitHubRepositoryInfo(
        project.repoUrl,
        project.githubToken || undefined
      );

      if (!repoInfo) {
        repoInfo = await getGitHubRepositoryInfo(project.repoUrl);
      }
    } catch (repoError) {
      console.error("Error fetching repo info:", repoError);
    }

    if (!repoInfo) {
      repoInfo = {
        name: project.name,
        htmlUrl: project.repoUrl,
        description: null,
        language: null,
        stars: 0,
        forks: 0,
      };
    }

    const { generateReadmeFromCodebase } = await import("./gemini");
    const readmeContent = await generateReadmeFromCodebase(
      project.name,
      summaries,
      repoInfo
    );

    const readme = await prisma.readme.upsert({
      where: {
        projectId: projectId,
      },
      update: {
        content: readmeContent,
        prompt: `Regenerated README for ${project.name} based on codebase analysis`,
        updatedAt: new Date(),
      },
      create: {
        content: readmeContent,
        prompt: `Generated README for ${project.name} based on codebase analysis`,
        projectId: projectId,
      },
    });

    return readme;
  } catch (error) {
    console.error("Error regenerating project README:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to regenerate README: ${errorMessage}`);
  }
}

export async function modifyReadmeWithQna(projectId: string, question: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const quotaCheck = await isProjectWithinQuota(projectId, dbUserId);
    if (!quotaCheck.allowed) {
      throw new Error(`UPGRADE_REQUIRED: ${quotaCheck.reason}`);
    }

    const currentReadme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!currentReadme) {
      throw new Error("No README found for this project");
    }

    const { modifyReadmeWithQuery } = await import("./gemini");
    const modifiedContent = await modifyReadmeWithQuery(
      currentReadme.content,
      question,
      project.name
    );

    const updatedReadme = await prisma.readme.update({
      where: {
        projectId: projectId,
      },
      data: {
        content: modifiedContent,
        prompt: `Modified README for ${project.name} based on user query: ${question}`,
        updatedAt: new Date(),
      },
    });

    const qnaRecord = await prisma.readmeQna.create({
      data: {
        question: question,
        answer: `README modified based on your request: "${question}"`,
        updatedContent: modifiedContent,
        readmeId: currentReadme.id,
      },
    });

    return {
      readme: updatedReadme,
      qnaRecord: qnaRecord,
    };
  } catch (error) {
    console.error("Error modifying README with Q&A:", error);
    throw new Error("Failed to modify README");
  }
}

export async function getReadmeQnaHistory(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
      include: {
        qnaHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return readme;
  } catch (error) {
    console.error("Error fetching README Q&A history:", error);
    throw new Error("Failed to fetch Q&A history");
  }
}

export async function getReadmeShare(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!readme) {
      return null;
    }

    const share = await prisma.readmeShare.findUnique({
      where: {
        readmeId: readme.id,
      },
    });

    return share;
  } catch (error) {
    console.error("Error getting README share:", error);
    return null;
  }
}

export async function createReadmeShare(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: dbUserId },
      select: { plan: true },
    });

    const userPlan = user?.plan ? normalizePlanName(user.plan) : "starter";
    if (userPlan === "starter") {
      throw new Error(
        "Sharing is only available for Professional and Enterprise plans. Please upgrade to share your README."
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!readme) {
      throw new Error("No README found for this project");
    }

    const existingShare = await prisma.readmeShare.findUnique({
      where: {
        readmeId: readme.id,
      },
    });

    if (existingShare && existingShare.isActive) {
      return existingShare;
    }

    const shareToken = crypto.randomUUID();

    const share = await prisma.readmeShare.upsert({
      where: {
        readmeId: readme.id,
      },
      update: {
        shareToken: shareToken,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        shareToken: shareToken,
        isActive: true,
        readmeId: readme.id,
      },
    });

    return share;
  } catch (error) {
    console.error("Error creating README share:", error);
    throw new Error("Failed to create share link");
  }
}

export async function getPublicReadme(shareToken: string) {
  try {
    const share = await prisma.readmeShare.findUnique({
      where: {
        shareToken: shareToken,
        isActive: true,
      },
      include: {
        readme: {
          include: {
            project: {
              select: {
                name: true,
                repoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!share) {
      throw new Error("Share link not found or expired");
    }

    return share;
  } catch (error) {
    console.error("Error fetching public README:", error);
    throw new Error("Failed to fetch public README");
  }
}

export async function revokeReadmeShare(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!readme) {
      throw new Error("No README found for this project");
    }

    const share = await prisma.readmeShare.update({
      where: {
        readmeId: readme.id,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return share;
  } catch (error) {
    console.error("Error revoking README share:", error);
    throw new Error("Failed to revoke share link");
  }
}

export async function getProjectDocs(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
      select: {
        id: true,
        content: true,
        prompt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return docs;
  } catch (error) {
    console.error("Error fetching project docs:", error);
    throw new Error("Failed to fetch docs");
  }
}

export async function getProjectWithToken(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
      select: {
        repoUrl: true,
        githubToken: true,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    return { repoUrl: project.repoUrl, githubToken: project.githubToken };
  } catch (error) {
    console.error("Error fetching project with token:", error);
    return null;
  }
}

const embeddingsStatusEmpty = {
  hasEmbeddings: false,
  count: 0,
  indexing: false,
  progress: 0,
  phase: "fast" as const,
  filesTotal: 0,
  filesProcessed: 0,
  jobError: null,
};

export async function checkEmbeddingsStatus(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return embeddingsStatusEmpty;
    }

    return await withPrismaRetry(async () => {
      const dbUserId = await getDbUserId(userId);
      if (!dbUserId) {
        throw new Error("User not found");
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: dbUserId,
          deletedAt: null,
        },
      });

      if (!project) {
        throw new Error("Project not found or unauthorized");
      }

      const embeddingsCount = await prisma.sourceCodeEmbeddings.count({
        where: { projectId },
      });

      type JobExtras = {
        phase?: string;
        filesTotal?: number;
        filesProcessed?: number;
      };

      const now = new Date();
      const staleProcessingThreshold = new Date(now.getTime() - 5 * 60 * 1000);

      let job = await prisma.indexingJob.findUnique({
        where: { projectId },
      });

      if (job?.status === "processing") {
        if (!job.lockedAt || job.lockedAt < staleProcessingThreshold) {
          await prisma.indexingJob.update({
            where: { projectId },
            data: {
              status: "queued",
              progress: 0,
              error: null,
              lockedAt: null,
              lockedBy: null,
              updatedAt: now,
            },
          });
        }
      }

      job = await prisma.indexingJob.findUnique({
        where: { projectId },
      });

      if (embeddingsCount === 0) {
        if (!job || job.status === "failed") {
          await prisma.indexingJob.upsert({
            where: { projectId },
            create: { projectId, status: "queued", progress: 0 },
            update: {
              status: "queued",
              progress: 0,
              error: null,
              lockedAt: null,
              lockedBy: null,
            },
          });
        }
      }

      job = await prisma.indexingJob.findUnique({
        where: { projectId },
      });

      if (job?.error && isLikelyGitHubRateLimitMessage(job.error)) {
        const ghAuth =
          project.githubToken || process.env.GITHUB_TOKEN || undefined;
        const recovered = await githubCoreQuotaRecovered(ghAuth);
        if (recovered) {
          const prevStatus = job.status;
          await prisma.indexingJob.update({
            where: { projectId },
            data: {
              error: null,
              ...(prevStatus === "failed"
                ? {
                  status: "queued",
                  lockedAt: null,
                  lockedBy: null,
                }
                : {}),
              updatedAt: now,
            },
          });
          job = await prisma.indexingJob.findUnique({
            where: { projectId },
          });
        }
      }

      if (job?.status === "queued" && job.lockedAt == null) {
        void kickIndexingWorker();
      }
      const jobExtrasFresh = job as
        | (typeof job & JobExtras)
        | null;

      const isIndexing = job
        ? job.status === "queued" || job.status === "processing"
        : false;

      return {
        hasEmbeddings: embeddingsCount > 0,
        count: embeddingsCount,
        indexing: isIndexing,
        progress: job?.progress ?? 0,
        phase: jobExtrasFresh?.phase ?? "fast",
        filesTotal: jobExtrasFresh?.filesTotal ?? 0,
        filesProcessed: jobExtrasFresh?.filesProcessed ?? 0,
        jobError: job?.error ?? null,
      };
    });
  } catch (error) {
    console.error("Error checking embeddings status:", error);
    return embeddingsStatusEmpty;
  }
}

export async function retryIndexing(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
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
        lockedAt: null,
        lockedBy: null,
      },
    });

    void kickIndexingWorker();

    return { success: true, message: "Indexing restarted successfully" };
  } catch (error) {
    console.error("Error retrying indexing:", error);
    throw new Error("Failed to restart indexing");
  }
}

export async function getIndexingDiagnostics(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const embeddingsCount = await prisma.sourceCodeEmbeddings.count({
      where: { projectId: projectId },
    });

    const hasGeminiKey = !!(
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
    );
    const hasGitHubToken = !!process.env.GITHUB_TOKEN;

    return {
      projectId,
      repoUrl: project.repoUrl,
      hasProjectToken: !!project.githubToken,
      embeddingsCount,
      hasGeminiApiKey: hasGeminiKey,
      hasGitHubToken,
      lastUpdated: project.updatedAt,
      diagnostics: {
        missingApiKeys: !hasGeminiKey
          ? ["GEMINI_API_KEY or GOOGLE_GENAI_API_KEY"]
          : [],
        recommendations: [
          !hasGeminiKey
            ? "Set GEMINI_API_KEY or GOOGLE_GENAI_API_KEY environment variable"
            : null,
          embeddingsCount === 0
            ? "No embeddings found - indexing may have failed. Check server logs for errors."
            : null,
          !hasGitHubToken && !project.githubToken
            ? "No GitHub token available - may fail for private repositories"
            : null,
        ].filter(Boolean),
      },
    };
  } catch (error) {
    console.error("Error getting indexing diagnostics:", error);
    throw new Error("Failed to get indexing diagnostics");
  }
}

export async function regenerateProjectDocs(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const quotaCheck = await isProjectWithinQuota(projectId, dbUserId);
    if (!quotaCheck.allowed) {
      throw new Error(`UPGRADE_REQUIRED: ${quotaCheck.reason}`);
    }

    const sourceCodeEmbeddings = await prisma.sourceCodeEmbeddings.findMany({
      where: {
        projectId: projectId,
      },
      select: {
        Summary: true,
      },
    });

    if (sourceCodeEmbeddings.length === 0) {
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

      let repoInfo: Partial<GitHubRepoInfo> | null = null;
      try {
        repoInfo = await getGitHubRepositoryInfo(
          project.repoUrl,
          project.githubToken || undefined
        );
        if (!repoInfo) {
          repoInfo = await getGitHubRepositoryInfo(project.repoUrl);
        }
      } catch (repoError) {
        console.error("Error fetching repo info:", repoError);
      }

      if (!repoInfo) {
        repoInfo = {
          name: project.name,
          htmlUrl: project.repoUrl,
          description: null,
          language: null,
          stars: 0,
          forks: 0,
        };
      }

      const { generateDocsFromCodebase } = await import("./gemini");
      const docsContent = await generateDocsFromCodebase(
        project.name,
        [],
        repoInfo
      );

      const docs = await prisma.docs.upsert({
        where: {
          projectId: projectId,
        },
        update: {
          content: docsContent,
          prompt: `Generated demo/preview docs for ${project.name} based on repository metadata. Indexing is in progress (takes 5-15 minutes) - please regenerate docs after indexing completes for comprehensive documentation.`,
          updatedAt: new Date(),
        },
        create: {
          content: docsContent,
          prompt: `Generated demo/preview docs for ${project.name} based on repository metadata. Indexing is in progress (takes 5-15 minutes) - please regenerate docs after indexing completes for comprehensive documentation.`,
          projectId: projectId,
        },
      });

      return docs;
    }

    const summaries = sourceCodeEmbeddings.map(
      (embedding) => embedding.Summary
    );

    let repoInfo: Partial<GitHubRepoInfo> | null = null;
    try {
      repoInfo = await getGitHubRepositoryInfo(
        project.repoUrl,
        project.githubToken || undefined
      );

      if (!repoInfo) {
        repoInfo = await getGitHubRepositoryInfo(project.repoUrl);
      }
    } catch (repoError) {
      console.error("Error fetching repo info:", repoError);
    }

    if (!repoInfo) {
      repoInfo = {
        name: project.name,
        htmlUrl: project.repoUrl,
        description: null,
        language: null,
        stars: 0,
        forks: 0,
      };
    }

    const { generateDocsFromCodebase } = await import("./gemini");
    const docsContent = await generateDocsFromCodebase(
      project.name,
      summaries,
      repoInfo
    );

    const docs = await prisma.docs.upsert({
      where: {
        projectId: projectId,
      },
      update: {
        content: docsContent,
        prompt: `Regenerated comprehensive docs for ${project.name} based on codebase analysis`,
        updatedAt: new Date(),
      },
      create: {
        content: docsContent,
        prompt: `Generated comprehensive docs for ${project.name} based on codebase analysis`,
        projectId: projectId,
      },
    });

    return docs;
  } catch (error) {
    console.error("Error regenerating project docs:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to regenerate docs: ${errorMessage}`);
  }
}

export async function enqueueReadmeRegeneration(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Please sign in and try again.");

  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) throw new Error("User not found");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: dbUserId, deletedAt: null },
  });
  if (!project) throw new Error("Project not found or unauthorized");

  const quotaCheck = await isProjectWithinQuota(projectId, dbUserId);
  if (!quotaCheck.allowed) {
    throw new Error(`UPGRADE_REQUIRED: ${quotaCheck.reason}`);
  }

  const existing = await prisma.backgroundJob.findFirst({
    where: {
      projectId,
      kind: "readme_regen",
      status: "running",
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return { jobId: existing.id, continuing: true as const };
  }

  const job = await prisma.backgroundJob.create({
    data: {
      userId: dbUserId,
      projectId,
      kind: "readme_regen",
      status: "running",
    },
  });

  after(async () => {
    try {
      await regenerateProjectReadme(projectId);
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: { status: "completed", completedAt: new Date() },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          error: msg.slice(0, 2000),
        },
      });
    }
  });

  return { jobId: job.id, continuing: false as const };
}

export async function enqueueDocsRegeneration(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) throw new Error("User not found");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: dbUserId, deletedAt: null },
  });
  if (!project) throw new Error("Project not found or unauthorized");

  const quotaCheck = await isProjectWithinQuota(projectId, dbUserId);
  if (!quotaCheck.allowed) {
    throw new Error(`UPGRADE_REQUIRED: ${quotaCheck.reason}`);
  }

  const existing = await prisma.backgroundJob.findFirst({
    where: {
      projectId,
      kind: "docs_regen",
      status: "running",
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return { jobId: existing.id, continuing: true as const };
  }

  const job = await prisma.backgroundJob.create({
    data: {
      userId: dbUserId,
      projectId,
      kind: "docs_regen",
      status: "running",
    },
  });

  after(async () => {
    try {
      await regenerateProjectDocs(projectId);
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: { status: "completed", completedAt: new Date() },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          error: msg.slice(0, 2000),
        },
      });
    }
  });

  return { jobId: job.id, continuing: false as const };
}

export async function getBackgroundJob(jobId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) throw new Error("User not found");

  const job = await withPrismaRetry(() =>
    prisma.backgroundJob.findFirst({
      where: { id: jobId, userId: dbUserId },
      select: {
        id: true,
        status: true,
        kind: true,
        error: true,
        completedAt: true,
        projectId: true,
        createdAt: true,
      },
    })
  );

  if (!job) return null;
  return job;
}

export async function modifyDocsWithQna(projectId: string, question: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const quotaCheck = await isProjectWithinQuota(projectId, dbUserId);
    if (!quotaCheck.allowed) {
      throw new Error(`UPGRADE_REQUIRED: ${quotaCheck.reason}`);
    }

    const currentDocs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!currentDocs) {
      throw new Error("No docs found for this project");
    }

    const { modifyDocsWithQuery } = await import("./gemini");
    const modifiedContent = await modifyDocsWithQuery(
      currentDocs.content,
      question,
      project.name
    );

    const updatedDocs = await prisma.docs.update({
      where: {
        projectId: projectId,
      },
      data: {
        content: modifiedContent,
        prompt: `Modified docs for ${project.name} based on user query: ${question}`,
        updatedAt: new Date(),
      },
    });

    const qnaRecord = await prisma.docsQna.create({
      data: {
        question: question,
        answer: `Documentation modified based on your request: "${question}"`,
        updatedContent: modifiedContent,
        docsId: currentDocs.id,
      },
    });

    return {
      docs: updatedDocs,
      qnaRecord: qnaRecord,
    };
  } catch (error) {
    console.error("Error modifying docs with Q&A:", error);

    if (error instanceof Error) {
      const msg = error.message;
      if (
        msg === "Unauthorized" ||
        msg === "User not found" ||
        msg.startsWith("Project not found") ||
        msg.startsWith("No docs found") ||
        msg.startsWith("UPGRADE_REQUIRED:") ||
        msg.includes("OPENROUTER_API_KEY") ||
        msg.includes("OpenRouter API error") ||
        msg.includes("Failed to modify docs with AI") ||
        msg.includes("Documentation modification resulted in missing sections") ||
        msg.includes("removed too many sections")
      ) {
        throw error;
      }
      if (process.env.NODE_ENV === "development") {
        throw new Error(`Failed to modify docs: ${msg}`);
      }
    }

    throw new Error(
      "Failed to modify docs. Check that OPENROUTER_API_KEY is set and try again."
    );
  }
}

export async function getDocsQnaHistory(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
      include: {
        qnaHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return docs;
  } catch (error) {
    console.error("Error fetching docs Q&A history:", error);
    throw new Error("Failed to fetch Q&A history");
  }
}

export async function getDocsShare(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!docs) {
      return null;
    }

    const share = await prisma.docsShare.findUnique({
      where: {
        docsId: docs.id,
      },
    });

    return share;
  } catch (error) {
    console.error("Error getting docs share:", error);
    return null;
  }
}

export async function createDocsShare(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: dbUserId },
      select: { plan: true },
    });

    const userPlan = user?.plan ? normalizePlanName(user.plan) : "starter";
    if (userPlan === "starter") {
      throw new Error(
        "Sharing is only available for Professional and Enterprise plans. Please upgrade to share your documentation."
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!docs) {
      throw new Error("No docs found for this project");
    }

    const existingShare = await prisma.docsShare.findUnique({
      where: {
        docsId: docs.id,
      },
    });

    if (existingShare && existingShare.isActive) {
      return existingShare;
    }

    const shareToken = crypto.randomUUID();

    const share = await prisma.docsShare.upsert({
      where: {
        docsId: docs.id,
      },
      update: {
        shareToken: shareToken,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        shareToken: shareToken,
        isActive: true,
        docsId: docs.id,
      },
    });

    return share;
  } catch (error) {
    console.error("Error creating docs share:", error);
    throw new Error("Failed to create share link");
  }
}

export async function getPublicDocs(shareToken: string) {
  try {
    const share = await prisma.docsShare.findUnique({
      where: {
        shareToken: shareToken,
        isActive: true,
      },
      include: {
        docs: {
          include: {
            project: {
              select: {
                name: true,
                repoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!share) {
      return null;
    }

    return share;
  } catch (error) {
    console.error("Error fetching public docs:", error);
    return null;
  }
}

export async function revokeDocsShare(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!docs) {
      throw new Error("No docs found for this project");
    }

    const share = await prisma.docsShare.update({
      where: {
        docsId: docs.id,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return share;
  } catch (error) {
    console.error("Error revoking docs share:", error);
    throw new Error("Failed to revoke share link");
  }
}

export async function deleteReadmeQnaRecord(projectId: string, qnaId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!readme) {
      throw new Error("No README found for this project");
    }

    await prisma.readmeQna.delete({
      where: {
        id: qnaId,
        readmeId: readme.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting README Q&A record:", error);
    throw new Error("Failed to delete Q&A record");
  }
}

export async function deleteAllReadmeQnaHistory(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!readme) {
      throw new Error("No README found for this project");
    }

    await prisma.readmeQna.deleteMany({
      where: {
        readmeId: readme.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting all README Q&A history:", error);
    throw new Error("Failed to delete Q&A history");
  }
}

export async function deleteDocsQnaRecord(projectId: string, qnaId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!docs) {
      throw new Error("No docs found for this project");
    }

    await prisma.docsQna.delete({
      where: {
        id: qnaId,
        docsId: docs.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting docs Q&A record:", error);
    throw new Error("Failed to delete Q&A record");
  }
}

export async function deleteAllDocsQnaHistory(projectId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error("User not found");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!docs) {
      throw new Error("No docs found for this project");
    }

    await prisma.docsQna.deleteMany({
      where: {
        docsId: docs.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting all docs Q&A history:", error);
    throw new Error("Failed to delete Q&A history");
  }
}
