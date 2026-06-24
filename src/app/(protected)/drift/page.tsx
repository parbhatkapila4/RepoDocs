"use client";

import React, { useState, useEffect, useRef } from "react";
import { useMountedRef } from "@/hooks/useMountedRef";
import Link from "next/link";
import {
  useProjectsContext,
  type SidebarProject,
} from "@/context/ProjectsContext";
import { motion } from "motion/react";
import {
  Loader2,
  AlertCircle,
  History,
  GitBranch,
  GitCommit,
  GitCompare,
  ChevronDown,
  RefreshCw,
  RotateCw,
  Info,
  CheckCircle2,
  FileDiff,
} from "lucide-react";
import { toast } from "sonner";
import type { DiffAnalysisResult } from "@/lib/diff";
import { AnalysisResult } from "@/components/diff/AnalysisResult";
import {
  setProjectBaselineNow,
  retryIndexingJob,
  getIndexingStatus,
} from "@/lib/actions-indexing";

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

interface ChangesMeta {
  baseSha: string;
  headSha: string;
  commitCount: number;
  fileCount: number;
  truncated: boolean;
  commits: {
    sha: string;
    message: string;
    author: string;
    date?: string | null;
  }[];
  files: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }[];
}

type ChangesStatus =
  | { kind: "no_changes" }
  | { kind: "no_baseline" }
  | { kind: "error"; message: string };

function shortSha(sha?: string | null): string {
  return sha ? sha.slice(0, 7) : "-";
}

