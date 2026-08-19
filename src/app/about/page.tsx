import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Github } from "lucide-react";

export const metadata = {
  title: "About  -  RepoDoc",
  description:
    "Why RepoDoc exists, how it's built, and what we're trying to fix about reading other people's code.",
};

const STATS = [
  { label: "embedding dims", value: "768" },
  { label: "files per answer", value: "top 5" },
  { label: "worker lease", value: "5 min" },
  { label: "unit tests", value: "20" },
];

const STACK = [
  { label: "framework", value: "Next.js" },
  { label: "database", value: "Postgres + pgvector" },
  { label: "orm", value: "Prisma" },
  { label: "auth", value: "Clerk" },
  { label: "chat model", value: "Gemini 2.5 Flash" },
  { label: "llm gateway", value: "OpenRouter" },
];

export default function AboutPage() {
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
        <Eyebrow>about</Eyebrow>
        <h1 className="mt-6 text-[clamp(2rem,4.4vw,3.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white">
          Reading other people&apos;s code
          <br />
          <span className="text-white/45">should not feel like archaeology.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-white/55">
          RepoDoc turns a GitHub repository into a system you can interrogate.
          Connect a repo, wait a few minutes, and get a chat surface, generated
          documentation, and a navigable architecture view  -  all grounded in
          the actual source.
        </p>
      </section>

      <section>
        <div className="mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 py-10">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/[0.05] sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-1 bg-[#040406] px-5 py-6"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                  {s.label}
                </div>
                <div className="text-[24px] font-medium tracking-[-0.02em] text-white">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/30">
            fixed parameters of the pipeline, read from the source
          </p>
        </div>
      </section>

      <Section label="01 / why" title="Documentation always loses">
        <p className="text-[15px] leading-[1.7] text-white/65">
          Onboarding into an unfamiliar codebase is a rite of passage everyone
          dreads. Documentation goes stale the day it&apos;s written. The
          original authors leave. The README covers the happy path and nothing
          else. After a few weeks of context-switching, the people who used to
          have the answers have moved on too.
        </p>
        <p className="mt-5 text-[15px] leading-[1.7] text-white/65">
          We built RepoDoc because the source code is the only thing that
          stays accurate. Make the code itself queryable, and the staleness
          problem goes away  -  every answer comes back with the files it was
          grounded in.
        </p>
      </Section>

      <Section label="02 / how" title="The pipeline">
        <ol className="space-y-7">
          <Step
            n="01"
            title="Ingest"
            body="Repository contents are fetched with LangChain's GithubRepoLoader, scoped to the default branch and respecting ignore rules."
          />
          <Step
            n="02"
            title="Summarize"
            body="Each file is summarized with Gemini 2.5 Flash. Summaries are short, deterministic, and produced in parallel."
          />
          <Step
            n="03"
            title="Embed"
            body="Summaries are embedded with gemini-embedding-001 (768 dimensions) and stored in PostgreSQL through pgvector."
          />
          <Step
            n="04"
            title="Retrieve"
            body="Queries run cosine similarity against the file index, then pass the top 5 matching files into the answer prompt for grounding and citation."
          />
        </ol>
      </Section>

      <Section label="03 / stack" title="What it's built on">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/[0.05] sm:grid-cols-3">
          {STACK.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-1 bg-[#040406] px-5 py-5"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                {s.label}
              </div>
              <div className="text-[15px] font-medium tracking-[-0.01em] text-white">
                {s.value}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[14.5px] leading-[1.7] text-white/55">
          One database holds metadata, embeddings, and conversation history.
          We deliberately avoided a separate vector store  -  keeping pgvector
          inline keeps marginal cost at zero and operational surface area
          small.
        </p>
      </Section>

      <Section label="04 / open source" title="The product is the source">
        <p className="text-[15px] leading-[1.7] text-white/65">
          RepoDoc is open source. The codebase is the canonical reference for
          everything on this page  -  the indexing job, the retrieval logic, the
          prompt templates, all of it. If something on the deployed product
          doesn&apos;t match what&apos;s on this page, the source is the
          tiebreaker.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/parbhatkapila4/RepoDocs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[13px] text-white/85 transition-colors hover:border-white/20 hover:text-white"
          >
            <Github className="h-3.5 w-3.5" />
            view on github
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <Link
            href="/documentation"
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-[13px] font-medium text-black transition-all hover:bg-white/95"
          >
            read the docs
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Section>
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

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
              {label}
            </div>
            <h2 className="mt-3 text-[22px] font-medium tracking-[-0.02em] text-white">
              {title}
            </h2>
          </div>
          <div className="md:col-span-9">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex items-start gap-5">
      <span className="mt-1 inline-flex shrink-0 items-baseline font-mono text-[11px] tracking-[0.18em] text-white/35">
        {n}
      </span>
      <div className="border-l border-white/[0.08] pl-5">
        <div className="text-[16px] font-medium tracking-[-0.01em] text-white">
          {title}
        </div>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-[1.7] text-white/60">
          {body}
        </p>
      </div>
    </li>
  );
}
