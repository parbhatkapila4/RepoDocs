"use client";

import React, { useMemo } from "react";

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const VIEW_W = 1600;
const VIEW_H = 480;
const BARS = 200;

interface Bar {
  x: number;
  w: number;
  h: number;
}

function buildBars(): Bar[] {
  const rand = seededRandom(7);
  const step = VIEW_W / BARS;
  const bars: Bar[] = [];

  for (let i = 0; i < BARS; i++) {
    const t = i / (BARS - 1);

    const envelope =
      0.4 +
      0.2 * Math.sin(t * Math.PI * 2 * 1.2 + 0.7) +
      0.13 * Math.sin(t * Math.PI * 2 * 2.9 + 2.0) +
      0.07 * Math.sin(t * Math.PI * 2 * 6.3 + 4.1);

    const spike = Math.pow(rand(), 3) * 0.55;
    const jitter = (rand() - 0.5) * 0.1;

    const norm = Math.max(0.05, Math.min(1, envelope + spike + jitter));
    bars.push({ x: i * step, w: step + 0.6, h: norm * VIEW_H });
  }

  return bars;
}

export default function FooterWaveform({ className }: { className?: string }) {
  const bars = useMemo(() => buildBars(), []);

  return (
    <div
      aria-hidden
      className={["pointer-events-none select-none", className]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="fw-fade" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <filter
            id="fw-grain"
            x="-2%"
            y="-2%"
            width="104%"
            height="104%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.6 0.42"
              numOctaves="3"
              seed="11"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 1
                      0 0 0 0 1
                      0 0 0 0 1
                      0 0 0 10 -4.8"
              result="speck"
            />
            <feComposite
              in="speck"
              in2="SourceGraphic"
              operator="in"
              result="grain"
            />
            <feComponentTransfer in="SourceGraphic" result="soft">
              <feFuncA type="linear" slope="0.22" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="soft" />
              <feMergeNode in="grain" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#fw-grain)" fill="url(#fw-fade)">
          {bars.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={VIEW_H - b.h}
              width={b.w}
              height={b.h}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
