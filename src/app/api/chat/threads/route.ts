import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { log } from "@/lib/logger";
import {
  requireAuthAndRateLimit,
  requirePaidPlan,
  isGuardFailure,
} from "@/lib/api-guards";
import prisma from "@/lib/prisma";
import {
  listThreads,
  createThread,
  deriveThreadTitle,
} from "@/lib/chat-threads";

export const runtime = "nodejs";

const CreateSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().max(200).optional(),
  mode: z.enum(["guidance", "default"]).optional(),
});

async function ownsProject(
  projectId: string,
  dbUserId: string,
): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: dbUserId, deletedAt: null },
    select: { id: true },
  });
  return Boolean(project);
}

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuthAndRateLimit(request);
    if (isGuardFailure(guard)) return guard.response;

    const gate = await requirePaidPlan(guard.dbUserId, "chat");
    if (isGuardFailure(gate)) return gate.response;

    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        {
          error: "Project ID is required",
          message: "Select a project to load its conversations.",
        },
        { status: 400 },
      );
    }

    if (!(await ownsProject(projectId, guard.dbUserId))) {
      return NextResponse.json(
        {
          error: "Project not found or unauthorized",
          message:
            "This project doesn't exist or isn't accessible from the account you're signed in with.",
        },
        { status: 404 },
      );
    }

    const threads = await listThreads(guard.dbUserId, projectId);
    return NextResponse.json({ success: true, threads });
  } catch (error) {
    log.error("[chat/threads] GET failed", error);
    return NextResponse.json(
      {
        error: "Failed to load conversations",
        message: "Conversations could not be loaded. Please try again.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuthAndRateLimit(request);
    if (isGuardFailure(guard)) return guard.response;

    const gate = await requirePaidPlan(guard.dbUserId, "chat");
    if (isGuardFailure(gate)) return gate.response;

    const parsed = CreateSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "A project ID is required to start a conversation.",
        },
        { status: 400 },
      );
    }

    const { projectId, title, mode } = parsed.data;

    if (!(await ownsProject(projectId, guard.dbUserId))) {
      return NextResponse.json(
        {
          error: "Project not found or unauthorized",
          message:
            "This project doesn't exist or isn't accessible from the account you're signed in with.",
        },
        { status: 404 },
      );
    }

    const thread = await createThread({
      userId: guard.dbUserId,
      projectId,
      title: title ? deriveThreadTitle(title) : "New conversation",
      mode,
    });

    return NextResponse.json({ success: true, thread }, { status: 201 });
  } catch (error) {
    log.error("[chat/threads] POST failed", error);
    return NextResponse.json(
      {
        error: "Failed to create conversation",
        message: "The conversation could not be started. Please try again.",
      },
      { status: 500 },
    );
  }
}
