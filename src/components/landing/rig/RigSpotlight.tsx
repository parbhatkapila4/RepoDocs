"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Network,
  MessageSquare,
  Quote,
  BookText,
  type LucideIcon,
} from "lucide-react";

import { STAGE, RED } from "./shared";

const GREEN = "#22c55e";
const PAPER = "#f3eee4";
const LINE = "rgba(255,255,255,0.09)";

const COLS: { icon: LucideIcon; label: string; title: string; body: string }[] = [
  {
    icon: MessageSquare,
    label: "Chat",
    title: "Ask in plain English",
    body: "What does this service do? Where's auth handled? RepoDoc answers from the indexed source  -  no spelunking.",
  },
  {
    icon: Quote,
    label: "Sources",
    title: "Check every answer",
    body: "Each response lists the files it was built from, ranked by similarity. Open them and verify against the real code.",
  },
  {
    icon: BookText,
    label: "Docs",
    title: "Docs written from code",
    body: "README and module docs generated from the indexed source rather than the last README  -  regenerate them whenever the repo moves on.",
  },
];
const ORBITS = [
  { path: "M10,160 a150,25 0 1,0 300,0 a150,25 0 1,0 -300,0", dur: 16, color: GREEN, r: 2, opacity: 0.8, reverse: false },
  { path: "M80,160 a80,150 0 1,0 160,0 a80,150 0 1,0 -160,0", dur: 26, color: PAPER, r: 1.8, opacity: 0.45, reverse: true },
  { path: "M10,160 a150,150 0 1,0 300,0 a150,150 0 1,0 -300,0", dur: 34, color: PAPER, r: 1.6, opacity: 0.35, reverse: false },
];

const NODE_DOTS = [
  { x: 98, y: 118, r: 2.5, dur: 4.4, begin: 0 },
  { x: 60, y: 205, r: 2, dur: 5.6, begin: 1.2 },
  { x: 125, y: 255, r: 2, dur: 3.8, begin: 2.1 },
  { x: 235, y: 100, r: 2, dur: 6.2, begin: 0.6 },
  { x: 210, y: 225, r: 1.8, dur: 4.9, begin: 2.8 },
];

