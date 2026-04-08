import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import {
  getGenerateEmbeddings,
  getSummariseCode,
  generateReadmeFromCodebase,
} from "./gemini";
import prisma from "@/lib/prisma";
import { createGitHubOctokit } from "@/lib/github-octokit";

function parseGithubOwnerRepo(
  githubUrl: string
): { owner: string; repo: string } | null {
  const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!urlMatch) return null;
  const [, owner, rawRepo] = urlMatch;
  return { owner, repo: rawRepo.replace(/\.git$/, "") };
}

export async function resolveGithubDefaultBranch(
  githubUrl: string,
  githubToken?: string
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

export async function loadGithubRepository(
  githubUrl: string,
  githubToken?: string,
  branch?: string
) {
  const token = githubToken || process.env.GITHUB_TOKEN;
  const ref =
    typeof branch === "string" && branch.trim().length > 0
      ? branch.trim()
      : await resolveGithubDefaultBranch(githubUrl, token);

  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: token,
    branch: ref,
    ignoreFiles: [
      ".github",
      ".gitignore",
      ".git",
      ".DS_Store",
      "package-lock.json",
      "pnpm-lock.yaml",
      "yarn.lock",
      "bun.lockb",
      "bun.lock",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 2,
  });
  const docs = await loader.load();
  return docs;
}
const HIGH_VALUE_PATTERNS = [
  /^readme/i,
  /^package\.json$/,
  /^tsconfig.*\.json$/,
  /^next\.config\./,
  /^nuxt\.config\./,
  /^vite\.config\./,
  /^webpack\.config\./,
  /\.config\.(ts|js|mjs)$/,
  /^src\/index\./,
  /^src\/main\./,
  /^src\/app\.(tsx?|jsx?)$/,
  /^app\/layout\./,
  /^app\/page\./,
  /^pages\/index\./,
  /^pages\/_app\./,
  /^index\.(ts|js|tsx|jsx)$/,
  /^lib\//,
  /^src\/lib\//,
  /^utils\//,
  /^src\/utils\//,
  /^prisma\/schema\.prisma$/,
  /^Dockerfile$/,
  /^docker-compose/,
  /^\.env\.example$/,
  /^Cargo\.toml$/,
  /^go\.mod$/,
  /^requirements\.txt$/,
  /^pyproject\.toml$/,
  /^Gemfile$/,
];

export function isHighValueFile(filePath: string): boolean {
  const normalised = filePath.replace(/\\/g, "/");
  return HIGH_VALUE_PATTERNS.some((re) => re.test(normalised));
}

const WORKER_BUDGET_MS = 45_000;
const BATCH_SIZE = 5;
const EMBEDDING_THROTTLE_MS = 500;

interface IndexResult {
  success: boolean;
  filesProcessed: number;
  successCount: number;
  failCount: number;
  needsResume: boolean;
  resumeAfter: string | null;
  phase: "fast" | "full";
}

