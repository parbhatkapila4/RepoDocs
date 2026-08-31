import { fetchJson } from "@/lib/fetch-json";

export type ChatSource = {
  fileName: string;
  similarity: number;
  summary: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[] | null;
  status?: "complete" | "error";
  createdAt: string;
  pending?: boolean;
};

export type ChatThread = {
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

export class ChatRequestError extends Error {
  status: number;
  threadId: string | null;
  constructor(message: string, status: number, threadId: string | null = null) {
    super(message);
    this.name = "ChatRequestError";
    this.status = status;
    this.threadId = threadId;
  }
}

type ApiError = { message?: string; error?: string; threadId?: string | null };

function fail(status: number, data: ApiError | null, fallback: string): never {
  throw new ChatRequestError(
    data?.message || data?.error || fallback,
    status,
    data?.threadId ?? null,
  );
}

export async function fetchThreads(projectId: string): Promise<ChatThread[]> {
  const res = await fetchJson<{ threads: ChatThread[] } & ApiError>(
    `/api/chat/threads?projectId=${encodeURIComponent(projectId)}`,
  );
  if (!res.ok || !res.data)
    fail(res.status, res.data, "Conversations could not be loaded.");
  return res.data.threads ?? [];
}

export async function fetchThreadMessages(
  threadId: string,
): Promise<{ thread: ChatThread; messages: ChatMessage[] }> {
  const res = await fetchJson<
    { thread: ChatThread; messages: ChatMessage[] } & ApiError
  >(`/api/chat/threads/${threadId}`);
  if (!res.ok || !res.data)
    fail(res.status, res.data, "This conversation could not be loaded.");
  return { thread: res.data.thread, messages: res.data.messages ?? [] };
}

export async function patchThread(
  threadId: string,
  changes: Partial<Pick<ChatThread, "title" | "pinned" | "archived" | "mode">>,
): Promise<ChatThread> {
  const res = await fetchJson<{ thread: ChatThread } & ApiError>(
    `/api/chat/threads/${threadId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    },
  );
  if (!res.ok || !res.data)
    fail(res.status, res.data, "The change could not be saved.");
  return res.data.thread;
}

export async function deleteThreadRequest(threadId: string): Promise<void> {
  const res = await fetchJson<ApiError>(`/api/chat/threads/${threadId}`, {
    method: "DELETE",
  });
  if (!res.ok)
    fail(res.status, res.data, "The conversation could not be deleted.");
}

export type AskResult = {
  answer: string;
  sources: ChatSource[];
  threadId: string;
  threadTitle: string;
  messageId: string | null;
};

export async function askQuestion(params: {
  projectId: string;
  question: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  mode: "default" | "guidance";
  threadId?: string | null;
}): Promise<AskResult> {
  const res = await fetchJson<
    {
      answer?: string;
      sources?: ChatSource[];
      thread?: { id: string; title: string };
      messageId?: string | null;
    } & ApiError
  >(
    "/api/query",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: params.projectId,
        question: params.question,
        conversationHistory: params.conversationHistory,
        mode: params.mode,
        ...(params.threadId ? { threadId: params.threadId } : {}),
      }),
    },
    { retryOnceOnNonJson: true },
  );

  if (res.nonJson) {
    throw new ChatRequestError(
      "The reply was interrupted before it reached the browser (page reload or session refresh mid-request). Your question was saved - reopen the conversation to see it.",
      res.status,
    );
  }

  if (!res.ok || !res.data) {
    fail(
      res.status,
      res.data,
      `Failed to get a response (HTTP ${res.status}).`,
    );
  }

  return {
    answer: res.data.answer ?? "",
    sources: res.data.sources ?? [],
    threadId: res.data.thread?.id ?? params.threadId ?? "",
    threadTitle: res.data.thread?.title ?? "",
    messageId: res.data.messageId ?? null,
  };
}
export function avatarGradient(seed: string): { from: string; to: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    from: `hsl(${hue} 62% 52%)`,
    to: `hsl(${(hue + 38) % 360} 58% 38%)`,
  };
}

export function initialsFor(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s/_-]/gu, " ")
    .split(/[\s/_-]+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
