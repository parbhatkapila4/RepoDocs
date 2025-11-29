'use server';

import { createProjectWithAuth } from './queries';
import { auth } from '@clerk/nextjs/server';
import prisma from './prisma';
import { getGitHubRepositoryInfo, type GitHubRepoInfo } from './github';

// Plan limits constants
const PLAN_LIMITS = {
  starter: { maxProjects: 3 },
  professional: { maxProjects: 10 },
  enterprise: { maxProjects: Infinity },
} as const;

// Normalize plan names (handles variations like "pro" -> "professional")
function normalizePlanName(plan: string): keyof typeof PLAN_LIMITS {
  const planLower = plan.toLowerCase();
  if (planLower === 'pro' || planLower === 'professional') {
    return 'professional';
  }
  if (planLower === 'enterprise' || planLower === 'ent') {
    return 'enterprise';
  }
  return 'starter';
}

// Helper function to get the actual database user ID from Clerk userId
async function getDbUserId(clerkUserId: string): Promise<string | null> {
  // First try to find user by Clerk ID
  let dbUser = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { id: true },
  });

  // If not found by ID, try to find by email
  if (!dbUser) {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);
      
      if (clerkUser.emailAddresses[0]?.emailAddress) {
        dbUser = await prisma.user.findUnique({
          where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
          select: { id: true },
        });
      }
    } catch {
      return null;
    }
  }

  return dbUser?.id || null;
}

export async function createProject(name: string, githubUrl: string, githubToken?: string) {
  return await createProjectWithAuth(name, githubUrl, githubToken);
}

export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    // Query user including plan field
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
      const { clerkClient } = await import('@clerk/nextjs/server');
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

    // Ensure plan is set and normalized, default to 'starter' if not available
    if (user) {
      const normalizedPlan = user.plan ? normalizePlanName(user.plan) : 'starter';
      return { ...user, plan: normalizedPlan };
    }
    return null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function getUserProjectCount() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return 0;
    }

    // First try to find user by Clerk ID
    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    // If not found by ID, try to find by email
    if (!dbUser) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
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
        userId: dbUser.id, // Use the actual database user ID
        deletedAt: null,
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting user project count:', error);
    return 0;
  }
}

export async function checkProjectLimit() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { canCreate: false, reason: 'Not authenticated', currentCount: 0, maxProjects: 3, plan: 'starter' };
    }

    // First try to find user by Clerk ID
    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    // If not found by ID, try to find by email
    if (!dbUser) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        
        if (clerkUser.emailAddresses[0]?.emailAddress) {
          dbUser = await prisma.user.findUnique({
            where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
            select: { id: true },
          });
        }
      } catch {
        // If we can't get the user, return default
        return { canCreate: false, reason: 'User not found', currentCount: 0, maxProjects: 3, plan: 'starter' };
      }
    }

    if (!dbUser) {
      return { canCreate: false, reason: 'User not found', currentCount: 0, maxProjects: 3, plan: 'starter' };
    }

    // Try to get the user's plan, but handle case where plan field doesn't exist
    let plan: keyof typeof PLAN_LIMITS = 'starter';
    try {
      // Use raw query to avoid errors if plan column doesn't exist in DB
      const result = await prisma.$queryRaw<{plan: string}[]>`SELECT plan FROM "User" WHERE id = ${dbUser.id} LIMIT 1`;
      if (result && result[0]?.plan) {
        plan = normalizePlanName(result[0].plan);
      }
    } catch {
      // If plan field doesn't exist yet in DB, default to starter
      plan = 'starter';
    }

    const maxProjects = PLAN_LIMITS[plan]?.maxProjects ?? 3;

    const projectCount = await prisma.project.count({
      where: {
        userId: dbUser.id, // Use the actual database user ID
        deletedAt: null,
      },
    });

    // If maxProjects is Infinity, allow unlimited projects
    if (maxProjects === Infinity) {
      return {
        canCreate: true,
        currentCount: projectCount,
        maxProjects: Infinity,
        plan,
      };
    }

    // Only block if they've reached the limit
    if (projectCount >= maxProjects) {
      return {
        canCreate: false,
        reason: plan === 'starter' 
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
    console.error('Error checking project limit:', error);
    // On error, allow creation to prevent blocking users
    return { canCreate: true, reason: 'Failed to check project limit', currentCount: 0, maxProjects: 3, plan: 'starter' };
  }
}