export async function indexGithubRepository(
  projectId: string,
  githubUrl: string,
  githubToken?: string,
  onProgress?: (progress: number) => Promise<void> | void
): Promise<IndexResult> {
  const { retryAsync, logError } = await import("./errors");
  const { cache } = await import("./cache");
  const invocationStart = Date.now();

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    const job = await prisma.indexingJob.findUnique({
      where: { projectId },
    });

    const jobRow = job as
      | (typeof job & {
        phase?: string | null;
        resumeAfter?: string | null;
      })
      | null;

    const currentPhase: "fast" | "full" =
      (jobRow?.phase as "fast" | "full") ?? "fast";
    const resumeAfterFile: string | null = jobRow?.resumeAfter ?? null;

    const alreadyIndexed = await prisma.sourceCodeEmbeddings.findMany({
      where: { projectId },
      select: { fileName: true },
    });
    const indexedSet = new Set(alreadyIndexed.map((e) => e.fileName));

    let defaultBranchForLoader: string | undefined;

    if (alreadyIndexed.length > 0) {
      const treeListing = await listGithubRepoPathsForPreindex(
        githubUrl,
        githubToken || process.env.GITHUB_TOKEN,
        25_000
      );
      if (treeListing) {
        defaultBranchForLoader = treeListing.defaultBranch;
      }
      if (treeListing && !treeListing.truncated) {
        const paths = treeListing.paths.filter(
          (p) => !isGithubLoaderIgnoredPath(p)
        );
        const notIndexed = paths.filter((p) => !indexedSet.has(p));
        if (notIndexed.length === 0 && paths.length > 0) {
          await generateReadmeIfNeeded(
            projectId,
            githubUrl,
            githubToken,
            retryAsync,
            logError
          );
          await cache.invalidateProject(projectId);
          return {
            success: true,
            filesProcessed: 0,
            successCount: 0,
            failCount: 0,
            needsResume: false,
            resumeAfter: null,
            phase: "full",
          };
        }
      }
    }

    try {
      await prisma.indexingJob.update({
        where: { projectId },
        data: { progress: 2, updatedAt: new Date() },
      });
    } catch { }
    if (onProgress) {
      try {
        await onProgress(2);
      } catch { }
    }

    const docs = await retryAsync(
      () =>
        loadGithubRepository(
          githubUrl,
          githubToken || process.env.GITHUB_TOKEN,
          defaultBranchForLoader
        ),
      {
        maxRetries: 3,
        initialDelay: 2000,
        retryIf: (error) => !error.message?.includes("authentication"),
      }
    );

    if (!docs || docs.length === 0) {
      throw new Error("No files found in repository");
    }

    const newDocs = docs.filter((d) => !indexedSet.has(d.metadata.source));

    if (newDocs.length === 0) {
      await generateReadmeIfNeeded(projectId, githubUrl, githubToken, retryAsync, logError);
      await cache.invalidateProject(projectId);
      return { success: true, filesProcessed: 0, successCount: 0, failCount: 0, needsResume: false, resumeAfter: null, phase: currentPhase };
    }

    let filesToProcess: Document[];
    if (currentPhase === "fast") {
      const highValue = newDocs.filter((d) => isHighValueFile(d.metadata.source));
      const rest = newDocs.filter((d) => !isHighValueFile(d.metadata.source));
      filesToProcess = [...highValue, ...rest];
    } else {
      filesToProcess = [...newDocs];
    }

    if (resumeAfterFile) {
      const idx = filesToProcess.findIndex((d) => d.metadata.source === resumeAfterFile);
      if (idx >= 0) {
        filesToProcess = filesToProcess.slice(idx + 1);
      }
    }

    await prisma.indexingJob.update({
      where: { projectId },
      data: {
        filesTotal: alreadyIndexed.length + newDocs.length,
        progress: 8,
        updatedAt: new Date(),
      },
    });
    if (onProgress) {
      try {
        await onProgress(8);
      } catch { }
    }

    let successCount = 0;
    let failCount = 0;
    let lastProcessed: string | null = null;
    let fastPhaseCompleted = false;
    const totalFiles = alreadyIndexed.length + newDocs.length;

    for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
      if (Date.now() - invocationStart > WORKER_BUDGET_MS) {
        await prisma.indexingJob.update({
          where: { projectId },
          data: {
            resumeAfter: lastProcessed,
            filesProcessed: indexedSet.size + successCount,
            progress: Math.floor(((indexedSet.size + successCount) / totalFiles) * 100),
            updatedAt: new Date(),
          },
        });
        return {
          success: true,
          filesProcessed: successCount,
          successCount,
          failCount,
          needsResume: true,
          resumeAfter: lastProcessed,
          phase: currentPhase,
        };
      }

      const batch = filesToProcess.slice(i, i + BATCH_SIZE);

      for (const doc of batch) {
        if (Date.now() - invocationStart > WORKER_BUDGET_MS) break;
        try {
          const summary = await retryAsync(() => getSummariseCode(doc), {
            maxRetries: 2,
            initialDelay: 500,
          });
          if (!summary) throw new Error("Empty summary generated");

          const embedding = await retryAsync(
            () => getGenerateEmbeddings(summary),
            { maxRetries: 2, initialDelay: 500 }
          );

          const row = await prisma.sourceCodeEmbeddings.create({
            data: {
              sourceCode:
                typeof doc.pageContent === "string"
                  ? doc.pageContent
                  : String(doc.pageContent ?? ""),
              fileName: doc.metadata.source,
              Summary: summary,
              projectId,
            },
          });

          await prisma.$executeRaw`
            UPDATE "SourceCodeEmbeddings"
            SET "summaryEmbedding" = ${embedding}::vector
            WHERE "id" = ${row.id}
          `;

          successCount++;
          lastProcessed = doc.metadata.source;

          await new Promise((r) => setTimeout(r, EMBEDDING_THROTTLE_MS));
        } catch (error) {
          logError(error, { file: doc.metadata.source, projectId });
          failCount++;
          lastProcessed = doc.metadata.source;
        }

        if (currentPhase === "fast" && !fastPhaseCompleted && !isHighValueFile(doc.metadata.source) && successCount > 0) {
          fastPhaseCompleted = true;
        }
      }

      const processed = indexedSet.size + successCount;
      const progressPercent = Math.floor((processed / totalFiles) * 100);
      if (onProgress) {
        try { await onProgress(progressPercent); } catch { }
      }

      try {
        await prisma.indexingJob.update({
          where: { projectId },
          data: {
            filesProcessed: processed,
            progress: progressPercent,
            updatedAt: new Date(),
          },
        });
      } catch { }

      if (i + BATCH_SIZE < filesToProcess.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (successCount === 0 && indexedSet.size === 0) {
      throw new Error(
        "Indexing produced no embeddings (every file failed). Check GEMINI_API_KEY or GOOGLE_GENAI_API_KEY, GitHub access for this repo, and server logs."
      );
    }

    await generateReadmeIfNeeded(projectId, githubUrl, githubToken, retryAsync, logError);
    await cache.invalidateProject(projectId);

    return {
      success: true,
      filesProcessed: successCount,
      successCount,
      failCount,
      needsResume: false,
      resumeAfter: null,
      phase: currentPhase,
    };
  } catch (error) {
    logError(error, { projectId, githubUrl });
    throw error;
  }
}

