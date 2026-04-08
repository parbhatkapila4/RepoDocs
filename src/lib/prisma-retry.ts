import { Prisma } from "@prisma/client";

const RETRY_CODES = new Set([
  "P1017",
  "P1001",
  "P1008",
  "P1011",
]);

const BASE_DELAY_MS = 75;
const DEFAULT_ATTEMPTS = 4;

export async function withPrismaRetry<T>(
  fn: () => Promise<T>,
  attempts: number = DEFAULT_ATTEMPTS
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const retryable =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        RETRY_CODES.has(e.code);
      if (retryable && i < attempts - 1) {
        await new Promise((r) =>
          setTimeout(r, BASE_DELAY_MS * Math.pow(2, i))
        );
        continue;
      }
      throw e;
    }
  }
  throw last;
}
