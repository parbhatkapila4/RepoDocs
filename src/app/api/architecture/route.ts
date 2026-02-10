import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { buildDependencyGraph } from "@/lib/architecture";

export const runtime = "nodejs";
export const maxDuration = 60;

async function getDbUserId(clerkUserId: string): Promise<string | null> {
  let dbUser = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { id: true },
  });

  if (!dbUser) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
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

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const projectId = request.nextUrl.searchParams.get("projectId");

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
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    const result = await buildDependencyGraph(projectId);

    return NextResponse.json({
      success: true,
      nodes: result.nodes,
      edges: result.edges,
    });
  } catch (error) {
    console.error("Error in architecture endpoint:", error);

    return NextResponse.json(
      {
        error: "Failed to build architecture graph",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
