jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    indexingJob: {
      findMany: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn(),
    },
  },
}));
jest.mock("@/lib/github", () => ({ indexGithubRepository: jest.fn() }));
jest.mock("@/lib/secret-crypto", () => ({
  decryptSecret: (v: string | null) => v,
}));
jest.mock("@/lib/baseline-mirror", () => ({
  mirrorBaselineIfPending: jest.fn().mockResolvedValue("abc1234"),
}));
jest.mock("@/lib/indexing-worker-kick", () => ({
  kickIndexingWorker: jest.fn().mockResolvedValue(undefined),
}));

import prisma from "@/lib/prisma";
import { indexGithubRepository } from "@/lib/github";
import { mirrorBaselineIfPending } from "@/lib/baseline-mirror";
import { kickIndexingWorker } from "@/lib/indexing-worker-kick";
import { runIndexingWorkerOnce } from "@/lib/indexing-worker-run";

const findMany = prisma.indexingJob.findMany as jest.Mock;
const update = prisma.indexingJob.update as jest.Mock;
const updateMany = prisma.indexingJob.updateMany as jest.Mock;
const indexRepo = indexGithubRepository as jest.Mock;

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    projectId: "proj-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01T10:00:00Z"),
    attempts: 0,
    phase: "fast",
    project: {
      repoUrl: "https://github.com/acme/ledger",
      githubToken: null,
      name: "ledger",
      user: { plan: "professional" },
    },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  update.mockResolvedValue({});
});

describe("runIndexingWorkerOnce", () => {
  it("reports idle when no eligible jobs exist", async () => {
    findMany.mockResolvedValue([]);
    const res = await runIndexingWorkerOnce();
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("idle");
  });

  it("skips free-plan jobs (indexing is a paid feature)", async () => {
    findMany.mockResolvedValue([
      makeJob({ project: { ...makeJob().project, user: { plan: "starter" } } }),
    ]);
    const res = await runIndexingWorkerOnce();
    expect(res.body.status).toBe("idle");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("yields when another worker wins the lease", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany.mockResolvedValue({ count: 0 });
    const res = await runIndexingWorkerOnce();
    expect(res.body.status).toBe("contended");
    expect(indexRepo).not.toHaveBeenCalled();
  });

  it("round-robins: picks the least-recently-worked job first", async () => {
    findMany.mockResolvedValue([
      makeJob({ id: "job-fresh", updatedAt: new Date("2026-01-01T12:00:00Z") }),
      makeJob({ id: "job-stale", updatedAt: new Date("2026-01-01T09:00:00Z") }),
    ]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockResolvedValue({
      success: true,
      needsResume: false,
      resumeAfter: null,
      filesProcessed: 1,
      successCount: 1,
      failCount: 0,
      phase: "full",
    });

    await runIndexingWorkerOnce();

    expect(updateMany.mock.calls[0][0].where.id).toBe("job-stale");
  });

  it("backs off instead of tight-looping when a pass makes zero progress", async () => {
    findMany.mockResolvedValue([makeJob({ attempts: 1 })]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockResolvedValue({
      success: true,
      needsResume: true,
      resumeAfter: null,
      filesProcessed: 0,
      successCount: 0,
      failCount: 0,
      phase: "fast",
    });

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("stalled");
    const data = update.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("queued");
    expect(data.attempts).toBe(2);
    expect(data.nextAttemptAt).toBeInstanceOf(Date);
    expect(kickIndexingWorker).not.toHaveBeenCalled();
  });

  it("fails a job permanently after repeated zero-progress passes", async () => {
    findMany.mockResolvedValue([makeJob({ attempts: 4 })]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockResolvedValue({
      success: true,
      needsResume: true,
      resumeAfter: null,
      filesProcessed: 0,
      successCount: 0,
      failCount: 0,
      phase: "fast",
    });

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("error");
    const data = update.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("failed");
    expect(data.attempts).toBe(5);
  });

  it("requeues with the resume cursor and resets attempts on a time-boxed pass", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockResolvedValue({
      success: true,
      needsResume: true,
      resumeAfter: "src/lib/visuals.ts",
      filesProcessed: 40,
      successCount: 40,
      failCount: 0,
      phase: "fast",
    });

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("paused");
    expect(res.body.resumeAfter).toBe("src/lib/visuals.ts");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job-1" },
        data: expect.objectContaining({
          status: "queued",
          resumeAfter: "src/lib/visuals.ts",
          attempts: 0,
          lockedAt: null,
          lockedBy: null,
        }),
      }),
    );
    expect(kickIndexingWorker).toHaveBeenCalled();
  });

  it("requeues instead of completing when files failed to index", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockResolvedValue({
      success: true,
      needsResume: false,
      resumeAfter: null,
      filesProcessed: 110,
      successCount: 107,
      failCount: 3,
      phase: "full",
    });

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("requeued_incomplete");
    const data = update.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("queued");
    expect(data.attempts).toBe(1);
    expect(data.nextAttemptAt).toBeInstanceOf(Date);
    expect(mirrorBaselineIfPending).not.toHaveBeenCalled();
  });

  it("completes with a recorded gap after failures persist past the attempt cap", async () => {
    findMany.mockResolvedValue([makeJob({ attempts: 4 })]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockResolvedValue({
      success: true,
      needsResume: false,
      resumeAfter: null,
      filesProcessed: 110,
      successCount: 108,
      failCount: 2,
      phase: "full",
    });

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("success");
    const data = update.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("completed");
    expect(data.error).toContain("could not be indexed");
    expect(mirrorBaselineIfPending).toHaveBeenCalledWith("proj-1");
  });

  it("completes the job and mirrors the baseline on success", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockResolvedValue({
      success: true,
      needsResume: false,
      resumeAfter: null,
      filesProcessed: 120,
      successCount: 120,
      failCount: 0,
      phase: "full",
    });

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("success");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job-1" },
        data: expect.objectContaining({
          status: "completed",
          progress: 100,
          phase: "full",
          resumeAfter: null,
        }),
      }),
    );
    expect(mirrorBaselineIfPending).toHaveBeenCalledWith("proj-1");
  });

  it("schedules a backoff retry when the pass throws", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockRejectedValue(new Error("GitHub 403"));

    const res = await runIndexingWorkerOnce();

    expect(res.status).toBe(500);
    expect(res.body.status).toBe("retrying");
    const data = update.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("queued");
    expect(data.attempts).toBe(1);
    expect(data.nextAttemptAt).toBeInstanceOf(Date);
    expect(data.nextAttemptAt.getTime()).toBeGreaterThan(Date.now() + 50_000);
  });

  it("fails permanently after the attempt cap", async () => {
    findMany.mockResolvedValue([makeJob({ attempts: 4 })]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockRejectedValue(new Error("still broken"));

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("error");
    const data = update.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("failed");
    expect(data.attempts).toBe(5);
    expect(data.nextAttemptAt).toBeNull();
  });
});
