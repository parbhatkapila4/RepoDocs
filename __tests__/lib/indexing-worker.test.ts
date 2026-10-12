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
jest.mock("@/lib/github-octokit", () => ({ createGitHubOctokit: jest.fn() }));

import prisma from "@/lib/prisma";
import { indexGithubRepository } from "@/lib/github";
import { mirrorBaselineIfPending } from "@/lib/baseline-mirror";
import { kickIndexingWorker } from "@/lib/indexing-worker-kick";
import { runIndexingWorkerOnce } from "@/lib/indexing-worker-run";
import { PAID_PLAN_VALUES } from "@/lib/plan";
import {
  REPO_TOKEN_REQUIRED_MESSAGE,
  RepoTokenRequiredError,
} from "@/lib/github/repo-access";

const findMany = prisma.indexingJob.findMany as jest.Mock;
const update = prisma.indexingJob.update as jest.Mock;
const updateMany = prisma.indexingJob.updateMany as jest.Mock;
const indexRepo = indexGithubRepository as jest.Mock;

const FENCED_WHERE = {
  id: "job-1",
  status: "processing",
  lockedBy: expect.any(String),
};

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
    },
    ...overrides,
  };
}

function completedPass(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    needsResume: false,
    resumeAfter: null,
    filesProcessed: 120,
    successCount: 120,
    failCount: 0,
    phase: "full",
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

  it("filters out free-plan and deleted-project jobs in the query, before the 40-job window", async () => {
    findMany.mockResolvedValue([]);

    await runIndexingWorkerOnce();

    const args = findMany.mock.calls[0][0];
    expect(args.take).toBe(40);
    expect(args.where.project).toEqual({
      deletedAt: null,
      user: {
        OR: PAID_PLAN_VALUES.map((plan) => ({
          plan: { equals: plan, mode: "insensitive" },
        })),
      },
    });
    expect(args.include.project.select).not.toHaveProperty("user");
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
    indexRepo.mockResolvedValue(completedPass({ filesProcessed: 1, successCount: 1 }));

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
    const data = updateMany.mock.calls.at(-1)?.[0]?.data;
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
    const data = updateMany.mock.calls.at(-1)?.[0]?.data;
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
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: FENCED_WHERE,
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
    indexRepo.mockResolvedValue(
      completedPass({ filesProcessed: 110, successCount: 107, failCount: 3 }),
    );

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("requeued_incomplete");
    const data = updateMany.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("queued");
    expect(data.attempts).toBe(1);
    expect(data.nextAttemptAt).toBeInstanceOf(Date);
    expect(mirrorBaselineIfPending).not.toHaveBeenCalled();
  });

  it("completes with a recorded gap after failures persist past the attempt cap", async () => {
    findMany.mockResolvedValue([makeJob({ attempts: 4 })]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockResolvedValue(
      completedPass({ filesProcessed: 110, successCount: 108, failCount: 2 }),
    );

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("success");
    const data = updateMany.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("completed");
    expect(data.error).toContain("could not be indexed");
    expect(mirrorBaselineIfPending).toHaveBeenCalledWith("proj-1");
  });

  it("completes the job and mirrors the baseline on success", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockResolvedValue(completedPass());

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("success");
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: FENCED_WHERE,
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
    const data = updateMany.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("queued");
    expect(data.attempts).toBe(1);
    expect(data.nextAttemptAt).toBeInstanceOf(Date);
    expect(data.nextAttemptAt.getTime()).toBeGreaterThan(Date.now() + 50_000);
  });

  it("fails at once, without retrying, when a private repo needs the project's own token", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockRejectedValue(new RepoTokenRequiredError());

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("error");
    const data = updateMany.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("failed");
    expect(data.attempts).toBe(1);
    expect(data.nextAttemptAt).toBeNull();
    expect(data.error).toBe(REPO_TOKEN_REQUIRED_MESSAGE);
  });

  it("fails permanently after the attempt cap", async () => {
    findMany.mockResolvedValue([makeJob({ attempts: 4 })]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockRejectedValue(new Error("still broken"));

    const res = await runIndexingWorkerOnce();

    expect(res.body.status).toBe("error");
    const data = updateMany.mock.calls.at(-1)?.[0]?.data;
    expect(data.status).toBe("failed");
    expect(data.attempts).toBe(5);
    expect(data.nextAttemptAt).toBeNull();
  });
});

describe("lease fencing", () => {
  it("conditions every write after the claim on the lease this worker holds", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany.mockResolvedValue({ count: 1 });
    indexRepo.mockImplementation(async (_id, _url, _token, onProgress) => {
      await onProgress(50);
      return completedPass();
    });

    await runIndexingWorkerOnce();

    const [claim, ...writes] = updateMany.mock.calls.map((c) => c[0]);
    const workerId = claim.data.lockedBy;
    expect(typeof workerId).toBe("string");
    expect(writes).toHaveLength(2);
    for (const write of writes) {
      expect(write.where).toEqual(
        expect.objectContaining({
          id: "job-1",
          status: "processing",
          lockedBy: workerId,
        }),
      );
    }
    expect(update).not.toHaveBeenCalled();
  });

  it("does not overwrite a cancel that lands while the pass is running", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValue({ count: 0 });
    indexRepo.mockResolvedValue(completedPass());

    const res = await runIndexingWorkerOnce();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("lease_lost");
    expect(mirrorBaselineIfPending).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("does not requeue or re-kick a time-boxed pass whose lease is gone", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValue({ count: 0 });
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

    expect(res.body.status).toBe("lease_lost");
    expect(kickIndexingWorker).not.toHaveBeenCalled();
  });

  it("does not overwrite a cancel when the pass throws", async () => {
    findMany.mockResolvedValue([makeJob()]);
    updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValue({ count: 0 });
    indexRepo.mockRejectedValue(new Error("GitHub 403"));

    const res = await runIndexingWorkerOnce();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("lease_lost");
  });
});
