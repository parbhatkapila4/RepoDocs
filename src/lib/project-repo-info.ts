import { decryptSecret } from "@/lib/secret-crypto";
import { getGitHubRepositoryInfo, type GitHubRepoInfo } from "@/lib/github";
import {
  RepoTokenRequiredError,
  resolveRepoToken,
} from "@/lib/github/repo-access";
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
    const token = await resolveRepoToken(
      project.repoUrl,
      decryptSecret(project.githubToken),
    );
    const info = await getGitHubRepositoryInfo(project.repoUrl, token);
    if (info) return info;
  } catch (repoError) {
    if (repoError instanceof RepoTokenRequiredError) throw repoError;
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
