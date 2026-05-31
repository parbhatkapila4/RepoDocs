"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

interface Statement {
  num: string;
  before: string;
  after: string;
  description: string;
}

const STATEMENTS: Statement[] = [
  {
    num: "01",
    before: "From hours of searching",
    after: "to seconds of clarity.",
    description:
      "Type a question about any module, function, or data flow. Retrieval pulls the right files, mapping resolves the relationships, and an answer arrives grounded in the indexed source  -  usually before you've finished switching tabs.",
  },
  {
    num: "02",
    before: "From scattered files",
    after: "to connected systems.",
    description:
      "RepoDoc walks the import graph the moment indexing finishes  -  services, schemas, and shared modules wired together as an interactive map. Pin a node, hover an edge, and trace how a request flows from the route handler to the database.",
  },
  {
    num: "03",
    before: "From guessing how it works",
    after: "to knowing exactly where it lives.",
    description:
      "Each answer carries citations into the underlying source. Click one to land on the precise line that backs the claim  -  so the explanation always survives a quick read of the actual code.",
  },
];

type TokenKind = "kw" | "fn" | "id" | "op" | "pn" | "st" | "cm";

interface Token {
  kind: TokenKind;
  text: string;
}

interface Line {
  indent: 0 | 1 | 2;
  tokens: Token[];
}

const LINES: Line[] = [
  { indent: 0, tokens: [
    { kind: "kw",  text: "export " },
    { kind: "kw",  text: "async " },
    { kind: "kw",  text: "function " },
    { kind: "fn",  text: "verifySession" },
    { kind: "pn",  text: "(" },
    { kind: "id",  text: "token" },
    { kind: "pn",  text: ") {" },
  ]},
  { indent: 1, tokens: [
    { kind: "kw",  text: "const " },
    { kind: "id",  text: "user" },
    { kind: "op",  text: " = " },
    { kind: "kw",  text: "await " },
    { kind: "id",  text: "db" },
    { kind: "pn",  text: "." },
    { kind: "fn",  text: "find" },
    { kind: "pn",  text: "(" },
    { kind: "id",  text: "token" },
    { kind: "pn",  text: ");" },
  ]},
  { indent: 1, tokens: [
    { kind: "kw",  text: "if " },
    { kind: "pn",  text: "(" },
    { kind: "op",  text: "!" },
    { kind: "id",  text: "user" },
    { kind: "pn",  text: ") {" },
  ]},
  { indent: 2, tokens: [
    { kind: "kw",  text: "throw " },
    { kind: "kw",  text: "new " },
    { kind: "fn",  text: "Error" },
    { kind: "pn",  text: "(" },
    { kind: "st",  text: "'unauthorized'" },
    { kind: "pn",  text: ");" },
  ]},
  { indent: 1, tokens: [
    { kind: "pn",  text: "}" },
  ]},
  { indent: 1, tokens: [
    { kind: "kw",  text: "return " },
    { kind: "id",  text: "user" },
    { kind: "pn",  text: ";" },
  ]},
  { indent: 0, tokens: [
    { kind: "pn",  text: "}" },
  ]},
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [
    { kind: "kw",  text: "export " },
    { kind: "kw",  text: "async " },
    { kind: "kw",  text: "function " },
    { kind: "fn",  text: "refreshSession" },
    { kind: "pn",  text: "(" },
    { kind: "id",  text: "token" },
    { kind: "pn",  text: ") {" },
  ]},
  { indent: 1, tokens: [
    { kind: "kw",  text: "const " },
    { kind: "id",  text: "next" },
    { kind: "op",  text: " = " },
    { kind: "kw",  text: "await " },
    { kind: "fn",  text: "create" },
    { kind: "pn",  text: "(" },
    { kind: "id",  text: "token" },
    { kind: "pn",  text: ");" },
  ]},
  { indent: 1, tokens: [
    { kind: "kw",  text: "return " },
    { kind: "id",  text: "next" },
    { kind: "pn",  text: ";" },
  ]},
  { indent: 0, tokens: [
    { kind: "pn",  text: "}" },
  ]},
  { indent: 0, tokens: [
    { kind: "cm",  text: "// resolve session for the request" },
  ]},
  { indent: 0, tokens: [
    { kind: "cm",  text: "// see auth/middleware.ts" },
  ]},
];

