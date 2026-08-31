"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  PauseCircle,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import {
  getIndexingStatus,
  retryIndexingJob,
  wakeIndexingWorkerForProject,
} from "@/lib/actions-indexing";
import { friendlyError, rawErrorDetail } from "@/lib/friendly-error";
import { LoadingButton } from "@/components/LoadingButton";
import { UpgradePanel } from "@/components/UpgradePanel";

const SEGMENTS = 60;
const POLL_MS = 2000;
const IDLE_POLL_MS = 30_000;

const GREEN = "#50fa7b";
const AMBER = "#ffb86c";
const RED = "#ff5555";
const IDLE = "#242424";

type JobStatus =
  | "not_started"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "locked"
  | "unavailable";

interface Status {
  status: JobStatus;
  progress: number;
  error: string | null;
  filesProcessed: number;
  filesTotal: number;
  phase: string | null;
  attempts: number;
  nextAttemptAt: Date | string | null;
  lockedAt: Date | string | null;
  updatedAt: Date | string | null;
}

const LEASE_MS = 5 * 60 * 1000;

function agoLabel(at: Date | string | null): string | null {
  if (!at) return null;
  const ms = Date.now() - new Date(at).getTime();
  if (ms < 60_000) return null;
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs === 1 ? "" : "s"}`;
}

function retryEta(at: Date | string | null): string {
  if (!at) return "shortly";
  const ms = new Date(at).getTime() - Date.now();
  if (ms <= 0) return "shortly";
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.ceil(mins / 60);
  return `in ${hrs} hour${hrs === 1 ? "" : "s"}`;
}

function segmentColor(
  index: number,
  filled: number,
  status: JobStatus,
): string {
  if (status === "failed") return index < filled ? RED : IDLE;
  if (status === "completed") return GREEN;
  if (index < filled - 1) return GREEN;

  if (index < filled) return AMBER;
  return IDLE;
}

export function IndexingMeter({ projectId }: { projectId: string }) {
  const [state, setState] = useState<Status | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [tick, setTick] = useState(0);

  const [peak, setPeak] = useState(0);

  const onRetry = async () => {
    setRetrying(true);
    try {
      await retryIndexingJob(projectId);
      toast.success("Indexing restarted");
      setState(null);
      setPeak(0);
      setTick((t) => t + 1);
    } catch (e) {
      toast.error("Couldn't restart indexing", {
        description: friendlyError(e),
      });
    } finally {
      setRetrying(false);
    }
  };
  const onResume = async () => {
    setResuming(true);
    try {
      await wakeIndexingWorkerForProject(projectId);
      toast.success("Worker woken", {
        description: "Indexing continues from where it stopped.",
      });
      setTick((t) => t + 1);
    } catch (e) {
      toast.error("Couldn't wake the worker", {
        description: friendlyError(e),
      });
    } finally {
      setResuming(false);
    }
  };

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const s = (await getIndexingStatus(projectId)) as Status;
        if (!alive) return;
        setState(s);
        const seen =
          s.filesTotal > 0
            ? Math.round((s.filesProcessed / s.filesTotal) * 100)
            : (s.progress ?? 0);
        setPeak((prev) => (seen > prev ? seen : prev));
        if (s.status === "queued" || s.status === "processing") {
          const waitingOnBackoff =
            s.status === "queued" &&
            s.nextAttemptAt != null &&
            new Date(s.nextAttemptAt).getTime() - Date.now() > POLL_MS * 2;
          timer = setTimeout(tick, waitingOnBackoff ? IDLE_POLL_MS : POLL_MS);
        }
      } catch {}
    };
    void tick();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [projectId, tick]);

  if (
    !state ||
    state.status === "not_started" ||
    state.status === "unavailable"
  )
    return null;

  if (state.status === "locked") {
    return <UpgradePanel feature="indexing" className="mb-8" />;
  }

  const done = state.status === "completed";
  const failed = state.status === "failed";
  const queued = state.status === "queued";
  const derived =
    state.filesTotal > 0
      ? Math.round((state.filesProcessed / state.filesTotal) * 100)
      : (state.progress ?? 0);

  const pct = done ? 100 : Math.max(0, Math.min(100, Math.max(derived, peak)));
  const filled = done ? SEGMENTS : Math.round((pct / 100) * SEGMENTS);
  const autoRetrying = queued && (state.attempts ?? 0) > 0;

  const leaseAlive =
    state.lockedAt != null &&
    Date.now() - new Date(state.lockedAt).getTime() < LEASE_MS;
  const working = state.status === "processing" && leaseAlive;
  const stalledLease = state.status === "processing" && !leaseAlive;
  const parked = queued && !autoRetrying;
  const idleFor = agoLabel(state.updatedAt);

  const headline = done
    ? "Indexing complete"
    : failed
      ? "Indexing failed"
      : autoRetrying
        ? `Paused - retrying ${retryEta(state.nextAttemptAt)}`
        : working
          ? `Indexing ${pct}%`
          : stalledLease
            ? `Interrupted at ${pct}%`
            : `Paused at ${pct}%`;

  const reason = failed
    ? friendlyError(state.error)
    : state.error
      ? `Last run stopped: ${friendlyError(state.error)}`
      : stalledLease
        ? "The worker stopped partway through a batch. Another one takes over automatically once the five-minute lease expires."
        : parked
          ? "Indexing runs in short slices so it survives serverless time limits. This one finished a slice and is waiting for the next to start."
          : null;

  const accent = done ? GREEN : failed ? RED : AMBER;

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 mb-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          {done ? (
            <CheckCircle2 className="w-4 h-4" style={{ color: GREEN }} />
          ) : failed ? (
            <AlertCircle className="w-4 h-4" style={{ color: RED }} />
          ) : working ? (
            <Loader2
              className="w-4 h-4 animate-spin"
              style={{ color: AMBER }}
            />
          ) : (
            <PauseCircle className="w-4 h-4" style={{ color: AMBER }} />
          )}
          <span className="text-[13px] font-medium" style={{ color: accent }}>
            {headline}
          </span>
        </div>

        {!done && !failed && state.filesTotal > 0 && (
          <span className="text-[#666] text-xs font-mono">
            {state.filesProcessed} / {state.filesTotal} files
          </span>
        )}
        {done && state.filesProcessed > 0 && (
          <span className="text-[#666] text-xs font-mono">
            {state.filesProcessed} files indexed
          </span>
        )}
      </div>

      <div
        className="flex items-end gap-[2px] h-9"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={headline}
      >
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const color = segmentColor(i, filled, state.status);
          const isEdge = !done && !failed && i === filled - 1;
          return (
            <span
              key={i}
              className={`flex-1 rounded-[1px] transition-colors duration-300 ${
                isEdge ? "animate-pulse" : ""
              }`}
              style={{
                backgroundColor: color,
                height: "100%",
                opacity: color === IDLE ? 1 : 0.9,
              }}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 text-[11px] font-mono text-[#555]">
        <span>{queued ? "waiting for worker" : "started"}</span>
        <span style={{ color: done ? GREEN : undefined }}>
          {done
            ? "100% indexed"
            : failed
              ? "stopped"
              : state.phase
                ? `${state.phase} pass`
                : `${pct}%`}
        </span>
        <span>{done ? "ready to query" : "complete"}</span>
      </div>

      {(failed || autoRetrying || reason) && (
        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
          <p className="text-[13px] text-[#aaa] leading-relaxed">
            {reason}
            {idleFor && !done && (
              <span className="text-[#666]"> No progress for {idleFor}.</span>
            )}
            {autoRetrying && (
              <span className="text-[#666]">
                {" "}
                Indexing will continue on its own from where it stopped (attempt{" "}
                {state.attempts + 1} of 5) - nothing already indexed is
                repeated.
              </span>
            )}
          </p>

          <div className="mt-3 flex items-center gap-3">
            {(parked || stalledLease) && !failed && (
              <LoadingButton
                onClick={onResume}
                loading={resuming}
                className="group px-3 py-1.5 bg-[#252525] text-white text-[13px] font-medium rounded-md hover:bg-[#303030] transition-colors border border-[#3a3a3a] hover:border-[#4a4a4a] disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                Resume now
              </LoadingButton>
            )}
            <LoadingButton
              onClick={onRetry}
              loading={retrying}
              className="group px-3 py-1.5 bg-[#252525] text-white text-[13px] font-medium rounded-md hover:bg-[#303030] transition-colors border border-[#3a3a3a] hover:border-[#4a4a4a] disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              {autoRetrying ? "Retry now" : "Retry indexing"}
            </LoadingButton>

            {rawErrorDetail(state.error) && (
              <button
                type="button"
                onClick={() => setShowDetail((v) => !v)}
                className="text-[11px] font-mono text-[#555] hover:text-[#888] transition-colors"
              >
                {showDetail ? "hide details" : "technical details"}
              </button>
            )}
          </div>

          {showDetail && rawErrorDetail(state.error) && (
            <pre className="mt-3 p-3 rounded-md bg-[#0d0d0d] border border-[#2a2a2a] text-[11px] font-mono text-[#666] whitespace-pre-wrap break-words max-h-40 overflow-auto">
              {rawErrorDetail(state.error)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
