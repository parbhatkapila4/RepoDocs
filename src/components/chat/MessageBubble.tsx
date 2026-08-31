"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy,
  CheckCheck,
  FileCode,
  ChevronDown,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/chat-client";
import { formatMessageTime } from "@/lib/relative-time";
import { ChatAvatar } from "./ChatAvatar";
import { RepoDocLogo } from "@/components/ui/repodoc-logo";

function CodeCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copy code"
      className="absolute right-2.5 top-2.5 rounded bg-white/[0.06] p-1 text-white/30 opacity-0 transition-all hover:bg-white/[0.12] hover:text-white/60 group-hover/code:opacity-100"
    >
      {copied ? (
        <CheckCheck className="h-3 w-3" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

function MarkdownBody({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm prose-invert max-w-none
        prose-p:mb-3 prose-p:leading-[1.7] prose-p:text-white/80
        prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-semibold prose-headings:tracking-[-0.01em] prose-headings:text-white/95
        prose-h1:text-[17px] prose-h2:text-[15.5px] prose-h3:text-[14.5px]
        prose-strong:font-semibold prose-strong:text-white/95
        prose-code:font-mono prose-code:text-[12.5px] prose-code:text-amber-200/70
        prose-li:mb-1 prose-li:leading-[1.65] prose-li:text-white/75
        prose-ul:my-2 prose-ol:my-2
        prose-a:text-sky-300/75 prose-a:underline prose-a:decoration-sky-300/25 prose-a:underline-offset-2 hover:prose-a:text-sky-300
        prose-blockquote:border-l-2 prose-blockquote:border-white/[0.1] prose-blockquote:pl-3 prose-blockquote:not-italic prose-blockquote:text-white/45
        prose-hr:my-4 prose-hr:border-white/[0.07]
        prose-table:my-0 prose-table:w-full
        prose-th:bg-white/[0.03] prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-[12px] prose-th:font-semibold prose-th:text-white/75
        prose-td:border-t prose-td:border-white/[0.06] prose-td:px-3 prose-td:py-2 prose-td:text-[13px] prose-td:text-white/70
        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table({ children }: { children?: React.ReactNode }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-white/[0.07]">
                <table className="w-full border-collapse">{children}</table>
              </div>
            );
          },
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
            if (inline || !match) {
              return (
                <code
                  className="rounded-[4px] bg-white/[0.08] px-1.5 py-px font-mono text-[12.5px] text-amber-200/70"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="group/code relative my-3">
                <div className="flex items-center justify-between rounded-t-lg border-b border-white/[0.05] bg-white/[0.03] px-3.5 py-1.5">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-white/30">
                    {match[1]}
                  </span>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    fontSize: "12.5px",
                    lineHeight: "1.6",
                    padding: "13px 15px",
                    margin: 0,
                    borderRadius: "0 0 8px 8px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderTop: "none",
                    background: "rgba(0,0,0,0.3)",
                    overflowX: "auto",
                  }}
                  {...props}
                >
                  {codeStr}
                </SyntaxHighlighter>
                <CodeCopyButton text={codeStr} />
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function SourcesPill({
  sources,
}: {
  sources: NonNullable<ChatMessage["sources"]>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.05] px-2.5 py-1 text-[11.5px] text-white/45 transition-colors hover:border-white/[0.12] hover:text-white/70"
      >
        <FileCode className="h-3 w-3" />
        {sources.length} source{sources.length === 1 ? "" : "s"}
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sources.map((s, i) => (
            <span
              key={`${s.fileName}-${i}`}
              title={s.summary}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-white/45"
            >
              <FileCode className="h-2.5 w-2.5 text-white/25" />
              {s.fileName.split("/").pop()}
              <span className="text-white/20">
                {(s.similarity * 100).toFixed(0)}%
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export type MessageViewer = { name: string; imageUrl?: string | null };

function AssistantAvatar() {
  return (
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/10">
      <RepoDocLogo size="sm" className="h-full w-full object-cover" />
    </span>
  );
}

export function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-white/[0.06]" />
      <span
        suppressHydrationWarning
        className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/35"
      >
        {label}
      </span>
      <span className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

export function MessageBubble({
  message,
  viewer,
}: {
  message: ChatMessage;
  viewer: MessageViewer;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isError = message.status === "error";

  const copy = () => {
    void navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) {
    return (
      <div className="group flex justify-end gap-2.5">
        <button
          type="button"
          onClick={copy}
          aria-label="Copy message"
          className="mt-1 self-start rounded-md p-1.5 text-white/20 opacity-0 transition-all hover:bg-white/[0.06] hover:text-white/60 focus-visible:opacity-100 group-hover:opacity-100"
        >
          {copied ? (
            <CheckCheck className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>

        <div
          className={cn(
            "max-w-[min(76%,640px)] rounded-2xl rounded-br-md border border-[var(--chat-accent)]/20 bg-[var(--chat-accent)]/[0.13] px-4 py-2.5",
            message.pending && "opacity-60",
          )}
        >
          <p className="whitespace-pre-wrap break-words text-[14.5px] leading-relaxed text-white/90">
            {message.content}
          </p>
          <span
            suppressHydrationWarning
            className="mt-1 block text-right text-[11px] text-white/30"
          >
            {formatMessageTime(message.createdAt)}
          </span>
        </div>

        <ChatAvatar
          name={viewer.name}
          src={viewer.imageUrl}
          size={32}
          className="mt-0.5"
        />
      </div>
    );
  }

  return (
    <div className="group flex gap-2.5">
      <AssistantAvatar />

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "rounded-2xl rounded-tl-md border px-4 py-3",
            isError
              ? "border-red-500/20 bg-red-500/[0.07]"
              : "border-white/[0.06] bg-[#232326]",
          )}
        >
          {isError ? (
            <p className="flex items-start gap-2 text-[14px] leading-relaxed text-red-200/85">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{message.content}</span>
            </p>
          ) : (
            <MarkdownBody content={message.content} />
          )}

          <span
            suppressHydrationWarning
            className="mt-1.5 block text-[11px] text-white/30"
          >
            {formatMessageTime(message.createdAt)}
          </span>
        </div>

        {message.sources && message.sources.length > 0 && (
          <SourcesPill sources={message.sources} />
        )}
      </div>

      <button
        type="button"
        onClick={copy}
        aria-label="Copy answer"
        className="mt-1 self-start rounded-md p-1.5 text-white/20 opacity-0 transition-all hover:bg-white/[0.06] hover:text-white/60 focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? (
          <CheckCheck className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex gap-2.5">
      <AssistantAvatar />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#232326] px-4 py-4">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
