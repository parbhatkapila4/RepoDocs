import "server-only";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export type ChatSource = {
  fileName: string;
  similarity: number;
  summary: string;
};

export type ChatMessageDto = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[] | null;
  status: "complete" | "error";
  createdAt: string;
};

export type ChatThreadSummary = {
  id: string;
  projectId: string;
  title: string;
  mode: string;
  pinned: boolean;
  archived: boolean;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  messageCount: number;
  createdAt: string;
};

const TITLE_MAX = 64;
const PREVIEW_MAX = 180;
export function deriveThreadTitle(question: string): string {
  const flat = question.replace(/\s+/g, " ").trim();
  if (!flat) return "New conversation";
  if (flat.length <= TITLE_MAX) return flat;

  const cut = flat.slice(0, TITLE_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > TITLE_MAX * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}

function toPreview(content: string): string {
  const flat = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/[#*_>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > PREVIEW_MAX ? `${flat.slice(0, PREVIEW_MAX)}…` : flat;
}

function toMessageDto(row: {
  id: string;
  role: string;
  content: string;
  sources: Prisma.JsonValue;
  status: string;
  createdAt: Date;
}): ChatMessageDto {
  return {
    id: row.id,
    role: row.role === "user" ? "user" : "assistant",
    content: row.content,
    sources: Array.isArray(row.sources)
      ? (row.sources as unknown as ChatSource[])
      : null,
    status: row.status === "error" ? "error" : "complete",
    createdAt: row.createdAt.toISOString(),
  };
}

function toThreadSummary(row: {
  id: string;
  projectId: string;
  title: string;
  mode: string;
  pinned: boolean;
  archived: boolean;
  lastMessageAt: Date;
  lastMessagePreview: string | null;
  messageCount: number;
  createdAt: Date;
}): ChatThreadSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    mode: row.mode,
    pinned: row.pinned,
    archived: row.archived,
    lastMessageAt: row.lastMessageAt.toISOString(),
    lastMessagePreview: row.lastMessagePreview,
    messageCount: row.messageCount,
    createdAt: row.createdAt.toISOString(),
  };
}

const SUMMARY_SELECT = {
  id: true,
  projectId: true,
  title: true,
  mode: true,
  pinned: true,
  archived: true,
  lastMessageAt: true,
  lastMessagePreview: true,
  messageCount: true,
  createdAt: true,
} as const;

export async function listThreads(
  userId: string,
  projectId: string,
): Promise<ChatThreadSummary[]> {
  const rows = await prisma.chatThread.findMany({
    where: { userId, projectId },
    select: SUMMARY_SELECT,
    orderBy: [{ pinned: "desc" }, { lastMessageAt: "desc" }],
    take: 200,
  });
  return rows.map(toThreadSummary);
}

export async function getThreadMessages(
  threadId: string,
  userId: string,
): Promise<{ thread: ChatThreadSummary; messages: ChatMessageDto[] } | null> {
  const thread = await prisma.chatThread.findFirst({
    where: { id: threadId, userId },
    select: SUMMARY_SELECT,
  });
  if (!thread) return null;

  const messages = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      sources: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    thread: toThreadSummary(thread),
    messages: messages.map(toMessageDto),
  };
}

export async function createThread(params: {
  userId: string;
  projectId: string;
  title: string;
  mode?: string;
}): Promise<ChatThreadSummary> {
  const row = await prisma.chatThread.create({
    data: {
      userId: params.userId,
      projectId: params.projectId,
      title: params.title,
      mode: params.mode ?? "default",
    },
    select: SUMMARY_SELECT,
  });
  return toThreadSummary(row);
}

export async function resolveThread(params: {
  threadId?: string | null;
  userId: string;
  projectId: string;
  question: string;
  mode: string;
}): Promise<ChatThreadSummary | null> {
  if (params.threadId) {
    const existing = await prisma.chatThread.findFirst({
      where: {
        id: params.threadId,
        userId: params.userId,
        projectId: params.projectId,
      },
      select: SUMMARY_SELECT,
    });
    return existing ? toThreadSummary(existing) : null;
  }

  return createThread({
    userId: params.userId,
    projectId: params.projectId,
    title: deriveThreadTitle(params.question),
    mode: params.mode,
  });
}

export async function appendMessage(params: {
  threadId: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[] | null;
  status?: "complete" | "error";
}): Promise<ChatMessageDto> {
  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        threadId: params.threadId,
        role: params.role,
        content: params.content,
        sources: params.sources?.length
          ? (params.sources as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,
        status: params.status ?? "complete",
      },
      select: {
        id: true,
        role: true,
        content: true,
        sources: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.chatThread.update({
      where: { id: params.threadId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: toPreview(params.content),
        messageCount: { increment: 1 },
        archived: false,
      },
    }),
  ]);

  return toMessageDto(message);
}

export async function updateThread(params: {
  threadId: string;
  userId: string;
  title?: string;
  pinned?: boolean;
  archived?: boolean;
  mode?: string;
}): Promise<ChatThreadSummary | null> {
  const owned = await prisma.chatThread.findFirst({
    where: { id: params.threadId, userId: params.userId },
    select: { id: true },
  });
  if (!owned) return null;

  const row = await prisma.chatThread.update({
    where: { id: params.threadId },
    data: {
      ...(params.title !== undefined
        ? { title: params.title.slice(0, 200) }
        : {}),
      ...(params.pinned !== undefined ? { pinned: params.pinned } : {}),
      ...(params.archived !== undefined ? { archived: params.archived } : {}),
      ...(params.mode !== undefined ? { mode: params.mode } : {}),
    },
    select: SUMMARY_SELECT,
  });
  return toThreadSummary(row);
}

export async function deleteThread(
  threadId: string,
  userId: string,
): Promise<boolean> {
  const { count } = await prisma.chatThread.deleteMany({
    where: { id: threadId, userId },
  });
  return count > 0;
}

export async function appendMessageSafe(
  params: Parameters<typeof appendMessage>[0],
): Promise<ChatMessageDto | null> {
  try {
    return await appendMessage(params);
  } catch (error) {
    log.error("[chat-threads] failed to append message", {
      threadId: params.threadId,
      role: params.role,
      error,
    });
    return null;
  }
}
