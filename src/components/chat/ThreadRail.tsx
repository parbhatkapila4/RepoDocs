"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  SquarePen,
  Archive,
  Check,
  ChevronDown,
  ChevronsUpDown,
  FolderGit2,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatThread } from "@/lib/chat-client";
import { ChatAvatar, PRESENCE_LABEL, type PresenceStatus } from "./ChatAvatar";
import { ThreadRow, ThreadRowSkeleton, ThreadListEmpty } from "./ThreadRow";

export function ThreadRail({
  user,
  projects,
  activeProjectId,
  onSelectProject,
  presence,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  isLoading,
  error,
  creating,
  className,
}: {
  user: { name: string; email: string; imageUrl?: string | null; plan: string };
  projects: { id: string; name: string }[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  presence: PresenceStatus;
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  isLoading: boolean;
  error: string | null;
  creating: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const { live, archived } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (t: ChatThread) =>
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.lastMessagePreview ?? "").toLowerCase().includes(q);

    return {
      live: threads.filter((t) => !t.archived && matches(t)),
      archived: threads.filter((t) => t.archived && matches(t)),
    };
  }, [threads, query]);

  const renderRow = (t: ChatThread) => (
    <ThreadRow
      key={t.id}
      thread={t}
      active={t.id === activeThreadId}
      avatarSeed={t.title}
      onSelect={() => onSelectThread(t.id)}
    />
  );

  return (
    <aside
      className={cn(
        "flex h-full w-full shrink-0 flex-col border-r border-white/[0.07] bg-[#141416] md:w-[344px]",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <ChatAvatar
          name={user.name || user.email}
          src={user.imageUrl}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold leading-tight text-white">
            {user.name || user.email}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] capitalize leading-tight text-white/40">
            {user.plan} plan
          </p>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          disabled={creating || !activeProjectId}
          title="New conversation"
          aria-label="New conversation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--chat-accent)] text-[var(--chat-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SquarePen className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="px-4 pb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]">
              <FolderGit2 className="h-3.5 w-3.5 shrink-0 text-white/35" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white/80">
                {activeProject?.name ?? "Select a repository"}
              </span>
              {activeProject && (
                <span className="shrink-0 text-[11px] text-white/35">
                  {PRESENCE_LABEL[presence]}
                </span>
              )}
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-white/25" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="max-h-[360px] w-[288px] overflow-y-auto rounded-lg border-white/[0.08] bg-[#1a1a1d] p-1 shadow-xl shadow-black/50"
          >
            <div className="px-2.5 pb-1 pt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
              Your repositories
            </div>
            {projects.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 text-[13px] focus:bg-white/[0.06]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FolderGit2 className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <span className="truncate font-medium text-white/80">
                    {p.name}
                  </span>
                </span>
                {p.id === activeProjectId && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[var(--chat-accent)]" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="h-10 w-full rounded-full border border-white/[0.06] bg-white/[0.05] pl-10 pr-9 text-[13.5px] text-white/85 outline-none transition-colors placeholder:text-white/30 focus:border-white/[0.14] focus:bg-white/[0.07]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <>
            <ThreadRowSkeleton />
            <ThreadRowSkeleton />
            <ThreadRowSkeleton />
          </>
        ) : error ? (
          <ThreadListEmpty
            message="Conversations could not be loaded"
            hint={error}
          />
        ) : !activeProjectId ? (
          <ThreadListEmpty
            message="No repository selected"
            hint="Pick a repository above to see its conversations."
          />
        ) : live.length === 0 && archived.length === 0 ? (
          <ThreadListEmpty
            message={query.trim() ? "No matches" : "No conversations yet"}
            hint={
              query.trim()
                ? "Try a different search term."
                : "Start one with the compose button above."
            }
          />
        ) : (
          <>
            {live.map(renderRow)}

            {archived.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  aria-expanded={showArchived}
                  className="mt-1 flex w-full items-center gap-2 border-t border-white/[0.06] px-4 py-2.5 text-[12px] font-medium text-white/35 transition-colors hover:bg-white/[0.03] hover:text-white/60"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archived
                  <span className="rounded-full bg-white/[0.07] px-1.5 py-px text-[10.5px] font-semibold tabular-nums text-white/40">
                    {archived.length}
                  </span>
                  <ChevronDown
                    className={cn(
                      "ml-auto h-3.5 w-3.5 transition-transform",
                      showArchived && "rotate-180",
                    )}
                  />
                </button>

                {showArchived && archived.map(renderRow)}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
