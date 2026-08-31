"use client";

import React, { useEffect, useRef } from "react";
import {
  ArrowUp,
  Loader2,
  Check,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ChatMode = "default" | "guidance";

export const MODES: {
  id: ChatMode;
  name: string;
  description: string;
}[] = [
  {
    id: "default",
    name: "Default",
    description: "Optimized for code analysis",
  },
  {
    id: "guidance",
    name: "Guidance",
    description: "Files, order, risks - no code unless asked",
  },
];

export type IndexingState = {
  hasEmbeddings: boolean;
  indexing: boolean;
  progress: number;
  phase: string;
  filesTotal: number;
  filesProcessed: number;
  jobError: string | null;
};

export function IndexingBar({ state }: { state: IndexingState }) {
  const pct = state.progress;
  const label =
    state.phase === "fast" && pct < 100
      ? state.filesTotal === 0 && pct === 0
        ? "Queued"
        : state.filesTotal === 0
          ? "Cloning…"
          : "Indexing"
      : state.phase === "full" && pct < 100
        ? "Deep indexing"
        : "Finishing";

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-[3px] w-20 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--chat-accent)] transition-all duration-1000 ease-out"
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
      <span className="font-mono text-[11px] tabular-nums text-white/35">
        {label}
        {state.filesTotal > 0 && ` ${state.filesProcessed}/${state.filesTotal}`}
      </span>
    </div>
  );
}

export function Composer({
  value,
  onChange,
  onSubmit,
  sending,
  disabled,
  placeholder,
  mode,
  onModeChange,
  indexing,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  sending: boolean;
  disabled?: boolean;
  placeholder: string;
  mode: ChatMode;
  onModeChange: (m: ChatMode) => void;
  indexing: IndexingState | null;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const active = MODES.find((m) => m.id === mode) ?? MODES[0];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  const submit = () => {
    if (sending || disabled || !value.trim()) return;
    onSubmit();
  };

  return (
    <div className="shrink-0 border-t border-white/[0.07] px-5 py-3.5">
      {indexing && (
        <div className="mb-2.5 px-1">
          <IndexingBar state={indexing} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-end gap-2.5 rounded-[22px] border border-white/[0.08] bg-white/[0.05] py-2 pl-2 pr-2 transition-colors focus-within:border-white/[0.16] focus-within:bg-white/[0.07]"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={`Answer mode: ${active.name}`}
              aria-label={`Answer mode: ${active.name}`}
              className="flex h-9 shrink-0 items-center gap-1.5 self-center rounded-full bg-white/[0.07] px-3 text-white/55 transition-colors hover:bg-white/[0.12] hover:text-white/85"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden text-[12.5px] font-medium sm:inline">
                {active.name}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            sideOffset={8}
            className="w-64 rounded-lg border-white/[0.08] bg-[#1a1a1d] p-1 shadow-xl shadow-black/50"
          >
            {MODES.map((m) => (
              <DropdownMenuItem
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className="flex cursor-pointer items-start justify-between gap-3 rounded-md px-2.5 py-2 focus:bg-white/[0.06]"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-white/85">
                    {m.name}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-white/35">
                    {m.description}
                  </span>
                </span>
                {m.id === mode && (
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--chat-accent)]" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Message"
          className="min-h-[36px] max-h-[140px] flex-1 resize-none self-center bg-transparent py-2 text-[14.5px] text-white/90 outline-none placeholder:text-white/30 disabled:opacity-40"
        />

        <button
          type="submit"
          disabled={sending || disabled || !value.trim()}
          aria-label="Send message"
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
            value.trim() && !sending && !disabled
              ? "bg-[var(--chat-accent)] text-[var(--chat-on-accent)] hover:opacity-90"
              : "bg-white/[0.07] text-white/25",
          )}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
