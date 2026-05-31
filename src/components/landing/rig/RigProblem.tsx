"use client";

import React from "react";
import { motion } from "motion/react";

import { RigEyebrow, STAGE, RED } from "./shared";

const LINE = "rgba(255,255,255,0.09)";

const CARDS = [
  {
    n: "001",
    cat: "Onboarding tax",
    title: "You're grepping in the dark.",
    body: "Every new repo is hours of jumping between files, guessing how they connect, hoping you didn't miss the one that matters.",
  },
  {
    n: "002",
    cat: "Stale docs",
    title: "The docs lie, if they exist.",
    body: "READMEs go out of date the day they're written. The only real source of truth is the code  -  and reading 80,000 lines isn't a plan.",
  },
  {
    n: "003",
    cat: "Tribal knowledge",
    title: "It's all in someone's head.",
    body: "How the system fits together lives with two senior engineers. When they're busy or gone, everyone else is blocked.",
  },
  {
    n: "004",
    cat: "AI guesswork",
    title: "Generic AI hallucinates.",
    body: "Assistants that don't know your codebase invent APIs and misread the architecture. No citations, no proof, no trust.",
  },
];

const EYE_TICKS = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  return {
    x1: 240 + Math.cos(a) * 196,
    y1: 240 + Math.sin(a) * 196,
    x2: 240 + Math.cos(a) * 210,
    y2: 240 + Math.sin(a) * 210,
  };
});

function SearchIllustration() {
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      className="h-auto w-full max-w-[360px] text-white"
      aria-hidden
    >
      <g opacity="0.22">
        <g stroke="currentColor" fill="none">
          <circle cx="240" cy="240" r="60" strokeWidth="0.6" />
          <circle cx="240" cy="240" r="108" strokeWidth="0.6" />
          <circle cx="240" cy="240" r="156" strokeWidth="0.6" />
          <circle cx="240" cy="240" r="204" strokeWidth="0.6" />
          <line x1="240" y1="24" x2="240" y2="456" strokeWidth="0.4" />
          <line x1="24" y1="240" x2="456" y2="240" strokeWidth="0.4" />
          {EYE_TICKS.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth="0.5" />
          ))}
          <path d="M96 240 Q240 150 384 240 Q240 330 96 240 Z" strokeWidth="1.2" />
          <circle cx="240" cy="240" r="42" strokeWidth="1" />
          <polyline points="44,78 44,44 78,44" strokeWidth="0.9" />
          <polyline points="436,78 436,44 402,44" strokeWidth="0.9" />
          <polyline points="436,402 436,436 402,436" strokeWidth="0.9" />
          <polyline points="44,402 44,436 78,436" strokeWidth="0.9" />
          <g strokeWidth="0.4" strokeDasharray="3 7">
            <line x1="240" y1="240" x2="118" y2="104" />
            <line x1="240" y1="240" x2="362" y2="104" />
            <line x1="240" y1="240" x2="118" y2="376" />
            <line x1="240" y1="240" x2="362" y2="376" />
          </g>
        </g>
        <g fill="currentColor">
          <circle cx="118" cy="118" r="2.5" />
          <circle cx="360" cy="140" r="2" />
          <circle cx="140" cy="360" r="2" />
          <circle cx="352" cy="352" r="2.5" />
          <text
            x="240"
            y="466"
            textAnchor="middle"
            className="font-mono"
            fontSize="6"
            letterSpacing="3"
          >
            SCANNING SOURCE
          </text>
        </g>
      </g>

      <circle cx="240" cy="240" r="30" fill="none" stroke={RED} strokeWidth="1.5" opacity="0.5" />
      <circle cx="240" cy="240" r="15" fill={RED} className="animate-pulse" />
    </svg>
  );
}

export default function RigProblem() {
  return (
    <section className="relative" style={{ backgroundColor: STAGE }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-2xl border border-white/[0.1]"
          style={{ backgroundColor: STAGE }}
        >
          <div className="px-8 pb-9 pt-10 lg:px-12 lg:pb-11 lg:pt-12">
            <div className="flex justify-center">
              <RigEyebrow glyph="✕">The problem</RigEyebrow>
            </div>
            <h2
              className="mt-9 max-w-4xl text-[clamp(2.4rem,6vw,4.75rem)] font-black leading-[0.98] tracking-[-0.04em]"
              style={{ color: "#f3eee4" }}
            >
              You&apos;re shipping in code you don&apos;t understand.
            </h2>
          </div>
          <div className="h-px w-full" style={{ backgroundColor: LINE }} />
          <div className="grid gap-px lg:grid-cols-3" style={{ backgroundColor: LINE }}>
            <div
              className="flex items-center justify-center p-10 lg:row-span-2"
              style={{ backgroundColor: STAGE }}
            >
              <SearchIllustration />
            </div>

            {CARDS.map((c) => (
              <div
                key={c.n}
                className="flex flex-col gap-3 p-7"
                style={{ backgroundColor: STAGE }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#AFBFC0]">
                    {c.cat}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/25">
                    {c.n}
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-white">
                  {c.title}
                </h3>
                <p className="text-[13px] leading-[1.6] text-white/45">{c.body}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