// Helper function to check if a project is within the user's allowed quota
async function isProjectWithinQuota(projectId: string, userId: string): Promise<{ allowed: boolean; reason?: string }> {
  let plan: keyof typeof PLAN_LIMITS = 'starter';
  try {
    // Use raw query to avoid errors if plan column doesn't exist in DB
    const result = await prisma.$queryRaw<{plan: string}[]>`SELECT plan FROM "User" WHERE id = ${userId} LIMIT 1`;
    if (result && result[0]?.plan) {
      plan = normalizePlanName(result[0].plan);
    }
  } catch {
    // If plan field doesn't exist yet in DB, default to starter
    plan = 'starter';
  }
  
  // Professional and Enterprise users have no limits
  if (plan !== 'starter') {
    return { allowed: true };
  }

  const maxProjects = PLAN_LIMITS[plan]?.maxProjects ?? 3;

  // Get the user's projects sorted by creation date
  const userProjects = await prisma.project.findMany({
    where: {
      userId: userId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
    },
  });

  // Find the index of the current project
  const projectIndex = userProjects.findIndex(p => p.id === projectId);
  
  // If project is within the first N allowed projects, allow it
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
      throw new Error('Unauthorized');
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
    console.error('Error updating user credits:', error);
    throw new Error('Failed to update user credits');
  }
}

export async function getUserProjects() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return [];
    }

    // First try to find user by Clerk ID
    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    // If not found by ID, try to find by email
    if (!dbUser) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        
        if (clerkUser.emailAddresses[0]?.emailAddress) {
          dbUser = await prisma.user.findUnique({
            where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
            select: { id: true },
          });
        }
      } catch {
        // If we can't get the user, return empty
        return [];
      }
    }

    if (!dbUser) {
      return [];
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: dbUser.id, // Use the actual database user ID
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
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
    console.error('Error fetching user projects:', error);
    return [];
  }
}

export async function fetchRepositoryInfo(repoUrl: string) {
  try {
    const repoInfo = await getGitHubRepositoryInfo(repoUrl);
    return repoInfo;
  } catch (error) {
    console.error('Error fetching repository information:', error);
    return null;
  }
}

export async function deleteUserProject(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First try to find user by Clerk ID
    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    // If not found by ID, try to find by email
    if (!dbUser) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        
        if (clerkUser.emailAddresses[0]?.emailAddress) {
          dbUser = await prisma.user.findUnique({
            where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
            select: { id: true },
          });
        }
      } catch {
        throw new Error('User not found');
      }
    }

    if (!dbUser) {
      throw new Error('User not found');
    }

    const project = await prisma.project.update({
      where: {
        id: projectId,
        userId: dbUser.id, // Use the actual database user ID
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return project;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}

export async function getProjectReadme(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
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
    console.error('Error fetching project README:', error);
    throw new Error('Failed to fetch README');
  }
}

export async function regenerateProjectReadme(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Check if project is within the user's quota
    const quotaCheck = await isProjectWithinQuota(projectId, dbUserId);
    if (!quotaCheck.allowed) {
      throw new Error(`UPGRADE_REQUIRED: ${quotaCheck.reason}`);
    }

    // Get all source code summaries for the project
    const sourceCodeEmbeddings = await prisma.sourceCodeEmbiddings.findMany({
      where: {
        projectId: projectId,
      },
      select: {
        Summary: true,
      },
    });

    if (sourceCodeEmbeddings.length === 0) {
      throw new Error('No source code data found for README generation');
    }

    const summaries = sourceCodeEmbeddings.map(embedding => embedding.Summary);
    
    // Get repository info with retry and proper token
    let repoInfo: Partial<GitHubRepoInfo> | null = null;
    try {
      // Try with project's GitHub token first, then fallback to env token
      repoInfo = await getGitHubRepositoryInfo(project.repoUrl, project.githubToken || undefined);
      
      // If that fails, try again without token (public repos)
      if (!repoInfo) {
        console.log('Retrying repo info fetch without token...');
        repoInfo = await getGitHubRepositoryInfo(project.repoUrl);
      }
    } catch (repoError) {
      console.error('Error fetching repo info:', repoError);
    }
    
    // Only use minimal fallback if we absolutely can't get repo info
    if (!repoInfo) {
      console.warn('Using minimal fallback for repo info - some data may be missing');
      repoInfo = {
        name: project.name,
        htmlUrl: project.repoUrl,
        description: null,
        language: null,
        stars: 0,
        forks: 0,
      };
    }
    
    // Import the generateReadmeFromCodebase function
    const { generateReadmeFromCodebase } = await import('./gemini');
    const readmeContent = await generateReadmeFromCodebase(project.name, summaries, repoInfo);

    // Update or create README
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
    console.error('Error regenerating project README:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to regenerate README: ${errorMessage}`);
  }
}

export async function modifyReadmeWithQna(projectId: string, question: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Check if project is within the user's quota
    const quotaCheck = await isProjectWithinQuota(projectId, dbUserId);
    if (!quotaCheck.allowed) {
      throw new Error(`UPGRADE_REQUIRED: ${quotaCheck.reason}`);
    }

    // Get current README
    const currentReadme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!currentReadme) {
      throw new Error('No README found for this project');
    }

    // Import the modifyReadmeWithQuery function
    const { modifyReadmeWithQuery } = await import('./gemini');
    const modifiedContent = await modifyReadmeWithQuery(currentReadme.content, question, project.name);

    // Update README with new content
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

    // Save Q&A history
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
    console.error('Error modifying README with Q&A:', error);
    throw new Error('Failed to modify README');
  }
}

