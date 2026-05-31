"use client";

import React from "react";
import { motion } from "motion/react";

import { RigEyebrow, RigDashes, STAGE, RED } from "./shared";

const GREEN = "#22c55e";
const PAPER = "#f3eee4";

function FlowCard({
  x,
  y,
  w,
  h,
  title,
  sub,
  accent,
  dim,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  accent?: string;
  dim?: boolean;
}) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const second = accent ?? sub;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="rgba(10,10,10,0.95)"
        stroke="rgba(243,238,228,0.15)"
        strokeWidth="1"
      />
      <text
        x={cx}
        y={second ? cy - 6 : cy}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-mono"
        fontSize="7"
        letterSpacing="1.5"
        fill={dim ? "rgba(243,238,228,0.3)" : "rgba(243,238,228,0.55)"}
      >
        {title}
      </text>
      {second && (
        <text
          x={cx}
          y={cy + 7}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono"
          fontSize="5.5"
          letterSpacing="1"
          fill={accent ? GREEN : "rgba(243,238,228,0.28)"}
        >
          {second}
        </text>
      )}
    </g>
  );
}

function IntroDiagram() {
  return (
    <svg
      viewBox="0 0 560 280"
      fill="none"
      className="mx-auto h-auto w-full max-w-3xl"
      aria-hidden
    >
      <defs>
        <linearGradient id="rd-trail-h1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GREEN} stopOpacity="0" />
          <stop offset="70%" stopColor={GREEN} stopOpacity="0.3" />
          <stop offset="100%" stopColor={GREEN} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="rd-trail-h2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GREEN} stopOpacity="0" />
          <stop offset="70%" stopColor={GREEN} stopOpacity="0.3" />
          <stop offset="100%" stopColor={GREEN} stopOpacity="0.6" />
        </linearGradient>
        <path id="rd-path-code" d="M130,125 L193,125" />
        <path id="rd-path-resp" d="M353,125 L423,125" />
        <path id="rd-path-halluc" d="M273,37 L273,57" />
        <path id="rd-path-guess" d="M273,192 L273,172" />
      </defs>

      <rect
        x="5"
        y="68"
        width="550"
        height="112"
        stroke="rgba(243,238,228,0.08)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <rect x="15" y="61" width="62" height="14" fill={STAGE} />
      <text x="20" y="71" className="font-mono" fontSize="6" letterSpacing="2" fill="rgba(243,238,228,0.3)">
        GROUNDED
      </text>

      <FlowCard x={20} y={100} w={110} h={50} title="YOUR REPO" sub="FILES · COMMITS" />
      <line x1="130" y1="125" x2="193" y2="125" stroke="rgba(34,197,94,0.15)" strokeWidth="1" />
      <line x1="130" y1="125" x2="193" y2="125" stroke="url(#rd-trail-h1)" strokeWidth="2">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
      </line>
      <rect x="-1.5" y="-1.5" width="3" height="3" fill={GREEN}>
        <animateMotion dur="2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
          <mpath href="#rd-path-code" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;1" dur="2s" repeatCount="indefinite" />
      </rect>

      <g>
        <rect x="193" y="78" width="160" height="94" fill="rgba(10,10,10,0.95)" stroke="rgba(243,238,228,0.22)" strokeWidth="1.5" />
        <text x="273" y="106" textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize="12" letterSpacing="2" fill={PAPER}>
          RepoDoc
        </text>
        <text x="273" y="124" textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize="5.5" letterSpacing="1.5" fill={GREEN}>
          ✓ INDEXED
        </text>
        <line x1="210" y1="145" x2="336" y2="145" stroke="rgba(243,238,228,0.08)" strokeWidth="0.5" />
        <text x="238" y="160" textAnchor="middle" className="font-mono" fontSize="5" letterSpacing="1" fill="rgba(243,238,228,0.28)">EMBED</text>
        <text x="273" y="160" textAnchor="middle" className="font-mono" fontSize="5" letterSpacing="1" fill="rgba(243,238,228,0.28)">MAP</text>
        <text x="308" y="160" textAnchor="middle" className="font-mono" fontSize="5" letterSpacing="1" fill="rgba(243,238,228,0.28)">CITE</text>
      </g>

      <line x1="353" y1="125" x2="423" y2="125" stroke="rgba(34,197,94,0.15)" strokeWidth="1" />
      <line x1="353" y1="125" x2="423" y2="125" stroke="url(#rd-trail-h2)" strokeWidth="2">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" begin="1s" repeatCount="indefinite" />
      </line>
      <rect x="-1.5" y="-1.5" width="3" height="3" fill={GREEN}>
        <animateMotion dur="2s" begin="1s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
          <mpath href="#rd-path-resp" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;1" dur="2s" begin="1s" repeatCount="indefinite" />
      </rect>
      <FlowCard x={423} y={100} w={120} h={50} title="ANSWER" accent="CITED · GROUNDED" />

      <FlowCard x={213} y={5} w={120} h={32} title="HALLUCINATION" dim />
      <line x1="273" y1="37" x2="273" y2="78" stroke={RED} strokeWidth="0.5" strokeDasharray="3 5" opacity="0.4" />
      <rect x="-1.5" y="-1.5" width="3" height="3" fill={RED}>
        <animateMotion dur="1.5s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
          <mpath href="#rd-path-halluc" />
        </animateMotion>
        <animate attributeName="opacity" values="0.8;0.8;0" keyTimes="0;0.6;1" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <g stroke={RED} strokeWidth="1.5">
        <line x1="267" y1="51" x2="279" y2="63" />
        <line x1="279" y1="51" x2="267" y2="63" />
      </g>

      <FlowCard x={213} y={215} w={120} h={32} title="GUESSWORK" dim />
      <line x1="273" y1="172" x2="273" y2="215" stroke={RED} strokeWidth="0.5" strokeDasharray="3 5" opacity="0.4" />
      <rect x="-1.5" y="-1.5" width="3" height="3" fill={RED}>
        <animateMotion dur="1.5s" begin="0.75s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
          <mpath href="#rd-path-guess" />
        </animateMotion>
        <animate attributeName="opacity" values="0.8;0.8;0" keyTimes="0;0.6;1" dur="1.5s" begin="0.75s" repeatCount="indefinite" />
      </rect>
      <g stroke={RED} strokeWidth="1.5">
        <line x1="267" y1="187" x2="279" y2="199" />
        <line x1="279" y1="187" x2="267" y2="199" />
      </g>
    </svg>
  );
}

export default function RigIntro() {
  return (
    <section className="relative mt-16 lg:mt-24" style={{ backgroundColor: STAGE }}>
      <RigDashes className="mx-auto max-w-5xl px-6" />

      <div className="mx-auto max-w-7xl px-6 pb-20 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <RigEyebrow glyph="✓">Introducing RepoDoc</RigEyebrow>
          <h2
            className="mx-auto mt-7 max-w-4xl text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.98] tracking-[-0.04em]"
            style={{ color: PAPER }}
          >
            Everything connected.
            <br />
            Understand your repo.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-[1.6] text-white/55">
            A complete picture of your codebase  -  indexed, mapped, and
            answerable. Grounded in the real source, cited to the line.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16"
        >
          <IntroDiagram />
        </motion.div>
      </div>
    </section>
  );
}
