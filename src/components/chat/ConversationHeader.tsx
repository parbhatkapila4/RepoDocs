"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Settings2,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatThread } from "@/lib/chat-client";
import { ChatAvatar, PRESENCE_LABEL, type PresenceStatus } from "./ChatAvatar";

const PRESENCE_DOT: Record<PresenceStatus, string> = {
  indexed: "bg-green-500",
  indexing: "bg-amber-500 animate-pulse",
  idle: "bg-gray-500",
  error: "bg-red-500",
};

export function ConversationHeader({
  thread,
  projectName,
  presence,
  onRename,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onBack,
}: {
  thread: ChatThread;
  projectName: string;
  presence: PresenceStatus;
  onRename: (title: string) => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  onBack?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(thread.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const beginEdit = () => {
    setDraft(thread.title);
    setEditing(true);
  };

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== thread.title) onRename(next);
    else setDraft(thread.title);
  };

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="-ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80 md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}

      <ChatAvatar name={projectName || thread.title} size={40} />

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(thread.title);
                setEditing(false);
              }
            }}
            maxLength={200}
            className="w-full rounded-md border border-white/[0.14] bg-white/[0.06] px-2 py-1 text-[15px] font-semibold text-white outline-none"
          />
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[15px] font-semibold leading-tight text-white">
              {thread.title}
            </h1>
            {thread.pinned && (
              <Pin className="h-3 w-3 shrink-0 -rotate-45 fill-white/30 text-white/30" />
            )}
          </div>
        )}

        <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] leading-tight text-white/40">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRESENCE_DOT[presence]}`}
          />
          <span>{PRESENCE_LABEL[presence]}</span>
          <span className="text-white/15">·</span>
          <span className="truncate font-mono text-[11.5px]">
            {projectName}
          </span>
          {thread.messageCount > 0 && (
            <>
              <span className="text-white/15">·</span>
              <span className="shrink-0 tabular-nums">
                {thread.messageCount} message
                {thread.messageCount === 1 ? "" : "s"}
              </span>
            </>
          )}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Conversation settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="w-52 rounded-lg border-white/[0.08] bg-[#1a1a1d] p-1 shadow-xl shadow-black/50"
        >
          <DropdownMenuItem
            onClick={beginEdit}
            className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2 text-[13px] focus:bg-white/[0.06]"
          >
            <Pencil className="h-3.5 w-3.5 text-white/40" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onTogglePin}
            className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2 text-[13px] focus:bg-white/[0.06]"
          >
            {thread.pinned ? (
              <PinOff className="h-3.5 w-3.5 text-white/40" />
            ) : (
              <Pin className="h-3.5 w-3.5 text-white/40" />
            )}
            {thread.pinned ? "Unpin" : "Pin to top"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onToggleArchive}
            className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2 text-[13px] focus:bg-white/[0.06]"
          >
            {thread.archived ? (
              <ArchiveRestore className="h-3.5 w-3.5 text-white/40" />
            ) : (
              <Archive className="h-3.5 w-3.5 text-white/40" />
            )}
            {thread.archived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-red-300 focus:bg-red-500/10 focus:text-red-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete conversation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
