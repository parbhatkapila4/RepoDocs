"use client";

import { getProjectRepositoryInfo } from "@/lib/actions";

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
export async function fetchProjectRepositoryInfo(
  projectId: string,
): Promise<RepositoryInfoResult | null> {
  try {
    return await getProjectRepositoryInfo(projectId);
  } catch {
    return null;
  }
}
