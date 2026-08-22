"use client";

import React from "react";
import { motion } from "motion/react";

import { RigEyebrow, STAGE, RED } from "./shared";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

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
const round2 = (n: number) => Math.round(n * 100) / 100;
const EYE_TICKS = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  return {
    x1: round2(240 + Math.cos(a) * 196),
    y1: round2(240 + Math.sin(a) * 196),
    x2: round2(240 + Math.cos(a) * 210),
    y2: round2(240 + Math.sin(a) * 210),
  };
});

const SWEEP_DUR = 8;
const BLIPS = [
  { x: 118, y: 118, r: 2.5 },
  { x: 360, y: 140, r: 2 },
  { x: 140, y: 360, r: 2 },
  { x: 352, y: 352, r: 2.5 },
].map((b) => {
  const deg = (Math.atan2(b.y - 240, b.x - 240) * 180) / Math.PI;
  const delay = (((deg + 90 + 360) % 360) / 360) * SWEEP_DUR;
  return { ...b, delay: Number(delay.toFixed(2)) };
});

function SearchIllustration() {
  const reduced = usePrefersReducedMotion();
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      className="h-auto w-full max-w-[360px] text-white"
      aria-hidden
    >
      <style>{`
        .rig-eye-blink {
          transform-box: fill-box;
          transform-origin: center;
          animation: rig-eye-blink 7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes rig-eye-blink {
          0%, 91%, 96%, 100% { transform: scaleY(1); }
          93.5% { transform: scaleY(0.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rig-eye-blink { animation: none; }
        }
      `}</style>

      <g opacity="0.22">
        <g stroke="currentColor" fill="none">
          <circle cx="240" cy="240" r="60" strokeWidth="0.6" />
          <circle cx="240" cy="240" r="108" strokeWidth="0.6" />
          <circle cx="240" cy="240" r="156" strokeWidth="0.6" />
          <circle cx="240" cy="240" r="204" strokeWidth="0.6" />
          <line x1="240" y1="24" x2="240" y2="456" strokeWidth="0.4" />
          <line x1="24" y1="240" x2="456" y2="240" strokeWidth="0.4" />
          {EYE_TICKS.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              strokeWidth="0.5"
            />
          ))}
          <path
            className="rig-eye-blink"
            d="M96 240 Q240 150 384 240 Q240 330 96 240 Z"
            strokeWidth="1.2"
          />
          <circle
            className="rig-eye-blink"
            cx="240"
            cy="240"
            r="42"
            strokeWidth="1"
          />
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
          <text
            x="240"
            y="466"
            textAnchor="middle"
            className="font-mono"
            fontSize="6"
            letterSpacing="3"
          >
            SCANNING SOURCE
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="3.2s"
              repeatCount="indefinite"
            />
          </text>
        </g>
      </g>

      {!reduced && (
        <g>
          <path
            d="M240 240 L134 70.4 A200 200 0 0 1 240 40 Z"
            fill={RED}
            opacity="0.06"
          />
          <line
            x1="240"
            y1="240"
            x2="240"
            y2="40"
            stroke={RED}
            strokeWidth="1"
            opacity="0.4"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 240 240"
            to="360 240 240"
            dur={`${SWEEP_DUR}s`}
            repeatCount="indefinite"
          />
        </g>
      )}

      {!reduced &&
        [0, SWEEP_DUR / 2].map((begin) => (
          <circle
            key={begin}
            cx="240"
            cy="240"
            r="30"
            fill="none"
            stroke={RED}
            strokeWidth="0.8"
          >
            <animate
              attributeName="r"
              values="30;200"
              dur={`${SWEEP_DUR / 2}s`}
              begin={`${begin}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.35;0"
              dur={`${SWEEP_DUR / 2}s`}
              begin={`${begin}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      {BLIPS.map((b) => (
        <g key={`${b.x}-${b.y}`}>
          <circle
            cx={b.x}
            cy={b.y}
            r={b.r}
            fill="currentColor"
            opacity={reduced ? 0.6 : 0.18}
          >
            {!reduced && (
              <animate
                attributeName="opacity"
                values="0.18;1;0.18"
                keyTimes="0;0.06;1"
                dur={`${SWEEP_DUR}s`}
                begin={`${b.delay}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
          {!reduced && (
            <circle
              cx={b.x}
              cy={b.y}
              r={b.r}
              fill="none"
              stroke={RED}
              strokeWidth="0.8"
              opacity="0"
            >
              <animate
                attributeName="r"
                values={`${b.r};${b.r * 7};${b.r * 7}`}
                keyTimes="0;0.2;1"
                dur={`${SWEEP_DUR}s`}
                begin={`${b.delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.5;0;0"
                keyTimes="0;0.2;1"
                dur={`${SWEEP_DUR}s`}
                begin={`${b.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          )}
        </g>
      ))}

      <g className="rig-eye-blink">
        <circle
          cx="240"
          cy="240"
          r="30"
          fill="none"
          stroke={RED}
          strokeWidth="1.5"
          opacity="0.5"
        />
        <circle
          cx="240"
          cy="240"
          r="15"
          fill={RED}
          className={reduced ? undefined : "animate-pulse"}
        />
      </g>
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
          <div
            className="grid gap-px lg:grid-cols-3"
            style={{ backgroundColor: LINE }}
          >
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
                <p className="text-[13px] leading-[1.6] text-white/45">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