async function generateReadmeIfNeeded(
  projectId: string,
  githubUrl: string,
  githubToken: string | undefined,
  retryAsync: any,
  logError: any
) {
  try {
    const allSummaries = await prisma.sourceCodeEmbeddings.findMany({
      where: { projectId },
      select: { Summary: true },
    });
    if (allSummaries.length === 0) return;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });
    if (!project) return;

    const repoInfo = await getGitHubRepositoryInfo(githubUrl, githubToken);
    const summaries = allSummaries.map((s) => s.Summary);

    const readmeContent = await retryAsync(
      () => generateReadmeFromCodebase(project.name, summaries, repoInfo),
      { maxRetries: 2, initialDelay: 2000 }
    );

    await prisma.readme.upsert({
      where: { projectId },
      update: {
        content: readmeContent,
        prompt: `Generated README for ${project.name} based on codebase analysis`,
        updatedAt: new Date(),
      },
      create: {
        content: readmeContent,
        prompt: `Generated README for ${project.name} based on codebase analysis`,
        projectId,
      },
    });
  } catch (err) {
    logError(err, { projectId, stage: "readme-generation" });
  }
}

async function generateEmbeddings(docs: Document[]) {
  return await Promise.allSettled(
    docs.map(async (doc) => {
      const summary = await getSummariseCode(doc);
      const embedding = await getGenerateEmbeddings(summary);
      return {
        summary,
        embedding,
        fileName: doc.metadata.source,
        sourceCode:
          typeof doc.pageContent === "string"
            ? doc.pageContent
            : String(doc.pageContent ?? ""),
      };
    })
  );
}

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
  githubToken?: string
): Promise<GitHubRepoInfo | null> {
  try {
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      console.error("Invalid GitHub repository URL:", repoUrl);
      return null;
    }

    const [, owner, repo] = urlMatch;
    const cleanRepo = repo.replace(".git", "");

    const token = githubToken || process.env.GITHUB_TOKEN;
    const octokit = createGitHubOctokit(token);

    let repoData;
    try {
      const response = await octokit.rest.repos.get({
        owner,
        repo: cleanRepo,
      });
      repoData = response.data;
    } catch (error: any) {
      if (error?.status === 404) {
        console.error(`Repository not found or private: ${owner}/${cleanRepo}`);
        return null;
      }
      if (error?.status === 403) {
        console.error(
          `GitHub API rate limit or forbidden: ${owner}/${cleanRepo}`
        );
        if (token) {
          const publicOctokit = createGitHubOctokit();
          try {
            const response = await publicOctokit.rest.repos.get({
              owner,
              repo: cleanRepo,
            });
            repoData = response.data;
          } catch (retryError) {
            throw error;
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    let languages: Record<string, number> = {};
    try {
      const { data: languagesData } = await octokit.rest.repos.listLanguages({
        owner,
        repo: cleanRepo,
      });
      languages = languagesData;
    } catch (error) { }

    let topics: { names: string[] } = { names: [] };
    try {
      const { data: topicsData } = await octokit.rest.repos.getAllTopics({
        owner,
        repo: cleanRepo,
      });
      topics = topicsData;
    } catch (error) { }

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
    console.error("Error fetching GitHub repository information:", error);
    return null;
  }
}

export async function fetchRepositoryReadmeRaw(
  repoUrl: string,
  githubToken?: string,
  maxChars = 14000
): Promise<string | null> {
  const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!urlMatch) return null;
  const [, owner, repo] = urlMatch;
  const cleanRepo = repo.replace(".git", "");
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

function normalizePathPreindex(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

const PREINDEX_LOCK_FILES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "bun.lock",
]);

const PREINDEX_ALLOWED_EXT = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".cs",
  ".php",
  ".rb",
  ".vue",
  ".svelte",
  ".html",
  ".htm",
  ".md",
  ".mdx",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".css",
  ".scss",
  ".prisma",
]);

