"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Github, Twitter, type LucideIcon } from "lucide-react";

import FooterWaveform from "./FooterWaveform";

interface NavItem {
  label: string;
  desc: string;
  href: string;
}

const PRODUCT: NavItem[] = [
  { label: "Documentation", desc: "Generated docs for every module", href: "/documentation" },
  { label: "Changelog", desc: "Shipped improvements, continuously", href: "/changelog" },
  { label: "Pricing", desc: "Plans for solo devs and teams", href: "/pricing" },
  { label: "API Reference", desc: "The endpoints behind the product", href: "/api" },
];

const COMPANY: NavItem[] = [
  { label: "About", desc: "The story behind RepoDoc", href: "/about" },
  { label: "Contact", desc: "Questions, demos, partnerships", href: "/contact" },
  { label: "Privacy", desc: "How we handle your data", href: "/privacy" },
  { label: "Terms", desc: "The fine print", href: "/terms" },
];

const ELSEWHERE: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "GitHub", href: "https://github.com/parbhatkapila4", icon: Github },
  { label: "Twitter", href: "https://x.com/Parbhat03", icon: Twitter },
];

const CONTACT_EMAIL = "parbhat@parbhat.work";

export default function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-[#040406] lg:mt-36">
      <BentBars side="left" />
      <BentBars side="right" />

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-20 flex -translate-x-1/2 flex-col items-center"
      >
        <span
          className="h-14 w-px"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(243,238,228,0.35))",
          }}
        />
        <span className="h-[3px] w-[3px] rounded-full bg-[#f3eee4]/40" />
      </div>

      <Image
        src="/repodoc.png"
        alt=""
        aria-hidden
        width={240}
        height={240}
        className="pointer-events-none absolute -bottom-5 right-1 z-0 h-40 w-40 select-none opacity-[0.05] grayscale md:h-56 md:w-56"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-14 pb-10 md:pt-20">
        <div className="grid grid-cols-2 gap-x-10 gap-y-12 md:grid-cols-12">
          <div className="col-span-2 md:col-span-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
              <span className="mr-1 text-white/70">✳</span>VER. 2026.1
            </div>
            <Link
              href="/"
              className="mt-4 inline-block text-[14px] text-white/55 transition-colors hover:text-white"
            >
              Home
            </Link>
          </div>

          <div className="col-span-2 md:col-span-5">
            <NavGroup title="Product" items={PRODUCT} />
            <div className="mt-9">
              <NavGroup title="Company" items={COMPANY} />
            </div>
          </div>

          <div className="col-span-1 md:col-span-3">
            <GroupHeading>Elsewhere</GroupHeading>
            <ul className="mt-5 space-y-2.5">
              {ELSEWHERE.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2.5 text-[14px] text-white/55 transition-colors hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5 text-white/35 transition-colors group-hover:text-white/80" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <GroupHeading>Contact</GroupHeading>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-5 inline-block text-[14px] text-white/55 transition-colors hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

      </div>

      <FooterWaveform className="h-[clamp(160px,23vw,320px)] w-full" />
    </footer>
  );
}

function BentBars({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";

  const bars = isLeft
    ? [
      "0,60 200,60 380,160 380,190 200,90 0,90",
      "0,120 200,120 380,220 380,250 200,150 0,150",
      "0,180 200,180 380,280 380,310 200,210 0,210",
    ]
    : [
      "600,60 400,60 220,160 220,190 400,90 600,90",
      "600,120 400,120 220,220 220,250 400,150 600,150",
      "600,180 400,180 220,280 220,310 400,210 600,210",
    ];

  const positionClass = isLeft ? "left-0" : "right-0";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute top-1/2 hidden -translate-y-1/2 md:block ${positionClass}`}
      style={{
        width: "min(36%, 460px)",
        aspectRatio: "600 / 400",
      }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 600 400"
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="geometricPrecision"
      >
        <defs>
          <pattern
            id={`footer-halftone-${side}`}
            x="0"
            y="0"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1.3" fill="rgba(255,255,255,1)" />
          </pattern>

          <linearGradient
            id={`footer-fade-${side}`}
            x1={isLeft ? "0" : "1"}
            y1="0"
            x2={isLeft ? "1" : "0"}
            y2="0"
          >
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="6%" stopColor="white" stopOpacity="0.9" />
            <stop offset="14%" stopColor="white" stopOpacity="1" />
            <stop offset="33%" stopColor="white" stopOpacity="1" />
            <stop offset="45%" stopColor="white" stopOpacity="0.95" />
            <stop offset="53%" stopColor="white" stopOpacity="0.7" />
            <stop offset="58%" stopColor="white" stopOpacity="0.35" />
            <stop offset="62%" stopColor="white" stopOpacity="0.1" />
            <stop offset="65%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={`footer-mask-${side}`}>
            <rect
              x="0"
              y="0"
              width="600"
              height="400"
              fill={`url(#footer-fade-${side})`}
            />
          </mask>
        </defs>
        <g mask={`url(#footer-mask-${side})`} fill={`url(#footer-halftone-${side})`}>
          {bars.map((points, i) => (
            <polygon key={i} points={points} />
          ))}
        </g>
      </svg>
    </div>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
      {children}
    </h4>
  );
}

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <GroupHeading>{title}</GroupHeading>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="group flex items-baseline gap-3">
              <span className="shrink-0 text-[14px] font-medium text-white/85 transition-colors group-hover:text-white">
                {item.label}
              </span>
              <span className="text-[12.5px] leading-snug text-white/30 transition-colors group-hover:text-white/45">
                {item.desc}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
