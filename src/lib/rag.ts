import prisma from "./prisma";
import { getGenerateEmbeddings } from "./gemini";
import { openrouterChatCompletion } from "./openrouter";
import { searchRepoMemory } from "./memory";
import {
  getGitHubRepositoryInfo,
  fetchRepositoryReadmeRaw,
  isHighValueFile,
  listGithubRepoPathsForPreindex,
  fetchGithubPreindexFileContents,
} from "./github";
import { buildQuickDependencyGraphFromGitTree } from "./architecture";

const PREINDEX_FETCH_FILES = 22;
const PREINDEX_PATH_LIST_CAP = 200;
const PREINDEX_EXCERPT_BUDGET = 90_000;

const PREINDEX_PREFERRED_LOWER = [
  "readme.md",
  "readme.markdown",
  "contributing.md",
  "package.json",
  "pnpm-workspace.yaml",
  "turbo.json",
  "tsconfig.json",
  "next.config.ts",
  "next.config.mjs",
  "next.config.js",
  "vite.config.ts",
  "vite.config.mts",
  "vitest.config.ts",
  "prisma/schema.prisma",
  "dockerfile",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "app/layout.tsx",
  "app/page.tsx",
];

function pickPreindexFetchPaths(allPaths: string[], maxFiles: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const byLower = new Map<string, string>();
  for (const p of allPaths) {
    byLower.set(p.replace(/\\/g, "/").toLowerCase(), p);
  }
  const push = (p: string) => {
    if (!p || seen.has(p)) return;
    seen.add(p);
    out.push(p);
  };
  for (const want of PREINDEX_PREFERRED_LOWER) {
    if (out.length >= maxFiles) break;
    const exact = byLower.get(want);
    if (exact) push(exact);
  }
  for (const p of allPaths) {
    if (out.length >= maxFiles) break;
    if (isHighValueFile(p)) push(p);
  }
  const need = maxFiles - out.length;
  if (need > 0 && allPaths.length > 0) {
    const stride = Math.max(1, Math.floor(allPaths.length / need));
    for (let i = 0; i < allPaths.length && out.length < maxFiles; i += stride) {
      push(allPaths[i]);
    }
  }
  for (const p of allPaths) {
    if (out.length >= maxFiles) break;
    push(p);
  }
  return out.slice(0, maxFiles);
}

export interface RAGQueryResult {
  answer: string;
  sources: {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[];
  tokensUsed?: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;

  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  modelUsed?: string;
  memoryHitCount?: number;
  avgMemorySimilarity?: number | null;
}


export async function searchCodebase(
  projectId: string,
  query: string,
  limit: number = 5
): Promise<
  {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[]
> {
  try {

    const queryEmbedding = await getGenerateEmbeddings(query);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error("Failed to generate query embedding");
    }


    const results = await prisma.$queryRaw<
      {
        id: string;
        fileName: string;
        sourceCode: string;
        Summary: string;
        similarity: number;
      }[]
    >`
      SELECT 
        id,
        "fileName",
        "sourceCode",
        "Summary",
        1 - ("summaryEmbedding" <=> ${queryEmbedding}::vector) as similarity
      FROM "SourceCodeEmbeddings"
      WHERE "projectId" = ${projectId}
        AND "summaryEmbedding" IS NOT NULL
      ORDER BY "summaryEmbedding" <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    return results.map((r) => ({
      fileName: r.fileName,
      sourceCode: r.sourceCode,
      summary: r.Summary,
      similarity: r.similarity,
    }));
  } catch (error) {
    console.error("Error searching codebase:", error);
    throw new Error("Failed to search codebase");
  }
}

export type QueryCodebaseMode = "default" | "guidance";

export interface QueryCodebaseOptions {
  mode?: QueryCodebaseMode;
}

export async function queryCodebase(
  projectId: string,
  question: string,
  conversationHistory?: { role: "user" | "assistant"; content: string }[],
  options?: QueryCodebaseOptions
): Promise<RAGQueryResult> {
  try {
    const relevantCode = await searchCodebase(projectId, question, 5);

    if (relevantCode.length === 0) {
      return {
        answer:
          "I couldn't find any relevant code for your question. The repository might not be fully indexed yet, or your question might be too specific.",
        sources: [],
        avgMemorySimilarity: null,
      };
    }

    let memoryContext = "";
    let memoryHitCount = 0;
    let avgMemorySimilarity: number | null = null;
    try {
      const queryEmbedding = await getGenerateEmbeddings(question);
      if (queryEmbedding?.length) {
        const memories = await searchRepoMemory(projectId, queryEmbedding, 3);
        memoryHitCount = memories.length;
        avgMemorySimilarity =
          memories.length > 0
            ? memories.reduce((s, m) => s + m.similarity, 0) / memories.length
            : null;
        if (memories.length > 0) {
          memoryContext =
            "\n\n## Repository memory (use to inform answers; code overrides when in conflict):\n" +
            memories
              .map(
                (m) => `[Memory: ${m.type}] ${m.content}`
              )
              .join("\n");
        }
      }
    } catch {
      memoryContext = "";
    }

    const codeContext = relevantCode
      .map((code, idx) => {
        return `
[Source ${idx + 1}: ${code.fileName}] (Relevance: ${(code.similarity * 100).toFixed(1)}%)
Summary: ${code.summary}

Code:
\`\`\`
${code.sourceCode.slice(0, 1000)}${code.sourceCode.length > 1000 ? "..." : ""}
\`\`\`
`;
      })
      .join("\n\n---\n\n");

