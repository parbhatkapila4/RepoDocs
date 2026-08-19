import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";

export const metadata = {
  title: "Documentation  -  RepoDoc",
  description:
    "How to connect a repository, query a codebase, and generate documentation with RepoDoc.",
};

const SECTIONS = [
  { id: "getting-started", label: "01", title: "Getting started" },
  { id: "indexing", label: "02", title: "Indexing" },
  { id: "querying", label: "03", title: "Querying" },
  { id: "documentation", label: "04", title: "Documentation & README" },
  { id: "sharing", label: "05", title: "Sharing" },
  { id: "stack", label: "06", title: "Under the hood" },
];

export default function DocumentationPage() {
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
        <Eyebrow>documentation</Eyebrow>
        <h1 className="mt-6 text-[clamp(2rem,4.4vw,3.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white">
          Connect a repository.
          <br />
          <span className="text-white/45">Query the system.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-white/55">
          A short guide to the four flows that make up RepoDoc  -  indexing,
          querying, documentation, and sharing. Every section is self-contained
          and points back at the API where relevant.
        </p>
      </section>

      <section>
        <div className="mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 py-10">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
            on this page
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="group flex items-baseline gap-3 py-1 text-[14px] text-white/55 transition-colors hover:text-white"
                >
                  <span className="font-mono text-[11px] text-white/30">
                    {s.label}
                  </span>
                  <span>{s.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Section id="getting-started" label="01 / getting started" title="Three steps to a queryable repo">
        <ol className="space-y-5">
          <Step
            n="1"
            title="Sign in"
            body="Authenticate with GitHub or email. Sessions are managed by Clerk; there is no separate API key to provision."
          />
          <Step
            n="2"
            title="Create a project"
            body="Paste a GitHub URL. RepoDoc walks the file tree and summarizes then embeds each source file in a background job. The import graph is derived from the stored source on demand, the first time you open the architecture view."
          />
          <Step
            n="3"
            title="Ask anything"
            body="Once indexing finishes, the chat surface is live. Every answer cites the files used to ground it."
          />
        </ol>
      </Section>

      <Section id="indexing" label="02 / indexing" title="What happens when you connect a repo">
        <p className="text-[14.5px] leading-[1.7] text-white/60">
          Indexing runs as a background job and emits progress through the
          dashboard. It typically takes 5&ndash;15 minutes depending on
          repository size. The worker time-boxes each run, writes a resume
          cursor, and requeues itself, so a large repo indexes across several
          short invocations rather than one long one.
        </p>
        <ul className="mt-6 space-y-3">
          <Bullet>
            Files are fetched with LangChain&apos;s GithubRepoLoader, scoped to
            the default branch. Lockfiles and VCS metadata are skipped;
            everything else in the tree is indexed.
          </Bullet>
          <Bullet>
            Each file is summarized with Gemini 2.5 Flash, then embedded with{" "}
            <span className="font-mono text-[12.5px] text-white/80">
              gemini-embedding-001
            </span>{" "}
            (768 dimensions).
          </Bullet>
          <Bullet>
            Vectors are written to PostgreSQL with the pgvector extension. A
            single database holds metadata, embeddings, and conversation
            history.
          </Bullet>
        </ul>
      </Section>

      <Section id="querying" label="03 / querying" title="Chat over an indexed repo">
        <p className="text-[14.5px] leading-[1.7] text-white/60">
          Chat is a grounded conversation that returns an answer plus the source
          files it was built from. Vector retrieval runs inside that endpoint  -
          the question is embedded, matched against file summaries by cosine
          similarity, and the top 5 files are passed into the answer prompt.
          There is no separate retrieval-only endpoint.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface>
            <SurfaceLabel>chat</SurfaceLabel>
            <code className="mt-1 block font-mono text-[13px] text-white">
              POST /api/query
            </code>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-white/55">
              Natural-language Q&amp;A with the source files listed alongside
              the answer. Accepts a conversation history for follow-ups.
            </p>
          </Surface>
          <Surface>
            <SurfaceLabel>repo discovery</SurfaceLabel>
            <code className="mt-1 block font-mono text-[13px] text-white">
              POST /api/search
            </code>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-white/55">
              Finds repositories on GitHub by keyword, language, and topic  -
              for picking something to index. It does not search your indexed
              files.
            </p>
          </Surface>
        </div>
      </Section>

      <Section id="documentation" label="04 / documentation & readme" title="Generate, then refine">
        <p className="text-[14.5px] leading-[1.7] text-white/60">
          Both documentation and README generation run against the indexed
          codebase. The output is editable through follow-up questions  - 
          &quot;add a troubleshooting section&quot; or &quot;update the API
          examples&quot; modify the document in place rather than starting
          over.
        </p>
        <ul className="mt-6 space-y-3">
          <Bullet>
            A project holds one current document. Each follow-up edit is stored
            with the content it produced, so earlier revisions stay reachable
            through the QnA history.
          </Bullet>
          <Bullet>
            Markdown rendering uses remark-gfm, with syntax highlighting
            wired through react-syntax-highlighter.
          </Bullet>
        </ul>
      </Section>

      <Section id="sharing" label="05 / sharing" title="Token-based public links">
        <p className="text-[14.5px] leading-[1.7] text-white/60">
          Documentation and README pages can be published to a tokenized URL
          without exposing the underlying project. Tokens are scoped per
          document, can be revoked at any time, and never grant access to the
          original repository or chat history.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <KV label="public docs" value="/docs/{token}" />
          <KV label="public readme" value="/readme/{token}" />
        </div>
      </Section>

      <Section id="stack" label="06 / under the hood" title="The stack">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface>
            <SurfaceLabel>app</SurfaceLabel>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-white/60">
              Next.js (App Router) on the server, React on the client,
              Tailwind for styling, Clerk for auth.
            </p>
          </Surface>
          <Surface>
            <SurfaceLabel>data</SurfaceLabel>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-white/60">
              PostgreSQL + pgvector, accessed through Prisma. One database
              for metadata, vectors, and history.
            </p>
          </Surface>
          <Surface>
            <SurfaceLabel>models</SurfaceLabel>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-white/60">
              All generation goes through OpenRouter, picked per task: Gemini
              2.5 Flash for chat and summaries, Gemini 2.5 Pro for README,
              Claude Haiku for docs edits. There is no cross-provider failover.
            </p>
          </Surface>
          <Surface>
            <SurfaceLabel>retrieval</SurfaceLabel>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-white/60">
              Vector similarity search over file-level summaries. The matching
              files are passed into the answer prompt for grounding and listed
              with the answer.
            </p>
          </Surface>
        </div>
      </Section>

      <div>
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-6 sm:px-8 lg:px-12 py-10 md:flex-row md:items-center">
          <p className="text-[14px] text-white/55">
            Stuck? The repository is public and contributions are welcome.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/parbhatkapila4/RepoDocs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[13px] text-white/80 transition-colors hover:border-white/20 hover:text-white"
            >
              <Github className="h-3.5 w-3.5" />
              github
            </a>
            <Link
              href="/api"
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-[13px] font-medium text-black transition-all hover:bg-white/95"
            >
              api reference
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
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

function Section({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
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
    <li className="flex items-start gap-4">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.02] font-mono text-[11px] text-white/70">
        {n}
      </span>
      <div>
        <div className="text-[15px] font-medium text-white">{title}</div>
        <p className="mt-1.5 text-[14px] leading-[1.65] text-white/55">
          {body}
        </p>
      </div>
    </li>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[14px] leading-[1.65] text-white/60">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/30" />
      <span>{children}</span>
    </li>
  );
}

function Surface({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5 transition-colors hover:border-white/[0.12]">
      {children}
    </div>
  );
}

function SurfaceLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-[13px] text-white/85">{value}</div>
    </div>
  );
}
