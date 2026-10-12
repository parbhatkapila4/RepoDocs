import { createGitHubOctokit } from "@/lib/github-octokit";
import { parseGithubOwnerRepo } from "./refs";

export const REPO_TOKEN_REQUIRED_MESSAGE =
  "This repository is private or doesn't exist. To use a private repo, re-create the project with a GitHub token that can read it.";

export class RepoTokenRequiredError extends Error {
  constructor() {
    super(REPO_TOKEN_REQUIRED_MESSAGE);
    this.name = "RepoTokenRequiredError";
  }
}
export async function resolveRepoToken(
  repoUrl: string,
  userToken: string | null | undefined,
): Promise<string | undefined> {
  if (userToken) return userToken;

  const parsed = parseGithubOwnerRepo(repoUrl);
  if (!parsed) {
    throw new Error(`Cannot parse owner/repo from GitHub URL: ${repoUrl}`);
  }

  const serverToken = process.env.GITHUB_TOKEN || undefined;
  let isPrivate: boolean;
  try {
    const { data } = await createGitHubOctokit(serverToken).rest.repos.get({
      owner: parsed.owner,
      repo: parsed.repo,
    });
    isPrivate = data.private;
  } catch (error) {
    if ((error as { status?: number })?.status === 404) {
      throw new RepoTokenRequiredError();
    }
    throw error;
  }

  if (isPrivate) throw new RepoTokenRequiredError();
  return serverToken;
}
