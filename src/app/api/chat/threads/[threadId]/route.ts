import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { log } from "@/lib/logger";
import {
  requireAuthAndRateLimit,
  requirePaidPlan,
  isGuardFailure,
} from "@/lib/api-guards";
import {
  getThreadMessages,
  updateThread,
  deleteThread,
} from "@/lib/chat-threads";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ threadId: string }> };

const PatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
    mode: z.enum(["guidance", "default"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });
const notFound = () =>
  NextResponse.json(
    {
      error: "Conversation not found",
      message: "This conversation no longer exists.",
    },
    { status: 404 },
  );

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const guard = await requireAuthAndRateLimit(request);
    if (isGuardFailure(guard)) return guard.response;

    const gate = await requirePaidPlan(guard.dbUserId, "chat");
    if (isGuardFailure(gate)) return gate.response;

    const { threadId } = await context.params;
    const result = await getThreadMessages(threadId, guard.dbUserId);
    if (!result) return notFound();

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    log.error("[chat/threads/:id] GET failed", error);
    return NextResponse.json(
      {
        error: "Failed to load conversation",
        message: "This conversation could not be loaded. Please try again.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const guard = await requireAuthAndRateLimit(request);
    if (isGuardFailure(guard)) return guard.response;

    const gate = await requirePaidPlan(guard.dbUserId, "chat");
    if (isGuardFailure(gate)) return gate.response;

    const parsed = PatchSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Nothing to update.",
        },
        { status: 400 },
      );
    }

    const { threadId } = await context.params;
    const thread = await updateThread({
      threadId,
      userId: guard.dbUserId,
      ...parsed.data,
    });
    if (!thread) return notFound();

    return NextResponse.json({ success: true, thread });
  } catch (error) {
    log.error("[chat/threads/:id] PATCH failed", error);
    return NextResponse.json(
      {
        error: "Failed to update conversation",
        message: "The change could not be saved. Please try again.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const guard = await requireAuthAndRateLimit(request);
    if (isGuardFailure(guard)) return guard.response;

    const gate = await requirePaidPlan(guard.dbUserId, "chat");
    if (isGuardFailure(gate)) return gate.response;

    const { threadId } = await context.params;
    const deleted = await deleteThread(threadId, guard.dbUserId);
    if (!deleted) return notFound();

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("[chat/threads/:id] DELETE failed", error);
    return NextResponse.json(
      {
        error: "Failed to delete conversation",
        message: "The conversation could not be deleted. Please try again.",
      },
      { status: 500 },
    );
  }
}