    const guidanceBlock = `
## GUIDANCE MODE (user is asking where to make changes):
The user is asking where to make changes in the codebase. Respond in the following format. Do not generate full code unless the user explicitly asks for code.
(1) **Files to modify**: List the files in recommended order of changes.
(2) **Order of changes**: Brief step-by-step (e.g. add types first, then API, then UI).
(3) **Migration / backward-compatibility**: Any considerations for existing callers or data.
(4) **Risks**: What could break or what to watch for.
(5) **Tests to update**: Which test files or areas to touch.
Write like a senior engineer giving guidance before coding.`;

    const baseSystemContent = `You are a senior software engineer and technical documentation expert with 15+ years of experience. Your role is to help developers understand their codebase with professional, comprehensive, and crystal-clear explanations.

You have access to the following relevant code snippets from their repository:

${codeContext}
${memoryContext}

## CORE RESPONSIBILITIES:

1. **Professional Communication**: 
   - Use clear, professional language appropriate for technical documentation
   - Structure your responses logically with proper headings and sections
   - Maintain a helpful and knowledgeable tone throughout

2. **Comprehensive Detail**:
   - Provide thorough explanations that cover all aspects of the question
   - Include context about how components interact with each other
   - Explain the "why" behind code decisions, not just the "what"
   - Break down complex concepts into digestible parts
   - Include relevant examples and use cases when applicable

3. **Clarity and Precision**:
   - Start with a clear, direct answer to the user's question
   - Use structured formatting (headings, bullet points, code blocks)
   - Define technical terms when first introduced
   - Provide step-by-step explanations for complex processes
   - Use visual separators and formatting to improve readability

4. **Code Understanding**:
   - Analyze the provided code snippets thoroughly
   - Explain the purpose and functionality of each relevant section
   - Identify patterns, design decisions, and architectural choices
   - Point out relationships between different files and components
   - Highlight important implementation details

5. **Actionable Information**:
   - Provide specific file paths and line references when relevant
   - Include code examples that demonstrate concepts clearly
   - Offer practical insights about how to use or modify the code
   - Suggest best practices or improvements when appropriate
   - Explain potential edge cases or considerations

## RESPONSE STRUCTURE:

For each question, structure your response as follows:

1. **Direct Answer**: Start with a clear, concise answer to the question
2. **Detailed Explanation**: Provide comprehensive context and background
3. **Code Analysis**: Break down relevant code sections with explanations
4. **Examples**: Include practical examples or use cases when helpful
5. **References**: Always cite specific files and code locations
6. **Additional Context**: Include related information that might be helpful

## FORMATTING GUIDELINES:

- Use markdown formatting extensively (headings, code blocks, lists, tables)
- Format code examples with proper syntax highlighting
- Use code blocks for all code snippets, even inline code
- Create clear visual hierarchy with headings and sections
- Use bullet points or numbered lists for step-by-step processes
- Include file paths in code format: \`path/to/file.ts\`

## IMPORTANT RULES:

- **Accuracy First**: Only provide information based on the code provided. If information is missing, clearly state what's not available
- **Be Thorough**: Don't skip details that would help the user fully understand the concept
- **Be Clear**: Avoid jargon without explanation. If you must use technical terms, define them
- **Cite Sources**: Always reference which files you're discussing: "In \`src/lib/auth.ts\`..."
- **Professional Tone**: Maintain a helpful, expert tone - like a senior engineer mentoring a colleague
- **Structure Matters**: Use clear sections, headings, and formatting to make responses easy to scan and understand
- **Context Awareness**: Consider the conversation history and build upon previous answers when relevant

## WHEN INFORMATION IS LIMITED:

If the provided code doesn't contain enough information to fully answer the question:
- Clearly state what information is available
- Explain what can be inferred from the code
- Specify what additional information would be needed for a complete answer
- Suggest where the user might find the missing information

Remember: Your goal is to make the codebase as understandable as possible. Be detailed, be clear, be professional, and always prioritize the user's understanding.`;

