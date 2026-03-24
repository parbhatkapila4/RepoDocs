import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

async function getDbUserId(clerkUserId: string): Promise<string | null> {
  let dbUser = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { id: true },
  });

  if (!dbUser) {
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        dbUser = await prisma.user.findUnique({
          where: { emailAddress: email },
          select: { id: true },
        });
      }
    } catch {
      return null;
    }
  }

  return dbUser?.id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as
      | { projectId?: string }
      | null;
    const projectId = body?.projectId?.trim();
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      message: "Indexing job queued",
    });
  } catch (error) {
    console.error("Error queueing indexing job:", error);
    return NextResponse.json(
      { error: "Failed to queue indexing job" },
      { status: 500 }
    );
  }
}

