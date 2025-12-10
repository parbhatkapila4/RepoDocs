import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database user ID
    let dbUserId = userId;
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      
      if (clerkUser.emailAddresses[0]?.emailAddress) {
        const dbUser = await prisma.user.findUnique({
          where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
          select: { id: true },
        });
        if (dbUser) {
          dbUserId = dbUser.id;
        }
      }
    } catch (error) {
      console.error('Error getting DB user:', error);
    }

    // Check if user is admin (you can add admin check logic here)
    // For now, we'll show analytics for the current user's data

    // User Statistics
    const totalUsers = await prisma.user.count();
    const usersByPlan = await prisma.user.groupBy({
      by: ['plan'],
      _count: true,
    });

    // Project Statistics
    const totalProjects = await prisma.project.count({
      where: { deletedAt: null },
    });
    
    const projectsByUser = await prisma.project.groupBy({
      by: ['userId'],
      where: { deletedAt: null },
      _count: true,
    });

    const projectsWithReadme = await prisma.project.count({
      where: {
        deletedAt: null,
        readme: { isNot: null },
      },
    });

    const projectsWithDocs = await prisma.project.count({
      where: {
        deletedAt: null,
        docs: { isNot: null },
      },
    });

    // Code Embeddings Statistics
    const totalEmbeddings = await prisma.sourceCodeEmbiddings.count();
    const embeddingsByProject = await prisma.sourceCodeEmbiddings.groupBy({
      by: ['projectId'],
      _count: true,
    });
    
    const avgFilesPerProject = embeddingsByProject.length > 0
      ? embeddingsByProject.reduce((sum, item) => sum + item._count, 0) / embeddingsByProject.length
      : 0;

    // Q&A Statistics
    const totalReadmeQuestions = await prisma.readmeQna.count();
    const totalDocsQuestions = await prisma.docsQna.count();
    const totalQuestions = totalReadmeQuestions + totalDocsQuestions;

    // Share Statistics
    const totalReadmeShares = await prisma.readmeShare.count({
      where: { isActive: true },
    });
    const totalDocsShares = await prisma.docsShare.count({
      where: { isActive: true },
    });
    const totalActiveShares = totalReadmeShares + totalDocsShares;

    // Recent Activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const recentProjects = await prisma.project.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
    });

    const recentQuestions = await prisma.readmeQna.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    }) + await prisma.docsQna.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Daily activity for the last 30 days
    const dailyActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const projects = await prisma.project.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
          deletedAt: null,
        },
      });

      const questions = await prisma.readmeQna.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
        },
      }) + await prisma.docsQna.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
        },
      });

      dailyActivity.push({
        date: date.toISOString().split('T')[0],
        projects,
        questions,
      });
    }

    // Top projects by embeddings (most indexed)
    const topProjectsByFiles = await prisma.sourceCodeEmbiddings.groupBy({
      by: ['projectId'],
      _count: true,
      orderBy: {
        _count: {
          projectId: 'desc',
        },
      },
      take: 10,
    });

    const topProjectsDetails = await Promise.all(
      topProjectsByFiles.map(async (item) => {
        const project = await prisma.project.findUnique({
          where: { id: item.projectId },
          select: {
            id: true,
            name: true,
            repoUrl: true,
            createdAt: true,
          },
        });
        return {
          ...project,
          fileCount: item._count,
        };
      })
    );

    // Language distribution (from file names - approximate)
    const allFiles = await prisma.sourceCodeEmbiddings.findMany({
      select: { fileName: true },
    });

    const languageMap: Record<string, number> = {};
    const extensions: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.jsx': 'JavaScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.go': 'Go',
      '.rs': 'Rust',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.vue': 'Vue',
      '.sh': 'Shell',
      '.sql': 'SQL',
      '.prisma': 'Prisma',
    };

    allFiles.forEach((file) => {
      const ext = file.fileName.substring(file.fileName.lastIndexOf('.'));
      const lang = extensions[ext] || 'Other';
      languageMap[lang] = (languageMap[lang] || 0) + 1;
    });

    const languageDistribution = Object.entries(languageMap)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // User engagement metrics
    const activeUsers = await prisma.user.count({
      where: {
        projects: {
          some: {
            deletedAt: null,
          },
        },
      },
    });

    const avgProjectsPerUser = totalUsers > 0 ? totalProjects / totalUsers : 0;
    const avgQuestionsPerProject = totalProjects > 0 ? totalQuestions / totalProjects : 0;

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
        usersByPlan: usersByPlan.map((item) => ({
          plan: item.plan,
          count: item._count,
        })),
        avgProjectsPerUser: Math.round(avgProjectsPerUser * 100) / 100,
      },
      projectMetrics: {
        totalProjects,
        projectsWithReadme,
        projectsWithDocs,
        avgFilesPerProject: Math.round(avgFilesPerProject * 100) / 100,
        topProjects: topProjectsDetails.filter((p) => p !== null),
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
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

