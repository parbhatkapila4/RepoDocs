/**
 * RAG (Retrieval-Augmented Generation) Query System
 * Implements semantic search over codebase embeddings and generates AI responses
 */

import prisma from './prisma';
import { getGenerateEmbeddings } from './gemini';
import { openrouterChatCompletion } from './openrouter';

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
    console.error('Error searching codebase:', error);
    throw new Error('Failed to search codebase');
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
        content: `You are a senior software engineer and technical documentation expert with 15+ years of experience. Your role is to help developers understand their codebase with professional, comprehensive, and crystal-clear explanations.

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

Remember: Your goal is to make the codebase as understandable as possible. Be detailed, be clear, be professional, and always prioritize the user's understanding.`,
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
    console.error('Error in RAG query:', error);
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

    // Note: Actual streaming would require OpenRouter streaming API
    // For now, we'll yield the full response
    const answer = await queryCodebase(projectId, question, conversationHistory);
    yield answer.answer;
  } catch (error) {
    console.error('Error in RAG streaming query:', error);
    yield 'Failed to process your question. Please try again.';
  }
}