export async function getReadmeQnaHistory(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get README and its Q&A history
    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
      include: {
        qnaHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return readme;
  } catch (error) {
    console.error('Error fetching README Q&A history:', error);
    throw new Error('Failed to fetch Q&A history');
  }
}

export async function getReadmeShare(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get README
    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!readme) {
      return null;
    }

    // Get existing share record
    const share = await prisma.readmeShare.findUnique({
      where: {
        readmeId: readme.id,
      },
    });

    return share;
  } catch (error) {
    console.error('Error getting README share:', error);
    return null;
  }
}

export async function createReadmeShare(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Check user plan - sharing is only for Professional and Enterprise
    const user = await prisma.user.findUnique({
      where: { id: dbUserId },
      select: { plan: true },
    });
    
    const userPlan = user?.plan ? normalizePlanName(user.plan) : 'starter';
    if (userPlan === 'starter') {
      throw new Error('Sharing is only available for Professional and Enterprise plans. Please upgrade to share your README.');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get README
    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!readme) {
      throw new Error('No README found for this project');
    }

    // Check if there's already an active share
    const existingShare = await prisma.readmeShare.findUnique({
      where: {
        readmeId: readme.id,
      },
    });

    // If there's an active share, return it instead of creating a new one
    if (existingShare && existingShare.isActive) {
      return existingShare;
    }

    // Generate a unique share token
    const shareToken = crypto.randomUUID();

    // Create or update share record
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
    console.error('Error creating README share:', error);
    throw new Error('Failed to create share link');
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
      throw new Error('Share link not found or expired');
    }

    return share;
  } catch (error) {
    console.error('Error fetching public README:', error);
    throw new Error('Failed to fetch public README');
  }
}

export async function revokeReadmeShare(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get README
    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!readme) {
      throw new Error('No README found for this project');
    }

    // Deactivate share
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
    console.error('Error revoking README share:', error);
    throw new Error('Failed to revoke share link');
  }
}

// Docs-related actions
export async function getProjectDocs(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
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
    console.error('Error fetching project docs:', error);
    throw new Error('Failed to fetch docs');
  }
}

export async function regenerateProjectDocs(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Check if project is within the user's quota
    const quotaCheck = await isProjectWithinQuota(projectId, dbUserId);
    if (!quotaCheck.allowed) {
      throw new Error(`UPGRADE_REQUIRED: ${quotaCheck.reason}`);
    }

    // Get all source code summaries for the project
    const sourceCodeEmbeddings = await prisma.sourceCodeEmbiddings.findMany({
      where: {
        projectId: projectId,
      },
      select: {
        Summary: true,
      },
    });

    if (sourceCodeEmbeddings.length === 0) {
      throw new Error('No source code data found for docs generation');
    }

    const summaries = sourceCodeEmbeddings.map(embedding => embedding.Summary);
    
    // Get repository info with retry and proper token
    let repoInfo: Partial<GitHubRepoInfo> | null = null;
    try {
      // Try with project's GitHub token first, then fallback to env token
      repoInfo = await getGitHubRepositoryInfo(project.repoUrl, project.githubToken || undefined);
      
      // If that fails, try again without token (public repos)
      if (!repoInfo) {
        console.log('Retrying repo info fetch without token...');
        repoInfo = await getGitHubRepositoryInfo(project.repoUrl);
      }
    } catch (repoError) {
      console.error('Error fetching repo info:', repoError);
    }
    
    // Only use minimal fallback if we absolutely can't get repo info
    if (!repoInfo) {
      console.warn('Using minimal fallback for repo info - some data may be missing');
      repoInfo = {
        name: project.name,
        htmlUrl: project.repoUrl,
        description: null,
        language: null,
        stars: 0,
        forks: 0,
      };
    }
    
    // Import and generate docs
    const { generateDocsFromCodebase } = await import('./gemini');
    const docsContent = await generateDocsFromCodebase(project.name, summaries, repoInfo);

    // Update or create docs
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
    console.error('Error regenerating project docs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to regenerate docs: ${errorMessage}`);
  }
}

