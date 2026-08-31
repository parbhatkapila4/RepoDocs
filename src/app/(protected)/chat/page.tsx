"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { ArrowLeft, MessagesSquare } from "lucide-react";

import { useProjectsContext } from "@/context/ProjectsContext";
import { useUser } from "@/hooks/useUser";
import { useMountedRef } from "@/hooks/useMountedRef";
import { isPaidPlan } from "@/lib/plan";
import { checkEmbeddingsStatus } from "@/lib/actions";
import { UpgradePanel } from "@/components/UpgradePanel";
import GitHubRateLimitNotice from "@/components/GitHubRateLimitNotice";

import {
  askQuestion,
  deleteThreadRequest,
  fetchThreadMessages,
  fetchThreads,
  patchThread,
  ChatRequestError,
  type ChatMessage,
  type ChatThread,
} from "@/lib/chat-client";
import { formatDayDivider, isSameDay } from "@/lib/relative-time";

import { ThreadRail } from "@/components/chat/ThreadRail";
import { ConversationHeader } from "@/components/chat/ConversationHeader";
import {
  MessageBubble,
  TypingBubble,
  DayDivider,
  type MessageViewer,
} from "@/components/chat/MessageBubble";
import {
  Composer,
  type ChatMode,
  type IndexingState,
} from "@/components/chat/Composer";
import type { PresenceStatus } from "@/components/chat/ChatAvatar";
import { WelcomePane } from "@/components/chat/WelcomePane";
const ACCENT = "#3B72E8";
const ON_ACCENT = "#ffffff";

const EMPTY_INDEX_STATE: IndexingState = {
  hasEmbeddings: false,
  indexing: false,
  progress: 0,
  phase: "fast",
  filesTotal: 0,
  filesProcessed: 0,
  jobError: null,
};

