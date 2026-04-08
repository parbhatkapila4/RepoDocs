"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useProjectsContext } from "@/context/ProjectsContext";
import { useUser } from "@/hooks/useUser";
import { checkEmbeddingsStatus } from "@/lib/actions";
import { useMountedRef } from "@/hooks/useMountedRef";
import {
  Loader2,
  FileCode,
  ChevronDown,
  Check,
  SquarePen,
  ArrowUp,
  Terminal,
  GitBranch,
  Layers,
  Copy,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import GitHubRateLimitNotice from "@/components/GitHubRateLimitNotice";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  persistChatMessages,
  readChatMessages,
  clearChatSession,
  registerChatInflight,
  getChatInflight,
  reconcileStaleChatPending,
} from "@/lib/chat-persistence";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: {
    fileName: string;
    similarity: number;
    summary: string;
  }[];
  timestamp: Date;
}

interface IndexingState {
  hasEmbeddings: boolean;
  indexing: boolean;
  progress: number;
  phase: string;
  filesTotal: number;
  filesProcessed: number;
  jobError: string | null;
}

const models = [
  {
    id: "repodoc-v1",
    name: "RepoDoc AI",
    description: "Optimized for code analysis",
  },
  {
    id: "repodoc-guidance",
    name: "Guidance Mode",
    description: "Files, order, risks -- no code unless asked",
  },
];

const starters = [
  { label: "Project structure", prompt: "How is the project structured?", icon: Layers },
  { label: "Auth flow", prompt: "Walk me through the authentication flow", icon: GitBranch },
  { label: "API overview", prompt: "What does the API layer look like?", icon: Terminal },
];

