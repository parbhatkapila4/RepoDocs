"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { tokenizeLines, type Token } from "../hero/tokenize";

interface Stage {
  id: string;
  num: string;
  title: string;
  desc: string;
  filePath: string;
  code: string;
}

const STAGES: Record<string, Stage> = {
  retrieval: {
    id: "retrieval",
    num: "01",
    title: "Retrieval",
    desc: "Finds the right code, not just keywords.",
    filePath: "src/lib/rag.ts",
    code: `const qVec = await embed(question);

return prisma.$queryRaw<Match[]>\`
  SELECT "fileName", "sourceCode",
    1 - ("summaryEmbedding" <=> \${qVec}::vector) AS sim
  FROM "SourceCodeEmbeddings"
  WHERE "projectId" = \${pid}
  ORDER BY "summaryEmbedding" <=> \${qVec}::vector
  LIMIT 5
\`;`,
  },
  mapping: {
    id: "mapping",
    num: "02",
    title: "Mapping",
    desc: "Understands how components connect.",
    filePath: "src/lib/github.ts",
    code: `for await (const file of repoStream) {
  const summary = await summariseCode(file.text);
  const vec = await embed(summary);

  await db.embeddings.upsert({
    where: { projectId_fileName },
    update: { summary, embedding: vec },
  });
}`,
  },
  reasoning: {
    id: "reasoning",
    num: "03",
    title: "Reasoning",
    desc: "Builds a coherent explanation.",
    filePath: "src/lib/rag.ts",
    code: `const ctx = chunks.map((c, i) =>
  \`[Source \${i + 1}: \${c.fileName}]
\${c.summary}\`
).join("\\n---\\n");

return openrouterChat({
  model: "google/gemini-2.5-flash",
  system: GROUND_PROMPT + ctx,
  messages: [...history, { role: "user", content: q }],
});`,
  },
  grounding: {
    id: "grounding",
    num: "04",
    title: "Grounding",
    desc: "Cites exact files and lines.",
    filePath: "src/lib/query-metrics.ts",
    code: `const cites = chunks.map((c) => ({
  file: c.fileName,
  range: parseLineRange(answer, c.fileName),
  sim: c.similarity,
}));

await recordQueryMetrics({
  projectId, routeType: "query",
  retrievalCount: cites.length,
  latencyMs, estimatedCostUsd,
});`,
  },
};

const LAYOUT_ORDER = ["retrieval", "mapping", "grounding", "reasoning"];
const CYCLE_ORDER = ["retrieval", "mapping", "reasoning", "grounding"];
const CYCLE_MS = 3000;
const EDGES = [
  { from: "retrieval", to: "mapping", d: "M 48 23.5 L 52 23.5" },
  { from: "mapping", to: "reasoning", d: "M 76 48 L 76 52" },
  { from: "reasoning", to: "grounding", d: "M 52 76.5 L 48 76.5" },
  { from: "grounding", to: "retrieval", d: "M 24 52 L 24 48" },
];

const TOKEN_CLASS: Record<Token["type"], string> = {
  keyword: "text-white/65",
  string: "text-white/52",
  comment: "text-white/28 italic",
  number: "text-white/65",
  identifier: "text-white/92",
  punctuation: "text-white/40",
  whitespace: "",
};

export default function SystemDepth() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-15%" });

  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!inView || hoveredId) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % CYCLE_ORDER.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [inView, hoveredId]);

  const activeId = hoveredId ?? CYCLE_ORDER[activeIdx];
  const activeIdxFromId = CYCLE_ORDER.indexOf(activeId);
  const nextId = CYCLE_ORDER[(activeIdxFromId + 1) % CYCLE_ORDER.length];

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#040406]"
      aria-labelledby="system-depth-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-32">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="max-w-2xl"
        >
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-amber-300/70">
            system depth
          </span>
          <h2
            id="system-depth-heading"
            className="mt-3 text-[clamp(2rem,4.4vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white"
          >
            Understanding is a system.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-[1.6] text-white/55">
            RepoDoc doesn&rsquo;t just answer. It builds understanding in a
            loop  -  retrieval feeds mapping, mapping feeds reasoning, reasoning
            grounds itself in code, and grounding sharpens the next retrieval.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto mt-16 w-full"
        >
          <Connections activeId={activeId} nextId={nextId} inView={inView} />

          <div className="relative grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2">
            {LAYOUT_ORDER.map((id, i) => {
              const stage = STAGES[id];
              const isActive = id === activeId;
              const isAdjacentInLoop = EDGES.some(
                (e) =>
                  (e.from === activeId && e.to === id) ||
                  (e.to === activeId && e.from === id)
              );
              return (
                <Card
                  key={id}
                  stage={stage}
                  isActive={isActive}
                  isAdjacent={isAdjacentInLoop}
                  inView={inView}
                  enterDelay={0.3 + i * 0.08}
                  onHoverStart={() => setHoveredId(id)}
                  onHoverEnd={() => setHoveredId(null)}
                />
              );
            })}
          </div>
        </motion.div>

        <div className="mt-8 flex items-center justify-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/30">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${hoveredId ? "bg-white/30" : "animate-ping bg-amber-400/55"
                }`}
            />
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${hoveredId ? "bg-white/55" : "bg-amber-400"
                }`}
            />
          </span>
          {hoveredId
            ? `pinned · ${STAGES[hoveredId].title.toLowerCase()}`
            : "looping continuously"}
        </div>
      </div>
    </section>
  );
}

