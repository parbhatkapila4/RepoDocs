import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github'
import { Document } from '@langchain/core/documents'
import { getGenerateEmbeddings, getSummariseCode } from './gemini'
import prisma from '@/lib/prisma'


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
    const docs = await loadGithubRepository(githubUrl, process.env.GITHUB_TOKEN)
    const allEmbeddings = await generateEmbeddings(docs as Document[])
    await Promise.allSettled(allEmbeddings.map(async (result, index) => {
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