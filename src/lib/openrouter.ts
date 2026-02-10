const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

if (!OPENROUTER_API_KEY) {
  throw new Error("Missing OPENROUTER_API_KEY environment variable");
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  system?: string;
}

interface EmbeddingOptions {
  model?: string;
  input: string;
}

export interface OpenRouterChatResult {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

export async function openrouterChatCompletion(
  options: ChatCompletionOptions
): Promise<OpenRouterChatResult> {
  const {
    model: modelOption = "google/gemini-2.5-flash-lite",
    messages,
    temperature = 0.7,
    max_tokens = 8000,
    system,
  } = options;

  const timeout =
    max_tokens >= 200000
      ? 1200000
      : max_tokens >= 100000
        ? 900000
        : max_tokens >= 50000
          ? 600000
          : max_tokens >= 16000
            ? 300000
            : max_tokens >= 8000
              ? 240000
              : 120000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response: Response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://repodoc.dev",
        "X-Title": "RepoDocs",
      },
      body: JSON.stringify({
        model: modelOption,
        messages: system
          ? [{ role: "system", content: system }, ...messages]
          : messages,
        temperature,
        max_tokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      model?: string;
    };

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from OpenRouter API");
    }

    const content = data.choices[0].message.content ?? "";
    const usage =
      data.usage &&
        typeof data.usage.prompt_tokens === "number" &&
        typeof data.usage.completion_tokens === "number"
        ? {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens:
            typeof data.usage.total_tokens === "number"
              ? data.usage.total_tokens
              : data.usage.prompt_tokens + data.usage.completion_tokens,
        }
        : undefined;
    const modelFromResponse =
      typeof data.model === "string" && data.model.length > 0
        ? data.model
        : undefined;

    return { content, usage, model: modelFromResponse };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutMinutes = Math.round(timeout / 60000);
      console.error(
        `OpenRouter API request timed out after ${timeoutMinutes} minutes`
      );
      throw new Error(
        `Request timed out after ${timeoutMinutes} minutes. The documentation generation is taking longer than expected. Please try again.`
      );
    }
    console.error("Error calling OpenRouter chat completion:", error);
    throw error;
  }
}

export async function openrouterSingleMessage(
  prompt: string,
  model?: string,
  maxTokens?: number,
  system?: string
): Promise<OpenRouterChatResult> {
  return openrouterChatCompletion({
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: maxTokens,
    system,
  });
}