export async function modifyDocsWithQna(projectId: string, question: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Check if project is within the user's quota
    const quotaCheck = await isProjectWithinQuota(projectId, dbUserId);
    if (!quotaCheck.allowed) {
      throw new Error(`UPGRADE_REQUIRED: ${quotaCheck.reason}`);
    }

    // Get current docs
    const currentDocs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!currentDocs) {
      throw new Error('No docs found for this project');
    }

    // Import the modifyDocsWithQuery function
    const { modifyDocsWithQuery } = await import('./gemini');
    const modifiedContent = await modifyDocsWithQuery(currentDocs.content, question, project.name);

    // Update docs with new content
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

    // Save Q&A history
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
    console.error('Error modifying docs with Q&A:', error);
    throw new Error('Failed to modify docs');
  }
}

export async function getDocsQnaHistory(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get docs and its Q&A history
    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
      include: {
        qnaHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return docs;
  } catch (error) {
    console.error('Error fetching docs Q&A history:', error);
    throw new Error('Failed to fetch Q&A history');
  }
}

export async function getDocsShare(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get docs
    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!docs) {
      return null;
    }

    // Get existing share record
    const share = await prisma.docsShare.findUnique({
      where: {
        docsId: docs.id,
      },
    });

    return share;
  } catch (error) {
    console.error('Error getting docs share:', error);
    return null;
  }
}

export async function createDocsShare(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Check user plan - sharing is only for Professional and Enterprise
    const user = await prisma.user.findUnique({
      where: { id: dbUserId },
      select: { plan: true },
    });
    
    const userPlan = user?.plan ? normalizePlanName(user.plan) : 'starter';
    if (userPlan === 'starter') {
      throw new Error('Sharing is only available for Professional and Enterprise plans. Please upgrade to share your documentation.');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get docs
    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!docs) {
      throw new Error('No docs found for this project');
    }

    // Check if there's already an active share
    const existingShare = await prisma.docsShare.findUnique({
      where: {
        docsId: docs.id,
      },
    });

    // If there's an active share, return it instead of creating a new one
    if (existingShare && existingShare.isActive) {
      return existingShare;
    }

    // Generate a unique share token
    const shareToken = crypto.randomUUID();

    // Create or update share record
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
    console.error('Error creating docs share:', error);
    throw new Error('Failed to create share link');
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
    console.error('Error fetching public docs:', error);
    return null;
  }
}

export async function revokeDocsShare(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get docs
    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!docs) {
      throw new Error('No docs found for this project');
    }

    // Deactivate share
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
    console.error('Error revoking docs share:', error);
    throw new Error('Failed to revoke share link');
  }
}

export async function deleteReadmeQnaRecord(projectId: string, qnaId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get README to verify ownership
    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!readme) {
      throw new Error('No README found for this project');
    }

    // Delete the Q&A record
    await prisma.readmeQna.delete({
      where: {
        id: qnaId,
        readmeId: readme.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting README Q&A record:', error);
    throw new Error('Failed to delete Q&A record');
  }
}

export async function deleteAllReadmeQnaHistory(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get README to verify ownership
    const readme = await prisma.readme.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!readme) {
      throw new Error('No README found for this project');
    }

    // Delete all Q&A records for this README
    await prisma.readmeQna.deleteMany({
      where: {
        readmeId: readme.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting all README Q&A history:', error);
    throw new Error('Failed to delete Q&A history');
  }
}

export async function deleteDocsQnaRecord(projectId: string, qnaId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get docs to verify ownership
    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!docs) {
      throw new Error('No docs found for this project');
    }

    // Delete the Q&A record
    await prisma.docsQna.delete({
      where: {
        id: qnaId,
        docsId: docs.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting docs Q&A record:', error);
    throw new Error('Failed to delete Q&A record');
  }
}

export async function deleteAllDocsQnaHistory(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      throw new Error('User not found');
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Get docs to verify ownership
    const docs = await prisma.docs.findUnique({
      where: {
        projectId: projectId,
      },
    });

    if (!docs) {
      throw new Error('No docs found for this project');
    }

    // Delete all Q&A records for this docs
    await prisma.docsQna.deleteMany({
      where: {
        docsId: docs.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting all docs Q&A history:', error);
    throw new Error('Failed to delete Q&A history');
  }
}
