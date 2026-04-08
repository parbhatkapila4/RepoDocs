import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import {
  buildDependencyGraph,
  buildQuickDependencyGraphFromGitTree,
} from "@/lib/architecture";

export const runtime = "nodejs";
export const maxDuration = 60;

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

    let result = await buildDependencyGraph(projectId);
    const embeddingsCount = await prisma.sourceCodeEmbeddings.count({
      where: { projectId },
    });
    let indexingJob = await prisma.indexingJob.findUnique({
      where: { projectId },
      select: { status: true, progress: true, error: true, updatedAt: true },
    });

    if (embeddingsCount === 0) {
      if (!indexingJob || indexingJob.status === "failed") {
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
      }

      const origin = request.nextUrl.origin;
      void fetch(`${origin}/api/indexing-worker`).catch(() => {
      });

      try {
        const quickGraph = (await Promise.race([
          buildQuickDependencyGraphFromGitTree(
            project.repoUrl,
            project.githubToken || process.env.GITHUB_TOKEN || undefined
          ),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
        ])) as
          | Awaited<ReturnType<typeof buildQuickDependencyGraphFromGitTree>>
          | null;

        if (quickGraph && quickGraph.nodes.length > 0) {
          result = quickGraph;
        }
      } catch {
      }

      indexingJob = await prisma.indexingJob.findUnique({
        where: { projectId },
        select: { status: true, progress: true, error: true, updatedAt: true },
      });
    }

    return NextResponse.json({
      success: true,
      nodes: result.nodes,
      edges: result.edges,
      diagnostics: {
        embeddingsCount,
        indexingStatus: indexingJob?.status ?? null,
        indexingProgress: indexingJob?.progress ?? 0,
        indexingError: indexingJob?.error ?? null,
        indexingUpdatedAt: indexingJob?.updatedAt ?? null,
      },
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
