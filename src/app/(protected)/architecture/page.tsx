"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useProjectsContext } from "@/context/ProjectsContext";
import { motion } from "motion/react";
import {
  Network,
  Loader2,
  AlertCircle,
  FileCode,
} from "lucide-react";
import type { ArchitectureNode, ArchitectureEdge } from "@/lib/architecture";

const colors = {
  green: "#50fa7b",
  cyan: "#8be9fd",
  purple: "#bd93f9",
  pink: "#ff79c6",
  yellow: "#f1fa8c",
  orange: "#ffb86c",
  red: "#ff5555",
  white: "#f8f8f2",
};

const NODE_WIDTH = 160;
const NODE_HEIGHT = 40;
const GRID_GAP = 16;
const COLS = 5;
const PAD = 24;

function shortName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

export default function ArchitecturePage() {
  const { projects, selectedProjectId } = useProjectsContext();
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    const main = document.querySelector('main[data-slot="sidebar-inset"]');
    if (main) (main as HTMLElement).style.backgroundColor = "#000000";
    return () => {
      if (main) (main as HTMLElement).style.backgroundColor = "";
    };
  }, []);

  const fetchGraph = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/architecture?projectId=${encodeURIComponent(currentProject.id)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message || data.error || "Failed to load architecture"
        );
      }
      const data = await res.json();
      setNodes(data.nodes ?? []);
      setEdges(data.edges ?? []);
      setSelectedId(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load architecture"
      );
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    if (currentProject) fetchGraph();
    else {
      setNodes([]);
      setEdges([]);
      setError(null);
    }
  }, [currentProject, fetchGraph]);

  const nodePositions = React.useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      pos[n.id] = {
        x: PAD + col * (NODE_WIDTH + GRID_GAP) + NODE_WIDTH / 2,
        y: PAD + row * (NODE_HEIGHT + GRID_GAP) + NODE_HEIGHT / 2,
      };
    });
    return pos;
  }, [nodes]);

  const svgDimensions = React.useMemo(() => {
    const w = Math.max(
      600,
      COLS * (NODE_WIDTH + GRID_GAP) + PAD * 2
    );
    const h = Math.max(
      320,
      Math.ceil(nodes.length / COLS) * (NODE_HEIGHT + GRID_GAP) + PAD * 2
    );
    return { width: w, height: h };
  }, [nodes.length]);

  const incoming = selectedId
    ? edges.filter((e) => e.to === selectedId).map((e) => e.from)
    : [];
  const outgoing = selectedId
    ? edges.filter((e) => e.from === selectedId).map((e) => e.to)
    : [];

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-black relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#333] to-transparent" />
        <div className="relative w-full max-w-full px-6 sm:px-8 lg:px-12 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-6">
            <Network className="w-8 h-8" style={{ color: colors.purple }} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 text-center">
            Select a project
          </h2>
          <p className="text-[#888] text-sm text-center max-w-md">
            Select a project from the sidebar to view its architecture map.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 px-4 py-2 text-[#888] hover:text-white border border-[#333] hover:border-[#555] rounded-lg text-sm font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#333] to-transparent" />

      <div className="relative w-full max-w-full px-6 sm:px-8 lg:px-12 py-8">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-[#666] text-xs font-mono tracking-wide uppercase mb-3 block">
            Dependency graph
          </span>
          <h1 className="text-4xl font-bold text-white mb-3">
            Architecture map
          </h1>
          <p className="text-[#888] text-sm max-w-md">
            File dependency graph from indexed source (imports and requires).
            Click a node to see incoming and outgoing edges.
          </p>
        </motion.div>

        <motion.div
          className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap px-4 py-3 bg-[#252525] border-b border-[#333]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-[#666] text-sm font-mono">
                architecture-map
              </span>
            </div>
            {nodes.length > 0 && (
              <span className="text-xs font-mono text-[#666]">
                {nodes.length} files · {edges.length} edges
              </span>
            )}
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex items-center gap-3 py-12 text-[#888]">
                <Loader2
                  className="w-5 h-5 animate-spin"
                  style={{ color: colors.cyan }}
                />
                <span className="text-sm font-mono">Loading architecture...</span>
              </div>
            )}

            {error && (
              <div
                className="flex items-center gap-3 p-4 rounded-lg border mb-6"
                style={{
                  backgroundColor: "rgba(255, 184, 108, 0.08)",
                  borderColor: "rgba(255, 184, 108, 0.3)",
                }}
              >
                <AlertCircle
                  className="w-5 h-5 shrink-0"
                  style={{ color: colors.orange }}
                />
                <span className="text-sm" style={{ color: colors.orange }}>
                  {error}
                </span>
              </div>
            )}

            {!loading && !error && nodes.length === 0 && (
              <div className="py-12 px-6 text-center rounded-lg bg-[#0a0a0a] border border-[#333]">
                <FileCode
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "#444" }}
                />
                <p className="text-[#666] text-sm font-mono">
                  No indexed files for this project.
                </p>
                <p className="text-[#555] text-xs mt-1">
                  Index the project first from the dashboard or wait for
                  indexing to complete.
                </p>
              </div>
            )}

            {!loading && !error && nodes.length > 0 && (
              <div className="flex gap-6 flex-col lg:flex-row w-full min-w-0">
                <div
                  className="rounded-lg bg-[#0a0a0a] border border-[#333] overflow-auto flex-1 min-w-0 w-full"
                  style={{ minHeight: 320 }}
                >
                  <svg
                    className="w-full h-auto"
                    viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ minHeight: 320 }}
                  >
                    {edges.map((e, i) => {
                      const fromPos = nodePositions[e.from];
                      const toPos = nodePositions[e.to];
                      if (!fromPos || !toPos) return null;
                      return (
                        <line
                          key={`e-${i}`}
                          x1={fromPos.x}
                          y1={fromPos.y}
                          x2={toPos.x}
                          y2={toPos.y}
                          stroke={colors.cyan}
                          strokeOpacity={0.4}
                          strokeWidth={1.5}
                        />
                      );
                    })}
                    {nodes.map((n) => {
                      const pos = nodePositions[n.id];
                      if (!pos) return null;
                      const isSelected = selectedId === n.id;
                      return (
                        <g
                          key={n.id}
                          onClick={() =>
                            setSelectedId((id) => (id === n.id ? null : n.id))
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <title>{n.path}</title>
                          <rect
                            x={pos.x - NODE_WIDTH / 2}
                            y={pos.y - NODE_HEIGHT / 2}
                            width={NODE_WIDTH}
                            height={NODE_HEIGHT}
                            rx={8}
                            fill="#1a1a1a"
                            stroke={
                              isSelected ? colors.green : "rgba(255,255,255,0.1)"
                            }
                            strokeWidth={isSelected ? 2 : 1}
                          />
                          <text
                            x={pos.x}
                            y={pos.y - 6}
                            textAnchor="middle"
                            fill="#f8f8f2"
                            fontSize={11}
                            className="font-medium"
                          >
                            {shortName(n.path).length > 22
                              ? shortName(n.path).slice(0, 21) + "…"
                              : shortName(n.path)}
                          </text>
                          <text
                            x={pos.x}
                            y={pos.y + 8}
                            textAnchor="middle"
                            fill="#666"
                            fontSize={9}
                          >
                            {n.path.length > 26
                              ? n.path.slice(0, 25) + "…"
                              : n.path}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {selectedId && (
                  <div className="lg:w-80 shrink-0 bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden h-fit">
                    <div className="px-4 py-3 bg-[#252525] border-b border-[#333]">
                      <span className="text-xs font-mono text-[#666] uppercase tracking-wider">
                        File details
                      </span>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-1">
                          Path
                        </h3>
                        <code
                          className="block text-sm font-mono break-all"
                          style={{ color: colors.cyan }}
                        >
                          {selectedId}
                        </code>
                      </div>
                      <div>
                        <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
                          Related
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-[#666] text-xs mb-1 font-mono">
                              Imports this file (incoming)
                            </p>
                            {incoming.length === 0 ? (
                              <p className="text-[#555] text-xs italic">—</p>
                            ) : (
                              <ul className="space-y-1">
                                {incoming.map((path) => (
                                  <li key={path}>
                                    <code
                                      className="text-xs font-mono px-2 py-0.5 rounded bg-[#0a0a0a] border border-[#333] block truncate"
                                      style={{ color: colors.purple }}
                                    >
                                      {path}
                                    </code>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <p className="text-[#666] text-xs mb-1 font-mono">
                              This file imports (outgoing)
                            </p>
                            {outgoing.length === 0 ? (
                              <p className="text-[#555] text-xs italic">—</p>
                            ) : (
                              <ul className="space-y-1">
                                {outgoing.map((path) => (
                                  <li key={path}>
                                    <code
                                      className="text-xs font-mono px-2 py-0.5 rounded bg-[#0a0a0a] border border-[#333] block truncate"
                                      style={{ color: colors.green }}
                                    >
                                      {path}
                                    </code>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
