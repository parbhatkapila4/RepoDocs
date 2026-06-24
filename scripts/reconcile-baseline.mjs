import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const all = process.argv.includes("--all");
const term =
  process.argv.find(
    (a) =>
      !a.startsWith("--") && a !== process.argv[0] && a !== process.argv[1],
  ) || "ynapse";
const apply = process.argv.includes("--apply");

async function main() {
  console.log(
    `Mode: ${apply ? "APPLY (will write)" : "DRY RUN (read only)"}  |  ${all ? "ALL projects" : `match name ~ "${term}"`}`,
  );
  const projects = await prisma.project.findMany({
    where: all
      ? { deletedAt: null }
      : { name: { contains: term, mode: "insensitive" }, deletedAt: null },
    select: {
      id: true,
      name: true,
      indexedCommitSha: true,
      indexedBranch: true,
      indexedAt: true,
    },
  });
  if (projects.length === 0) {
    console.log(`No project matching "${term}".`);
    return;
  }

  for (const p of projects) {
    const job = await prisma.indexingJob.findUnique({
      where: { projectId: p.id },
      select: {
        status: true,
        lastCommitSha: true,
        indexedBranch: true,
        updatedAt: true,
        filesProcessed: true,
        filesTotal: true,
      },
    });

    console.log(`\n=== ${p.name}  (${p.id}) ===`);
    console.log(
      `  BEFORE  Project.indexedCommitSha = ${p.indexedCommitSha ?? "NULL"}`,
    );
    console.log(
      `          Job.status=${job?.status ?? "none"}  lastCommitSha=${job?.lastCommitSha ?? "NULL"}  files=${job ? `${job.filesProcessed}/${job.filesTotal}` : "-"}  branch=${job?.indexedBranch ?? "NULL"}`,
    );

    if (!job) {
      console.log("  -> skip: no indexing job");
      continue;
    }
    if (p.indexedCommitSha) {
      console.log("  -> skip: already has a baseline (idempotent no-op)");
      continue;
    }
    if (job.status !== "completed") {
      console.log(`  -> skip: job status is "${job.status}", not completed`);
      continue;
    }
    if (!job.lastCommitSha) {
      console.log("  -> skip: no captured lastCommitSha to mirror");
      continue;
    }

    if (!apply) {
      console.log(
        `  -> WOULD mirror lastCommitSha ${job.lastCommitSha} (branch ${job.indexedBranch}). Re-run with --apply to write.`,
      );
      continue;
    }

    await prisma.project.update({
      where: { id: p.id },
      data: {
        indexedCommitSha: job.lastCommitSha,
        indexedBranch: job.indexedBranch,
        indexedAt: job.updatedAt ?? new Date(),
      },
    });
    const after = await prisma.project.findUnique({
      where: { id: p.id },
      select: { indexedCommitSha: true, indexedBranch: true, indexedAt: true },
    });
    console.log("  -> MIRRORED.");
    console.log(
      `  AFTER   Project.indexedCommitSha = ${after.indexedCommitSha}  branch=${after.indexedBranch}  indexedAt=${after.indexedAt?.toISOString?.() ?? after.indexedAt}`,
    );
  }
}

main()
  .catch((e) => {
    console.error("ERROR:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
