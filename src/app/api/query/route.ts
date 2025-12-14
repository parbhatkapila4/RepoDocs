import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { queryCodebase } from "@/lib/rag";

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

    const body = await request.json();
    const { projectId, question, conversationHistory } = body;

    if (!projectId || !question) {
      return NextResponse.json(
        { error: "Project ID and question are required" },
        { status: 400 }
      );
    }

    if (typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question must be a non-empty string" },
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

    const embeddingsCount = await prisma.sourceCodeEmbiddings.count({
      where: {
        projectId: projectId,
      },
    });

    if (embeddingsCount === 0) {
      return NextResponse.json(
        {
          error: "Project not indexed yet",
          message:
            "This project has not been indexed yet. Please wait for the indexing to complete.",
        },
        { status: 400 }
      );
    }

    const result = await queryCodebase(
      projectId,
      question,
      conversationHistory
    );

    try {
      await prisma.$executeRaw`
        INSERT INTO "CodebaseQueries" ("projectId", "question", "answer", "sourcesCount", "createdAt")
        VALUES (${projectId}, ${question}, ${result.answer}, ${result.sources.length}, NOW())
      `;
    } catch (dbError) {}

    return NextResponse.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      metadata: {
        sourcesCount: result.sources.length,
        projectName: project.name,
      },
    });
  } catch (error) {
    console.error("Error in query endpoint:", error);

    return NextResponse.json(
      {
        error: "Failed to process query",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
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

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

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

    try {
      const queries = await prisma.$queryRaw<
        {
          id: string;
          question: string;
          answer: string;
          sourcesCount: number;
          createdAt: Date;
        }[]
      >`
        SELECT id, question, answer, "sourcesCount", "createdAt"
        FROM "CodebaseQueries"
        WHERE "projectId" = ${projectId}
        ORDER BY "createdAt" DESC
        LIMIT 50
      `;

      return NextResponse.json({
        success: true,
        queries,
      });
    } catch (error) {
      return NextResponse.json({
        success: true,
        queries: [],
      });
    }
  } catch (error) {
    console.error("Error fetching query history:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch query history",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
