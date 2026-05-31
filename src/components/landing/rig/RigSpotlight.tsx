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
    body: "What does this service do? Where's auth handled? RepoDoc answers from the indexed source in seconds  -  no spelunking.",
  },
  {
    icon: Quote,
    label: "Citations",
    title: "Trust every answer",
    body: "Each response cites the exact lines it came from. Click through and verify against the real code.",
  },
  {
    icon: BookText,
    label: "Docs",
    title: "Docs that stay true",
    body: "README and module docs generated from the code, and regenerated as it changes  -  never stale.",
  },
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
        <circle cx="98" cy="118" r="2.5" />
        <circle cx="60" cy="205" r="2" />
        <circle cx="125" cy="255" r="2" />
        <circle cx="235" cy="100" r="2" />
        <circle cx="210" cy="225" r="1.8" />
      </g>
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
      className={`border px-5 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.16em] ${highlighted ? "border-white/25" : "border-white/[0.12]"
        }`}
      style={{ backgroundColor: "rgba(10,10,10,0.95)" }}
    >
      <div className={dim ? "text-white/40" : "text-[#f3eee4]"}>{children}</div>
      {accent && (
        <div
          className="mt-1 flex items-center justify-center gap-1 text-[9.5px]"
          style={{ color: GREEN }}
        >
          <span>✓</span>
          {accent}
        </div>
      )}
    </div>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="h-4 w-px"
        style={{ background: `linear-gradient(to bottom, transparent, ${GREEN})` }}
      />
      <span
        className="my-1 font-mono text-[8.5px] uppercase tracking-[0.18em]"
        style={{ color: GREEN }}
      >
        {label}
      </span>
      <span
        className="h-4 w-px"
        style={{ background: `linear-gradient(to top, transparent, ${GREEN})` }}
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

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <FlowCard dim>Scattered files</FlowCard>
                <Connector label="indexed" />
                <FlowCard highlighted accent="MAPPED">
                  RepoDoc
                </FlowCard>
                <Connector label="linked" />
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
                See the whole system.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-[1.6] text-white/55">
                Modules, services, schemas  -  RepoDoc traces how every piece
                connects, so you can follow a request from the route handler all
                the way to the database.
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
