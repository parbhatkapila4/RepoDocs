import { decryptSecret } from "@/lib/secret-crypto";
import { getGitHubRepositoryInfo, type GitHubRepoInfo } from "@/lib/github";
import { log } from "@/lib/logger";

export interface ProjectRepoRef {
  name: string;
  repoUrl: string;
  githubToken: string | null;
}

export async function fetchRepoInfoForProject(
  project: ProjectRepoRef,
): Promise<Partial<GitHubRepoInfo>> {
  try {
    const withToken = await getGitHubRepositoryInfo(
      project.repoUrl,
      decryptSecret(project.githubToken) || undefined,
    );
    if (withToken) return withToken;
    const anonymous = await getGitHubRepositoryInfo(project.repoUrl);
    if (anonymous) return anonymous;
  } catch (repoError) {
    log.error("Error fetching repo info:", repoError);
  }
  return {
    name: project.name,
    htmlUrl: project.repoUrl,
    description: null,
    language: null,
    stars: 0,
    forks: 0,
  };
}
