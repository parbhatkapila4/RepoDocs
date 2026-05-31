import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "API Reference  -  RepoDoc",
  description:
    "Programmatic access to RepoDoc's retrieval, search, and analytics endpoints.",
};

type Method = "GET" | "POST" | "PUT" | "DELETE";

const methodColor: Record<Method, string> = {
  GET: "text-emerald-300/80",
  POST: "text-amber-300/80",
  PUT: "text-sky-300/80",
  DELETE: "text-rose-300/80",
};

const ENDPOINTS: {
  method: Method;
  path: string;
  summary: string;
  request?: string;
  response?: string;
}[] = [
    {
      method: "POST",
      path: "/api/query",
      summary:
        "Ask a natural-language question about an indexed project. Returns a grounded answer with citations to the source files used.",
      request: `{
  "projectId": "uuid",
  "question": "How does authentication work?",
  "conversationHistory": [
    { "role": "user", "content": "previous question" },
    { "role": "assistant", "content": "previous answer" }
  ]
}`,
      response: `{
  "answer": "Authentication is handled by Clerk middleware...",
  "sources": [
    {
      "fileName": "src/lib/auth.ts",
      "similarity": 0.89,
      "summary": "Configures Clerk session validation"
    }
  ]
}`,
    },
    {
      method: "POST",
      path: "/api/search",
      summary:
        "Run a semantic search over file embeddings for a project. Returns the top matches by cosine similarity.",
      request: `{
  "projectId": "uuid",
  "query": "rate limiting",
  "limit": 10
}`,
      response: `{
  "results": [
    {
      "fileName": "src/lib/rate-limit.ts",
      "similarity": 0.81,
      "summary": "Token bucket implementation"
    }
  ]
}`,
    },
    {
      method: "GET",
      path: "/api/analytics",
      summary:
        "Retrieve aggregated usage and indexing metrics for the authenticated user across their projects.",
      response: `{
  "totalProjects": 12,
  "totalQueries": 4821,
  "avgLatencyMs": 142,
  "cacheHitRate": 0.73
}`,
    },
    {
      method: "GET",
      path: "/api/architecture",
      summary:
        "Return the resolved import graph for a project  -  nodes, edges, and module groupings used by the architecture view.",
      response: `{
  "nodes": [
    { "id": "src/app/page.tsx", "group": "app" }
  ],
  "edges": [
    { "from": "src/app/page.tsx", "to": "src/lib/auth.ts" }
  ]
}`,
    },
    {
      method: "POST",
      path: "/api/analyze-diff",
      summary:
        "Analyze a unified diff against an indexed project and return a structured summary of the change.",
      request: `{
  "projectId": "uuid",
  "diff": "diff --git a/src/lib/auth.ts ..."
}`,
    },
    {
      method: "GET",
      path: "/api/observability",
      summary:
        "Inspect cost, latency, and indexing health metrics for a single project.",
    },
  ];

export default function ApiReferencePage() {
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
        <Eyebrow>api reference</Eyebrow>
        <h1 className="mt-6 text-[clamp(2rem,4.4vw,3.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white">
          A small surface area.
          <br />
          <span className="text-white/45">Stable, JSON, predictable.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-white/55">
          Every product surface is built on the same handful of endpoints.
          Authenticate with a Clerk session, send JSON, get JSON back. All
          requests are scoped to projects you own.
        </p>
      </section>

      <Section label="01 / authentication" title="Session-based auth">
        <p className="text-[14.5px] leading-[1.7] text-white/60">
          RepoDoc uses Clerk for authentication. Requests must carry a valid
          session cookie issued by the same Clerk application  -  there is no
          separate API key system. Endpoints return{" "}
          <code className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[12px] text-white/80">
            401 Unauthorized
          </code>{" "}
          when the session is missing or expired, and{" "}
          <code className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[12px] text-white/80">
            403 Forbidden
          </code>{" "}
          for projects you don&apos;t own.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KV label="base" value="https://repodoc.app" />
          <KV label="content-type" value="application/json" />
          <KV label="rate limit" value="60 req / min" />
        </div>
      </Section>

      <Section label="02 / endpoints" title="Reference">
        <div className="divide-y divide-white/[0.05]">
          {ENDPOINTS.map((ep) => (
            <article key={ep.path} className="py-7 first:pt-0 last:pb-0">
              <header className="flex flex-wrap items-baseline gap-3">
                <span
                  className={`font-mono text-[11px] uppercase tracking-[0.18em] ${methodColor[ep.method]}`}
                >
                  {ep.method}
                </span>
                <code className="font-mono text-[15px] text-white">
                  {ep.path}
                </code>
              </header>
              <p className="mt-3 max-w-3xl text-[14px] leading-[1.65] text-white/55">
                {ep.summary}
              </p>

              {(ep.request || ep.response) && (
                <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {ep.request && (
                    <CodeBlock label="request" code={ep.request} />
                  )}
                  {ep.response && (
                    <CodeBlock label="response" code={ep.response} />
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </Section>
      <Section label="03 / errors" title="Error shape">
        <p className="text-[14.5px] leading-[1.7] text-white/60">
          Errors are returned with a non-2xx status and a JSON body. The
          message is suitable for surfacing to end users; the code is stable
          and intended for branching logic.
        </p>
        <div className="mt-5">
          <CodeBlock
            label="error"
            code={`{
  "error": {
    "code": "project_not_found",
    "message": "No project with that id exists for this account."
  }
}`}
          />
        </div>
      </Section>

      <FooterStrip />
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

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.06] bg-black/40">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-3.5 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
          {label}
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.65] text-white/75">
        {code}
      </pre>
    </div>
  );
}

function FooterStrip() {
  return (
    <div>
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-6 sm:px-8 lg:px-12 py-10 md:flex-row md:items-center">
        <p className="text-[14px] text-white/55">
          Need help wiring it in? The documentation page walks through every
          flow end-to-end.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/documentation"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[13px] text-white/80 transition-colors hover:border-white/20 hover:text-white"
          >
            documentation
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-[13px] font-medium text-black transition-all hover:bg-white/95"
          >
            talk to us
          </Link>
        </div>
      </div>
    </div>
  );
}