function IndexingBar({ state }: { state: IndexingState }) {
  if (state.hasEmbeddings && !state.indexing) return null;
  if (!state.indexing && !state.hasEmbeddings) return null;

  const pct = state.progress;
  const label =
    state.phase === "fast" && pct < 100
      ? state.filesTotal === 0 && pct === 0
        ? "Queued"
        : state.filesTotal === 0
          ? "Cloning..."
          : "Indexing"
      : state.phase === "full" && pct < 100
        ? "Deep indexing"
        : "Finishing";

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-[3px] w-20 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/30 transition-all duration-1000 ease-out"
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-white/25 font-mono">
        {label}
        {state.filesTotal > 0 && ` ${state.filesProcessed}/${state.filesTotal}`}
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="absolute top-2.5 right-2.5 p-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-white/30 hover:text-white/50 transition-all opacity-0 group-hover/code:opacity-100"
    >
      {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function ChatPage() {
  const { projects, selectedProjectId } = useProjectsContext();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [indexState, setIndexState] = useState<IndexingState>({
    hasEmbeddings: false,
    indexing: false,
    progress: 0,
    phase: "fast",
    filesTotal: 0,
    filesProcessed: 0,
    jobError: null,
  });
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mountedRef = useMountedRef();

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const userName =
    user?.firstName || user?.emailAddress?.split("@")[0] || "";

  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    reconcileStaleChatPending(selectedProjectId);
    const stored = readChatMessages(selectedProjectId);
    setMessages(stored);

    const inflight = getChatInflight(selectedProjectId);
    if (inflight) {
      setIsLoading(true);
      void inflight.finally(() => {
        if (!mountedRef.current) return;
        setMessages(readChatMessages(selectedProjectId));
        setIsLoading(false);
      });
    }
  }, [selectedProjectId]);

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
    [mountedRef]
  );

  useEffect(() => {
    if (!selectedProjectId) {
      setIndexState({ hasEmbeddings: false, indexing: false, progress: 0, phase: "fast", filesTotal: 0, filesProcessed: 0, jobError: null });
      setInitialCheckDone(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      await runCheck(selectedProjectId);
      if (!cancelled) setInitialCheckDone(true);
    };

    void check();

    const intervalId = setInterval(() => {
      if (!cancelled) void runCheck(selectedProjectId);
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [selectedProjectId, runCheck]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentProject || isLoading) return;

    const question = input.trim();
    setInput("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    const priorMessages = messages;
    const msgsWithUser = [...priorMessages, userMessage];
    setMessages(msgsWithUser);
    persistChatMessages(currentProject.id, msgsWithUser);
    setIsLoading(true);

    const conversationHistory = priorMessages.slice(-4).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const pid = currentProject.id;
    const mode =
      selectedModel.id === "repodoc-guidance" ? "guidance" : "default";

    const work = (async () => {
      try {
        const response = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: pid,
            question,
            conversationHistory,
            mode,
          }),
        });

        const data = await response.json();
        let next: Message[];

        if (!response.ok) {
          const msg = (data.message || "").toLowerCase();
          if (
            response.status === 403 ||
            msg.includes("rate limit") ||
            msg.includes("quota")
          ) {
            const rateMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content:
                "GitHub's API limit has been reached. This is temporary and resets automatically within the hour. Your data is safe -- just try again in a few minutes.",
              timestamp: new Date(),
            };
            next = [...msgsWithUser, rateMsg];
          } else {
            throw new Error(data.message || "Failed to get response");
          }
        } else {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.answer,
            sources: data.sources,
            timestamp: new Date(),
          };
          next = [...msgsWithUser, assistantMessage];
        }
        persistChatMessages(pid, next);
        void runCheck(pid);
      } catch (error) {
        console.error("Error querying codebase:", error);
        const errText =
          error instanceof Error ? error.message : "Failed to get response";
        const isRate =
          errText.toLowerCase().includes("rate limit") ||
          errText.toLowerCase().includes("quota");
        if (!isRate) {
          toast.error(errText);
        }
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: isRate
            ? "GitHub's API limit has been reached. This is temporary and resets automatically within the hour. Your data is safe -- just try again in a few minutes."
            : "Something went wrong. Please try again.",
          timestamp: new Date(),
        };
        const next = [...msgsWithUser, errorMessage];
        persistChatMessages(pid, next);
      }
    })();

    registerChatInflight(pid, work);
    void work.finally(() => {
      if (!mountedRef.current) return;
      setMessages(readChatMessages(pid));
      setIsLoading(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const showIndexingBar =
    initialCheckDone &&
    (indexState.indexing || (!indexState.hasEmbeddings && indexState.progress < 100));

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0c]">
        <div className="text-center max-w-xs px-6">
          <p className="text-sm text-white/30 leading-relaxed">
            Pick a project from the sidebar to start exploring your code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0c] overflow-hidden">
      <header className="shrink-0 flex items-center justify-between px-5 h-[52px] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-[13px] font-medium text-white/60 hover:text-white/80 transition-colors outline-none rounded-md px-2 py-1 -ml-2 hover:bg-white/[0.04]">
                {selectedModel.name}
                <ChevronDown className="w-3 h-3 text-white/20" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={6}
              className="w-56 bg-[#131316] border-white/[0.08] rounded-lg p-1 shadow-xl shadow-black/40"
            >
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-md cursor-pointer text-[13px] hover:bg-white/[0.05] focus:bg-white/[0.05]"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-white/80">{model.name}</div>
                    <div className="text-[11px] text-white/25 mt-0.5 truncate">{model.description}</div>
                  </div>
                  {selectedModel.id === model.id && (
                    <Check className="w-3.5 h-3.5 text-white/50 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          onClick={() => {
            if (currentProject) clearChatSession(currentProject.id);
            setMessages([]);
            setInput("");
          }}
          className="flex items-center gap-1.5 text-[13px] text-white/25 hover:text-white/50 transition-colors rounded-md px-2 py-1 hover:bg-white/[0.04]"
          title="New chat"
        >
          <SquarePen className="w-3.5 h-3.5" />
        </button>
      </header>


      <div className="flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-5">
            <div className="w-full max-w-[540px]">

              <div className="mb-8">
                <h1 className="text-[28px] sm:text-[32px] font-semibold text-white tracking-[-0.03em] leading-tight">
                  {userName ? `What's on your mind,` : "What would you like"}
                  <br />
                  <span className="text-white/30">
                    {userName || "to explore"}
                    {userName ? "?" : "?"}
                  </span>
                </h1>
              </div>

              <GitHubRateLimitNotice error={indexState.jobError} className="mb-4" />


              <form onSubmit={handleSubmit}>
                <div className="group/input rounded-2xl border border-white/[0.08] bg-[#111114] shadow-lg shadow-black/20 overflow-hidden transition-all focus-within:border-white/[0.15] focus-within:shadow-xl focus-within:shadow-black/30">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask about ${currentProject.name}...`}
                    disabled={isLoading}
                    rows={1}
                    className="w-full bg-transparent border-none outline-none resize-none px-5 pt-4 pb-1 text-[15px] text-white/90 placeholder:text-white/20 min-h-[52px] max-h-[160px] disabled:opacity-40"
                  />
                  <div className="flex items-center justify-between px-4 pb-3">
                    <div className="flex-1 mr-3">
                      {showIndexingBar ? (
                        <IndexingBar state={indexState} />
                      ) : (
                        <span className="text-[11px] text-white/10 select-none">
                          Enter to send
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/90 hover:bg-white disabled:bg-white/[0.06] disabled:hover:bg-white/[0.06] transition-all shrink-0"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 text-white/70 animate-spin" />
                      ) : (
                        <ArrowUp className="w-4 h-4 text-[#0a0a0c]" />
                      )}
                    </button>
                  </div>
                </div>
              </form>


              <div className="grid grid-cols-3 gap-2 mt-4">
                {starters.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      setInput(s.prompt);
                      inputRef.current?.focus();
                    }}
                    className="group flex flex-col gap-2 text-left rounded-xl border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] px-3.5 py-3 transition-all"
                  >
                    <s.icon className="w-4 h-4 text-white/15 group-hover:text-white/40 transition-colors" />
                    <span className="text-[12px] leading-snug text-white/30 group-hover:text-white/50 transition-colors">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto min-h-0 scrollbar-thin"
          >
            <div className="max-w-[680px] mx-auto px-5 sm:px-6 py-8 space-y-6">
              <GitHubRateLimitNotice error={indexState.jobError} />
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-white/[0.07] text-[14px] text-white/85 rounded-2xl rounded-br-sm px-4 py-2.5 leading-relaxed border border-white/[0.06]">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">

                      <div className="flex gap-3.5">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center mt-0.5">
                          <span className="text-[10px] font-bold text-white/50">R</span>
                        </div>
                        <div className="flex-1 min-w-0 text-[14px] leading-[1.75] text-white/75">
                          <div className="prose prose-sm prose-invert max-w-none
                            [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                            prose-p:text-white/75 prose-p:leading-[1.75] prose-p:mb-3
                            prose-headings:text-white/90 prose-headings:font-semibold prose-headings:tracking-[-0.01em] prose-headings:mt-5 prose-headings:mb-2
                            prose-h1:text-[18px] prose-h2:text-[16px] prose-h3:text-[15px]
                            prose-strong:text-white/85 prose-strong:font-semibold
                            prose-code:text-amber-200/50 prose-code:font-mono prose-code:text-[13px]
                            prose-li:text-white/70 prose-li:leading-[1.7] prose-li:mb-1
                            prose-ul:my-2 prose-ol:my-2
                            prose-a:text-sky-300/60 prose-a:underline prose-a:underline-offset-2 prose-a:decoration-sky-300/20 hover:prose-a:text-sky-300/80 prose-a:transition-colors
                            prose-blockquote:border-l-2 prose-blockquote:border-white/[0.08] prose-blockquote:pl-4 prose-blockquote:text-white/40 prose-blockquote:not-italic
                            prose-hr:border-white/[0.06] prose-hr:my-5
                          ">
                            <ReactMarkdown
                              components={{
                                code({
                                  inline,
                                  className,
                                  children,
                                  ...props
                                }: {
                                  inline?: boolean;
                                  className?: string;
                                  children?: React.ReactNode;
                                }) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  const codeStr = String(children).replace(/\n$/, "");
                                  return !inline && match ? (
                                    <div className="group/code relative my-3">
                                      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] bg-white/[0.02] rounded-t-lg">
                                        <span className="text-[11px] font-mono text-white/20">{match[1]}</span>
                                      </div>
                                      <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{
                                          fontSize: "12.5px",
                                          lineHeight: "1.65",
                                          padding: "14px 16px",
                                          margin: 0,
                                          borderRadius: "0 0 8px 8px",
                                          border: "1px solid rgba(255,255,255,0.05)",
                                          borderTop: "none",
                                          background: "rgba(0,0,0,0.25)",
                                          overflowX: "auto",
                                        }}
                                        {...props}
                                      >
                                        {codeStr}
                                      </SyntaxHighlighter>
                                      <CopyButton text={codeStr} />
                                    </div>
                                  ) : (
                                    <code
                                      className="bg-white/[0.06] text-amber-200/50 px-1.5 py-px rounded-[4px] text-[13px] font-mono"
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>


                      {message.sources && message.sources.length > 0 && (
                        <div className="ml-[38px]">
                          <details className="group">
                            <summary className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-white/20 hover:text-white/35 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
                              <FileCode className="w-3 h-3" />
                              <span>{message.sources.length} source{message.sources.length !== 1 ? "s" : ""} referenced</span>
                              <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {message.sources.map((source, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] text-white/30"
                                  title={source.summary}
                                >
                                  <FileCode className="w-2.5 h-2.5 text-white/15" />
                                  {source.fileName.split("/").pop()}
                                  <span className="text-white/10">{(source.similarity * 100).toFixed(0)}%</span>
                                </span>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3.5">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-white/40 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        )}


        {messages.length > 0 && (
          <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0a0c]/90 backdrop-blur-sm px-5 py-3.5">
            <form onSubmit={handleSubmit} className="max-w-[680px] mx-auto">
              <div className="flex items-end gap-3 rounded-xl border border-white/[0.08] bg-[#111114] px-4 py-2.5 focus-within:border-white/[0.15] transition-colors shadow-md shadow-black/10">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none py-1 text-[14px] text-white/90 placeholder:text-white/20 min-h-[28px] max-h-[100px] disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/90 hover:bg-white disabled:bg-white/[0.06] transition-all shrink-0 mb-px"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 text-white/70 animate-spin" />
                  ) : (
                    <ArrowUp className="w-3.5 h-3.5 text-[#0a0a0c]" />
                  )}
                </button>
              </div>
              {showIndexingBar && (
                <div className="mt-2 px-1">
                  <IndexingBar state={indexState} />
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