const SCATTERED: { x: number; y: number; r: number }[] = [
  { x: 18, y: 9,  r: -10 },
  { x: 62, y: 6,  r: 7 },
  { x: 38, y: 18, r: -16 },
  { x: 78, y: 24, r: 13 },
  { x: 14, y: 30, r: 8 },
  { x: 50, y: 32, r: -7 },
  { x: 72, y: 40, r: 14 },
  { x: 24, y: 44, r: -14 },
  { x: 56, y: 50, r: 5 },
  { x: 82, y: 56, r: -6 },
  { x: 16, y: 62, r: 16 },
  { x: 44, y: 68, r: -12 },
  { x: 64, y: 78, r: 9 },
  { x: 30, y: 86, r: -9 },
];

const FOCUS_LINE = 8;
const STRUCTURED_X = 14;
const STRUCTURED_Y_START = 22;
const LINE_SPACING = 4.5;
const INDENT_STEP = 2.4; 

const CODE_FONT_CQW = 1.55;

const COLOR_BASE: Record<TokenKind, string> = {
  kw: "rgba(252,211,77,0.95)", 
  fn: "rgba(255,255,255,0.95)", 
  id: "rgba(255,255,255,0.72)", 
  op: "rgba(255,255,255,0.55)", 
  pn: "rgba(255,255,255,0.42)", 
  st: "rgba(252,211,77,0.78)",  
  cm: "rgba(255,255,255,0.32)", 
};

const COLOR_FOCUS: Record<TokenKind, string> = {
  kw: "rgba(252,211,77,1)",
  fn: "rgba(255,255,255,1)",
  id: "rgba(255,255,255,0.95)",
  op: "rgba(252,211,77,0.78)",
  pn: "rgba(252,211,77,0.62)",
  st: "rgba(252,211,77,0.95)",
  cm: "rgba(252,211,77,0.7)",
};

const COLOR_FADED: Record<TokenKind, string> = {
  kw: "rgba(255,255,255,0.18)",
  fn: "rgba(255,255,255,0.18)",
  id: "rgba(255,255,255,0.13)",
  op: "rgba(255,255,255,0.11)",
  pn: "rgba(255,255,255,0.11)",
  st: "rgba(255,255,255,0.13)",
  cm: "rgba(255,255,255,0.11)",
};

