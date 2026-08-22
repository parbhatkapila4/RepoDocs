import { createGitHubOctokit } from "@/lib/github-octokit";

export interface GithubCompareFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface GithubCompareData {
  ahead_by: number;
  total_commits: number;
  base_sha: string;
  head_sha: string;
  commits: {
    sha: string;
    message: string;
    author: string;
    date: string | null;
  }[];
  files: GithubCompareFile[];
}

export type GithubCompareOutcome =
  | { ok: true; data: GithubCompareData }
  | { ok: false; status: number; reason: string; message: string };

export async function compareCommitsBasehead(
  owner: string,
  repo: string,
  basehead: string,
  githubToken?: string,
): Promise<GithubCompareOutcome> {
  const octokit = createGitHubOctokit(githubToken || process.env.GITHUB_TOKEN);
  try {
    const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead,
    });
    const commits = (data.commits ?? []).map((c) => ({
      sha: c.sha,
      message: c.commit?.message ?? "",
      author: c.commit?.author?.name ?? c.author?.login ?? "",
      date: c.commit?.author?.date ?? c.commit?.committer?.date ?? null,
    }));
    return {
      ok: true,
      data: {
        ahead_by: data.ahead_by ?? 0,
        total_commits: data.total_commits ?? 0,
        base_sha: data.base_commit?.sha ?? "",
        head_sha:
          commits.length > 0
            ? commits[commits.length - 1].sha
            : (data.base_commit?.sha ?? ""),
        commits,
        files: (data.files ?? []).map((f) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          patch: f.patch,
        })),
      },
    };
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status === 404) {
      return {
        ok: false,
        status: 404,
        reason: "repo_or_baseline_not_found",
        message:
          "Repository or baseline commit not found. The repo may have moved, the branch may have been renamed or deleted, or the indexed commit no longer exists on the remote.",
      };
    }
    if (status === 403) {
      return {
        ok: false,
        status: 403,
        reason: "github_forbidden",
        message:
          "GitHub denied access (rate limit or insufficient token scope). Private repositories require a token with the 'repo' scope.",
      };
    }
    if (status === 401) {
      return {
        ok: false,
        status: 403,
        reason: "github_auth_failed",
        message:
          "GitHub authentication failed - the project's access token may be missing, expired, or revoked.",
      };
    }
    return {
      ok: false,
      status: 502,
      reason: "github_error",
      message:
        e instanceof Error ? e.message : "Failed to compare commits on GitHub.",
    };
  }
}
