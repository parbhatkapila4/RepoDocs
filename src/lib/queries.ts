import prisma from './prisma';
import { Project, Prisma } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

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

export async function createProjectWithAuth(name: string, githubUrl: string): Promise<Project> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    if (!name || !githubUrl) {
      throw new Error('Name and GitHub URL are required');
    }

    const project = await prisma.project.create({
      data: {
        name,
        repoUrl: githubUrl,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

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
