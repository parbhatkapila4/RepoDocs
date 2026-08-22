import { createGitHubOctokit } from "@/lib/github-octokit";

export function parseGithubOwnerRepo(
  githubUrl: string,
): { owner: string; repo: string } | null {
  const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!urlMatch) return null;
  const [, owner, rawRepo] = urlMatch;
  return { owner, repo: rawRepo.replace(/\.git$/, "") };
}

export async function resolveGithubDefaultBranch(
  githubUrl: string,
  githubToken?: string,
): Promise<string> {
  const parsed = parseGithubOwnerRepo(githubUrl);
  if (!parsed) return "main";
  const octokit = createGitHubOctokit(githubToken || process.env.GITHUB_TOKEN);
  try {
    const { data } = await octokit.rest.repos.get({
      owner: parsed.owner,
      repo: parsed.repo,
    });
    const b = data.default_branch;
    return typeof b === "string" && b.trim().length > 0 ? b.trim() : "main";
  } catch {
    return "main";
  }
}

export async function fetchBranchHeadSha(
  githubUrl: string,
  branch: string,
  githubToken?: string,
): Promise<string> {
  const parsed = parseGithubOwnerRepo(githubUrl);
  if (!parsed) {
    throw new Error(`Cannot parse owner/repo from GitHub URL: ${githubUrl}`);
  }
  const octokit = createGitHubOctokit(githubToken || process.env.GITHUB_TOKEN);
  const { data } = await octokit.rest.git.getRef({
    owner: parsed.owner,
    repo: parsed.repo,
    ref: `heads/${branch}`,
  });
  return data.object.sha;
}
