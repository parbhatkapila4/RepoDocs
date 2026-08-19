export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryIf?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryIf = () => true,
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !retryIf(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));

      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

export function logError(error: any, context?: Record<string, any>) {
  const errorMessage = error?.message || "Unknown error";
  const errorStack = error?.stack;
  if (context?.projectId || context?.file) {
    console.error("Indexing/Embedding Error:", {
      message: errorMessage,
      context: context,
      stack: errorStack,
    });
  } else {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error:",
        errorMessage,
        context ? `Context: ${JSON.stringify(context)}` : ""
      );
    }
  }
}