export default function ChatPage() {
  const { projects, selectedProjectId, selectProject } = useProjectsContext();
  const { user } = useUser();
  const mountedRef = useMountedRef();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<ChatMode>("default");

  const [indexState, setIndexState] =
    useState<IndexingState>(EMPTY_INDEX_STATE);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.emailAddress ||
    "";

  const viewer: MessageViewer = useMemo(
    () => ({ name: displayName, imageUrl: user?.imageUrl ?? null }),
    [displayName, user?.imageUrl],
  );

  const presence: PresenceStatus = indexState.jobError
    ? "error"
    : indexState.indexing
      ? "indexing"
      : indexState.hasEmbeddings
        ? "indexed"
        : "idle";

  const loadThreads = useCallback(
    async (projectId: string, opts?: { autoSelect?: boolean }) => {
      try {
        setThreadsError(null);
        const list = await fetchThreads(projectId);
        if (!mountedRef.current) return;
        setThreads(list);

        if (opts?.autoSelect) {
          const first = list.find((t) => !t.archived) ?? list[0] ?? null;
          setActiveThreadId(first?.id ?? null);
        }
      } catch (error) {
        if (!mountedRef.current) return;
        setThreads([]);
        setThreadsError(
          error instanceof Error
            ? error.message
            : "Conversations could not be loaded.",
        );
      }
    },
    [mountedRef],
  );

  useEffect(() => {
    if (!selectedProjectId) {
      setThreads([]);
      setActiveThreadId(null);
      setMessages([]);
      return;
    }
    setThreadsLoading(true);
    setActiveThreadId(null);
    setDraftOpen(false);
    setMessages([]);
    void loadThreads(selectedProjectId, { autoSelect: true }).finally(() => {
      if (mountedRef.current) setThreadsLoading(false);
    });
  }, [selectedProjectId, loadThreads, mountedRef]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessagesLoading(true);
    void fetchThreadMessages(activeThreadId)
      .then(({ thread, messages: loaded }) => {
        if (cancelled || !mountedRef.current) return;
        setMessages(loaded);
        setMode(thread.mode === "guidance" ? "guidance" : "default");
      })
      .catch((error) => {
        if (cancelled || !mountedRef.current) return;
        setMessages([]);
        toast.error(
          error instanceof Error
            ? error.message
            : "This conversation could not be loaded.",
        );
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) setMessagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeThreadId, mountedRef]);

  const prevCountRef = useRef(0);
  useEffect(() => {
    if (messages.length !== prevCountRef.current) {
      requestAnimationFrame(() =>
        scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
      prevCountRef.current = messages.length;
    }
  }, [messages]);

  const runCheck = useCallback(
    async (projectId: string) => {
      try {
        const s = await checkEmbeddingsStatus(projectId);
        if (!mountedRef.current) return;
        setIndexState({
          hasEmbeddings: s.hasEmbeddings,
          indexing: s.indexing,
          progress: s.progress,
          phase: s.phase,
          filesTotal: s.filesTotal,
          filesProcessed: s.filesProcessed,
          jobError: s.jobError ?? null,
        });
      } catch {
        if (!mountedRef.current) return;
        setIndexState((prev) => ({ ...prev, hasEmbeddings: false }));
      }
    },
    [mountedRef],
  );

  useEffect(() => {
    if (!selectedProjectId) {
      setIndexState(EMPTY_INDEX_STATE);
      setInitialCheckDone(false);
      return;
    }
    let cancelled = false;
    void runCheck(selectedProjectId).then(() => {
      if (!cancelled) setInitialCheckDone(true);
    });
    const id = setInterval(() => {
      if (!cancelled) void runCheck(selectedProjectId);
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedProjectId, runCheck]);

  const send = useCallback(async () => {
    const question = input.trim();
    if (!question || !currentProject || sending) return;

    setInput("");
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    const prior = messages;
    setMessages([...prior, optimistic]);
    setSending(true);

    const projectId = currentProject.id;

    try {
      const result = await askQuestion({
        projectId,
        question,
        conversationHistory: prior
          .slice(-4)
          .map((m) => ({ role: m.role, content: m.content })),
        mode,
        threadId: activeThreadId,
      });

      if (!mountedRef.current) return;
      setMessages((cur) => [
        ...cur.map((m) =>
          m.id === optimistic.id ? { ...m, pending: false } : m,
        ),
        {
          id: result.messageId ?? `assistant-${Date.now()}`,
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          status: "complete",
          createdAt: new Date().toISOString(),
        },
      ]);
      if (result.threadId) setActiveThreadId(result.threadId);
      void loadThreads(projectId);
      void runCheck(projectId);
    } catch (error) {
      if (!mountedRef.current) return;

      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      const status = error instanceof ChatRequestError ? error.status : 0;
      const serverThreadId =
        error instanceof ChatRequestError ? error.threadId : null;

      setMessages((cur) => [
        ...cur.map((m) =>
          m.id === optimistic.id ? { ...m, pending: false } : m,
        ),
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: message,
          status: "error",
          createdAt: new Date().toISOString(),
        },
      ]);
      if (serverThreadId) setActiveThreadId(serverThreadId);
      if (status !== 402) toast.error(message);
      void loadThreads(projectId);
    } finally {
      if (mountedRef.current) setSending(false);
    }
  }, [
    input,
    currentProject,
    sending,
    messages,
    mode,
    activeThreadId,
    loadThreads,
    runCheck,
    mountedRef,
  ]);

  const applyThreadChange = useCallback(
    async (threadId: string, changes: Parameters<typeof patchThread>[1]) => {
      const snapshot = threads;
      setThreads((cur) =>
        cur.map((t) => (t.id === threadId ? { ...t, ...changes } : t)),
      );
      try {
        const updated = await patchThread(threadId, changes);
        if (!mountedRef.current) return;
        setThreads((cur) => cur.map((t) => (t.id === threadId ? updated : t)));
      } catch (error) {
        if (!mountedRef.current) return;
        setThreads(snapshot);
        toast.error(
          error instanceof Error ? error.message : "The change was not saved.",
        );
      }
    },
    [threads, mountedRef],
  );

  const removeThread = useCallback(
    async (threadId: string) => {
      const snapshot = threads;
      const remaining = threads.filter((t) => t.id !== threadId);
      setThreads(remaining);
      if (activeThreadId === threadId) {
        setActiveThreadId(remaining.find((t) => !t.archived)?.id ?? null);
      }
      try {
        await deleteThreadRequest(threadId);
      } catch (error) {
        if (!mountedRef.current) return;
        setThreads(snapshot);
        toast.error(
          error instanceof Error
            ? error.message
            : "The conversation was not deleted.",
        );
      }
    },
    [threads, activeThreadId, mountedRef],
  );

  const openThread = useCallback((id: string) => {
    setActiveThreadId(id);
    setDraftOpen(false);
  }, []);

  const backToList = useCallback(() => {
    setActiveThreadId(null);
    setDraftOpen(false);
    setMessages([]);
  }, []);

  const startNewChat = useCallback(() => {
    setActiveThreadId(null);
    setMessages([]);
    setInput("");
    setDraftOpen(true);
  }, []);

  const grouped = useMemo(() => {
    const out: { message: ChatMessage; divider: string | null }[] = [];
    messages.forEach((message, i) => {
      const prev = messages[i - 1];
      const needsDivider =
        !prev || !isSameDay(prev.createdAt, message.createdAt);
      out.push({
        message,
        divider: needsDivider ? formatDayDivider(message.createdAt) : null,
      });
    });
    return out;
  }, [messages]);

  const showIndexingBar =
    initialCheckDone &&
    (indexState.indexing ||
      (!indexState.hasEmbeddings && indexState.progress < 100));

  if (user && !isPaidPlan(user.plan)) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d0d0f] px-6">
        <div className="w-full max-w-lg">
          <UpgradePanel feature="chat" />
        </div>
      </div>
    );
  }

  const conversationVisible =
    Boolean(activeThreadId) || messages.length > 0 || draftOpen;

  return (
    <div
      className="flex h-full min-h-0 overflow-hidden bg-[#0d0d0f]"
      style={
        {
          "--chat-accent": ACCENT,
          "--chat-on-accent": ON_ACCENT,
        } as React.CSSProperties
      }
    >
      <ThreadRail
        user={{
          name: displayName,
          email: user?.emailAddress ?? "",
          imageUrl: user?.imageUrl,
          plan: user?.plan ?? "starter",
        }}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        activeProjectId={selectedProjectId}
        onSelectProject={selectProject}
        presence={presence}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={openThread}
        onNewChat={startNewChat}
        isLoading={threadsLoading}
        error={threadsError}
        creating={false}
        className={conversationVisible ? "hidden md:flex" : "flex"}
      />

      <section
        className={`min-w-0 flex-1 flex-col ${conversationVisible ? "flex" : "hidden md:flex"}`}
      >
        {!currentProject ? (
          <EmptyPane
            title="No repository selected"
            body="Pick a repository from the list to start asking questions about it."
          />
        ) : (
          <>
            {activeThread ? (
              <ConversationHeader
                key={activeThread.id}
                thread={activeThread}
                onBack={backToList}
                projectName={currentProject.name}
                presence={presence}
                onRename={(title) =>
                  void applyThreadChange(activeThread.id, { title })
                }
                onTogglePin={() =>
                  void applyThreadChange(activeThread.id, {
                    pinned: !activeThread.pinned,
                  })
                }
                onToggleArchive={() =>
                  void applyThreadChange(activeThread.id, {
                    archived: !activeThread.archived,
                  })
                }
                onDelete={() => void removeThread(activeThread.id)}
              />
            ) : (
              <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-5">
                <button
                  type="button"
                  onClick={backToList}
                  aria-label="Back to conversations"
                  className="-ml-2 flex h-8 w-8 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.06] hover:text-white/80 md:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-[15px] font-semibold leading-tight text-white">
                    New conversation
                  </h1>
                  <p className="mt-0.5 truncate font-mono text-[11.5px] leading-tight text-white/40">
                    {currentProject.name}
                  </p>
                </div>
              </header>
            )}

            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex min-h-full w-full flex-col px-6 py-6">
                <GitHubRateLimitNotice
                  error={indexState.jobError}
                  className="mb-4"
                />

                {messagesLoading ? (
                  <p className="flex flex-1 items-center justify-center text-[13px] text-white/30">
                    Loading conversation…
                  </p>
                ) : messages.length === 0 ? (
                  <WelcomePane
                    projectName={currentProject.name}
                    onPick={(prompt) => setInput(prompt)}
                  />
                ) : (
                  <div className="space-y-4">
                    {grouped.map(({ message, divider }) => (
                      <React.Fragment key={message.id}>
                        {divider && <DayDivider label={divider} />}
                        <MessageBubble message={message} viewer={viewer} />
                      </React.Fragment>
                    ))}
                    {sending && <TypingBubble />}
                  </div>
                )}

                <div ref={scrollAnchorRef} className="h-2" />
              </div>
            </div>

            <Composer
              value={input}
              onChange={setInput}
              onSubmit={() => void send()}
              sending={sending}
              placeholder={`Ask about ${currentProject.name}…`}
              mode={mode}
              onModeChange={setMode}
              indexing={showIndexingBar ? indexState : null}
            />
          </>
        )}
      </section>
    </div>
  );
}

function EmptyPane({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <MessagesSquare className="mb-3 h-6 w-6 text-white/15" />
      <p className="text-[14px] font-medium text-white/70">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-white/35">
        {body}
      </p>
    </div>
  );
}
