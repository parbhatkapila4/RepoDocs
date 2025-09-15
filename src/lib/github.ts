import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github'
import { Document } from '@langchain/core/documents'
import { getGenerateEmbeddings, getSummariseCode } from './gemini'
import prisma from '@/lib/prisma'
import { Octokit } from 'octokit'


export async function loadGithubRepository(githubUrl: string, githubToken?: string) {
    const loader = new GithubRepoLoader(githubUrl, {
        accessToken: githubToken,
        branch: 'main',
        ignoreFiles: ['.github', '.gitignore', '.git', '.DS_Store', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock'],
        recursive: true,
        unknown: 'warn',
        maxConcurrency: 5
    })
    const docs = await loader.load()
    return docs
}


export async function indexGithubRepository(projectId: string, githubUrl: string, githubToken?: string) {
    const docs = await loadGithubRepository(githubUrl, githubToken || process.env.GITHUB_TOKEN)
    const allEmbeddings = await generateEmbeddings(docs as Document[])
    await Promise.allSettled(allEmbeddings.map(async (result) => {
        if (result.status === 'rejected' || !result.value) {
            return
        }
        const embedding = result.value
        const sourceCodeEmbiddings = await prisma.sourceCodeEmbiddings.create({
            data: {
                sourceCode: embedding.sourceCode,
                fileName: embedding.fileName,
                Summary: embedding.summary,
                projectId: projectId
            }
        })
        await prisma.$executeRaw`
        UPDATE "SourceCodeEmbiddings"
        SET "summaryEmbedding" = ${embedding.embedding}::vector
        WHERE "id" = ${sourceCodeEmbiddings.id}
        `
    }))
}

async function generateEmbeddings(docs: Document[]) {
    return await Promise.allSettled(docs.map(async doc => {
        const summary = await getSummariseCode(doc)
        const embedding = await getGenerateEmbeddings(summary)
        return {
            summary,
            embedding,
            fileName: doc.metadata.source,
            sourceCode: JSON.parse(JSON.stringify(doc.pageContent))
        }
    }))
}

// GitHub Repository Information Schema
export interface GitHubRepoInfo {
    id: number
    name: string
    fullName: string
    description: string | null
    htmlUrl: string
    cloneUrl: string
    sshUrl: string
    language: string | null
    languages: Record<string, number>
    stars: number
    forks: number
    watchers: number
    openIssues: number
    size: number
    defaultBranch: string
    createdAt: string
    updatedAt: string
    pushedAt: string
    topics: string[]
    license: {
        name: string
        spdxId: string | null
        url: string | null
    } | null
    owner: {
        login: string
        id: number
        avatarUrl: string
        htmlUrl: string
        type: string
    }
    isPrivate: boolean
    isFork: boolean
    isArchived: boolean
    hasIssues: boolean
    hasProjects: boolean
    hasWiki: boolean
    hasPages: boolean
    hasDownloads: boolean
    archived: boolean
    disabled: boolean
    visibility: string
    forksCount: number
    stargazersCount: number
    watchersCount: number
    openIssuesCount: number
    networkCount: number
    subscribersCount: number
}

// Function to get GitHub repository information
export async function getGitHubRepositoryInfo(repoUrl: string, githubToken?: string): Promise<GitHubRepoInfo | null> {
    try {
        // Extract owner and repo name from URL
        const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
        if (!urlMatch) {
            throw new Error('Invalid GitHub repository URL')
        }

        const [, owner, repo] = urlMatch
        const cleanRepo = repo.replace('.git', '')

        // Initialize Octokit
        const octokit = new Octokit({
            auth: githubToken || process.env.GITHUB_TOKEN
        })

        // Get repository information
        const { data: repoData } = await octokit.rest.repos.get({
            owner,
            repo: cleanRepo
        })

        // Get repository languages
        const { data: languages } = await octokit.rest.repos.listLanguages({
            owner,
            repo: cleanRepo
        })

        // Get repository topics
        const { data: topics } = await octokit.rest.repos.getAllTopics({
            owner,
            repo: cleanRepo
        })

        // Transform the data to our schema
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
            license: repoData.license ? {
                name: repoData.license.name,
                spdxId: repoData.license.spdx_id || null,
                url: repoData.license.url || null
            } : null,
            owner: {
                login: repoData.owner.login,
                id: repoData.owner.id,
                avatarUrl: repoData.owner.avatar_url,
                htmlUrl: repoData.owner.html_url,
                type: repoData.owner.type
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
            visibility: repoData.visibility || 'public',
            forksCount: repoData.forks_count,
            stargazersCount: repoData.stargazers_count,
            watchersCount: repoData.watchers_count,
            openIssuesCount: repoData.open_issues_count,
            networkCount: repoData.network_count,
            subscribersCount: repoData.subscribers_count
        }

        return repoInfo
    } catch (error) {
        console.error('Error fetching GitHub repository information:', error)
        return null
    }
}