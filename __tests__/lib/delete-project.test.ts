jest.mock("@clerk/nextjs/server", () => ({ auth: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    project: { update: jest.fn() },
    indexingJob: { updateMany: jest.fn() },
  },
}));

import prisma from "@/lib/prisma";
import { deleteProject } from "@/lib/queries";

const transaction = prisma.$transaction as jest.Mock;
const projectUpdate = prisma.project.update as jest.Mock;
const jobUpdateMany = prisma.indexingJob.updateMany as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  projectUpdate.mockImplementation((args) => ({ op: "project.update", args }));
  jobUpdateMany.mockImplementation((args) => ({
    op: "indexingJob.updateMany",
    args,
  }));
});

describe("deleteProject", () => {
  it("soft-deletes the project and cancels its queued or running job in one transaction", async () => {
    const row = { id: "proj-1", deletedAt: new Date() };
    transaction.mockResolvedValue([row, { count: 1 }]);

    await expect(deleteProject("proj-1", "user-1")).resolves.toBe(row);

    expect(transaction).toHaveBeenCalledTimes(1);
    const [softDelete, cancelJob] = transaction.mock.calls[0][0];
    expect(softDelete).toEqual({
      op: "project.update",
      args: {
        where: { id: "proj-1", userId: "user-1" },
        data: { deletedAt: expect.any(Date) },
      },
    });
    expect(cancelJob).toEqual({
      op: "indexingJob.updateMany",
      args: {
        where: { projectId: "proj-1", status: { in: ["queued", "processing"] } },
        data: {
          status: "cancelled",
          error: "Project deleted",
          lockedAt: null,
          lockedBy: null,
          nextAttemptAt: null,
        },
      },
    });
  });

  it("surfaces a failed delete (e.g. not the owner) without cancelling anything outside the transaction", async () => {
    transaction.mockRejectedValue(
      Object.assign(new Error("Record to update not found."), {
        code: "P2025",
      }),
    );

    await expect(deleteProject("proj-1", "someone-else")).rejects.toThrow(
      "Failed to delete project",
    );
    expect(jobUpdateMany).toHaveBeenCalledTimes(1);
    expect(transaction.mock.calls[0][0][1].op).toBe("indexingJob.updateMany");
  });
});