function Globe() {
  return (
    <svg viewBox="0 0 320 320" fill="none" className="h-full w-full" aria-hidden>
      <g stroke="rgba(243,238,228,0.09)" strokeWidth="1">
        <circle cx="160" cy="160" r="150" />
        <ellipse cx="160" cy="48" rx="100" ry="15" />
        <ellipse cx="160" cy="88" rx="131" ry="20" />
        <ellipse cx="160" cy="124" rx="146" ry="23" />
        <ellipse cx="160" cy="160" rx="150" ry="25" />
        <ellipse cx="160" cy="196" rx="146" ry="23" />
        <ellipse cx="160" cy="232" rx="131" ry="20" />
        <ellipse cx="160" cy="272" rx="100" ry="15" />
        <ellipse cx="160" cy="160" rx="120" ry="150" />
        <ellipse cx="160" cy="160" rx="80" ry="150" />
        <ellipse cx="160" cy="160" rx="38" ry="150" />
        <line x1="160" y1="10" x2="160" y2="310" />
      </g>
      <g fill="rgba(243,238,228,0.18)">
        {NODE_DOTS.map((d) => (
          <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.r}>
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur={`${d.dur}s`}
              begin={`${d.begin}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>
      {ORBITS.map((o, i) => (
        <circle key={i} r={o.r} fill={o.color} opacity={o.opacity}>
          <animateMotion
            dur={`${o.dur}s`}
            repeatCount="indefinite"
            path={o.path}
            calcMode="linear"
            keyPoints={o.reverse ? "1;0" : "0;1"}
            keyTimes="0;1"
          />
        </circle>
      ))}
    </svg>
  );
}

function FlowCard({
  children,
  accent,
  highlighted,
  dim,
}: {
  children: React.ReactNode;
  accent?: string;
  highlighted?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className={`border px-5 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.16em] ${highlighted ? "rig-core-glow border-white/25" : "border-white/[0.12]"
        }`}
      style={{ backgroundColor: "rgba(10,10,10,0.95)" }}
    >
      <div className={dim ? "text-white/40" : "text-[#f3eee4]"}>{children}</div>
      {accent && (
        <div
          className="rig-mapped mt-1 flex items-center justify-center gap-1 text-[9.5px]"
          style={{ color: GREEN }}
        >
          <span>✓</span>
          {accent}
        </div>
      )}
    </div>
  );
}

function Connector({ label, delay = 0 }: { label: string; delay?: number }) {
  return (
    <div className="relative flex flex-col items-center">
      <span
        className="h-4 w-px"
        style={{ background: `linear-gradient(to bottom, transparent, ${GREEN})` }}
      />
      <span
        className="relative z-10 my-1 font-mono text-[8.5px] uppercase tracking-[0.18em]"
        style={{ color: GREEN }}
      >
        {label}
      </span>
      <span
        className="h-4 w-px"
        style={{ background: `linear-gradient(to top, transparent, ${GREEN})` }}
      />
      <span
        aria-hidden
        className="rig-packet absolute left-1/2 top-0 h-[5px] w-[3px] -translate-x-1/2 rounded-full"
        style={{
          backgroundColor: GREEN,
          boxShadow: `0 0 8px ${GREEN}`,
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
}

function Badge({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex w-fit items-center gap-2 rounded-md border border-[#AFBFC0]/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
      style={{ color: RED }}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

export default function RigSpotlight() {
  return (
    <section className="relative mt-16 lg:mt-24" style={{ backgroundColor: STAGE }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-2xl border border-white/[0.1]"
        >
          <div className="grid lg:grid-cols-2">
            <div
              className="relative min-h-[440px] overflow-hidden border-b border-white/[0.08] lg:border-b-0 lg:border-r"
              style={{ backgroundColor: STAGE }}
            >
              <div className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2">
                <Globe />
              </div>

              <div
                className="absolute left-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10"
                style={{ backgroundColor: "rgba(10,10,10,0.6)" }}
              >
                <Network className="h-5 w-5" style={{ color: RED }} />
              </div>

              <style>{`
                @keyframes rig-packet-drop {
                  0% { top: -6%; opacity: 0; }
                  14% { opacity: 0.9; }
                  80% { opacity: 0.9; }
                  100% { top: 102%; opacity: 0; }
                }
                .rig-packet { animation: rig-packet-drop 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
                @keyframes rig-core-glow {
                  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                  50% { box-shadow: 0 0 26px -4px rgba(34, 197, 94, 0.4); }
                }
                .rig-core-glow { animation: rig-core-glow 4.8s ease-in-out infinite; }
                @keyframes rig-mapped-pulse {
                  0%, 100% { opacity: 0.65; }
                  50% { opacity: 1; }
                }
                .rig-mapped { animation: rig-mapped-pulse 2.4s ease-in-out infinite; }
              `}</style>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <FlowCard dim>Scattered files</FlowCard>
                <Connector label="indexed" />
                <FlowCard highlighted accent="MAPPED">
                  RepoDoc
                </FlowCard>
                <Connector label="linked" delay={1.2} />
                <FlowCard dim>Connected system</FlowCard>
              </div>
            </div>

            <div
              className="flex flex-col justify-center p-10 lg:p-14"
              style={{ backgroundColor: STAGE }}
            >
              <Badge icon={Network}>Architecture</Badge>
              <h2
                className="mt-6 text-[clamp(2.2rem,4.6vw,3.6rem)] font-black leading-[1.0] tracking-[-0.035em]"
                style={{ color: PAPER }}
              >
                See the whole repo.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-[1.6] text-white/55">
                Every indexed file in one map, with the import edges between
                them drawn. Click a file to see its dependencies in both
                directions, read straight out of the source  -  so you start
                from the shape of the repo instead of a folder tree.
              </p>
            </div>
          </div>

          <div className="h-px w-full" style={{ backgroundColor: LINE }} />

          <div className="grid gap-px lg:grid-cols-3" style={{ backgroundColor: LINE }}>
            {COLS.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex flex-col gap-4 p-8"
                style={{ backgroundColor: STAGE }}
              >
                <Badge icon={c.icon}>{c.label}</Badge>
                <h3
                  className="text-[20px] font-bold tracking-[-0.01em]"
                  style={{ color: PAPER }}
                >
                  {c.title}
                </h3>
                <p className="text-[13.5px] leading-[1.6] text-white/45">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
