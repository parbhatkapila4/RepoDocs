import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import {
  rateLimit,
  getRateLimitIdentifier,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limiter";

export const runtime = "nodejs";

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".js": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".java": "Java",
  ".cpp": "C++",
  ".c": "C",
  ".cs": "C#",
  ".go": "Go",
  ".rs": "Rust",
  ".php": "PHP",
  ".rb": "Ruby",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".vue": "Vue",
  ".sh": "Shell",
  ".sql": "SQL",
  ".prisma": "Prisma",
};

function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

function buildLanguageDistribution(files: { fileName: string }[]) {
  const languageMap: Record<string, number> = {};
  files.forEach((file) => {
    const idx = file.fileName.lastIndexOf(".");
    const ext = idx >= 0 ? file.fileName.substring(idx) : "";
    const lang = EXTENSION_TO_LANGUAGE[ext] || "Other";
    languageMap[lang] = (languageMap[lang] || 0) + 1;
  });
  return Object.entries(languageMap)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(
      getRateLimitIdentifier(request, userId),
      RATE_LIMITS.API
    );
    if (!rl.success) return rateLimitResponse(rl.resetTime);

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: dbUserId },
      select: { emailAddress: true, plan: true, createdAt: true },
    });

    const isAdmin =
      !!currentUser?.emailAddress &&
      getAdminEmails().has(currentUser.emailAddress.toLowerCase());

    let projectIds: string[] = [];
    if (!isAdmin) {
      const myProjects = await prisma.project.findMany({
        where: { userId: dbUserId, deletedAt: null },
        select: { id: true },
      });
      projectIds = myProjects.map((p) => p.id);
    }

    const embeddingsWhere = isAdmin ? {} : { projectId: { in: projectIds } };
    const projectWhere = isAdmin
      ? { deletedAt: null }
      : { userId: dbUserId, deletedAt: null };
    const readmeQnaWhere = isAdmin
      ? {}
      : { readme: { projectId: { in: projectIds } } };
    const docsQnaWhere = isAdmin
      ? {}
      : { docs: { projectId: { in: projectIds } } };
    const readmeShareWhere = isAdmin
      ? { isActive: true }
      : { isActive: true, readme: { projectId: { in: projectIds } } };
    const docsShareWhere = isAdmin
      ? { isActive: true }
      : { isActive: true, docs: { projectId: { in: projectIds } } };

    let totalUsers: number;
    let activeUsers: number;
    let usersByPlan: Array<{ plan: string; count: number }>;
    if (isAdmin) {
      totalUsers = await prisma.user.count();
      const grouped = await prisma.user.groupBy({
        by: ["plan"],
        _count: true,
      });
      usersByPlan = grouped.map((item) => ({
        plan: item.plan,
        count: item._count,
      }));
      activeUsers = await prisma.user.count({
        where: { projects: { some: { deletedAt: null } } },
      });
    } else {
      totalUsers = 1;
      usersByPlan = [{ plan: currentUser?.plan ?? "starter", count: 1 }];
      activeUsers = projectIds.length > 0 ? 1 : 0;
    }

    const totalProjects = await prisma.project.count({ where: projectWhere });

    const projectsWithReadme = await prisma.project.count({
      where: { ...projectWhere, readme: { isNot: null } },
    });
    const projectsWithDocs = await prisma.project.count({
      where: { ...projectWhere, docs: { isNot: null } },
    });

    const totalEmbeddings = await prisma.sourceCodeEmbeddings.count({
      where: embeddingsWhere,
    });
    const embeddingsByProject = await prisma.sourceCodeEmbeddings.groupBy({
      by: ["projectId"],
      where: embeddingsWhere,
      _count: true,
    });
    const avgFilesPerProject =
      embeddingsByProject.length > 0
        ? embeddingsByProject.reduce((sum, item) => sum + item._count, 0) /
        embeddingsByProject.length
        : 0;

    const totalReadmeQuestions = await prisma.readmeQna.count({
      where: readmeQnaWhere,
    });
    const totalDocsQuestions = await prisma.docsQna.count({
      where: docsQnaWhere,
    });
    const totalQuestions = totalReadmeQuestions + totalDocsQuestions;

    const totalReadmeShares = await prisma.readmeShare.count({
      where: readmeShareWhere,
    });
    const totalDocsShares = await prisma.docsShare.count({
      where: docsShareWhere,
    });
    const totalActiveShares = totalReadmeShares + totalDocsShares;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = isAdmin
      ? await prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
      : currentUser?.createdAt && currentUser.createdAt >= thirtyDaysAgo
        ? 1
        : 0;

    const recentProjects = await prisma.project.count({
      where: { ...projectWhere, createdAt: { gte: thirtyDaysAgo } },
    });

    const recentQuestions =
      (await prisma.readmeQna.count({
        where: { ...readmeQnaWhere, createdAt: { gte: thirtyDaysAgo } },
      })) +
      (await prisma.docsQna.count({
        where: { ...docsQnaWhere, createdAt: { gte: thirtyDaysAgo } },
      }));

    const dailyActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const projects = await prisma.project.count({
        where: { ...projectWhere, createdAt: { gte: date, lt: nextDate } },
      });

      const questions =
        (await prisma.readmeQna.count({
          where: { ...readmeQnaWhere, createdAt: { gte: date, lt: nextDate } },
        })) +
        (await prisma.docsQna.count({
          where: { ...docsQnaWhere, createdAt: { gte: date, lt: nextDate } },
        }));

      dailyActivity.push({
        date: date.toISOString().split("T")[0],
        projects,
        questions,
      });
    }

    const topProjectsByFiles = await prisma.sourceCodeEmbeddings.groupBy({
      by: ["projectId"],
      where: embeddingsWhere,
      _count: true,
      orderBy: {
        _count: {
          projectId: "desc",
        },
      },
      take: 10,
    });

    const topIds = topProjectsByFiles.map((item) => item.projectId);
    const topDetails = topIds.length
      ? await prisma.project.findMany({
        where: { id: { in: topIds } },
        select: { id: true, name: true, repoUrl: true, createdAt: true },
      })
      : [];
    const detailsById = new Map(topDetails.map((p) => [p.id, p]));
    const topProjects = topProjectsByFiles
      .map((item) => {
        const details = detailsById.get(item.projectId);
        if (!details) return null;
        return { ...details, fileCount: item._count };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const allFiles = await prisma.sourceCodeEmbeddings.findMany({
      where: embeddingsWhere,
      select: { fileName: true },
    });
    const languageDistribution = buildLanguageDistribution(allFiles);

    const avgProjectsPerUser = totalUsers > 0 ? totalProjects / totalUsers : 0;
    const avgQuestionsPerProject =
      totalProjects > 0 ? totalQuestions / totalProjects : 0;

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalProjects,
        totalEmbeddings,
        totalQuestions,
        totalActiveShares,
      },
      userMetrics: {
        totalUsers,
        activeUsers,
        usersByPlan,
        avgProjectsPerUser: Math.round(avgProjectsPerUser * 100) / 100,
      },
      projectMetrics: {
        totalProjects,
        projectsWithReadme,
        projectsWithDocs,
        avgFilesPerProject: Math.round(avgFilesPerProject * 100) / 100,
        topProjects,
      },
      codeMetrics: {
        totalEmbeddings,
        avgFilesPerProject: Math.round(avgFilesPerProject * 100) / 100,
        languageDistribution,
      },
      engagementMetrics: {
        totalQuestions,
        totalReadmeQuestions,
        totalDocsQuestions,
        avgQuestionsPerProject: Math.round(avgQuestionsPerProject * 100) / 100,
        totalActiveShares,
      },
      recentActivity: {
        last30Days: {
          newUsers: recentUsers,
          newProjects: recentProjects,
          newQuestions: recentQuestions,
        },
        dailyActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
