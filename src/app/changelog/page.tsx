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
  tag: "major" | "minor" | "patch";
  highlight?: string;
  changes: { type: ChangeType; items: string[] }[];
}

const RELEASES: Release[] = [
  {
    version: "1.0.0",
    date: "2026-05-06",
    tag: "major",
    highlight:
      "First stable release. The full retrieval, documentation, and sharing surface goes live.",
    changes: [
      {
        type: "added",
        items: [
          "GitHub repository ingestion via LangChain GithubRepoLoader",
          "RAG-powered chat with Gemini 2.5 Flash and 768-dim embeddings",
          "PostgreSQL + pgvector for similarity search",
          "One-click documentation and README generation",
          "Token-based public sharing for docs and READMEs",
          "Repository analytics with language distribution and GitHub stats",
          "Multi-project support with per-project history",
          "Stripe integration with subscription plans",
          "Rate limiting and per-user request budgets",
          "Inline citations on every answer",
        ],
      },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-03-14",
    tag: "minor",
    changes: [
      {
        type: "added",
        items: [
          "Public share links for documentation and README",
          "Share link revocation",
          "Markdown rendering with remark-gfm",
          "Repository metadata: stars, forks, watchers, language mix",
        ],
      },
      {
        type: "changed",
        items: [
          "Improved chunking and retrieval quality on large codebases",
          "Tightened embedding prompts for higher recall",
          "Better loading and empty states across the app",
        ],
      },
      {
        type: "fixed",
        items: [
          "Vector search ranking on repos with many similar files",
          "GitHub API rate-limit handling on initial index",
          "Embedding generation for very large source files",
        ],
      },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-02-02",
    tag: "minor",
    changes: [
      {
        type: "added",
        items: [
          "Redux Toolkit for cross-route state",
          "Project context and shared hooks",
          "Analytics surface with platform metrics",
          "Database indexes for faster project lookups",
        ],
      },
      {
        type: "changed",
        items: [
          "Migrated to Next.js App Router",
          "Upgraded Prisma with first-class pgvector support",
          "Reorganized API routes for predictability",
        ],
      },
      {
        type: "security",
        items: [
          "Zod validation across API boundaries",
          "Token-bucket rate limiting per user",
          "Stronger CSRF and XSS posture",
        ],
      },
    ],
  },
  {
    version: "0.7.0",
    date: "2025-12-18",
    tag: "minor",
    changes: [
      {
        type: "added",
        items: [
          "Landing page with product demo",
          "Pricing, about, contact, terms, and privacy pages",
        ],
      },
      {
        type: "changed",
        items: [
          "Refreshed marketing copy and section structure",
          "Mobile responsiveness pass on all marketing pages",
        ],
      },
    ],
  },
  {
    version: "0.6.0",
    date: "2025-11-04",
    tag: "minor",
    changes: [
      {
        type: "added",
        items: [
          "Jest and React Testing Library scaffolding",
          "Coverage on the RAG pipeline and core API routes",
        ],
      },
      {
        type: "changed",
        items: [
          "Stricter TypeScript settings across the codebase",
          "Lint rules brought in line with the rest of the org",
        ],
      },
    ],
  },
];

const tagColor: Record<Release["tag"], string> = {
  major: "text-amber-300/90",
  minor: "text-sky-300/85",
  patch: "text-emerald-300/85",
};

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
          <span className="text-white/45">In order, with dates.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-white/55">
          A running log of every release. The most recent build is at the top.
          Anything user-visible eventually lands here.
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
                        className={`font-mono text-[10px] uppercase tracking-[0.22em] ${tagColor[r.tag]}`}
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
