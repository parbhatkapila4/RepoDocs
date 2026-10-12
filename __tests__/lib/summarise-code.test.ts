jest.mock("@google/genai", () => ({ GoogleGenAI: jest.fn() }));
jest.mock("@/lib/openrouter", () => ({
  ...jest.requireActual("@/lib/openrouter"),
  openrouterSingleMessage: jest.fn(),
}));

import type { Document } from "@langchain/core/documents";
import {
  OpenRouterError,
  isRetryableOpenRouterError,
  openrouterChatCompletion,
  openrouterSingleMessage,
} from "@/lib/openrouter";
import { EmptySummaryError, getSummariseCode } from "@/lib/gemini";
import { retryAsync } from "@/lib/errors";

const singleMessage = openrouterSingleMessage as jest.Mock;

const doc = {
  pageContent: "export const rate = 0.07;\n",
  metadata: { source: "src/pricing.ts" },
} as unknown as Document;

function reply(content: string) {
  return {
    content,
    usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
    model: "google/gemini-2.5-flash-lite",
  };
}
function summariseWithRetry() {
  return retryAsync(() => getSummariseCode(doc), {
    maxRetries: 2,
    initialDelay: 1,
    retryIf: isRetryableOpenRouterError,
  });
}

let consoleError: jest.SpyInstance;
beforeAll(() => {
  consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => consoleError.mockRestore());
beforeEach(() => jest.clearAllMocks());

describe("getSummariseCode", () => {
  it("returns the summary with its token usage", async () => {
    singleMessage.mockResolvedValue(reply("Pricing constants for the ledger."));

    await expect(getSummariseCode(doc)).resolves.toEqual({
      content: "Pricing constants for the ledger.",
      promptTokens: 100,
      completionTokens: 20,
      totalTokens: 120,
      modelUsed: "google/gemini-2.5-flash-lite",
    });
  });

  it.each(["", "  \n\t"])(
    "throws instead of returning an empty summary (%j), carrying the call's usage",
    async (content) => {
      singleMessage.mockResolvedValue(reply(content));

      const error = await getSummariseCode(doc).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(EmptySummaryError);
      expect((error as Error).message).toContain("empty summary");
      expect((error as EmptySummaryError).usage).toEqual({
        promptTokens: 100,
        completionTokens: 20,
        totalTokens: 120,
        modelUsed: "google/gemini-2.5-flash-lite",
      });
    },
  );

  it("propagates API errors instead of returning an empty summary", async () => {
    const apiError = new OpenRouterError(
      "OpenRouter API error: 503 Service Unavailable - busy",
      503,
    );
    singleMessage.mockRejectedValue(apiError);

    await expect(getSummariseCode(doc)).rejects.toBe(apiError);
  });
});

describe("summary retries", () => {
  it("retries an empty summary twice, then gives up", async () => {
    singleMessage.mockResolvedValue(reply(""));

    await expect(summariseWithRetry()).rejects.toThrow("empty summary");
    expect(singleMessage).toHaveBeenCalledTimes(3);
  });

  it("recovers when a rate limit clears on retry", async () => {
    singleMessage
      .mockRejectedValueOnce(
        new OpenRouterError(
          "OpenRouter API error: 429 Too Many Requests - slow down",
          429,
        ),
      )
      .mockResolvedValue(reply("Pricing constants for the ledger."));

    await expect(summariseWithRetry()).resolves.toMatchObject({
      content: "Pricing constants for the ledger.",
    });
    expect(singleMessage).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["a missing key", new OpenRouterError("OPENROUTER_API_KEY is not set.")],
    ["a 400", new OpenRouterError("OpenRouter API error: 400 Bad Request", 400)],
    ["a 401", new OpenRouterError("OpenRouter API error: 401 Unauthorized", 401)],
    ["a 402", new OpenRouterError("OpenRouter API error: 402 Payment Required", 402)],
    ["a 404", new OpenRouterError("OpenRouter API error: 404 Not Found", 404)],
  ])("does not retry %s", async (_label, error) => {
    singleMessage.mockRejectedValue(error);

    await expect(summariseWithRetry()).rejects.toBe(error);
    expect(singleMessage).toHaveBeenCalledTimes(1);
  });
});

describe("OpenRouter errors", () => {
  const realFetch = global.fetch;
  const realKey = process.env.OPENROUTER_API_KEY;

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    global.fetch = realFetch;
    if (realKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = realKey;
  });

  const ask = () =>
    openrouterChatCompletion({ messages: [{ role: "user", content: "hi" }] });

  it("tags an HTTP failure with its status", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "bad key",
    }) as unknown as typeof fetch;

    const error = await ask().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(OpenRouterError);
    expect((error as OpenRouterError).status).toBe(401);
    expect(isRetryableOpenRouterError(error)).toBe(false);
  });

  it("reports a missing key as a non-retryable error", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const error = await ask().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(OpenRouterError);
    expect((error as OpenRouterError).status).toBeNull();
    expect(isRetryableOpenRouterError(error)).toBe(false);
  });

  it("treats rate limits, server errors and network failures as retryable", () => {
    expect(isRetryableOpenRouterError(new OpenRouterError("x", 429))).toBe(true);
    expect(isRetryableOpenRouterError(new OpenRouterError("x", 503))).toBe(true);
    expect(isRetryableOpenRouterError(new TypeError("fetch failed"))).toBe(true);
  });
});
