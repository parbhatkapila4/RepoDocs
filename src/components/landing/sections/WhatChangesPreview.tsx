"use client";

import React, { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";

import { tokenizeLines, type Token } from "../hero/tokenize";
import { moduleById } from "./whatchanges-data";

const TOKEN_CLASS: Record<Token["type"], string> = {
  keyword: "text-white/70",
  string: "text-white/55",
  comment: "text-white/30 italic",
  number: "text-white/70",
  identifier: "text-white/95",
  punctuation: "text-white/45",
  whitespace: "",
};

interface Props {
  nodeId: string;
}

export default function WhatChangesPreview({ nodeId }: Props) {
  const mod = moduleById(nodeId);
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#08080b]">
      <AnimatePresence mode="wait">
        {mod && (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Header mod={mod} />
            <CodeBody mod={mod} />
            <Footer mod={mod} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({ mod }: { mod: ReturnType<typeof moduleById> }) {
  if (!mod) return null;
  return (
    <div className="border-b border-white/[0.05] px-5 pb-4 pt-5">
      <div className="flex items-baseline gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-amber-200/70">
          {mod.label}
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
          module
        </span>
      </div>
      <p className="mt-3 text-[14px] leading-snug text-white/85">
        {mod.description}
      </p>
      <p className="mt-2 font-mono text-[11px] text-white/40">
        {mod.filePath}
      </p>
    </div>
  );
}

function CodeBody({ mod }: { mod: ReturnType<typeof moduleById> }) {
  const lines = useMemo(() => (mod ? tokenizeLines(mod.body) : []), [mod]);
  if (!mod) return null;

  return (
    <div className="overflow-hidden px-3 py-3">
      <pre className="rounded-md bg-[#06060a] font-mono text-[12px] leading-[1.7]">
        {lines.map((tokens, i) => {
          const lineNumber = mod.startLine + i;
          const isHighlighted =
            mod.highlight &&
            lineNumber >= mod.highlight.from &&
            lineNumber <= mod.highlight.to;
          return (
            <div
              key={i}
              className={`relative flex ${isHighlighted ? "bg-amber-400/[0.05]" : ""
                }`}
            >
              {isHighlighted && (
                <span className="absolute left-0 top-0 h-full w-[2px] bg-amber-400/70" />
              )}
              <span
                className={`shrink-0 select-none border-r border-white/[0.04] py-0 pl-3 pr-2.5 text-right tabular-nums ${isHighlighted ? "text-amber-300/70" : "text-white/22"
                  }`}
                style={{ minWidth: "2.5rem" }}
              >
                {lineNumber}
              </span>
              <code className="block flex-1 overflow-x-auto whitespace-pre py-0 pl-3 pr-3">
                {tokens.length === 0 ? (
                  <span> </span>
                ) : (
                  tokens.map((tok, j) => (
                    <span key={j} className={TOKEN_CLASS[tok.type]}>
                      {tok.text}
                    </span>
                  ))
                )}
              </code>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function Footer({ mod }: { mod: ReturnType<typeof moduleById> }) {
  if (!mod || !mod.highlight) return null;
  return (
    <div className="border-t border-white/[0.05] px-5 py-2.5 font-mono text-[10.5px] text-white/30">
      <span className="text-amber-200/60">
        cited as {mod.filePath}:{mod.highlight.from}-{mod.highlight.to}
      </span>
    </div>
  );
}