    const systemContent =
      options?.mode === "guidance"
        ? baseSystemContent + guidanceBlock
        : baseSystemContent;

    const messages: {
      role: "user" | "assistant" | "system";
      content: string;
    }[] = [
        {
          role: "system",
          content: systemContent,
        },
      ];

    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    messages.push({
      role: "user",
      content: question,
    });

    const chatResult = await openrouterChatCompletion({
      model: "google/gemini-2.5-flash",
      messages,
      temperature: 0.3,
    });

    const usage = chatResult.usage;
    return {
      answer: chatResult.content,
      sources: relevantCode,
      usage: chatResult.usage,
      model: chatResult.model,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      modelUsed: chatResult.model,
      memoryHitCount,
      avgMemorySimilarity,
    };
  } catch (error) {
    console.error("Error in RAG query:", error);
    throw new Error("Failed to process your question. Please try again.");
  }
}

export async function queryCodebasePreindex(
  repoUrl: string,
  githubToken: string | null | undefined,
  question: string,
  conversationHistory?: { role: "user" | "assistant"; content: string }[],
  options?: QueryCodebaseOptions
): Promise<RAGQueryResult> {
  const token = githubToken || undefined;
  const repoInfo = await getGitHubRepositoryInfo(repoUrl, token);
  const treeMeta = await listGithubRepoPathsForPreindex(repoUrl, token);

  let paths: string[] = treeMeta?.paths ?? [];
  const owner = treeMeta?.owner;
  const repoName = treeMeta?.repo;
  const branch =
    treeMeta?.defaultBranch ?? repoInfo?.defaultBranch ?? "main";

  if (paths.length === 0) {
    const graph = await buildQuickDependencyGraphFromGitTree(repoUrl, token);
    paths = graph.nodes.map((n) => n.path).slice(0, 220);
  }

  const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  const own = owner ?? urlMatch?.[1];
  const rep = repoName ?? urlMatch?.[2]?.replace(/\.git$/, "");

  const picked = pickPreindexFetchPaths(paths, PREINDEX_FETCH_FILES);
  const fetched =
    own && rep
      ? await fetchGithubPreindexFileContents(
        own,
        rep,
        picked,
        branch,
        token,
        7200,
        PREINDEX_FETCH_FILES
      )
      : [];

  const readme = await fetchRepositoryReadmeRaw(repoUrl, token, 10_000);
  const hasReadmeInFetched = fetched.some((f) =>
    /^readme(\.|$)/i.test(f.path.split("/").pop() || "")
  );
  const readmeSupplement =
    readme && !hasReadmeInFetched
      ? `\n## README (supplementary excerpt)\n${readme}\n`
      : "";

  const excerptParts: string[] = [];
  let excerptUsed = 0;
  for (const f of fetched) {
    const header = `\n## File: ${f.path}${f.truncated ? " (trimmed per file)" : ""}\n\`\`\`\n`;
    const footer = `\n\`\`\`\n`;
    const room = PREINDEX_EXCERPT_BUDGET - excerptUsed - header.length - footer.length;
    if (room < 200) break;
    const body =
      f.text.length > room ? `${f.text.slice(0, room)}\n...` : f.text;
    excerptParts.push(header + body + footer);
    excerptUsed += header.length + body.length + footer.length;
  }

  const pathList = paths.length
    ? paths.slice(0, PREINDEX_PATH_LIST_CAP).join("\n")
    : "(no file paths discovered yet)";

  const metaBlock = repoInfo
    ? `Repository: ${repoInfo.fullName}
Description: ${repoInfo.description ?? "n/a"}
Default branch: ${repoInfo.defaultBranch}
Primary language: ${repoInfo.language ?? "n/a"}
Topics: ${repoInfo.topics?.join(", ") || "n/a"}
Stars / forks: ${repoInfo.stars} / ${repoInfo.forks}`
    : "Repository metadata could not be loaded (check URL, privacy, or GitHub token).";

  const guidanceBlock =
    options?.mode === "guidance"
      ? `\n## GUIDANCE MODE\nGive file-oriented guidance using paths from the list and excerpts. Do not invent files that are not listed.`
      : "";

  const fileExcerptSection =
    excerptParts.length > 0
      ? `## File contents (raw from GitHub; pre-index)\n${excerptParts.join("")}`
      : "";

  const systemContent = `You help developers understand a GitHub repository. Embeddings may still be indexing in the background.

Use the metadata, the file excerpts (when present), any README supplement, and the path list. Do not claim you read files that are not in the excerpts or README supplement. If detail is missing, say what is missing and that full indexing will improve answers.
${guidanceBlock}

## Context

${metaBlock}

${fileExcerptSection}
${readmeSupplement}
## File paths (from GitHub tree, truncated)
${pathList}`;

  const messages: {
    role: "user" | "assistant" | "system";
    content: string;
  }[] = [{ role: "system", content: systemContent }];

  if (conversationHistory?.length) {
    messages.push(...conversationHistory);
  }
  messages.push({ role: "user", content: question });

  const chatResult = await openrouterChatCompletion({
    model: "google/gemini-2.5-flash",
    messages,
    temperature: 0.35,
  });

  const usage = chatResult.usage;
  let sources = fetched.map((f, i) => ({
    fileName: f.path,
    sourceCode: f.text.slice(0, 600),
    summary: f.truncated
      ? "Pre-index excerpt (trimmed per file)"
      : "Pre-index file from GitHub",
    similarity: Math.max(0.22, 0.58 - i * 0.02),
  }));
  if (sources.length === 0 && readme && !hasReadmeInFetched) {
    sources = [
      {
        fileName: "README.md",
        sourceCode: readme.slice(0, 500),
        summary: "README excerpt (pre-index)",
        similarity: 0.45,
      },
    ];
  } else if (sources.length === 0 && paths.length) {
    sources = paths.slice(0, 10).map((p) => ({
      fileName: p,
      sourceCode: "",
      summary: "Tree path only (pre-index; could not fetch contents)",
      similarity: 0.25,
    }));
  }

  return {
    answer: chatResult.content,
    sources,
    usage: chatResult.usage,
    model: chatResult.model,
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    modelUsed: chatResult.model,
    memoryHitCount: 0,
    avgMemorySimilarity: null,
  };
}

