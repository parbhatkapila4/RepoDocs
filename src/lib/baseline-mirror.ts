import prisma from "./prisma";

export async function mirrorBaselineIfPending(
  projectId: string
): Promise<string | null> {
  const [job, project] = await Promise.all([
    prisma.indexingJob.findUnique({
      where: { projectId },
      select: {
        status: true,
        lastCommitSha: true,
        indexedBranch: true,
        updatedAt: true,
      },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      select: { indexedCommitSha: true },
    }),
  ]);

  if (!job || !project) return null;
  if (project.indexedCommitSha) return null;
  if (job.status !== "completed") return null;
  if (!job.lastCommitSha) return null;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      indexedCommitSha: job.lastCommitSha,
      indexedBranch: job.indexedBranch,
      indexedAt: job.updatedAt ?? new Date(),
    },
  });

  return job.lastCommitSha;
}
