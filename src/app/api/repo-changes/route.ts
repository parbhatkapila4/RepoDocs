import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { decryptSecret } from "@/lib/secret-crypto";
import { parseDiff, buildUnifiedDiffFromGithubFiles } from "@/lib/diff";
import {
  analyzeParsedDiff,
  buildDriftSystemPrompt,
  recordAnalysisSuccess,
  recordAnalysisFailure,
} from "@/lib/analyze";
import {
  requireAuthAndRateLimit,
  requireOwnedProjectWithinBudget,
  isGuardFailure,
} from "@/lib/api-guards";
import { parseGithubOwnerRepo, compareCommitsBasehead } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  projectId: z.string().min(1),
});

const MAX_COMMITS_RETURNED = 50;
const MAX_FILES_RETURNED = 300;

export async function POST(request: NextRequest) {
  let startMs = 0;
  let projectIdForMetrics = "";

  try {
    const access = await requireAuthAndRateLimit(request);
    if (isGuardFailure(access)) return access.response;
    const { dbUserId } = access;

    const parsed = BodySchema.safeParse(
      await request.json().catch(() => null)
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }
    const { projectId } = parsed.data;

    projectIdForMetrics = projectId;

    const owned = await requireOwnedProjectWithinBudget(projectId, dbUserId);
    if (isGuardFailure(owned)) return owned.response;
    const { project } = owned;

    const repo = parseGithubOwnerRepo(project.repoUrl);
    if (!repo) {
      return NextResponse.json(
        { error: "Invalid repository URL on project", reason: "bad_repo_url" },
        { status: 422 }
      );
    }

    const indexedCommitSha = project.indexedCommitSha;
    const indexedBranch = project.indexedBranch;

    if (!indexedCommitSha || !indexedBranch) {
      return NextResponse.json({ reason: "no_baseline" }, { status: 409 });
    }

    const token =
      (project.githubToken ? decryptSecret(project.githubToken) : null) ||
      process.env.GITHUB_TOKEN ||
      undefined;

    const compare = await compareCommitsBasehead(
      repo.owner,
      repo.repo,
      `${indexedCommitSha}...${indexedBranch}`,
      token
    );
    if (!compare.ok) {
      return NextResponse.json(
        {
          error: "GitHub comparison failed",
          reason: compare.reason,
          message: compare.message,
        },
        { status: compare.status }
      );
    }
    const data = compare.data;
    const baseSha = indexedCommitSha;
    const headSha = data.head_sha;

    if (data.ahead_by === 0) {
      return NextResponse.json({ status: "no_changes", baseSha, headSha });
    }

    const built = buildUnifiedDiffFromGithubFiles(data.files);
    const fileCount = built.fileCount;
    const truncated = built.truncated || data.files.length >= 300;

    startMs = Date.now();
    const result = await analyzeParsedDiff(parseDiff(built.diff), projectId, {
      systemPrompt: buildDriftSystemPrompt(baseSha, data.total_commits),
    });
    const latencyMs = Date.now() - startMs;

    recordAnalysisSuccess("repo-changes", projectId, result, latencyMs);

    const { _metrics, ...analysis } = result;

    return NextResponse.json({
      success: true,
      analysis,
      baseSha,
      headSha,
      commitCount: data.total_commits,
      fileCount,
      truncated,
      commits: data.commits.slice(0, MAX_COMMITS_RETURNED),
      files: data.files.slice(0, MAX_FILES_RETURNED).map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
      })),
    });
  } catch (error) {
    const latencyMs = startMs ? Date.now() - startMs : 0;
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Error in repo-changes endpoint:", error);

    recordAnalysisFailure(
      "repo-changes",
      projectIdForMetrics,
      latencyMs,
      errorMessage
    );

    return NextResponse.json(
      {
        error: "Failed to analyze repo changes",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
