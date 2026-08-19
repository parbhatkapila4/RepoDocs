import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Changelog  -  RepoDoc",
  description: "Release notes and product updates for RepoDoc.",
};

type ChangeType =
  | "added"
  | "changed"
  | "fixed"
  | "security"
  | "deprecated"
  | "removed";

const changeColor: Record<ChangeType, string> = {
  added: "text-emerald-300/85",
  changed: "text-sky-300/85",
  fixed: "text-amber-300/85",
  security: "text-rose-300/85",
  deprecated: "text-orange-300/85",
  removed: "text-white/45",
};

interface Release {
  version: string;
  date: string;
  tag: string;
  highlight?: string;
  changes: { type: ChangeType; items: string[] }[];
}

const RELEASES: Release[] = [
  {
    version: "Diff mode",
    date: "2026-06",
    tag: "drift",
    highlight:
      "Analyze a pasted diff, or the net change between the commit a repo was indexed at and its current HEAD.",
    changes: [
      {
        type: "added",
        items: [
          "POST /api/repo-changes  -  compares the indexed baseline commit against branch HEAD",
          "Baseline capture: indexedCommitSha, indexedBranch and indexedAt pinned at index start",
          "Structured diff analysis  -  impacted files, risk level, tests to update",
          "Shared guard and analysis core extracted so both diff modes run the same pipeline",
        ],
      },
    ],
  },
  {
    version: "Background jobs",
    date: "2026-04",
    tag: "indexing",
    changes: [
      {
        type: "added",
        items: [
          "BackgroundJob model for README and docs regeneration",
          "Fast and full indexing phases with a resume cursor",
        ],
      },
    ],
  },
  {
    version: "Leased job queue",
    date: "2026-03",
    tag: "indexing",
    highlight:
      "Indexing moved out of the request path into a Postgres-backed job with a lease.",
    changes: [
      {
        type: "added",
        items: [
          "IndexingJob table with an atomic compare-and-swap claim",
          "Five-minute lease so a crashed worker's job is reclaimed, not lost",
          "Time-boxed worker runs that save a cursor and requeue before the platform timeout",
          "Daily Vercel cron backstop plus on-demand worker kicks",
          "Retry and cancel from the dashboard",
        ],
      },
    ],
  },
  {
    version: "Cost controls",
    date: "2026-02",
    tag: "observability",
    changes: [
      {
        type: "added",
        items: [
          "QueryMetrics row per AI request: model, tokens, latency, estimated USD, success",
          "Cold-start, cache-hit and memory-similarity flags on every metric row",
          "Per-project monthlyCostLimitUsd  -  queries return 402 once exceeded",
          "Indexing pauses and requeues instead of running past the limit",
          "Observability page for cost and latency per project",
        ],
      },
    ],
  },
  {
    version: "Docs and analytics",
    date: "2025-12",
    tag: "product",
    changes: [
      {
        type: "added",
        items: [
          "Token-based public share links for docs and README, revocable at any time",
          "Repository analytics with language distribution and GitHub stats",
          "Markdown rendering with remark-gfm and syntax highlighting",
          "Landing, about, contact, terms and privacy pages",
        ],
      },
    ],
  },
  {
    version: "Plans and tests",
    date: "2025-11",
    tag: "platform",
    changes: [
      {
        type: "added",
        items: [
          "Plan tiers with project-count limits enforced at create time",
          "Gumroad checkout, with auto-downgrade on refund or cancellation",
          "Jest scaffolding and the first unit tests",
        ],
      },
      {
        type: "security",
        items: [
          "Zod validation across API boundaries",
          "Fixed-window rate limiting per identity, returning 429 with Retry-After",
        ],
      },
    ],
  },
  {
    version: "First build",
    date: "2025-09",
    tag: "foundation",
    changes: [
      {
        type: "added",
        items: [
          "GitHub repository ingestion via LangChain GithubRepoLoader",
          "File summaries embedded with gemini-embedding-001 at 768 dimensions",
          "PostgreSQL + pgvector cosine similarity search",
          "Grounded chat that lists the source files behind each answer",
          "README and documentation generation",
          "Clerk auth and Redux Toolkit for cross-route state",
        ],
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040406]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(245,158,11,0.04), transparent 70%)",
        }}
      />

      <TopBar />

      <section className="relative mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 pt-20 pb-12">
        <Eyebrow>changelog</Eyebrow>
        <h1 className="mt-6 text-[clamp(2rem,4.4vw,3.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white">
          What changed.
          <br />
          <span className="text-white/45">In order, from the commit log.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-white/55">
          A development log grouped by the month the work landed, most recent
          first. RepoDoc ships continuously and isn&apos;t cut into tagged
          releases, so these are milestones rather than version numbers  -  the
          git history is the record.
        </p>
      </section>

      <div>
        <div className="mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 py-12">
          <ol className="relative">
            {RELEASES.map((r, i) => (
              <li key={r.version} className="relative pb-14 last:pb-0">
                {i < RELEASES.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[6px] top-7 bottom-0 w-px bg-gradient-to-b from-white/12 via-white/6 to-transparent"
                  />
                )}

                <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="inline-block h-3 w-3 rounded-full border border-white/15 bg-[#040406]"
                      >
                        <span className="block h-full w-full rounded-full bg-amber-400/55" />
                      </span>
                      <div>
                        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
                          {r.date}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 ml-[24px] flex items-baseline gap-2.5">
                      <span className="text-[20px] font-medium tracking-[-0.02em] text-white">
                        {r.version}
                      </span>
                      <span
                        className="font-mono text-[10px] uppercase tracking-[0.22em] text-sky-300/85"
                      >
                        {r.tag}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-9">
                    {r.highlight && (
                      <p className="mb-7 max-w-2xl border-l-2 border-white/10 pl-4 text-[15px] leading-[1.65] text-white/70">
                        {r.highlight}
                      </p>
                    )}

                    <div className="space-y-7">
                      {r.changes.map((group) => (
                        <div key={group.type}>
                          <div
                            className={`font-mono text-[10.5px] uppercase tracking-[0.22em] ${changeColor[group.type]}`}
                          >
                            {group.type}
                          </div>
                          <ul className="mt-3 space-y-2">
                            {group.items.map((item) => (
                              <li
                                key={item}
                                className="flex items-start gap-3 text-[14px] leading-[1.6] text-white/65"
                              >
                                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/25" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}

function TopBar() {
  return (
    <div className="border-b border-white/[0.05]">
      <div className="flex items-center px-6 sm:px-8 lg:px-12 py-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white/40 transition-all group-hover:-translate-x-0.5 group-hover:text-white/70" />
          <Image
            src="/repodoc.png"
            alt="RepoDoc"
            width={20}
            height={20}
            className="rounded-[5px]"
          />
          <span className="text-[13.5px] font-medium tracking-[-0.01em] text-white/85 transition-colors group-hover:text-white">
            RepoDoc
          </span>
        </Link>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/45">
      <span className="h-1 w-1 rounded-full bg-amber-400" />
      {children}
    </div>
  );
}
