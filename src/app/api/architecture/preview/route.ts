import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import { normalizePath } from "@/lib/architecture";
import {
  extractCodePreview,
  inferPrismLanguage,
} from "@/lib/architecture-preview";

export const runtime = "nodejs";
export const maxDuration = 30;

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
    const filePath = request.nextUrl.searchParams.get("path");

    if (!projectId || !filePath) {
      return NextResponse.json(
        { error: "projectId and path are required" },
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

    const want = normalizePath(filePath);

    const meta = await prisma.sourceCodeEmbeddings.findMany({
      where: { projectId },
      select: { id: true, fileName: true },
    });

    const hit = meta.find((m) => normalizePath(m.fileName) === want);
    if (!hit) {
      return NextResponse.json(
        {
          error: "not_indexed",
          message:
            "No indexed source for this path. Finish indexing or pick another file.",
        },
        { status: 404 }
      );
    }

    const row = await prisma.sourceCodeEmbeddings.findUnique({
      where: { id: hit.id },
      select: { sourceCode: true, Summary: true, fileName: true },
    });

    if (!row?.sourceCode) {
      return NextResponse.json(
        { error: "not_indexed", message: "Source not available." },
        { status: 404 }
      );
    }

    const preview = extractCodePreview(row.sourceCode);
    const language = inferPrismLanguage(row.fileName || filePath);

    return NextResponse.json({
      success: true,
      summary: row.Summary || null,
      segments: preview.segments,
      omittedBetween: preview.omittedBetween ?? null,
      language,
      totalLines: preview.totalLines,
      truncated: preview.truncated,
    });
  } catch (error) {
    console.error("architecture preview:", error);
    return NextResponse.json(
      {
        error: "Failed to load preview",
        message:
          error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
