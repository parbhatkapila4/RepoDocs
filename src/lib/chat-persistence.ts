const storageKey = (projectId: string) => `repodoc:v1:chat:${projectId}`;
const pendingKey = (projectId: string) => `repodoc:v1:chat-pending:${projectId}`;

export type ChatSource = {
  fileName: string;
  similarity: number;
  summary: string;
};

export type ChatMessageSnapshot = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp: string;
};

export type ChatMessagePersisted = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp: Date;
};

function toSnapshot(m: ChatMessagePersisted): ChatMessageSnapshot {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    sources: m.sources,
    timestamp:
      m.timestamp instanceof Date
        ? m.timestamp.toISOString()
        : String(m.timestamp),
  };
}

export function persistChatMessages(
  projectId: string,
  messages: ChatMessagePersisted[]
): void {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(
      storageKey(projectId),
      JSON.stringify(messages.map(toSnapshot))
    );
  } catch {

  }
}

export function readChatMessages(projectId: string): ChatMessagePersisted[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = sessionStorage.getItem(storageKey(projectId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as ChatMessageSnapshot[];
    return arr.map((s) => ({
      id: s.id,
      role: s.role,
      content: s.content,
      sources: s.sources,
      timestamp: new Date(s.timestamp),
    }));
  } catch {
    return [];
  }
}

export function clearChatSession(projectId: string): void {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(storageKey(projectId));
    sessionStorage.removeItem(pendingKey(projectId));
  } catch {
  }
}

function setPending(projectId: string, pending: boolean): void {
  try {
    if (typeof window === "undefined") return;
    if (pending) sessionStorage.setItem(pendingKey(projectId), "1");
    else sessionStorage.removeItem(pendingKey(projectId));
  } catch {
  }
}

const inflightByProject = new Map<string, Promise<unknown>>();

export function registerChatInflight(
  projectId: string,
  promise: Promise<unknown>
): Promise<unknown> {
  inflightByProject.set(projectId, promise);
  setPending(projectId, true);
  void promise.finally(() => {
    inflightByProject.delete(projectId);
    setPending(projectId, false);
  });
  return promise;
}

export function getChatInflight(
  projectId: string
): Promise<unknown> | undefined {
  return inflightByProject.get(projectId);
}

export function reconcileStaleChatPending(projectId: string): void {
  try {
    if (typeof window === "undefined") return;
    if (
      sessionStorage.getItem(pendingKey(projectId)) === "1" &&
      !inflightByProject.has(projectId)
    ) {
      sessionStorage.removeItem(pendingKey(projectId));
    }
  } catch {
  }
}