function isPreindexTreePath(path: string): boolean {
  const p = path.replace(/\\/g, "/");
  const lower = p.toLowerCase();
  if (
    lower.includes("node_modules/") ||
    lower.includes(".next/") ||
    lower.includes("dist/") ||
    lower.includes("build/") ||
    lower.includes(".git/") ||
    lower.includes("/vendor/") ||
    lower.endsWith(".min.js") ||
    lower.endsWith(".map")
  ) {
    return false;
  }
  const segments = lower.split("/");
  const base = segments[segments.length - 1] || "";
  if (PREINDEX_LOCK_FILES.has(base)) return false;
  if (base === "dockerfile") return true;
  const dot = base.lastIndexOf(".");
  const ext = dot >= 0 ? base.slice(dot) : "";
  return PREINDEX_ALLOWED_EXT.has(ext);
}

function isGithubLoaderIgnoredPath(path: string): boolean {
  const n = path.replace(/\\/g, "/");
  if (n === ".github" || n.startsWith(".github/")) return true;
  if (n.includes("/.github/")) return true;
  return false;
}

export async function listGithubRepoPathsForPreindex(
  repoUrl: string,
  githubToken?: string,
  maxPaths = 500
): Promise<{
  paths: string[];
  defaultBranch: string;
  owner: string;
  repo: string;
  truncated: boolean;
} | null> {
  const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!urlMatch) return null;
  const [, owner, rawRepo] = urlMatch;
  const repo = rawRepo.replace(/\.git$/, "");
  const token = githubToken || process.env.GITHUB_TOKEN;
  const octokit = createGitHubOctokit(token);
  try {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const branch = repoData.default_branch;
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const commitSha = refData.object.sha;
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: commitSha,
      recursive: "true",
    });
    const raw = (treeData.tree || [])
      .filter(
        (item) => item.type === "blob" && item.path && isPreindexTreePath(item.path)
      )
      .map((item) => normalizePathPreindex(item.path!))
      .filter(Boolean);
    const truncated = raw.length > maxPaths;
    const paths = raw.slice(0, maxPaths);
    return { paths, defaultBranch: branch, owner, repo, truncated };
  } catch (e) {
    console.error("listGithubRepoPathsForPreindex:", e);
    return null;
  }
}

export type PreindexFetchedFile = {
  path: string;
  text: string;
  truncated: boolean;
};

export async function fetchGithubPreindexFileContents(
  owner: string,
  repo: string,
  paths: string[],
  ref: string,
  githubToken?: string,
  maxCharsPerFile = 7500,
  maxFiles = 24
): Promise<PreindexFetchedFile[]> {
  const token = githubToken || process.env.GITHUB_TOKEN;
  const octokit = createGitHubOctokit(token);
  const out: PreindexFetchedFile[] = [];
  const unique = Array.from(new Set(paths)).slice(0, maxFiles);
  for (const path of unique) {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });
      if (
        Array.isArray(data) ||
        !("content" in data) ||
        typeof data.content !== "string"
      ) {
        continue;
      }
      const raw = Buffer.from(data.content, "base64").toString("utf-8");
      const truncated = raw.length > maxCharsPerFile;
      const text = truncated ? raw.slice(0, maxCharsPerFile) : raw;
      out.push({ path, text, truncated });
    } catch {

    }
  }
  return out;
}
