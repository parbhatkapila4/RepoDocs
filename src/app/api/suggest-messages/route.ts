import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export const maxDuration = 30;  

export async function POST(req: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), maxDuration * 1000);

  try {
    const prompt = "Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for an anonymous social messaging platform, like Qooh.me, and should be suitable for a diverse audience. Avoid personal or sensitive topics, focusing instead on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'What’s a hobby you’ve recently started?||If you could have dinner with any historical figure, who would it be?||What’s a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and contribute to a positive and welcoming conversational environment.";

    const result = streamText({
      model: openai("gpt-4o"),
      messages: [{ role: "user", content: prompt }],
    });

    clearTimeout(timeout);
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    clearTimeout(timeout);

    if (error?.name === "APIError") {
      const { name, status, headers, message } = error;

      console.error("AI APIError:", { name, status, message, headers });

      return NextResponse.json(
        { name, status, headers, message },
        { status: status ?? 500 }
      );
    }

    if (
      error?.name === "AbortError" ||
      String(error?.message).toLowerCase().includes("aborted")
    ) {
      console.error("Request timed out:", error);
      return NextResponse.json(
        { name: "AbortError", status: 504, message: "Request timed out." },
        { status: 504 }
      );
    }

    console.error("An unexpected error occurred", error);
    throw error;
  }
}
