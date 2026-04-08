"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

const POLL_MS = 4000;
const DEFAULT_IDLE_MS = 2 * 60 * 1000;
export type BackgroundJobSnapshot = {
  id: string;
  status: "running" | "completed" | "failed";
  kind: string;
  error: string | null;
  completedAt: Date | string | null;
  projectId: string;
  createdAt: Date | string;
} | null;

function jobStorageKey(storageKey: string, projectId: string) {
  return `repodoc:bg-job:${storageKey}:${projectId}`;
}

function noticeStorageKey(storageKey: string, projectId: string) {
  return `repodoc:bg-notice:${storageKey}:${projectId}`;
}

export type BackgroundRegenKind = "readme_regen" | "docs_regen";

type ToastCopy = { title: string; description: string };

export function useBackgroundRegenJob(opts: {
  projectId: string | null;
  storageKey: string;
  idleMs?: number;
  enqueue: (
    projectId: string
  ) => Promise<{ jobId: string; continuing: boolean }>;
  getJob: (jobId: string) => Promise<BackgroundJobSnapshot>;
  onSync: () => void | Promise<void>;
  setBusy: (busy: boolean) => void;
  onUpgradeRequired?: () => void;
  toastSuccessActive: ToastCopy;
  toastSuccessAway: ToastCopy;
  toastFailed: (message: string) => ToastCopy;
}) {
  const {
    projectId,
    storageKey,
    idleMs = DEFAULT_IDLE_MS,
    enqueue,
    getJob,
    onSync,
    setBusy,
    onUpgradeRequired,
    toastSuccessActive,
    toastSuccessAway,
    toastFailed,
  } = opts;

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackedJobIdRef = useRef<string | null>(null);
  const activelyWaitingRef = useRef(false);
  const resumedRef = useRef(false);
  const lastInteractionRef = useRef(Date.now());
  const mountedRef = useRef(true);

  const optsRef = useRef({
    onSync,
    setBusy,
    toastSuccessActive,
    toastSuccessAway,
    toastFailed,
    storageKey,
    idleMs,
  });
  optsRef.current = {
    onSync,
    setBusy,
    toastSuccessActive,
    toastSuccessAway,
    toastFailed,
    storageKey,
    idleMs,
  };

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleTerminal = useCallback(
    async (
      status: "completed" | "failed",
      errorMsg: string | null,
      pid: string
    ) => {
      clearPoll();
      trackedJobIdRef.current = null;
      try {
        sessionStorage.removeItem(jobStorageKey(optsRef.current.storageKey, pid));
      } catch {
       
      }

      const {
        onSync: sync,
        setBusy: busy,
        toastSuccessActive: tActive,
        toastSuccessAway: tAway,
        toastFailed: tFail,
        storageKey: sk,
        idleMs: idle,
      } = optsRef.current;

      const visible =
        typeof document !== "undefined" &&
        document.visibilityState === "visible";
      const idleExceeded = Date.now() - lastInteractionRef.current > idle;
      const userPresentForInline =
        visible &&
        (activelyWaitingRef.current || !idleExceeded);
      const useAwayCopy = resumedRef.current || !userPresentForInline;

      if (status === "completed") {
        if (useAwayCopy) {
          if (visible && mountedRef.current) {
            toast.info(tAway.title, { description: tAway.description });
            await Promise.resolve(sync());
          } else {
            try {
              sessionStorage.setItem(
                noticeStorageKey(sk, pid),
                JSON.stringify({ status: "completed", at: Date.now() })
              );
            } catch {
              
            }
          }
        } else if (mountedRef.current) {
          toast.success(tActive.title, { description: tActive.description });
          await Promise.resolve(sync());
        }
      } else {
        const { title, description } = tFail(errorMsg || "Something went wrong");
        if (useAwayCopy && !visible) {
          try {
            sessionStorage.setItem(
              noticeStorageKey(sk, pid),
              JSON.stringify({
                status: "failed",
                message: errorMsg,
                at: Date.now(),
              })
            );
          } catch {
            
          }
        } else if (mountedRef.current) {
          toast.error(title, { description });
        }
        await Promise.resolve(sync());
      }

      activelyWaitingRef.current = false;
      resumedRef.current = false;
      if (mountedRef.current) busy(false);
    },
    [clearPoll]
  );

  const pollOnce = useCallback(
    async (jobId: string, pid: string) => {
      try {
        const row = await getJob(jobId);
        if (!row) {
          clearPoll();
          activelyWaitingRef.current = false;
          resumedRef.current = false;
          if (mountedRef.current) optsRef.current.setBusy(false);
          return;
        }
        if (row.status === "running") return;
        await handleTerminal(row.status, row.error, pid);
      } catch (e) {
        console.error("[BackgroundRegenJob] poll failed:", e);
      }
    },
    [getJob, handleTerminal, clearPoll]
  );

  const startPolling = useCallback(
    (jobId: string, pid: string) => {
      clearPoll();
      void pollOnce(jobId, pid);
      pollRef.current = setInterval(() => {
        void pollOnce(jobId, pid);
      }, POLL_MS);
    },
    [clearPoll, pollOnce]
  );

  const flushDeferredNotice = useCallback(async () => {
    if (!projectId || typeof window === "undefined") return;
    const sk = optsRef.current.storageKey;
    try {
      const raw = sessionStorage.getItem(noticeStorageKey(sk, projectId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        status: string;
        message?: string;
      };
      sessionStorage.removeItem(noticeStorageKey(sk, projectId));
      const { toastSuccessAway: tAway, toastFailed: tFail, onSync: sync } =
        optsRef.current;
      if (parsed.status === "completed") {
        toast.info(tAway.title, { description: tAway.description });
      } else if (parsed.status === "failed") {
        const { title, description } = tFail(parsed.message || "Failed");
        toast.error(title, { description });
      }
      await Promise.resolve(sync());
    } catch {
      
    }
  }, [projectId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const bump = () => {
      lastInteractionRef.current = Date.now();
    };
    const o = { passive: true } as AddEventListenerOptions;
    window.addEventListener("pointerdown", bump, o);
    window.addEventListener("keydown", bump, o);
    return () => {
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("keydown", bump);
    };
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void flushDeferredNotice();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [flushDeferredNotice]);

  useEffect(() => {
    void flushDeferredNotice();
  }, [projectId, flushDeferredNotice]);

  useEffect(() => {
    if (!projectId) {
      clearPoll();
      trackedJobIdRef.current = null;
      activelyWaitingRef.current = false;
      resumedRef.current = false;
      return;
    }

    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(
        jobStorageKey(optsRef.current.storageKey, projectId)
      );
    } catch {
      stored = null;
    }
    if (!stored) return;

    resumedRef.current = true;
    activelyWaitingRef.current = false;
    trackedJobIdRef.current = stored;
    optsRef.current.setBusy(true);
    startPolling(stored, projectId);

    return () => {
      clearPoll();
    };
  }, [projectId, startPolling, clearPoll]);

  const start = useCallback(async () => {
    if (!projectId) return;
    const sk = optsRef.current.storageKey;
    optsRef.current.setBusy(true);
    activelyWaitingRef.current = true;
    resumedRef.current = false;
    lastInteractionRef.current = Date.now();

    try {
      const { jobId } = await enqueue(projectId);
      trackedJobIdRef.current = jobId;
      try {
        sessionStorage.setItem(jobStorageKey(sk, projectId), jobId);
      } catch {
        
      }
      startPolling(jobId, projectId);
    } catch (err) {
      activelyWaitingRef.current = false;
      resumedRef.current = false;
      optsRef.current.setBusy(false);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start";

      if (errorMessage.includes("UPGRADE_REQUIRED")) {
        onUpgradeRequired?.();
        toast.error("Upgrade required", {
          description:
            "Upgrade to Professional for 10 projects or Enterprise for unlimited.",
        });
      } else {
        toast.error("Request failed", { description: errorMessage });
      }
    }
  }, [projectId, enqueue, startPolling, onUpgradeRequired]);

  return { start };
}