function formatShortDate(date?: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFriendlyDate(date?: Date | string | null): string {
  if (!date) return "an earlier point";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "an earlier point";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fileStatusStyle(status: string): { label: string; color: string } {
  switch (status) {
    case "added":
      return { label: "added", color: "#50fa7b" };
    case "removed":
      return { label: "removed", color: "#ff5555" };
    case "renamed":
      return { label: "renamed", color: "#8be9fd" };
    case "copied":
      return { label: "copied", color: "#bd93f9" };
    case "modified":
    case "changed":
      return { label: "modified", color: "#ffb86c" };
    default:
      return { label: status || "modified", color: "#ffb86c" };
  }
}

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type JobSnapshot = {
  status: "queued" | "processing" | "completed" | "failed" | "not_started";
  progress: number;
  filesProcessed: number;
  filesTotal: number;
  error: string | null;
  updatedAt: Date | string | null;
};

const STATUS_POLL_MS = 2500;

function relativeTime(date?: Date | string | null): string {
  if (!date) return "unknown";
  const d = typeof date === "string" ? new Date(date) : date;
  const t = d.getTime();
  if (Number.isNaN(t)) return "unknown";
  const sec = Math.round((Date.now() - t) / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(day / 365)}y ago`;
}

function DriftHeader({
  meta,
  indexedAt,
}: {
  meta: ChangesMeta;
  indexedAt?: Date | string | null;
}) {
  const [showCommits, setShowCommits] = useState(false);
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <GitBranch className="w-4 h-4" style={{ color: colors.green }} />
        <span className="text-white font-medium font-mono">
          {meta.commitCount} {meta.commitCount === 1 ? "commit" : "commits"} ·{" "}
          {meta.fileCount} {meta.fileCount === 1 ? "file" : "files"} changed
        </span>
        <span className="text-[#666]">since {relativeTime(indexedAt)}</span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs font-mono">
        <code
          className="px-2 py-0.5 rounded bg-[#0a0a0a] border border-[#333]"
          style={{ color: colors.cyan }}
        >
          {shortSha(meta.baseSha)}
        </code>
        <span className="text-[#555]">→</span>
        <code
          className="px-2 py-0.5 rounded bg-[#0a0a0a] border border-[#333]"
          style={{ color: colors.green }}
        >
          {shortSha(meta.headSha)}
        </code>
      </div>

      {meta.truncated && (
        <div
          className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: "rgba(255, 184, 108, 0.1)",
            border: "1px solid rgba(255, 184, 108, 0.3)",
          }}
        >
          <Info
            className="w-3.5 h-3.5 mt-0.5 shrink-0"
            style={{ color: colors.orange }}
          />
          <span className="text-xs" style={{ color: colors.orange }}>
            Large diff - analysis is capped at the first 300 changed files.
          </span>
        </div>
      )}

      {meta.commits.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowCommits((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-mono text-[#888] hover:text-white transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showCommits ? "rotate-180" : ""}`}
            />
            {showCommits ? "Hide" : "Show"} {meta.commits.length} commit
            {meta.commits.length === 1 ? "" : "s"}
          </button>

          {showCommits && (
            <ul className="mt-3 space-y-2.5 border-l border-[#333] pl-4">
              {meta.commits.map((c) => (
                <li key={c.sha} className="text-xs">
                  <div className="flex items-baseline gap-2">
                    <code
                      className="font-mono shrink-0"
                      style={{ color: colors.purple }}
                    >
                      {shortSha(c.sha)}
                    </code>
                    <span className="text-[#f8f8f2] break-words">
                      {c.message.split("\n")[0]}
                    </span>
                  </div>
                  <div className="text-[#666] font-mono flex items-center gap-1.5 flex-wrap">
                    {c.author && <span>{c.author}</span>}
                    {c.date && (
                      <>
                        {c.author && <span className="text-[#444]">·</span>}
                        <span>{relativeTime(c.date)}</span>
                        <span className="text-[#444]">·</span>
                        <span>{formatShortDate(c.date)}</span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ChangedFiles({
  files,
  truncated,
}: {
  files: ChangesMeta["files"];
  truncated: boolean;
}) {
  if (files.length === 0) return null;
  const totalAdds = files.reduce((s, f) => s + (f.additions || 0), 0);
  const totalDels = files.reduce((s, f) => s + (f.deletions || 0), 0);
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider flex items-center gap-2">
          <FileDiff className="w-4 h-4" style={{ color: colors.cyan }} />
          Changed files ({files.length})
        </h3>
        <span className="text-xs font-mono">
          <span style={{ color: colors.green }}>+{totalAdds}</span>{" "}
          <span style={{ color: colors.red }}>−{totalDels}</span>
        </span>
      </div>
      <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {files.map((f) => {
          const s = fileStatusStyle(f.status);
          return (
            <li
              key={f.filename}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="font-mono px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    color: s.color,
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: `1px solid ${s.color}33`,
                  }}
                >
                  {s.label}
                </span>
                <code className="font-mono text-[#f8f8f2] truncate">
                  {f.filename}
                </code>
              </div>
              <span className="font-mono shrink-0 whitespace-nowrap">
                <span style={{ color: colors.green }}>+{f.additions}</span>{" "}
                <span style={{ color: colors.red }}>−{f.deletions}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {truncated && (
        <p className="mt-3 text-xs text-[#666]">
          Showing the first 300 changed files (large diff).
        </p>
      )}
    </div>
  );
}

function friendlyCheckError(
  status: number,
  data: { reason?: string; message?: string; error?: string } | null
): string {
  const reason = data?.reason ?? "";
  const raw = data?.message || data?.error || "";
  if (/being processed/i.test(raw)) {
    return "RepoDoc is still reading this repository. This will be available once indexing finishes.";
  }
  if (status === 404 || reason === "bad_repo_url" || /not found|404/i.test(raw)) {
    return "RepoDoc can't access this repository. If it's private, it needs a token with access; if the URL changed, re-add it in your project settings.";
  }
  if (status === 403 || /rate limit|rate-limit|403/i.test(raw)) {
    return "GitHub temporarily limited requests. Try again in a few minutes.";
  }
  if (status === 401 || /credential|unauthorized|401/i.test(raw)) {
    return "GitHub rejected the access token for this repository. Add or refresh it, then try again.";
  }
  return (
    raw || "Something went wrong while checking for changes. Please try again."
  );
}

type NoBaselineReason = "pre_tracking" | "failed" | "orphaned";

type View =
  | { kind: "loading" }
  | { kind: "indexing" }
  | { kind: "checking" }
  | { kind: "has_changes" }
  | { kind: "no_changes" }
  | { kind: "error"; message: string }
  | { kind: "no_baseline"; reason: NoBaselineReason }
  | { kind: "ready" };

function DriftChecker({ project }: { project: SidebarProject }) {
  const { loadProjects } = useProjectsContext();
  const [analysis, setAnalysis] = useState<DiffAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [changesMeta, setChangesMeta] = useState<ChangesMeta | null>(null);
  const [changesStatus, setChangesStatus] = useState<ChangesStatus | null>(
    null
  );
  const [baselineBusy, setBaselineBusy] = useState(false);
  const [reindexBusy, setReindexBusy] = useState(false);
  const [reindexStartedAt, setReindexStartedAt] = useState<number | null>(null);
  const [job, setJob] = useState<JobSnapshot | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [actionError, setActionError] = useState<string | null>(null);
  const mountedRef = useMountedRef();
  const sawActiveRef = useRef(false);
  const hasBaselineRef = useRef(Boolean(project.indexedCommitSha));
  useEffect(() => {
    hasBaselineRef.current = Boolean(project.indexedCommitSha);
  }, [project.indexedCommitSha]);
  const reconcileTriedRef = useRef(false);

  const handleSetBaseline = async () => {
    if (baselineBusy || reindexBusy) return;
    if (mountedRef.current) {
      setBaselineBusy(true);
      setActionError(null);
    }
    try {
      const res = await setProjectBaselineNow(project.id);
      if (!mountedRef.current) return;
      if (res.success) {
        await loadProjects();
        if (!mountedRef.current) return;
        setChangesStatus(null);
        setAnalysis(null);
        setChangesMeta(null);
        toast.success(
          res.alreadySet
            ? "Already tracking changes for this repo"
            : "Now tracking changes from today"
        );
      } else {
        setActionError(res.error);
      }
    } catch (error) {
      if (mountedRef.current)
        setActionError(
          error instanceof Error ? error.message : "Failed to set baseline."
        );
    } finally {
      if (mountedRef.current) setBaselineBusy(false);
    }
  };

  const handleReindex = async () => {
    if (baselineBusy || reindexBusy) return;
    if (mountedRef.current) {
      setReindexBusy(true);
      setActionError(null);
    }
    try {
      await retryIndexingJob(project.id);
      if (!mountedRef.current) return;
      sawActiveRef.current = true;
      setJob({
        status: "queued",
        progress: 0,
        filesProcessed: 0,
        filesTotal: 0,
        error: null,
        updatedAt: null,
      });
      setNowMs(Date.now());
      setReindexStartedAt(Date.now());
      setChangesStatus(null);
      setAnalysis(null);
      setChangesMeta(null);
      toast.success("Re-indexing started");
    } catch (error) {
      if (mountedRef.current)
        setActionError(
          error instanceof Error
            ? error.message
            : "Couldn't start re-indexing. It may already be running - try again shortly."
        );
    } finally {
      if (mountedRef.current) setReindexBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const poll = async () => {
      try {
        const s = await getIndexingStatus(project.id);
        if (cancelled || !mountedRef.current) return;
        const snap: JobSnapshot = {
          status: s.status as JobSnapshot["status"],
          progress: typeof s.progress === "number" ? s.progress : 0,
          filesProcessed: s.filesProcessed ?? 0,
          filesTotal: s.filesTotal ?? 0,
          error: s.error ?? null,
          updatedAt: s.updatedAt ?? null,
        };
        setJob(snap);
        setStatusLoaded(true);

        if (snap.status === "queued" || snap.status === "processing") {
          sawActiveRef.current = true;
          return;
        }

        stop();
        if (snap.status === "completed" && sawActiveRef.current) {
          sawActiveRef.current = false;
          await loadProjects();
          if (cancelled || !mountedRef.current) return;
          setChangesStatus(null);
          setAnalysis(null);
          setChangesMeta(null);
          setReindexStartedAt(null);
          toast.success("Indexing complete - now tracking changes");
        } else if (
          snap.status === "completed" &&
          !hasBaselineRef.current &&
          !reconcileTriedRef.current
        ) {
          reconcileTriedRef.current = true;
          await loadProjects();
        }
      } catch {
        if (mountedRef.current) setStatusLoaded(true);
      }
    };

    void poll();
    timer = setInterval(poll, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      stop();
    };
  }, [project.id, reindexStartedAt, loadProjects]);

  useEffect(() => {
    if (reindexStartedAt === null) return;
    if (job?.status === "completed" || job?.status === "failed") return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [reindexStartedAt, job?.status]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (mountedRef.current) setStatusLoaded(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [mountedRef]);

  const handleCheckChanges = async () => {
    if (isLoading) return;

    if (mountedRef.current) {
      setIsLoading(true);
      setAnalysis(null);
      setChangesMeta(null);
      setChangesStatus(null);
    }

    try {
      const response = await fetch("/api/repo-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      const data = await response.json().catch(() => null);

      if (!mountedRef.current) return;

      if (response.status === 409 && data?.reason === "no_baseline") {
        setChangesStatus({ kind: "no_baseline" });
        return;
      }

      if (!response.ok) {
        setChangesStatus({
          kind: "error",
          message: friendlyCheckError(response.status, data),
        });
        return;
      }

      if (data?.status === "no_changes") {
        setChangesStatus({ kind: "no_changes" });
        return;
      }

      if (data?.success && data?.analysis) {
        setAnalysis(data.analysis);
        setChangesMeta({
          baseSha: data.baseSha,
          headSha: data.headSha,
          commitCount: data.commitCount ?? 0,
          fileCount: data.fileCount ?? 0,
          truncated: Boolean(data.truncated),
          commits: Array.isArray(data.commits) ? data.commits : [],
          files: Array.isArray(data.files) ? data.files : [],
        });
        toast.success("Changes analyzed");
        return;
      }

      setChangesStatus({
        kind: "error",
        message: "Unexpected response from the server. Please try again.",
      });
    } catch (error) {
      console.error("Check repo changes error:", error);
      if (mountedRef.current)
        setChangesStatus({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to check for changes",
        });
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  const jobActive = job?.status === "queued" || job?.status === "processing";
  const jobFailed = job?.status === "failed";
  const jobCompleted = job?.status === "completed";
  const hasBaseline = Boolean(project.indexedCommitSha);

  const noBaselineReason: NoBaselineReason = jobFailed
    ? "failed"
    : jobCompleted
      ? "orphaned"
      : "pre_tracking";

  let view: View;
  if (jobActive) {
    view = { kind: "indexing" };
  } else if (isLoading) {
    view = { kind: "checking" };
  } else if (analysis && changesMeta) {
    view = { kind: "has_changes" };
  } else if (changesStatus?.kind === "no_changes") {
    view = { kind: "no_changes" };
  } else if (changesStatus?.kind === "error") {
    view = { kind: "error", message: changesStatus.message };
  } else if (changesStatus?.kind === "no_baseline") {
    view = { kind: "no_baseline", reason: noBaselineReason };
  } else if (!hasBaseline) {
    view = statusLoaded
      ? { kind: "no_baseline", reason: noBaselineReason }
      : { kind: "loading" };
  } else {
    view = { kind: "ready" };
  }

  const jobStatus = job?.status ?? "queued";
  const indexingPill = jobStatus === "processing" ? "Indexing" : "Queued";
  const reindexPct = Math.max(0, Math.min(100, job?.progress ?? 0));
  const showBar = jobStatus === "processing" || reindexPct > 0;
  const startedThisSession = reindexStartedAt !== null;
  const elapsedMs = startedThisSession ? nowMs - reindexStartedAt : 0;
  const indexingTimerText = startedThisSession
    ? `${formatElapsed(elapsedMs)} elapsed`
    : `updated ${relativeTime(job?.updatedAt)}`;

  const checkLabel =
    view.kind === "has_changes" ||
      view.kind === "no_changes" ||
      view.kind === "error"
      ? "Check again"
      : "Check for changes";

  const checkButton = (
    <button
      type="button"
      onClick={handleCheckChanges}
      disabled={isLoading}
      className="w-full px-6 py-3 bg-white text-black font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#eee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#000" }} />
          Checking…
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" style={{ color: "#000" }} />
          {checkLabel}
        </>
      )}
    </button>
  );

  const baselineReadyLine = hasBaseline ? (
    <div className="px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg">
      <div className="flex items-center gap-2 text-sm text-white">
        <CheckCircle2
          className="w-4 h-4 shrink-0"
          style={{ color: colors.green }}
        />
        <span className="font-medium">
          Tracking changes since {formatFriendlyDate(project.indexedAt)}
        </span>
      </div>
      <div className="mt-1 pl-6 text-xs font-mono text-[#666] flex items-center gap-1.5 flex-wrap">
        <span>{relativeTime(project.indexedAt)}</span>
        <span className="text-[#444]">·</span>
        <span>{shortSha(project.indexedCommitSha)}</span>
        {project.indexedBranch && (
          <>
            <span className="text-[#444]">·</span>
            <span>{project.indexedBranch}</span>
          </>
        )}
      </div>
      {jobFailed && (
        <p className="mt-2 pl-6 text-xs text-[#888]">
          The last re-index didn&apos;t finish.{" "}
          <button
            type="button"
            onClick={handleReindex}
            disabled={reindexBusy}
            className="underline underline-offset-2 text-[#aaa] hover:text-white disabled:opacity-50"
          >
            {reindexBusy ? "Starting…" : "Try again"}
          </button>
        </p>
      )}
    </div>
  ) : null;

  const indexingPanel = (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#252525] border border-[#333] flex items-center justify-center shrink-0">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: colors.green }}
          />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">
            RepoDoc is still reading this repository…
          </h3>
          <p className="text-[#888] text-xs mt-1 leading-relaxed">
            We&apos;ll be able to track changes the moment this finishes.
          </p>
        </div>
      </div>

      <div className="p-4 bg-[#0a0a0a] border border-[#333] rounded-lg space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono"
            style={{
              color: colors.green,
              backgroundColor: "rgba(80, 250, 123, 0.1)",
              border: "1px solid rgba(80, 250, 123, 0.3)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: colors.green }}
            />
            {indexingPill}
          </span>
          <span className="text-xs font-mono text-[#888]">
            {indexingTimerText}
          </span>
        </div>

        {showBar ? (
          <div>
            <div className="h-2 w-full bg-[#222] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${reindexPct}%`, backgroundColor: colors.green }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-[#666]">
              <span>
                {job && job.filesTotal > 0
                  ? `${job.filesProcessed} / ${job.filesTotal} files`
                  : `${job?.filesProcessed ?? 0} files processed`}
              </span>
              <span>{reindexPct}%</span>
            </div>
          </div>
        ) : (
          <p className="text-xs font-mono text-[#666]">
            Waiting for an indexing worker to pick up the job…
          </p>
        )}
      </div>

      <div>
        <button
          type="button"
          disabled
          className="w-full px-6 py-3 bg-white text-black font-medium rounded-lg flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
        >
          <RefreshCw className="w-4 h-4" style={{ color: "#000" }} />
          Check for changes
        </button>
        <p className="text-[#666] text-xs mt-2 text-center">
          Available once indexing finishes.
        </p>
      </div>
    </div>
  );

  const noBaselinePanelReason: NoBaselineReason =
    view.kind === "no_baseline" ? view.reason : "pre_tracking";
  const primaryIsReindex =
    noBaselinePanelReason === "failed" ||
    noBaselinePanelReason === "orphaned";

  const startTrackingPrimary = (
    <button
      type="button"
      onClick={handleSetBaseline}
      disabled={baselineBusy || reindexBusy}
      className="w-full sm:w-auto px-6 py-3 bg-white text-black font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#eee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {baselineBusy ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#000" }} />
          Starting…
        </>
      ) : (
        <>
          <GitCommit className="w-4 h-4" style={{ color: "#000" }} />
          Start tracking changes
        </>
      )}
    </button>
  );

  const reindexPrimary = (
    <button
      type="button"
      onClick={handleReindex}
      disabled={baselineBusy || reindexBusy}
      className="w-full sm:w-auto px-6 py-3 bg-white text-black font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#eee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {reindexBusy ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#000" }} />
          Starting…
        </>
      ) : (
        <>
          <RotateCw className="w-4 h-4" style={{ color: "#000" }} />
          Re-index now
        </>
      )}
    </button>
  );

  const reindexSecondary = (
    <button
      type="button"
      onClick={handleReindex}
      disabled={baselineBusy || reindexBusy}
      className="text-sm text-[#888] hover:text-white underline underline-offset-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {reindexBusy ? "Starting re-index…" : "Re-index instead"}
    </button>
  );

  const setBaselineSecondary = (
    <button
      type="button"
      onClick={handleSetBaseline}
      disabled={baselineBusy || reindexBusy}
      className="text-sm text-[#888] hover:text-white underline underline-offset-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {baselineBusy ? "Setting baseline…" : "Set a baseline anyway"}
    </button>
  );

  const noBaselinePanel = (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#252525] border border-[#333] flex items-center justify-center shrink-0">
          <Info className="w-5 h-5" style={{ color: colors.yellow }} />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">
            {noBaselinePanelReason === "failed"
              ? "RepoDoc couldn't finish reading this repository."
              : noBaselinePanelReason === "orphaned"
                ? "RepoDoc read this repo, but didn't save a starting point."
                : "There's no starting point to compare against yet."}
          </h3>
          <p className="text-[#888] text-xs mt-1 leading-relaxed">
            {noBaselinePanelReason === "failed"
              ? "Because the last read didn't complete, there's nothing reliable to compare against. Re-indexing reads the repo again and sets a clean starting point."
              : noBaselinePanelReason === "orphaned"
                ? "Indexing finished, but the starting point to compare against wasn't recorded. Re-indexing reads the repo again and captures one cleanly."
                : "This repo was added before change-tracking existed. Pick today's code as the starting point, and we'll track everything that changes from here."}
          </p>
        </div>
      </div>

      {noBaselinePanelReason === "failed" && job?.error && (
        <div
          className="flex items-start gap-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: "rgba(255, 85, 85, 0.08)",
            border: "1px solid rgba(255, 85, 85, 0.3)",
          }}
        >
          <AlertCircle
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: colors.red }}
          />
          <span className="text-xs" style={{ color: "#ffb3b3" }}>
            {job.error}
          </span>
        </div>
      )}

      <p className="text-[#666] text-xs leading-relaxed">
        {primaryIsReindex
          ? "Re-index now - reads the whole repo again and captures a clean starting point. Takes a few minutes."
          : "Start tracking changes - uses today's code as the baseline. We compare future changes against it, starting immediately."}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {primaryIsReindex ? reindexPrimary : startTrackingPrimary}
        <span className="hidden sm:inline text-[#555] text-xs">or</span>
        {primaryIsReindex ? setBaselineSecondary : reindexSecondary}
      </div>

      <p className="text-[#555] text-xs leading-relaxed">
        {primaryIsReindex
          ? "Set a baseline anyway - starts tracking from today's code without re-reading. Faster, but the analysis may be thin until you re-index."
          : "Re-index instead - slower, but rebuilds RepoDoc's understanding from scratch for the cleanest baseline."}
      </p>

      {actionError && (
        <div
          className="flex items-start gap-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: "rgba(255, 85, 85, 0.08)",
            border: "1px solid rgba(255, 85, 85, 0.3)",
          }}
        >
          <AlertCircle
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: colors.red }}
          />
          <span className="text-xs" style={{ color: "#ffb3b3" }}>
            {actionError}
          </span>
        </div>
      )}
    </div>
  );

  const controlBody = (
    <div className="space-y-5">
      {baselineReadyLine}
      {checkButton}
      {view.kind === "checking" && (
        <div className="space-y-3 pt-1" aria-hidden>
          <div className="h-3 w-1/3 bg-[#222] rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-[#1d1d1d] rounded animate-pulse" />
          <div className="h-24 w-full bg-[#161616] rounded-lg animate-pulse" />
        </div>
      )}
    </div>
  );

  const loadingPanel = (
    <div className="flex items-center gap-3 px-4 py-6 text-[#888]">
      <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.green }} />
      <span className="text-sm">Checking this repository&apos;s status…</span>
    </div>
  );

  let bodyContent: React.ReactNode;
  if (view.kind === "loading") {
    bodyContent = loadingPanel;
  } else if (view.kind === "indexing") {
    bodyContent = indexingPanel;
  } else if (view.kind === "no_baseline") {
    bodyContent = noBaselinePanel;
  } else {
    bodyContent = controlBody;
  }

  return (
    <>
      <motion.div
        className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border-b border-[#333]">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-[#666] text-sm font-mono">
            repo-changes
          </span>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#252525] border border-[#333] flex items-center justify-center">
              <History className="w-5 h-5" style={{ color: colors.green }} />
            </div>
            <div>
              <h2 className="text-white font-semibold">Changes since indexed</h2>
              <p className="text-[#666] text-xs">
                See what&apos;s changed in your repo since RepoDoc last read it.
              </p>
            </div>
          </div>

          {bodyContent}
        </div>
      </motion.div>

      {view.kind === "has_changes" && changesMeta && analysis && (
        <motion.div
          className="mt-8 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DriftHeader meta={changesMeta} indexedAt={project.indexedAt} />
          {changesMeta.files.length > 0 && (
            <ChangedFiles
              files={changesMeta.files}
              truncated={changesMeta.truncated}
            />
          )}
          <AnalysisResult analysis={analysis} />
        </motion.div>
      )}

      {view.kind === "no_changes" && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3 p-5 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <CheckCircle2
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: colors.green }}
            />
            <div>
              <p className="text-white text-sm font-medium">
                This repo hasn&apos;t changed since RepoDoc last read it.
              </p>
              <p className="text-[#666] text-xs mt-1">
                Everything&apos;s up to date - nothing has drifted.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {view.kind === "error" && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="flex items-start gap-3 p-5 rounded-lg"
            style={{
              backgroundColor: "rgba(255, 85, 85, 0.08)",
              border: "1px solid rgba(255, 85, 85, 0.3)",
            }}
          >
            <AlertCircle
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: colors.red }}
            />
            <div>
              <p className="text-white text-sm font-medium">
                Couldn&apos;t check for changes
              </p>
              <p className="text-[#aaa] text-xs mt-1 leading-relaxed">
                {view.message}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default function DriftPage() {
  const { projects, selectedProjectId } = useProjectsContext();
  const currentProject = projects.find((p) => p.id === selectedProjectId);

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
            <GitCompare className="w-8 h-8" style={{ color: colors.purple }} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 text-center">
            No Project Selected
          </h2>
          <p className="text-[#888] text-sm text-center max-w-md">
            Select a project from the sidebar to check how far it has drifted
            since it was indexed.
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
            Drift
          </span>
          <h1 className="text-4xl font-bold text-white mb-3">
            Changes Since Indexed
          </h1>
          <p className="text-[#888] text-sm max-w-md">
            See what&apos;s changed in your repository since RepoDoc last read
            it - and which parts of its understanding may now be out of date.
          </p>
        </motion.div>

        <DriftChecker key={currentProject.id} project={currentProject} />
      </div>
    </div>
  );
}
