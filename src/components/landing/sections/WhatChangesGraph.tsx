"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Github } from "lucide-react";

import {
  CONNECTIONS,
  MODULES,
  POSITIONS,
  connectionsOf,
} from "./whatchanges-data";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  inView: boolean;
}

type NodeState = "selected" | "connected" | "dimmed";
type EdgeState = "active" | "muted" | "dimmed";

export default function WhatChangesGraph({
  selectedId,
  onSelect,
  inView,
}: Props) {
  const connectedIds = useMemo(
    () => new Set(connectionsOf(selectedId)),
    [selectedId]
  );

  const getNodeState = (id: string): NodeState => {
    if (id === selectedId) return "selected";
    if (connectedIds.has(id)) return "connected";
    return "dimmed";
  };

  const getEdgeState = (a: string, b: string): EdgeState => {
    if (a === selectedId || b === selectedId) return "active";
    if (connectedIds.has(a) && connectedIds.has(b)) return "muted";
    return "dimmed";
  };

  return (
    <div className="relative aspect-[5/4] w-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 45% at 50% 50%, rgba(245,158,11,0.05), transparent 70%)",
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {CONNECTIONS.map(([a, b], i) => {
          const from = POSITIONS[a];
          const to = POSITIONS[b];
          if (!from || !to) return null;
          const state = getEdgeState(a, b);
          const outerToOuter = a !== "repo" && b !== "repo";
          const path = outerToOuter
            ? curvePath(from, to, i % 2 === 0 ? 1 : -1)
            : `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

          const isActive = state === "active";
          const stroke = isActive
            ? "rgba(251,191,36,0.78)"
            : state === "muted"
              ? "rgba(255,255,255,0.22)"
              : "rgba(255,255,255,0.06)";
          const width = isActive ? 0.34 : state === "muted" ? 0.2 : 0.16;

          return (
            <g key={`${a}-${b}`}>
              {isActive && (
                <motion.path
                  d={path}
                  fill="none"
                  stroke="rgba(251,191,36,0.18)"
                  strokeWidth={1.1}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                />
              )}

              <motion.path
                d={path}
                fill="none"
                stroke={stroke}
                strokeWidth={width}
                strokeLinecap="round"
                strokeDasharray={isActive ? "1.6 1.8" : undefined}
                className={isActive ? "edge-flow" : undefined}
                vectorEffect="non-scaling-stroke"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{
                  opacity: {
                    duration: 0.4,
                    delay: 0.45 + i * 0.05,
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

      {MODULES.map((m, i) => {
        const pos = POSITIONS[m.id];
        if (!pos) return null;
        const state = getNodeState(m.id);
        const isCenter = !!m.isCenter;
        const enterDelay = isCenter ? 0.1 : 0.3 + i * 0.08;
        return (
          <motion.button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
            transition={{
              duration: 0.4,
              delay: enterDelay,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            {isCenter ? (
              <CenterNode state={state} label={m.label} />
            ) : (
              <ModuleNode state={state} label={m.label} />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function CenterNode({
  state,
  label,
}: {
  state: NodeState;
  label: string;
}) {
  const isSelected = state === "selected";
  return (
    <span
      className={[
        "relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-medium tracking-tight transition-all",
        isSelected
          ? "border-amber-400/40 bg-amber-400/[0.10] text-amber-100 shadow-[0_0_24px_-4px_rgba(245,158,11,0.35)]"
          : "border-white/15 bg-[#0c0c10] text-white/85",
      ].join(" ")}
    >
      <Github
        className={`h-3.5 w-3.5 ${isSelected ? "text-amber-200" : "text-white/55"
          }`}
      />
      {label}
      {isSelected && (
        <motion.span
          aria-hidden
          className="absolute -inset-1.5 rounded-full border border-amber-400/20"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </span>
  );
}

function ModuleNode({
  state,
  label,
}: {
  state: NodeState;
  label: string;
}) {
  const styles =
    state === "selected"
      ? "border-amber-400/40 bg-amber-400/[0.08] text-amber-100 shadow-[0_0_18px_-4px_rgba(245,158,11,0.45)]"
      : state === "connected"
        ? "border-white/25 bg-[#0c0c10] text-white/85"
        : "border-white/[0.08] bg-[#08080c] text-white/35";
  const opacity = state === "dimmed" ? "opacity-55" : "opacity-100";
  return (
    <span
      className={[
        "relative inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.18em] transition-all",
        styles,
        opacity,
      ].join(" ")}
    >
      <span
        className={`h-1 w-1 rounded-full ${state === "selected"
            ? "bg-amber-300"
            : state === "connected"
              ? "bg-white/60"
              : "bg-white/20"
          }`}
      />
      {label}
    </span>
  );
}

function curvePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  side: number
): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M ${from.x} ${from.y}`;
  const offset = len * 0.18;
  const perpX = (-dy / len) * offset * side;
  const perpY = (dx / len) * offset * side;
  return `M ${from.x} ${from.y} Q ${midX + perpX} ${midY + perpY} ${to.x} ${to.y}`;
}
