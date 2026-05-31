"use client";

import React, { useMemo } from "react";

interface NodeData {
  id: string;
  x: number;
  y: number;
  pixelSize: number;
  alpha: number;
  isHub?: boolean;
  label?: string;
  pulseDelay?: number;
  pulseDuration?: number;
}

interface EdgeData {
  from: string;
  to: string;
  alpha: number;
  side: number;
}

const CLUSTERS = [
  { id: "ui", x: 16, y: 18, label: "ui", count: 9, radius: 9 },
  { id: "api", x: 78, y: 20, label: "api", count: 10, radius: 10 },
  { id: "rag", x: 50, y: 48, label: "rag", count: 12, radius: 13 },
  { id: "github", x: 20, y: 76, label: "github", count: 8, radius: 9 },
  { id: "store", x: 78, y: 76, label: "pgvector", count: 9, radius: 10 },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateGraph() {
  const rand = seededRandom(42);
  const nodes: NodeData[] = [];
  const edges: EdgeData[] = [];

  let edgeIdx = 0;
  const addEdge = (from: string, to: string, alpha: number) => {
    edges.push({ from, to, alpha, side: edgeIdx++ % 2 === 0 ? 1 : -1 });
  };

  CLUSTERS.forEach((cluster) => {
    nodes.push({
      id: cluster.id,
      x: cluster.x,
      y: cluster.y,
      pixelSize: 5,
      alpha: 0.7,
      isHub: true,
      label: cluster.label,
      pulseDelay: rand() * 5,
      pulseDuration: 6 + rand() * 4,
    });

    for (let i = 0; i < cluster.count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = (rand() * 0.7 + 0.3) * cluster.radius;
      const memberId = `${cluster.id}-m${i}`;
      const isMidNode = rand() < 0.3;
      nodes.push({
        id: memberId,
        x: Math.max(2, Math.min(98, cluster.x + Math.cos(angle) * dist)),
        y: Math.max(2, Math.min(98, cluster.y + Math.sin(angle) * dist)),
        pixelSize: isMidNode ? 2.5 : 1.6,
        alpha: 0.18 + rand() * 0.22,
      });
      addEdge(cluster.id, memberId, 0.06);

      if (i > 0 && rand() < 0.5) {
        addEdge(memberId, `${cluster.id}-m${i - 1}`, 0.045);
      }
      if (i > 1 && rand() < 0.25) {
        addEdge(memberId, `${cluster.id}-m${i - 2}`, 0.035);
      }
    }
  });

  const hubs = CLUSTERS.map((c) => c.id);
  for (let i = 0; i < hubs.length; i++) {
    for (let j = i + 1; j < hubs.length; j++) {
      if (rand() < 0.7) {
        addEdge(hubs[i], hubs[j], 0.075);
      }
    }
  }

  for (let i = 0; i < 6; i++) {
    const from = `${CLUSTERS[Math.floor(rand() * CLUSTERS.length)].id}-m${Math.floor(rand() * 6)
      }`;
    const to = `${CLUSTERS[Math.floor(rand() * CLUSTERS.length)].id}-m${Math.floor(rand() * 6)
      }`;
    if (from === to) continue;
    if (nodes.find((n) => n.id === from) && nodes.find((n) => n.id === to)) {
      addEdge(from, to, 0.025);
    }
  }

  for (let i = 0; i < 18; i++) {
    const id = `sat-${i}`;
    nodes.push({
      id,
      x: 4 + rand() * 92,
      y: 4 + rand() * 92,
      pixelSize: 1.2 + rand() * 0.8,
      alpha: 0.12 + rand() * 0.16,
    });
    if (rand() < 0.6) {
      const targetHub = hubs[Math.floor(rand() * hubs.length)];
      addEdge(id, targetHub, 0.025);
    }
  }

  return { nodes, edges };
}

function nodeById(nodes: NodeData[], id: string): NodeData | undefined {
  return nodes.find((n) => n.id === id);
}

function curvePath(from: NodeData, to: NodeData, side: number): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M ${from.x} ${from.y}`;
  const offset = len * 0.13;
  const perpX = (-dy / len) * offset * side;
  const perpY = (dx / len) * offset * side;
  return `M ${from.x} ${from.y} Q ${midX + perpX} ${midY + perpY
    } ${to.x} ${to.y}`;
}

interface Props {
  className?: string;
}
export default function SystemGraph({ className }: Props) {
  const { nodes, edges } = useMemo(() => generateGraph(), []);

  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="constellation-drift absolute inset-[-3%]"
        style={{
          maskImage:
            "radial-gradient(ellipse 88% 82% at 50% 50%, black 35%, transparent 95%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 88% 82% at 50% 50%, black 35%, transparent 95%)",
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {edges.map((e, i) => {
            const from = nodeById(nodes, e.from);
            const to = nodeById(nodes, e.to);
            if (!from || !to) return null;
            return (
              <path
                key={i}
                d={curvePath(from, to, e.side)}
                fill="none"
                stroke={`rgba(255,255,255,${e.alpha})`}
                strokeWidth={0.12}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {nodes.map((n) => {
          const isHub = !!n.isHub;
          return (
            <span
              key={n.id}
              className={isHub ? "system-hub-pulse absolute rounded-full" : "absolute rounded-full"}
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                width: `${n.pixelSize}px`,
                height: `${n.pixelSize}px`,
                backgroundColor: "rgba(255,255,255,1)",
                opacity: isHub ? undefined : n.alpha,
                transform: "translate(-50%, -50%)",
                boxShadow: isHub
                  ? "0 0 12px 2px rgba(255,255,255,0.18)"
                  : undefined,
                animationDelay: isHub ? `${n.pulseDelay}s` : undefined,
                animationDuration: isHub ? `${n.pulseDuration}s` : undefined,
              }}
            />
          );
        })}

        {nodes
          .filter((n) => n.isHub && n.label)
          .map((n) => (
            <span
              key={`label-${n.id}`}
              className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.22em] text-white/35"
              style={{
                left: `${n.x}%`,
                top: `calc(${n.y}% + 12px)`,
              }}
            >
              {n.label}
            </span>
          ))}
      </div>
    </div>
  );
}