function Connections({
  activeId,
  nextId,
  inView,
}: {
  activeId: string;
  nextId: string;
  inView: boolean;
}) {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 hidden h-full w-full lg:block"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {EDGES.map((e, i) => {
        const isActive = e.from === activeId && e.to === nextId;
        return (
          <g key={`${e.from}-${e.to}`}>
            {isActive && (
              <motion.path
                d={e.d}
                fill="none"
                stroke="rgba(251,191,36,0.22)"
                strokeWidth={1.4}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
            <motion.path
              d={e.d}
              fill="none"
              stroke={
                isActive
                  ? "rgba(251,191,36,0.85)"
                  : "rgba(255,255,255,0.16)"
              }
              strokeWidth={isActive ? 0.45 : 0.25}
              strokeLinecap="round"
              strokeDasharray={isActive ? "1.6 1.8" : undefined}
              className={isActive ? "edge-flow" : undefined}
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{
                opacity: {
                  duration: 0.5,
                  delay: 0.7 + i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                },
                stroke: { duration: 0.25 },
                strokeWidth: { duration: 0.25 },
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function Card({
  stage,
  isActive,
  isAdjacent,
  inView,
  enterDelay,
  onHoverStart,
  onHoverEnd,
}: {
  stage: Stage;
  isActive: boolean;
  isAdjacent: boolean;
  inView: boolean;
  enterDelay: number;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: enterDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
      className={[
        "group relative grid cursor-default overflow-hidden rounded-md border bg-[#08080b] transition-all duration-300",
        "outline-none focus-visible:ring-1 focus-visible:ring-amber-400/40",
        "grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:aspect-[2/1] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:grid-rows-1",
        isActive
          ? "border-amber-400/35 bg-amber-400/[0.02] shadow-[0_0_30px_-6px_rgba(245,158,11,0.30)]"
          : isAdjacent
            ? "border-white/15"
            : "border-white/[0.08]",
      ].join(" ")}
    >
      <CardInfo stage={stage} isActive={isActive} />
      <CodePanel stage={stage} isActive={isActive} />
    </motion.div>
  );
}

function CardInfo({ stage, isActive }: { stage: Stage; isActive: boolean }) {
  return (
    <div className="flex flex-col justify-between p-5 lg:p-6">
      <div className="flex items-start justify-between">
        <span
          className={`font-mono text-[10.5px] uppercase tracking-[0.22em] transition-colors ${isActive ? "text-amber-300/85" : "text-white/30"
            }`}
        >
          {stage.num}
        </span>
        <span
          className={`relative h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-amber-400" : "bg-white/15"
            }`}
        />
      </div>

      <div className="mt-6">
        <h3
          className={`text-[18px] font-medium leading-tight tracking-tight transition-colors ${isActive ? "text-white" : "text-white/80"
            }`}
        >
          {stage.title}
        </h3>
        <p
          className={`mt-2 max-w-[26ch] text-[13px] leading-snug transition-colors ${isActive ? "text-white/70" : "text-white/45"
            }`}
        >
          {stage.desc}
        </p>
      </div>
    </div>
  );
}

function CodePanel({ stage, isActive }: { stage: Stage; isActive: boolean }) {
  const lines = useMemo(() => tokenizeLines(stage.code), [stage.code]);

  return (
    <div
      className={`flex flex-col overflow-hidden border-t border-white/[0.04] bg-[#06060a] transition-opacity duration-300 lg:border-l lg:border-t-0 ${isActive ? "opacity-100" : "opacity-75"
        }`}
    >
      <div className="flex items-center justify-between border-b border-white/[0.04] px-3 py-2">
        <span
          className={`truncate font-mono text-[10.5px] transition-colors ${isActive ? "text-amber-300/70" : "text-white/45"
            }`}
        >
          {stage.filePath}
        </span>
        <span className="ml-2 shrink-0 font-mono text-[9px] uppercase tracking-[0.22em] text-white/22">
          ts
        </span>
      </div>
      <pre className="flex-1 overflow-hidden px-3 py-3 font-mono text-[10.5px] leading-[1.65]">
        {lines.map((tokens, i) => (
          <div key={i} className="flex">
            <span
              className="w-5 shrink-0 select-none pr-2 text-right tabular-nums text-white/22"
              aria-hidden
            >
              {i + 1}
            </span>
            <code className="block flex-1 overflow-hidden whitespace-pre">
              {tokens.length === 0 ? (
                <span> </span>
              ) : (
                tokens.map((tok, j) => (
                  <span key={j} className={TOKEN_CLASS[tok.type]}>
                    {tok.text}
                  </span>
                ))
              )}
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
}
