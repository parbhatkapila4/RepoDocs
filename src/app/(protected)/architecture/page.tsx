"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useMountedRef } from "@/hooks/useMountedRef";
import Link from "next/link";
import { useProjectsContext } from "@/context/ProjectsContext";
import { motion } from "motion/react";
import {
  Network,
  Loader2,
  AlertCircle,
  FileCode,
  Copy,
  CheckCheck,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ArchitectureNode, ArchitectureEdge } from "@/lib/architecture";
import { previewToCopyText } from "@/lib/architecture-preview";
import GitHubRateLimitNotice, {
  isRateLimitError,
} from "@/components/GitHubRateLimitNotice";

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

function PreviewCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy excerpt"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="p-1.5 rounded-md bg-white/6 hover:bg-white/10 text-[#888] hover:text-[#ccc] transition-colors"
    >
      {copied ? (
        <CheckCheck className="w-3.5 h-3.5" style={{ color: colors.green }} />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export default function ArchitecturePage() {
  const { projects, selectedProjectId } = useProjectsContext();
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<{
    embeddingsCount: number;
    indexingStatus: "queued" | "processing" | "completed" | "failed" | null;
    indexingProgress: number;
    indexingError: string | null;
  } | null>(null);
  const [filePreview, setFilePreview] = useState<{
    summary: string | null;
    segments: Array<{ startLine: number; endLine: number; code: string }>;
    omittedBetween?: { fromLine: number; toLine: number };
    language: string;
    totalLines: number;
    truncated: boolean;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const mountedRef = useMountedRef();

  useEffect(() => {
    const main = document.querySelector('main[data-slot="sidebar-inset"]');
    if (main) (main as HTMLElement).style.backgroundColor = "#000000";
    return () => {
      if (main) (main as HTMLElement).style.backgroundColor = "";
    };
  }, []);

  const fetchGraph = useCallback(async () => {
    if (!currentProject) return;
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
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
      if (!mountedRef.current) return;
      setNodes(data.nodes ?? []);
      setEdges(data.edges ?? []);
      setDiagnostics(data.diagnostics ?? null);
      setSelectedId(null);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(
        e instanceof Error ? e.message : "Failed to load architecture"
      );
      setNodes([]);
      setEdges([]);
      setDiagnostics(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentProject?.id, mountedRef]);


  useEffect(() => {
    if (currentProject) fetchGraph();
    else {
      setNodes([]);
      setEdges([]);
      setError(null);
    }
  }, [currentProject, fetchGraph]);

  useEffect(() => {
    if (!selectedId || !currentProject?.id) {
      setFilePreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    const ac = new AbortController();
    setPreviewLoading(true);
    setPreviewError(null);
    setFilePreview(null);

    const url = `/api/architecture/preview?projectId=${encodeURIComponent(
      currentProject.id
    )}&path=${encodeURIComponent(selectedId)}`;

    void fetch(url, { signal: ac.signal })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          summary?: string | null;
          segments?: Array<{
            startLine: number;
            endLine: number;
            code: string;
          }>;
          language?: string;
          totalLines?: number;
          truncated?: boolean;
          omittedBetween?: { fromLine: number; toLine: number } | null;
        };
        if (!res.ok) {
          throw new Error(
            data.message || data.error || "Failed to load file preview"
          );
        }
        return data;
      })
      .then((data) => {
        if (ac.signal.aborted || !mountedRef.current) return;
        setFilePreview({
          summary: data.summary ?? null,
          segments: Array.isArray(data.segments) ? data.segments : [],
          omittedBetween:
            data.omittedBetween &&
              data.omittedBetween.fromLine <= data.omittedBetween.toLine
              ? data.omittedBetween
              : undefined,
          language: data.language ?? "typescript",
          totalLines: data.totalLines ?? 0,
          truncated: Boolean(data.truncated),
        });
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted || !mountedRef.current) return;
        if (e instanceof Error && e.name === "AbortError") return;
        setPreviewError(
          e instanceof Error ? e.message : "Failed to load file preview"
        );
      })
      .finally(() => {
        if (!ac.signal.aborted && mountedRef.current) setPreviewLoading(false);
      });

    return () => ac.abort();
  }, [selectedId, currentProject?.id, mountedRef]);

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

            <GitHubRateLimitNotice error={error} className="mb-6" />
            {error && !isRateLimitError(error) && (
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
                {diagnostics?.indexingStatus === "processing" && (
                  <p className="text-[#7dd3fc] text-xs mt-1">
                    Indexing is in progress ({diagnostics.indexingProgress}%).
                    Please wait a bit and refresh.
                  </p>
                )}
                {diagnostics?.indexingStatus === "queued" && (
                  <p className="text-[#93c5fd] text-xs mt-1">
                    Indexing job is queued. It will start shortly.
                  </p>
                )}
                {diagnostics?.indexingStatus === "failed" && (
                  <p className="text-[#fca5a5] text-xs mt-1">
                    Last indexing failed
                    {diagnostics.indexingError
                      ? `: ${diagnostics.indexingError}`
                      : "."}
                  </p>
                )}
                {!diagnostics?.indexingStatus && (
                  <p className="text-[#555] text-xs mt-1">
                    Index the project first from dashboard.
                  </p>
                )}
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
                  <div className="lg:w-[min(26rem,calc(100vw-3rem))] shrink-0 bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden h-fit max-w-full">
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
                          Overview
                        </h3>
                        {previewLoading && (
                          <div className="flex items-center gap-2 text-[#666] text-xs font-mono py-2">
                            <Loader2
                              className="w-3.5 h-3.5 animate-spin shrink-0"
                              style={{ color: colors.cyan }}
                            />
                            Loading excerpt…
                          </div>
                        )}
                        {!previewLoading && previewError && (
                          <p className="text-xs text-[#888] leading-relaxed">
                            {previewError.includes("No indexed source") ||
                              previewError.includes("not_indexed")
                              ? "Code preview needs indexed source. If indexing is not done yet, only the file list from GitHub may be shown."
                              : previewError}
                          </p>
                        )}
                        {!previewLoading &&
                          !previewError &&
                          filePreview &&
                          filePreview.totalLines > 0 &&
                          filePreview.segments.length > 0 && (
                            <div className="space-y-3">
                              {filePreview.summary ? (
                                <p className="text-xs text-[#b8b8b8] leading-relaxed">
                                  {filePreview.summary}
                                </p>
                              ) : null}
                              <div className="rounded-lg border border-[#333] overflow-hidden bg-[#0a0a0a]">
                                <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-[#333] bg-[#141414]">
                                  <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span
                                      className="text-[10px] font-mono uppercase tracking-wide"
                                      style={{ color: colors.purple }}
                                    >
                                      {filePreview.language}
                                    </span>
                                    <span className="text-[10px] font-mono text-[#555]">
                                      {filePreview.segments.length} excerpt
                                      {filePreview.segments.length !== 1
                                        ? "s"
                                        : ""}{" "}
                                      · {filePreview.totalLines} lines
                                      {filePreview.truncated ? " · …" : ""}
                                    </span>
                                  </div>
                                  <PreviewCopyButton
                                    text={previewToCopyText(
                                      filePreview.segments,
                                      filePreview.omittedBetween
                                    )}
                                  />
                                </div>
                                <div
                                  className="max-h-[min(56vh,480px)] overflow-auto"
                                  style={{ overscrollBehavior: "contain" }}
                                >
                                  {filePreview.segments.map((seg, idx) => {
                                    const ob = filePreview.omittedBetween;
                                    const showGap =
                                      idx === 1 &&
                                      ob &&
                                      ob.toLine >= ob.fromLine;
                                    return (
                                      <React.Fragment
                                        key={`${seg.startLine}-${seg.endLine}-${idx}`}
                                      >
                                        {showGap ? (
                                          <div className="text-center py-2 px-2 text-[10px] font-mono text-[#666] border-b border-[#252525] bg-[#0c0c0c]">
                                            Lines {ob.fromLine}–{ob.toLine}{" "}
                                            omitted in source
                                          </div>
                                        ) : null}
                                        <SyntaxHighlighter
                                          style={vscDarkPlus}
                                          language={filePreview.language}
                                          PreTag="div"
                                          showLineNumbers
                                          startingLineNumber={seg.startLine}
                                          lineNumberStyle={{
                                            minWidth: "2.5em",
                                            paddingRight: "0.75em",
                                            color: "#4a4a4a",
                                            fontSize: "10px",
                                            userSelect: "none",
                                          }}
                                          customStyle={{
                                            fontSize: "11.5px",
                                            lineHeight: "1.58",
                                            margin: 0,
                                            padding: "10px 10px 12px 6px",
                                            background: "#0a0a0a",
                                            overflowX: "auto",
                                          }}
                                        >
                                          {seg.code}
                                        </SyntaxHighlighter>
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
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
                              <p className="text-[#555] text-xs italic">-</p>
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
                              <p className="text-[#555] text-xs italic">-</p>
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