export default function TheShift() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerInView = useInView(sectionRef, { once: true, margin: "-15%" });
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#040406]"
      aria-labelledby="the-shift-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-32 lg:py-40">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="max-w-3xl"
        >
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-amber-300/70">
            the shift
          </span>
          <h2
            id="the-shift-heading"
            className="mt-3 text-[clamp(2rem,4.4vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white"
          >
            You stop reading code.
            <br />
            <span className="text-white/40">
              You start understanding systems.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-[1.6] text-white/55">
            RepoDoc changes how you approach a codebase. From digging through
            files to seeing how everything fits together.
          </p>
        </motion.header>

        <div className="mt-20 grid gap-x-16 lg:mt-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {STATEMENTS.map((s, i) => (
            <StatementBlock
              key={s.num}
              statement={s}
              index={i}
              isActive={activeStep === i}
              onActivate={() => setActiveStep(i)}
            />
          ))}

          <div className="hidden lg:col-start-2 lg:row-start-1 lg:row-end-4 lg:block">
            <div className="sticky top-[16vh] flex h-[68vh] items-center justify-center">
              <CodeCanvas step={activeStep} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatementBlock({
  statement,
  index,
  isActive,
  onActivate,
}: {
  statement: Statement;
  index: number;
  isActive: boolean;
  onActivate: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inMiddle = useInView(ref, { margin: "-45% 0% -45% 0%" });
  const enteredOnce = useInView(ref, { once: true, margin: "-15%" });

  useEffect(() => {
    if (inMiddle) onActivate();
  }, [inMiddle, onActivate]);

  return (
    <div
      ref={ref}
      className="relative flex min-h-[70vh] flex-col justify-center py-12 lg:min-h-[80vh] lg:py-0"
    >
      <div className="mb-12 lg:hidden">
        <CodeCanvas step={index} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={enteredOnce ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative lg:pl-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-[8%] hidden h-[84%] w-px overflow-hidden lg:block"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.08) 22%, rgba(255,255,255,0.08) 78%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-0 origin-top"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.6) 22%, rgba(251,191,36,0.6) 78%, transparent 100%)",
              transform: isActive ? "scaleY(1)" : "scaleY(0)",
              transition:
                "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute -left-[3px] top-1/2 hidden -translate-y-1/2 lg:block"
          style={{
            opacity: isActive ? 1 : 0,
            transform: `translateY(-50%) scale(${isActive ? 1 : 0.5})`,
            transition:
              "opacity 500ms ease, transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
            transitionDelay: isActive ? "550ms" : "0ms",
          }}
        >
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/45" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]" />
          </span>
        </div>

        <div className="relative flex items-center gap-3">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-700"
            style={{
              color: isActive
                ? "rgba(252,211,77,0.95)"
                : "rgba(252,211,77,0.6)",
            }}
          >
            {statement.num}
          </span>
          <span
            className="h-px transition-all duration-700"
            style={{
              width: isActive ? "3rem" : "1.75rem",
              background: isActive
                ? "rgba(251,191,36,0.6)"
                : "rgba(251,191,36,0.18)",
            }}
          />
        </div>

        <h3
          className="relative mt-5 text-[clamp(1.5rem,3.4vw,2.25rem)] font-medium leading-[1.2] tracking-[-0.025em]"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          <span
            className="block transition-colors duration-700"
            style={{
              color: isActive
                ? "rgba(255,255,255,0.45)"
                : "rgba(255,255,255,0.28)",
            }}
          >
            {statement.before}
          </span>
          <span
            className="mt-1 block transition-colors duration-700"
            style={{
              color: isActive
                ? "rgba(255,255,255,1)"
                : "rgba(255,255,255,0.42)",
            }}
          >
            {statement.after}
          </span>
        </h3>

        <p
          className="relative mt-5 max-w-md text-[14px] leading-[1.65] tracking-[-0.005em] transition-colors duration-700"
          style={{
            color: isActive
              ? "rgba(255,255,255,0.62)"
              : "rgba(255,255,255,0.3)",
          }}
        >
          {statement.description}
        </p>
      </motion.div>
    </div>
  );
}

