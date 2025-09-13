'use server';

import { createProjectWithAuth } from './queries';
import { auth } from '@clerk/nextjs/server';
import prisma from './prisma';

export async function createProject(name: string, githubUrl: string) {
  return await createProjectWithAuth(name, githubUrl);
}

export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
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
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
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
