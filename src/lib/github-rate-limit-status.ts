import { createGitHubOctokit } from "@/lib/github-octokit";
export async function githubCoreQuotaRecovered(
  auth?: string | null
): Promise<boolean> {
  try {
    const octokit = createGitHubOctokit(auth);
    const { data } = await octokit.rest.rateLimit.get();
    const core = data.resources?.core;
    if (!core || typeof core.remaining !== "number" || typeof core.reset !== "number") {
      return false;
    }
    const now = Math.floor(Date.now() / 1000);
    return core.remaining > 0 || now >= core.reset;
  } catch {
    return false;
  }
}