function CodeCanvas({ step }: { step: number }) {
  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const focusY = STRUCTURED_Y_START + FOCUS_LINE * LINE_SPACING;

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[480px]"
      style={{ containerType: "size" }}
    >
      <div
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.018] to-transparent"
        style={{
          border: "1px solid",
          borderColor:
            step === 0
              ? "rgba(255,255,255,0.025)"
              : "rgba(255,255,255,0.085)",
          transition: "border-color 700ms ease",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          opacity: step === 2 ? 1 : 0,
          transition: "opacity 600ms ease",
          transitionDelay: step === 2 ? "350ms" : "0ms",
          background: `radial-gradient(ellipse 70% 14% at 50% ${focusY}%, rgba(251,191,36,0.14), transparent 70%)`,
        }}
      />

      <div
        className="absolute left-0 right-0 px-5"
        style={{
          top: "8%",
          opacity: step === 0 ? 0 : 1,
          transform: step === 0 ? "translateY(-4px)" : "translateY(0)",
          transition: "opacity 500ms ease, transform 500ms ease",
          transitionDelay: step === 0 ? "0ms" : "550ms",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="block h-1 w-1 rounded-full bg-white/15" />
            <span className="block h-1 w-1 rounded-full bg-white/15" />
            <span className="block h-1 w-1 rounded-full bg-white/15" />
          </div>
          <span className="font-mono text-[10px] tracking-[0.05em] text-white/40">
            src/auth/<span className="text-white/65">middleware.ts</span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
            ts
          </span>
        </div>
        <div
          className="mt-2 h-px w-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute left-[6%] right-[6%] rounded-[3px]"
        style={{
          top: `${focusY - 1.6}%`,
          height: "3.2%",
          background: "rgba(251,191,36,0.08)",
          borderLeft: "2px solid rgba(251,191,36,0.85)",
          opacity: step === 2 ? 1 : 0,
          transition: "opacity 500ms ease",
          transitionDelay: step === 2 ? "400ms" : "0ms",
        }}
      />

      {LINES.map((line, i) => {
        const scatter = SCATTERED[i];
        const isFocus = step === 2 && i === FOCUS_LINE;
        const isFaded = step === 2 && i !== FOCUS_LINE;

        const x = step === 0 ? scatter.x : STRUCTURED_X;
        const y =
          step === 0 ? scatter.y : STRUCTURED_Y_START + i * LINE_SPACING;
        const rot = step === 0 ? scatter.r : 0;

        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translateY(-50%) rotate(${rot}deg)`,
              transformOrigin: "left center",
              transition: `left 950ms ${ease}, top 950ms ${ease}, transform 950ms ${ease}, opacity 700ms ease`,
              transitionDelay: step === 1 ? `${i * 35}ms` : "0ms",
              opacity: step === 0 ? 0.85 : isFaded ? 0.5 : 1,
            }}
          >
            <div className="flex items-center">
              <span
                className="select-none font-mono tabular-nums"
                style={{
                  width: "3.5cqw",
                  marginRight: "1.6cqw",
                  textAlign: "right",
                  fontSize: "1.7cqw",
                  color: isFocus
                    ? "rgba(251,191,36,0.95)"
                    : isFaded
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.32)",
                  opacity: step === 0 ? 0 : 1,
                  transform:
                    step === 0 ? "translateX(-4px)" : "translateX(0)",
                  transition:
                    "opacity 450ms ease, color 500ms ease, transform 500ms ease",
                  transitionDelay: step === 0 ? "0ms" : "650ms",
                }}
              >
                {i + 1}
              </span>

              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: `${line.indent * INDENT_STEP}cqw`,
                  flexShrink: 0,
                }}
              />

              <span
                className="font-mono whitespace-nowrap tracking-tight"
                style={{
                  fontSize: `${CODE_FONT_CQW}cqw`,
                  lineHeight: 1,
                }}
              >
                {line.tokens.length === 0 ? (
                  <span aria-hidden>&nbsp;</span>
                ) : (
                  line.tokens.map((t, j) => (
                    <span
                      key={j}
                      style={{
                        color: isFocus
                          ? COLOR_FOCUS[t.kind]
                          : isFaded
                            ? COLOR_FADED[t.kind]
                            : COLOR_BASE[t.kind],
                        transition: "color 600ms ease",
                      }}
                    >
                      {t.text}
                    </span>
                  ))
                )}
              </span>
            </div>
          </div>
        );
      })}

      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "5%",
          top: `${focusY}%`,
          transform: "translateY(-50%)",
          opacity: step === 2 ? 1 : 0,
          transition: "opacity 500ms ease",
          transitionDelay: step === 2 ? "750ms" : "0ms",
        }}
      >
        <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-[#0a0a0d]/95 px-2.5 py-1 shadow-[0_4px_18px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <span className="block h-1 w-1 rounded-full bg-amber-400" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-200/85">
            line 9
          </span>
        </div>
      </div>
    </div>
  );
}
