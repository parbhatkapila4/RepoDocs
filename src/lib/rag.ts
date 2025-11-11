/**
 * RAG (Retrieval-Augmented Generation) Query System
 * Implements semantic search over codebase embeddings and generates AI responses
 */

import prisma from './prisma';
import { getGenerateEmbeddings } from './gemini';
import { openrouterChatCompletion } from './openrouter';
import { logger } from './logger';

export interface RAGQueryResult {
  answer: string;
  sources: {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[];
  tokensUsed?: number;
}

/**
 * Performs semantic search over codebase embeddings using vector similarity
 */
export async function searchCodebase(
  projectId: string,
  query: string,
  limit: number = 5
): Promise<{
  fileName: string;
  sourceCode: string;
  summary: string;
  similarity: number;
}[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await getGenerateEmbeddings(query);
    
    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error('Failed to generate query embedding');
    }

    // Perform vector similarity search using PostgreSQL pgvector
    // Using cosine similarity (<=> operator in pgvector)
    const results = await prisma.$queryRaw<{
      id: string;
      fileName: string;
      sourceCode: string;
      Summary: string;
      similarity: number;
    }[]>`
      SELECT 
        id,
        "fileName",
        "sourceCode",
        "Summary",
        1 - ("summaryEmbedding" <=> ${queryEmbedding}::vector) as similarity
      FROM "SourceCodeEmbiddings"
      WHERE "projectId" = ${projectId}
        AND "summaryEmbedding" IS NOT NULL
      ORDER BY "summaryEmbedding" <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    return results.map(r => ({
      fileName: r.fileName,
      sourceCode: r.sourceCode,
      summary: r.Summary,
      similarity: r.similarity,
    }));
  } catch (error) {
    logger.error('Error searching codebase', { error, projectId });
    // Fallback: return most recently indexed files if vector search fails
    const fallback = await prisma.sourceCodeEmbiddings.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        fileName: true,
        sourceCode: true,
        Summary: true,
      },
    });

    if (fallback.length === 0) {
      throw new Error(
        'Vector search failed and no indexed source files were found. Re-run indexing or check database configuration.',
      );
    }

    return fallback.map((item) => ({
      fileName: item.fileName,
      sourceCode: item.sourceCode,
      summary: item.Summary,
      similarity: 0,
    }));
  }
}

/**
 * Main RAG query function - retrieves relevant code and generates answer
 */
export async function queryCodebase(
  projectId: string,
  question: string,
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
): Promise<RAGQueryResult> {
  try {
    // Step 1: Retrieve relevant code snippets using vector similarity
    const relevantCode = await searchCodebase(projectId, question, 5);

    if (relevantCode.length === 0) {
      return {
        answer: "I couldn't find any relevant code for your question. The repository might not be fully indexed yet, or your question might be too specific.",
        sources: [],
      };
    }

    // Step 2: Build context from retrieved code
    const codeContext = relevantCode
      .map((code, idx) => {
        return `
[Source ${idx + 1}: ${code.fileName}] (Relevance: ${(code.similarity * 100).toFixed(1)}%)
Summary: ${code.summary}

Code:
\`\`\`
${code.sourceCode.slice(0, 1000)}${code.sourceCode.length > 1000 ? '...' : ''}
\`\`\`
`;
      })
      .join('\n\n---\n\n');

    // Step 3: Build conversation messages with RAG context
    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      {
        role: 'system',
        content: `You are an expert software engineer helping a developer understand their codebase. 

You have access to the following relevant code snippets from their repository:

${codeContext}

Instructions:
- Answer questions accurately based on the code provided
- Reference specific files and code when explaining
- If the code doesn't contain enough information, say so honestly
- Use markdown formatting for code examples
- Be concise but thorough
- If you see potential issues or improvements, mention them
- Always cite which files you're referencing`,
      },
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add current question
    messages.push({
      role: 'user',
      content: question,
    });

    // Step 4: Generate answer using AI with retrieved context
    const answer = await openrouterChatCompletion({
      model: 'google/gemini-2.5-flash',
      messages,
      temperature: 0.3, // Lower temperature for more accurate, factual responses
    });

    return {
      answer,
      sources: relevantCode,
    };
  } catch (error) {
    logger.error('Error in RAG query', { error, projectId });
    throw new Error('Failed to process your question. Please try again.');
  }
}

/**
 * Streaming version of RAG query for real-time responses
 */
export async function* queryCodebaseStream(
  projectId: string,
  question: string,
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
): AsyncGenerator<string, void, unknown> {
  try {
    // Step 1: Retrieve relevant code
    const relevantCode = await searchCodebase(projectId, question, 5);

    if (relevantCode.length === 0) {
      yield "I couldn't find any relevant code for your question.";
      return;
    }

    // Build context
    const codeContext = relevantCode
      .map((code, idx) => {
        return `
[Source ${idx + 1}: ${code.fileName}] (Relevance: ${(code.similarity * 100).toFixed(1)}%)
Summary: ${code.summary}

Code:
\`\`\`
${code.sourceCode.slice(0, 1000)}${code.sourceCode.length > 1000 ? '...' : ''}
\`\`\`
`;
      })
      .join('\n\n---\n\n');

    const systemMessage = `You are an expert software engineer helping a developer understand their codebase. 

You have access to the following relevant code snippets from their repository:

${codeContext}

Instructions:
- Answer questions accurately based on the code provided
- Reference specific files and code when explaining
- Use markdown formatting for code examples
- Be concise but thorough
- Always cite which files you're referencing`;

    yield systemMessage;

    // Note: Actual streaming would require OpenRouter streaming API
    // For now, we'll yield the full response
    const answer = await queryCodebase(projectId, question, conversationHistory);
    yield answer.answer;
  } catch (error) {
    logger.error('Error in RAG streaming query', { error, projectId });
    yield 'Failed to process your question. Please try again.';
  }
}