export async function* queryCodebaseStream(
  projectId: string,
  question: string,
  conversationHistory?: { role: "user" | "assistant"; content: string }[]
): AsyncGenerator<string, void, unknown> {
  try {
    const relevantCode = await searchCodebase(projectId, question, 5);

    if (relevantCode.length === 0) {
      yield "I couldn't find any relevant code for your question.";
      return;
    }

    const codeContext = relevantCode
      .map((code, idx) => {
        return `
[Source ${idx + 1}: ${code.fileName}] (Relevance: ${(code.similarity * 100).toFixed(1)}%)
Summary: ${code.summary}

Code:
\`\`\`
${code.sourceCode.slice(0, 1000)}${code.sourceCode.length > 1000 ? "..." : ""}
\`\`\`
`;
      })
      .join("\n\n---\n\n");

    const systemMessage = `You are a senior software engineer and technical documentation expert with 15+ years of experience. Your role is to help developers understand their codebase with professional, comprehensive, and crystal-clear explanations.

You have access to the following relevant code snippets from their repository:

${codeContext}

## CORE RESPONSIBILITIES:

1. **Professional Communication**: 
   - Use clear, professional language appropriate for technical documentation
   - Structure your responses logically with proper headings and sections
   - Maintain a helpful and knowledgeable tone throughout

2. **Comprehensive Detail**:
   - Provide thorough explanations that cover all aspects of the question
   - Include context about how components interact with each other
   - Explain the "why" behind code decisions, not just the "what"
   - Break down complex concepts into digestible parts
   - Include relevant examples and use cases when applicable

3. **Clarity and Precision**:
   - Start with a clear, direct answer to the user's question
   - Use structured formatting (headings, bullet points, code blocks)
   - Define technical terms when first introduced
   - Provide step-by-step explanations for complex processes
   - Use visual separators and formatting to improve readability

4. **Code Understanding**:
   - Analyze the provided code snippets thoroughly
   - Explain the purpose and functionality of each relevant section
   - Identify patterns, design decisions, and architectural choices
   - Point out relationships between different files and components
   - Highlight important implementation details

5. **Actionable Information**:
   - Provide specific file paths and line references when relevant
   - Include code examples that demonstrate concepts clearly
   - Offer practical insights about how to use or modify the code
   - Suggest best practices or improvements when appropriate
   - Explain potential edge cases or considerations

## RESPONSE STRUCTURE:

For each question, structure your response as follows:

1. **Direct Answer**: Start with a clear, concise answer to the question
2. **Detailed Explanation**: Provide comprehensive context and background
3. **Code Analysis**: Break down relevant code sections with explanations
4. **Examples**: Include practical examples or use cases when helpful
5. **References**: Always cite specific files and code locations
6. **Additional Context**: Include related information that might be helpful

## FORMATTING GUIDELINES:

- Use markdown formatting extensively (headings, code blocks, lists, tables)
- Format code examples with proper syntax highlighting
- Use code blocks for all code snippets, even inline code
- Create clear visual hierarchy with headings and sections
- Use bullet points or numbered lists for step-by-step processes
- Include file paths in code format: \`path/to/file.ts\`

## IMPORTANT RULES:

- **Accuracy First**: Only provide information based on the code provided. If information is missing, clearly state what's not available
- **Be Thorough**: Don't skip details that would help the user fully understand the concept
- **Be Clear**: Avoid jargon without explanation. If you must use technical terms, define them
- **Cite Sources**: Always reference which files you're discussing: "In \`src/lib/auth.ts\`..."
- **Professional Tone**: Maintain a helpful, expert tone - like a senior engineer mentoring a colleague
- **Structure Matters**: Use clear sections, headings, and formatting to make responses easy to scan and understand
- **Context Awareness**: Consider the conversation history and build upon previous answers when relevant

## WHEN INFORMATION IS LIMITED:

If the provided code doesn't contain enough information to fully answer the question:
- Clearly state what information is available
- Explain what can be inferred from the code
- Specify what additional information would be needed for a complete answer
- Suggest where the user might find the missing information

Remember: Your goal is to make the codebase as understandable as possible. Be detailed, be clear, be professional, and always prioritize the user's understanding.`;

    yield systemMessage;

    const answer = await queryCodebase(
      projectId,
      question,
      conversationHistory
    );
    yield answer.answer;
  } catch (error) {
    console.error("Error in RAG streaming query:", error);
    yield "Failed to process your question. Please try again.";
  }
}
