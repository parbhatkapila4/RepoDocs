"use client";

import React from "react";
import { motion } from "motion/react";

export const RED = "#AFBFC0";

export const STAGE = "#040406";

export function RigEyebrow({
  glyph = "◆",
  children,
}: {
  glyph?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#AFBFC0]/30 bg-[#AFBFC0]/[0.07] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#AFBFC0]">
      <span aria-hidden>{glyph}</span>
      {children}
    </span>
  );
}

const DASHES = [
  { t: 6, l: 4, w: 74, o: 0.9, dur: 3.2, delay: 0.0, dx: 10 },
  { t: 20, l: 30, w: 40, o: 0.5, dur: 2.6, delay: 0.5, dx: 6 },
  { t: 14, l: 52, w: 96, o: 0.85, dur: 3.8, delay: 0.2, dx: 13 },
  { t: 40, l: 12, w: 56, o: 0.6, dur: 2.9, delay: 0.9, dx: 7 },
  { t: 32, l: 66, w: 124, o: 0.95, dur: 4.3, delay: 0.3, dx: 15 },
  { t: 52, l: 44, w: 34, o: 0.45, dur: 2.4, delay: 1.2, dx: 5 },
  { t: 64, l: 6, w: 104, o: 0.7, dur: 3.5, delay: 0.6, dx: 11 },
  { t: 58, l: 80, w: 60, o: 0.55, dur: 2.8, delay: 1.5, dx: 8 },
  { t: 76, l: 34, w: 84, o: 0.85, dur: 3.6, delay: 0.4, dx: 10 },
  { t: 82, l: 60, w: 44, o: 0.5, dur: 2.7, delay: 1.0, dx: 6 },
  { t: 28, l: 88, w: 52, o: 0.6, dur: 3.1, delay: 0.7, dx: 9 },
  { t: 88, l: 18, w: 66, o: 0.4, dur: 2.5, delay: 1.4, dx: 7 },
];

export function RigDashes({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative h-28 w-full overflow-hidden ${className}`}
    >
      {DASHES.map((d, i) => (
        <motion.span
          key={i}
          className="absolute h-[3px] origin-left rounded-full"
          style={{
            top: `${d.t}%`,
            left: `${d.l}%`,
            width: `${d.w}px`,
            backgroundColor: RED,
          }}
          initial={{ opacity: d.o, scaleX: 1, x: 0 }}
          animate={{
            opacity: [d.o, d.o * 0.2, d.o, d.o * 0.65, d.o],
            scaleX: [1, 1.22, 0.82, 1.08, 1],
            x: [0, d.dx, 0, -d.dx * 0.4, 0],
          }}
          transition={{
            duration: d.dur,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
