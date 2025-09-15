import { Document } from "@langchain/core/documents"
import { openrouterSingleMessage } from "@/lib/openrouter"
import { GoogleGenAI } from "@google/genai";

const genAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })


export async function getSummariseCode(doc: Document) {
    console.log("Summarising code for ", doc.metadata.source)
    try {
        const code = doc.pageContent.slice(0, 10000)

        const prompt = `You are an intelligent senior software engineer who specializes in onboarding junior software engineers onto projects.
You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
Here is the code: 
---
${code}
---
Give a summary no more than 100 words of the code above.`

        return openrouterSingleMessage(prompt)
    } catch (error) {
        console.error("Error summarising code for ", doc.metadata.source, error)
        return ""
    }
}

export async function getGenerateEmbeddings(summary: string) {
    console.log("Generating embeddings")
    try {
        const response = await genAi.models.embedContent({
            model: 'gemini-embedding-001',
            contents: summary as string,
            config: {
                outputDimensionality: 768,
            },
        });
        if (!response?.embeddings) {
            return []
        }
        const embeddingLength = response?.embeddings[0]?.values;

        return embeddingLength
    } catch (error) {
        console.error("Error generating embeddings:", error)
        return []
    }
}
