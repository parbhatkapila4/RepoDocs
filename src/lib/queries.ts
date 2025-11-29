import prisma from './prisma';
import { Project, Prisma } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { indexGithubRepository } from './github';

// Plan limits constants
const PLAN_LIMITS = {
  starter: { maxProjects: 3 },
  professional: { maxProjects: 10 },
  enterprise: { maxProjects: Infinity },
} as const;

export async function createProject(data: Prisma.ProjectCreateInput): Promise<Project> {
  try {
    const project = await prisma.project.create({
      data,
    });

    return project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
}

export async function createProjectWithAuth(name: string, githubUrl: string, githubToken?: string): Promise<Project> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    if (!name || !githubUrl) {
      throw new Error('Name and GitHub URL are required');
    }

    // First, ensure the user exists in the database
    let existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      // User doesn't exist with this ID - check by email or create
      console.log('User not found by ID, checking by email...');
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        
        if (clerkUser.emailAddresses[0]?.emailAddress) {
          const userEmail = clerkUser.emailAddresses[0].emailAddress;
          
          // Check if user exists with this email
          existingUser = await prisma.user.findUnique({
            where: { emailAddress: userEmail },
          });
          
          if (existingUser) {
            // User exists with email but different ID - update their info
            console.log('User found by email, updating...');
            existingUser = await prisma.user.update({
              where: { emailAddress: userEmail },
              data: {
                imageUrl: clerkUser.imageUrl,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
              },
            });
          } else {
            // Create new user
            console.log('Creating new user...');
            existingUser = await prisma.user.create({
              data: {
                id: userId,
                emailAddress: userEmail,
                imageUrl: clerkUser.imageUrl,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
              },
            });
          }
          console.log('User ready');
        } else {
          throw new Error('User email not found');
        }
      } catch (userError) {
        console.error('Error handling user:', userError);
        throw new Error('Failed to create user account');
      }
    }

    // Now check project limit using the actual user ID from database
    let plan: keyof typeof PLAN_LIMITS = 'starter';
    try {
      const planResult = await prisma.$queryRaw<{plan: string}[]>`SELECT plan FROM "User" WHERE id = ${existingUser.id} LIMIT 1`;
      if (planResult && planResult[0]?.plan) {
        plan = planResult[0].plan as keyof typeof PLAN_LIMITS;
      }
    } catch {
      plan = 'starter';
    }

    const maxProjects = PLAN_LIMITS[plan]?.maxProjects ?? 3;

    const projectCount = await prisma.project.count({
      where: {
        userId: existingUser.id, // Use the actual user ID
        deletedAt: null,
      },
    });

    if (projectCount >= maxProjects) {
      const upgradeMessage = plan === 'starter' 
        ? 'Please upgrade to Professional for 10 projects or Enterprise for unlimited projects.'
        : plan === 'professional'
        ? 'Please upgrade to Enterprise for unlimited projects.'
        : '';
      throw new Error(`PROJECT_LIMIT_REACHED: You've reached the maximum of ${maxProjects} projects on the ${plan} plan. ${upgradeMessage}`);
    }

    const project = await prisma.project.create({
      data: {
        name,
        repoUrl: githubUrl,
        user: {
          connect: {
            id: existingUser.id, // Use the actual user ID from database
          },
        },
      },
    });

    // Index the GitHub repository after project creation
    try {
      await indexGithubRepository(project.id, githubUrl, githubToken);
      console.log(`Successfully indexed repository for project: ${project.name}`);
    } catch (indexingError) {
      console.error('Error indexing GitHub repository:', indexingError);
      // Don't throw here - project creation succeeded, indexing failed
      // The project can still be used, just without the indexed content
    }

    return project;
  } catch (error) {
    console.error('Error creating project:', error);
    if (error instanceof Error && error.message.startsWith('PROJECT_LIMIT_REACHED:')) {
      throw error;
    }
    throw new Error('Failed to create project');
  }
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  try {
    const projects = await prisma.project.findMany({
      where: {
        userId: userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects;
  } catch (error) {
    console.error('Error fetching user projects:', error);
    throw new Error('Failed to fetch projects');
  }
}

export async function getProjectById(projectId: string, userId: string): Promise<Project | null> {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId,
        deletedAt: null,
      },
    });

    return project;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw new Error('Failed to fetch project');
  }
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: Prisma.ProjectUpdateInput
): Promise<Project> {
  try {
    const project = await prisma.project.update({
      where: {
        id: projectId,
        userId: userId,
      },
      data,
    });

    return project;
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }
}

export async function deleteProject(projectId: string, userId: string): Promise<Project> {
  try {
    const project = await prisma.project.update({
      where: {
        id: projectId,
        userId: userId,
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
