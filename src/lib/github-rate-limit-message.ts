export function isLikelyGitHubRateLimitMessage(
  message: string | null | undefined
): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("quota exhausted") ||
    lower.includes("api rate") ||
    (lower.includes("403") && lower.includes("github"))
  );
}
export const isRateLimitError = isLikelyGitHubRateLimitMessage;
