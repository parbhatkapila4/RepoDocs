import prisma from "./prisma";
import { getGenerateEmbeddings } from "./gemini";
import { openrouterChatCompletion } from "./openrouter";

const VALID_TYPES = ["concept", "decision", "relationship"] as const;

export async function extractMemoriesFromConversation(
  question: string,
  answer: string
): Promise<{ type: string; content: string }[]> {
  const systemMessage = `You are a knowledge extraction system. Your task is to extract only long-term, reusable knowledge about the codebase from a user question and assistant answer.

RULES:
1. Look at the user question and the assistant answer.
2. Extract ONLY long-term, durable knowledge: facts, architectural decisions, relationships between modules or systems.
3. Output a valid JSON array of objects. Each object must have exactly two keys: "type" and "content".
4. "type" MUST be one of: "concept", "decision", "relationship".
   - concept: Factual knowledge about the repo (how something works, what a component does)
   - decision: Architectural or engineering decisions (why something was built a certain way)
   - relationship: Relationships between modules, systems, or components
5. Ignore transient or conversational content. Do not extract greetings, follow-ups, or one-off clarifications.
6. Return at most 5 items. If nothing worth remembering, return [].
7. Output only the JSON array, no other text.`;

  const userMessage = `Question: ${question}\n\nAnswer:\n${answer}`;

  const chatResult = await openrouterChatCompletion({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
  });

  const trimmed = chatResult.content.trim();


  let jsonStr = trimmed;
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter(
      (item): item is { type: string; content: string } =>
        item != null &&
        typeof item === "object" &&
        typeof item.type === "string" &&
        typeof item.content === "string" &&
        VALID_TYPES.includes(item.type as (typeof VALID_TYPES)[number])
    )
    .map((item) => ({ type: item.type, content: item.content }));
}


export async function storeMemories(
  projectId: string,
  items: { type: string; content: string }[]
): Promise<void> {
  for (const item of items) {
    if (!VALID_TYPES.includes(item.type as (typeof VALID_TYPES)[number])) {
      continue;
    }

    try {
      const embedding = await getGenerateEmbeddings(item.content);
      if (!embedding || embedding.length === 0) {
        continue;
      }

      const created = await prisma.repoMemory.create({
        data: {
          projectId,
          type: item.type,
          content: item.content,
          relevanceScore: 1.0,
        },
      });

      await prisma.$executeRaw`
        UPDATE "RepoMemory"
        SET "embedding" = ${embedding}::vector
        WHERE "id" = ${created.id}
      `;
    } catch (err) {
      console.error("[RepoMemory] Failed to store memory:", err);
      // Don't throw - fire-and-forget; caller should not be blocked
    }
  }
}


export async function searchRepoMemory(
  projectId: string,
  queryEmbedding: number[],
  limit: number
): Promise<{ type: string; content: string; similarity: number }[]> {
  try {
    const results = await prisma.$queryRaw<
      { id: string; type: string; content: string; similarity: number }[]
    >`
      SELECT id, type, content, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
      FROM "RepoMemory"
      WHERE "projectId" = ${projectId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    return results.map((r) => ({
      type: r.type,
      content: r.content,
      similarity: r.similarity,
    }));
  } catch (err) {
    console.error("[RepoMemory] Search failed:", err);
    return [];
  }
}
