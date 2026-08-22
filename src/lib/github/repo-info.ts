import { createGitHubOctokit } from "@/lib/github-octokit";
import { log } from "@/lib/logger";

export interface GitHubRepoInfo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  language: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  size: number;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  topics: string[];
  license: {
    name: string;
    spdxId: string | null;
    url: string | null;
  } | null;
  owner: {
    login: string;
    id: number;
    avatarUrl: string;
    htmlUrl: string;
    type: string;
  };
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  hasPages: boolean;
  hasDownloads: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: string;
  forksCount: number;
  stargazersCount: number;
  watchersCount: number;
  openIssuesCount: number;
  networkCount: number;
  subscribersCount: number;
}

export async function getGitHubRepositoryInfo(
  repoUrl: string,
  githubToken?: string,
): Promise<GitHubRepoInfo | null> {
  try {
    const urlMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!urlMatch) {
      log.error("Invalid GitHub repository URL:", repoUrl);
      return null;
    }

    const [, owner, repo] = urlMatch;
    const cleanRepo = repo.replace(/\.git$/, "");

    const token = githubToken || process.env.GITHUB_TOKEN;
    const octokit = createGitHubOctokit(token);

    const repoPromise = octokit.rest.repos.get({ owner, repo: cleanRepo });
    repoPromise.catch(() => {});
    const languagesPromise = octokit.rest.repos
      .listLanguages({ owner, repo: cleanRepo })
      .then((r) => r.data as Record<string, number>)
      .catch(() => ({}) as Record<string, number>);
    const topicsPromise = octokit.rest.repos
      .getAllTopics({ owner, repo: cleanRepo })
      .then((r) => r.data as { names: string[] })
      .catch(() => ({ names: [] as string[] }));

    let repoData;
    try {
      const response = await repoPromise;
      repoData = response.data;
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 404) {
        log.error(`Repository not found or private: ${owner}/${cleanRepo}`);
        return null;
      }
      if (status === 403) {
        log.error(`GitHub API rate limit or forbidden: ${owner}/${cleanRepo}`);
        if (token) {
          const publicOctokit = createGitHubOctokit();
          try {
            const response = await publicOctokit.rest.repos.get({
              owner,
              repo: cleanRepo,
            });
            repoData = response.data;
          } catch {
            throw error;
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    const [languages, topics] = await Promise.all([
      languagesPromise,
      topicsPromise,
    ]);

    const repoInfo: GitHubRepoInfo = {
      id: repoData.id,
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      htmlUrl: repoData.html_url,
      cloneUrl: repoData.clone_url,
      sshUrl: repoData.ssh_url,
      language: repoData.language,
      languages,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      openIssues: repoData.open_issues_count,
      size: repoData.size,
      defaultBranch: repoData.default_branch,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      pushedAt: repoData.pushed_at,
      topics: topics.names || [],
      license: repoData.license
        ? {
            name: repoData.license.name,
            spdxId: repoData.license.spdx_id || null,
            url: repoData.license.url || null,
          }
        : null,
      owner: {
        login: repoData.owner.login,
        id: repoData.owner.id,
        avatarUrl: repoData.owner.avatar_url,
        htmlUrl: repoData.owner.html_url,
        type: repoData.owner.type,
      },
      isPrivate: repoData.private,
      isFork: repoData.fork,
      isArchived: repoData.archived,
      hasIssues: repoData.has_issues,
      hasProjects: repoData.has_projects || false,
      hasWiki: repoData.has_wiki || false,
      hasPages: repoData.has_pages || false,
      hasDownloads: repoData.has_downloads || false,
      archived: repoData.archived || false,
      disabled: repoData.disabled || false,
      visibility: repoData.visibility || "public",
      forksCount: repoData.forks_count,
      stargazersCount: repoData.stargazers_count,
      watchersCount: repoData.watchers_count,
      openIssuesCount: repoData.open_issues_count,
      networkCount: repoData.network_count,
      subscribersCount: repoData.subscribers_count,
    };

    return repoInfo;
  } catch (error) {
    log.error("Error fetching GitHub repository information:", error);
    return null;
  }
}

export async function fetchRepositoryReadmeRaw(
  repoUrl: string,
  githubToken?: string,
  maxChars = 14000,
): Promise<string | null> {
  const urlMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!urlMatch) return null;
  const [, owner, repo] = urlMatch;
  const cleanRepo = repo.replace(/\.git$/, "");
  const token = githubToken || process.env.GITHUB_TOKEN;
  const octokit = createGitHubOctokit(token);
  try {
    const { data } = await octokit.rest.repos.getReadme({
      owner,
      repo: cleanRepo,
      mediaType: { format: "raw" },
    });
    let text: string;
    if (typeof data === "string") {
      text = data;
    } else if (data instanceof ArrayBuffer) {
      text = new TextDecoder("utf-8").decode(data);
    } else if (data instanceof Uint8Array) {
      text = new TextDecoder("utf-8").decode(data);
    } else {
      text = String(data);
    }
    return text.slice(0, maxChars);
  } catch {
    return null;
  }
}
