"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useProjectsContext } from "@/context/ProjectsContext";
import { Activity, Loader2, AlertCircle } from "lucide-react";

const WINDOW_DAYS = 7;

type CostBreakdown = {
  query: number;
  diff: number;
  architecture: number;
};

type ObservabilityData = {
  totalQueries: number;
  avgLatencyMs: number;
  memoryHitRate: number;
  estimatedCostUsd7d: number;
  totalCost7d?: number;
  breakdown?: CostBreakdown;
  recentErrors: {
    createdAt: string;
    routeType: string;
    errorMessage: string | null;
  }[];
  cost30d: number;
  monthlyCostLimitUsd: number | null;
  alertThresholdPercent: number;
  budgetStatus: "ok" | "warning" | "limit_exceeded" | "not_set";
  coldStartCount?: number;
  coldStartLatencyAvg?: number;
  warmLatencyAvg?: number;
  cacheHitRate?: number;
  avgLatencyCacheHit?: number;
  avgLatencyCacheMiss?: number;
  healthStatus?: "healthy" | "warning" | "critical";
  avgMemorySimilarity?: number | null;
};

export default function ObservabilityPage() {
  const { projects, selectedProjectId } = useProjectsContext();
  const [data, setData] = useState<ObservabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    if (!selectedProjectId || !currentProject) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(
      `/api/observability?projectId=${encodeURIComponent(selectedProjectId)}&window=${WINDOW_DAYS}`
    )
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => {
            throw new Error(body.error || body.message || "Failed to load metrics");
          });
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, [selectedProjectId, currentProject?.id]);

  useEffect(() => {
    const main = document.querySelector('main[data-slot="sidebar-inset"]');
    if (main) (main as HTMLElement).style.backgroundColor = "#000000";
    return () => {
      if (main) (main as HTMLElement).style.backgroundColor = "";
    };
  }, []);

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-black relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#333] to-transparent" />
        <div className="relative w-full max-w-full px-6 sm:px-8 lg:px-12 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-6">
            <Activity className="w-8 h-8 text-[#888]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 text-center">
            No Project Selected
          </h2>
          <p className="text-[#888] text-sm text-center max-w-md">
            Select a project from the sidebar to view AI usage and query metrics.
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
        <div className="mb-10">
          <span className="text-[#666] text-xs font-mono tracking-wide uppercase mb-3 block">
            Internal
          </span>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold text-white">
              Observability
            </h1>
            {data?.healthStatus && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium border ${data.healthStatus === "critical"
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : data.healthStatus === "warning"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-green-500/10 text-green-400 border-green-500/30"
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${data.healthStatus === "critical"
                    ? "bg-red-500"
                    : data.healthStatus === "warning"
                      ? "bg-amber-500"
                      : "bg-green-500"
                    }`}
                />
                {data.healthStatus === "critical"
                  ? "Critical"
                  : data.healthStatus === "warning"
                    ? "Warning"
                    : "Healthy"}
              </span>
            )}
          </div>
          <p className="text-[#888] text-sm max-w-md">
            Query metrics and estimated cost for this project (last {WINDOW_DAYS} days).
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#666]" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-medium mb-1">Error loading metrics</h3>
              <p className="text-[#888] text-sm">{error}</p>
            </div>
          </div>
        )}

        {data && !loading && !error && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                <p className="text-[#666] text-xs font-mono uppercase tracking-wider mb-1">
                  Total queries
                </p>
                <p className="text-2xl font-bold text-white">{data.totalQueries}</p>
                <p className="text-[#888] text-xs mt-1">Last {WINDOW_DAYS} days</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                <p className="text-[#666] text-xs font-mono uppercase tracking-wider mb-1">
                  Avg latency
                </p>
                <p className="text-2xl font-bold text-white">{data.avgLatencyMs.toFixed(0)} ms</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                <p className="text-[#666] text-xs font-mono uppercase tracking-wider mb-1">
                  Memory hit rate
                </p>
                <p className="text-2xl font-bold text-white">
                  {(data.memoryHitRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                <p className="text-[#666] text-xs font-mono uppercase tracking-wider mb-1">
                  Avg memory similarity (7d)
                </p>
                <p className="text-2xl font-bold text-white">
                  {data.avgMemorySimilarity != null
                    ? data.avgMemorySimilarity.toFixed(2)
                    : "—"}
                </p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                <p className="text-[#666] text-xs font-mono uppercase tracking-wider mb-1">
                  Est. cost (7d)
                </p>
                <p className="text-2xl font-bold text-white">
                  ${data.estimatedCostUsd7d.toFixed(4)}
                </p>
              </div>
            </div>


            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border-b border-[#333]">
                <span className="text-[#888] text-sm font-mono">
                  Cost breakdown ({WINDOW_DAYS}d)
                </span>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[#888] text-sm">
                  Total cost (7d):{" "}
                  <span className="text-white font-mono">
                    $
                    {(data.totalCost7d ?? data.estimatedCostUsd7d).toFixed(4)}
                  </span>
                </p>
                {data.breakdown != null && (
                  <table className="w-full max-w-xs text-left">
                    <tbody className="text-sm">
                      <tr className="border-b border-[#252525]">
                        <td className="py-2 text-[#666] font-mono">query</td>
                        <td className="py-2 text-white font-mono">
                          ${(data.breakdown.query ?? 0).toFixed(4)}
                        </td>
                      </tr>
                      <tr className="border-b border-[#252525]">
                        <td className="py-2 text-[#666] font-mono">diff</td>
                        <td className="py-2 text-white font-mono">
                          ${(data.breakdown.diff ?? 0).toFixed(4)}
                        </td>
                      </tr>
                      <tr className="border-b border-[#252525] last:border-b-0">
                        <td className="py-2 text-[#666] font-mono">
                          architecture
                        </td>
                        <td className="py-2 text-white font-mono">
                          ${(data.breakdown.architecture ?? 0).toFixed(4)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>


            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
              <p className="text-[#666] text-xs font-mono uppercase tracking-wider mb-2">
                Budget (30d)
              </p>
              {data.monthlyCostLimitUsd != null ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#888] text-sm">
                      ${data.cost30d.toFixed(4)} of ${data.monthlyCostLimitUsd.toFixed(2)} limit
                    </span>
                    <span
                      className={`text-xs font-mono shrink-0 ${data.budgetStatus === "limit_exceeded"
                        ? "text-red-500"
                        : data.budgetStatus === "warning"
                          ? "text-amber-500"
                          : "text-[#888]"
                        }`}
                    >
                      {Math.min(
                        100,
                        (data.cost30d / data.monthlyCostLimitUsd) * 100
                      ).toFixed(0)}
                      % used
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#333] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (data.cost30d / data.monthlyCostLimitUsd) * 100
                        )}%`,
                        backgroundColor:
                          data.budgetStatus === "limit_exceeded"
                            ? "#ef4444"
                            : data.budgetStatus === "warning"
                              ? "#f59e0b"
                              : "#555",
                      }}
                    />
                  </div>
                  {data.budgetStatus === "warning" && (
                    <p className="text-amber-500 text-xs">Approaching budget limit</p>
                  )}
                  {data.budgetStatus === "limit_exceeded" && (
                    <p className="text-red-500 text-xs">Budget limit exceeded</p>
                  )}
                </div>
              ) : (
                <p className="text-[#666] text-sm">No budget limit set</p>
              )}
            </div>


            {(data.coldStartCount !== undefined ||
              data.coldStartLatencyAvg !== undefined ||
              data.warmLatencyAvg !== undefined) && (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                  <p className="text-[#666] text-xs font-mono uppercase tracking-wider mb-3">
                    Cold starts (7d)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[#666] text-xs mb-0.5">Cold starts</p>
                      <p className="text-white font-mono">
                        {data.coldStartCount ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#666] text-xs mb-0.5">Cold avg latency</p>
                      <p className="text-white font-mono">
                        {(data.coldStartLatencyAvg ?? 0) > 0
                          ? `${(data.coldStartLatencyAvg ?? 0).toFixed(0)} ms`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#666] text-xs mb-0.5">Warm avg latency</p>
                      <p className="text-white font-mono">
                        {(data.warmLatencyAvg ?? 0) > 0
                          ? `${(data.warmLatencyAvg ?? 0).toFixed(0)} ms`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}


            {(data.cacheHitRate !== undefined ||
              data.avgLatencyCacheHit !== undefined ||
              data.avgLatencyCacheMiss !== undefined) && (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                  <p className="text-[#666] text-xs font-mono uppercase tracking-wider mb-3">
                    Cache (7d)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[#666] text-xs mb-0.5">Cache hit rate</p>
                      <p className="text-white font-mono">
                        {data.cacheHitRate != null && data.totalQueries > 0
                          ? `${(data.cacheHitRate * 100).toFixed(1)}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#666] text-xs mb-0.5">
                        Avg latency (cache hit)
                      </p>
                      <p className="text-white font-mono">
                        {(data.avgLatencyCacheHit ?? 0) > 0
                          ? `${(data.avgLatencyCacheHit ?? 0).toFixed(0)} ms`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#666] text-xs mb-0.5">
                        Avg latency (cache miss)
                      </p>
                      <p className="text-white font-mono">
                        {(data.avgLatencyCacheMiss ?? 0) > 0
                          ? `${(data.avgLatencyCacheMiss ?? 0).toFixed(0)} ms`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border-b border-[#333]">
                <AlertCircle className="w-4 h-4 text-[#888]" />
                <span className="text-[#888] text-sm font-mono">Recent errors</span>
              </div>
              <div className="overflow-x-auto">
                {data.recentErrors.length === 0 ? (
                  <p className="p-6 text-[#666] text-sm">No errors in the last {WINDOW_DAYS} days.</p>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#333]">
                        <th className="px-4 py-3 text-[#666] text-xs font-mono uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-4 py-3 text-[#666] text-xs font-mono uppercase tracking-wider">
                          Route
                        </th>
                        <th className="px-4 py-3 text-[#666] text-xs font-mono uppercase tracking-wider">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentErrors.map((row, i) => (
                        <tr
                          key={`${row.createdAt}-${row.routeType}-${i}`}
                          className="border-b border-[#252525] last:border-b-0"
                        >
                          <td className="px-4 py-3 text-[#888] text-sm font-mono whitespace-nowrap">
                            {new Date(row.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-white text-sm font-mono">
                            {row.routeType}
                          </td>
                          <td className="px-4 py-3 text-[#888] text-sm max-w-md truncate" title={row.errorMessage ?? undefined}>
                            {row.errorMessage ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
