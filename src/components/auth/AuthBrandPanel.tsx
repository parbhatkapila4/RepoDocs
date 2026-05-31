import React from "react";
import Image from "next/image";

const PILLARS = [
  {
    num: "01",
    label: "retrieval",
    body: "Cosine similarity over file-level embeddings in pgvector. Top-5 grounded, citations on every answer.",
  },
  {
    num: "02",
    label: "observability",
    body: "Every AI request: route, model, tokens, latency, cost, success. Per-project budgets and health.",
  },
  {
    num: "03",
    label: "infrastructure",
    body: "Lease-based indexing queue on Postgres. Stale-lock recovery. Vercel cron as backstop.",
  },
] as const;

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#040406] lg:flex lg:flex-col">
      {/* Layered ambient art: grid texture, abstract graph */}
      <BrandArt />

      <div className="relative z-10 flex flex-1 flex-col px-12 py-14 xl:px-16">
        <div className="flex items-center gap-2.5">
          <Image
            src="/repodoc.png"
            alt="RepoDoc"
            width={26}
            height={26}
            className="rounded-[6px]"
          />
          <span className="text-[16px] font-semibold tracking-[-0.01em] text-white">
            RepoDoc
          </span>
        </div>

        <div className="mt-14">
          <h2 className="text-[clamp(1.9rem,2.7vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-white">
            Understand the system.
            <br />
            <span className="text-white/45">Not just the code.</span>
          </h2>

          <p className="mt-6 max-w-md text-[14.5px] leading-[1.65] text-white/55">
            RepoDoc indexes a GitHub repository, traces the relationships
            between modules, and turns the codebase into something you can
            interrogate, with every answer grounded in the source.
          </p>
        </div>

        <div className="mt-14 space-y-7 pt-10">
          {PILLARS.map((p) => (
            <div key={p.num} className="flex gap-5">
              <span className="mt-1 inline-block font-mono text-[10.5px] tracking-[0.18em] text-white/55">
                {p.num}
              </span>
              <div className="flex-1">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/45">
                  {p.label}
                </div>
                <p className="mt-2 max-w-md text-[13.5px] leading-[1.6] text-white/65">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/55" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
            all systems operational
          </span>
          <span aria-hidden className="ml-auto h-px w-16 bg-white/[0.06]" />
        </div>

        <p className="mt-6 text-[12.5px] leading-[1.55] text-white/35">
          Experiencing issues?{" "}
          <a
            href="mailto:parbhat@parbhat.work"
            className="text-white/65 underline underline-offset-4 transition-colors hover:text-white"
          >
            parbhat@parbhat.work
          </a>
        </p>
      </div>
    </aside>
  );
}

function BrandArt() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <svg
        aria-hidden
        viewBox="0 0 600 600"
        className="pointer-events-none absolute -right-24 -bottom-24 h-[700px] w-[700px] opacity-[0.7]"
      >
        <defs>
          <radialGradient id="brand-fade" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
            <stop offset="55%" stopColor="white" stopOpacity="0.03" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ai-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="222" cy="300" r="255" fill="url(#brand-fade)" />

        <rect
          x="64"
          y="140"
          width="320"
          height="232"
          rx="15"
          fill="rgba(255,255,255,0.018)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1"
        />
        <line
          x1="64"
          y1="176"
          x2="384"
          y2="176"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
        <rect x="82" y="156" width="84" height="12" rx="3" fill="rgba(255,255,255,0.12)" />
        <g fill="rgba(255,255,255,0.10)">
          <circle cx="350" cy="162" r="2.2" />
          <circle cx="361" cy="162" r="2.2" />
          <circle cx="372" cy="162" r="2.2" />
        </g>

        <rect x="72" y="255" width="304" height="16" rx="3" fill="rgba(255,255,255,0.045)" />
        <rect x="66" y="255" width="3" height="16" rx="1.5" fill="rgba(52,211,153,0.85)" />

        <g fill="rgba(255,255,255,0.16)">
          <rect x="82" y="198" width="8" height="4" rx="2" />
          <rect x="82" y="219" width="8" height="4" rx="2" />
          <rect x="82" y="240" width="8" height="4" rx="2" />
          <rect x="82" y="261" width="8" height="4" rx="2" />
          <rect x="82" y="282" width="8" height="4" rx="2" />
          <rect x="82" y="303" width="8" height="4" rx="2" />
          <rect x="82" y="324" width="8" height="4" rx="2" />
          <rect x="82" y="345" width="8" height="4" rx="2" />
        </g>

        <g fill="rgba(255,255,255,0.3)">
          <rect x="148" y="197" width="58" height="6" rx="3" />
          <rect x="119" y="218" width="86" height="6" rx="3" />
          <rect x="165" y="239" width="34" height="6" rx="3" />
          <rect x="119" y="281" width="52" height="6" rx="3" />
          <rect x="138" y="302" width="74" height="6" rx="3" />
          <rect x="119" y="323" width="90" height="6" rx="3" />
          <rect x="104" y="344" width="36" height="6" rx="3" />
        </g>
        <g fill="rgba(255,255,255,0.5)">
          <rect x="104" y="197" width="38" height="6" rx="3" />
          <rect x="119" y="239" width="40" height="6" rx="3" />
          <rect x="177" y="281" width="24" height="6" rx="3" />
          <rect x="104" y="302" width="28" height="6" rx="3" />
        </g>
        <rect x="134" y="260" width="96" height="6" rx="3" fill="rgba(255,255,255,0.42)" />

        <circle cx="238" cy="263" r="2.5" fill="rgba(52,211,153,0.85)" />
        <path
          d="M 238 263 C 326 264 336 330 322 392"
          fill="none"
          stroke="rgba(255,255,255,0.13)"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* Grounded answer */}
        <rect
          x="206"
          y="392"
          width="180"
          height="86"
          rx="14"
          fill="rgba(255,255,255,0.025)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        <circle cx="230" cy="420" r="13" fill="url(#ai-glow)" />
        <circle cx="230" cy="420" r="4" fill="rgba(52,211,153,0.9)" />
        <rect x="246" y="416" width="84" height="7" rx="3.5" fill="rgba(255,255,255,0.42)" />
        <rect x="226" y="438" width="144" height="6" rx="3" fill="rgba(255,255,255,0.3)" />
        <rect x="226" y="454" width="96" height="6" rx="3" fill="rgba(255,255,255,0.3)" />
      </svg>
    </>
  );
}
