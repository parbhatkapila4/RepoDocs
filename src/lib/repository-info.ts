"use client";

import { getProjectWithToken } from "@/lib/actions";
import { getGitHubRepositoryInfo } from "@/lib/github";

export interface RepositoryInfoResult {
  stars?: number;
  stargazersCount?: number;
  forks?: number;
  forksCount?: number;
  language?: string | null;
  license?: { name?: string | null } | string | null;
  description?: string | null;
  topics?: string[];
  htmlUrl?: string;
  owner?: { login: string; avatarUrl?: string };
}

function isUseful(info: RepositoryInfoResult | null): info is RepositoryInfoResult {
  if (!info) return false;
  return Boolean(
    (info.stars ?? info.stargazersCount ?? 0) > 0 ||
      info.language ||
      info.license
  );
}

export async function fetchProjectRepositoryInfo(
  projectId: string,
  fallbackRepoUrl?: string | null
): Promise<RepositoryInfoResult | null> {
  let token: string | undefined;
  let repoUrl: string | undefined = fallbackRepoUrl ?? undefined;

  try {
    const project = await getProjectWithToken(projectId);
    if (project?.githubToken) token = project.githubToken;
    if (project?.repoUrl) repoUrl = project.repoUrl;
  } catch {
  }

  if (!repoUrl) return null;

  try {
    const info = (await getGitHubRepositoryInfo(
      repoUrl,
      token
    )) as RepositoryInfoResult | null;
    if (isUseful(info)) return info;
    return info ?? null;
  } catch {
    return null;
  }
}
