"use client";

import React from "react";
import {
  Layers,
  Compass,
  ShieldCheck,
  Terminal,
  Database,
  TriangleAlert,
} from "lucide-react";
import { ChatAvatar } from "./ChatAvatar";

const STARTERS = [
  {
    label: "Project structure",
    prompt: "How is the project structured?",
    icon: Layers,
  },
  {
    label: "Where to start",
    prompt: "I am new to this codebase. Which files should I read first?",
    icon: Compass,
  },
  {
    label: "Auth flow",
    prompt: "Walk me through the authentication flow",
    icon: ShieldCheck,
  },
  {
    label: "API surface",
    prompt: "What does the API layer look like?",
    icon: Terminal,
  },
  {
    label: "Data model",
    prompt: "Explain the database schema and how the tables relate",
    icon: Database,
  },
  {
    label: "Risky areas",
    prompt: "Which parts of this codebase look riskiest to change?",
    icon: TriangleAlert,
  },
];

export function WelcomePane({
  projectName,
  onPick,
}: {
  projectName: string;
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8">
      <ChatAvatar name={projectName} size={56} />

      <h2 className="mt-4 text-center text-[23px] font-semibold tracking-[-0.02em] text-white">
        Ask anything about{" "}
        <span className="text-[var(--chat-accent)]">{projectName}</span>
      </h2>
      <p className="mt-2 max-w-[430px] text-center text-[13.5px] leading-relaxed text-white/40">
        Every answer cites the source files it was drawn from, and the
        conversation is saved as you go.
      </p>

      <div className="mt-7 grid w-full max-w-[660px] gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-left transition-all hover:border-white/[0.14] hover:bg-white/[0.05]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] transition-colors group-hover:border-[var(--chat-accent)]/30 group-hover:bg-[var(--chat-accent)]/10">
              <s.icon className="h-4 w-4 text-white/30 transition-colors group-hover:text-[var(--chat-accent)]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-white/80">
                {s.label}
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-white/35">
                {s.prompt}
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-7 text-[11.5px] text-white/25">
        Enter to send &middot; Shift + Enter for a new line
      </p>
    </div>
  );
}
