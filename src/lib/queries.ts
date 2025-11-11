import prisma from './prisma';
import { Project, Prisma } from '@prisma/client';
import { auth, currentUser } from '@clerk/nextjs/server';
import { indexGithubRepository } from './github';

export async function createProjectWithAuth(name: string, githubUrl: string, githubToken?: string): Promise<Project> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    if (!name || !githubUrl) {
      throw new Error('Name and GitHub URL are required');
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error('Unable to fetch user information');
    }
    const primaryEmail =
      clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      throw new Error('Unable to create project without a user email address');
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { emailAddress: primaryEmail },
    });

    if (existingByEmail && existingByEmail.id !== userId) {
      await prisma.user.delete({
        where: { id: existingByEmail.id },
      });
    }

    await prisma.user.upsert({
      where: { id: userId },
      update: {
        emailAddress: primaryEmail,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
      create: {
        id: userId,
        emailAddress: primaryEmail,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
    });

    const project = await prisma.project.create({
      data: {
        name,
        repoUrl: githubUrl,
        githubToken,
        user: {
          connect: {
            id: userId,
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
