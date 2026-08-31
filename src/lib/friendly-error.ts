import { isLikelyGitHubRateLimitMessage } from "./github-rate-limit-message";

function text(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (raw instanceof Error) return raw.message;
  const m = (raw as { message?: unknown })?.message;
  return typeof m === "string" ? m : String(raw);
}

export function friendlyError(raw: unknown): string {
  const msg = text(raw);
  if (!msg) return "Something went wrong. Please try again.";
  const s = msg.toLowerCase();

  if (
    s.includes("can't reach database server") ||
    s.includes("cannot reach database server") ||
    s.includes("p1001") ||
    s.includes("prismaclientinitializationerror") ||
    s.includes("connection pool") ||
    s.includes("too many connections")
  ) {
    return "The database is temporarily unreachable - it may be asleep or restarting. Wait a moment and try again.";
  }
  if (
    s.includes("p1002") ||
    s.includes("timed out fetching a new connection")
  ) {
    return "The database took too long to respond. Try again in a moment.";
  }
  if (
    s.includes("p2021") ||
    s.includes("does not exist in the current database") ||
    (s.includes("relation") && s.includes("does not exist"))
  ) {
    return "A required database table is missing. Run the database migrations, then try again.";
  }
  if (s.includes("p2002") || s.includes("unique constraint")) {
    return "That record already exists.";
  }

  if (isLikelyGitHubRateLimitMessage(msg)) {
    return "GitHub's request limit was reached. It resets automatically - try again in a few minutes.";
  }
  if (s.includes("not found or private") || s.includes("404")) {
    return "That repository couldn't be found on GitHub. It may have been renamed, deleted, or made private.";
  }
  if (s.includes("bad credentials") || s.includes("401")) {
    return "GitHub rejected the access token. Add or refresh this project's token, then try again.";
  }
  if (s.includes("repo scope") || s.includes("insufficient")) {
    return "The GitHub token doesn't have access to this repository. Private repos need a token with the 'repo' scope.";
  }

  if (
    s.includes("gemini_api_key") ||
    s.includes("openrouter_api_key") ||
    s.includes("api key") ||
    s.includes("no auth credentials")
  ) {
    return "An AI provider key is missing or invalid on the server. This needs a configuration fix, not a retry.";
  }
  if (s.includes("429") || s.includes("rate limit")) {
    return "Too many requests right now. Wait a moment and try again.";
  }
  if (s.includes("402") || s.includes("budget")) {
    return "This project has reached its monthly AI spend limit. Raise the limit in observability settings to continue.";
  }
  if (s.includes("context length") || s.includes("too many tokens")) {
    return "That request was too large for the model. Try a smaller repository or a narrower question.";
  }

  if (
    s.includes("etimedout") ||
    s.includes("econnreset") ||
    s.includes("econnrefused") ||
    s.includes("enotfound") ||
    s.includes("fetch failed") ||
    s.includes("network") ||
    s.includes("socket hang up")
  ) {
    return "A network request failed on the way out. Check your connection and try again.";
  }
  if (s.includes("timeout") || s.includes("timed out")) {
    return "That took too long and was stopped. Try again.";
  }

  if (s.includes("produced no embeddings")) {
    return "Indexing finished without reading any files. The repository may be empty, or access may have been denied partway through.";
  }
  if (s.includes("unauthorized") || s.includes("not authorized")) {
    return "You don't have access to this. Try signing in again.";
  }

  const looksTechnical =
    msg.length > 140 ||
    /invalid `.*` invocation|at [A-Za-z]+\.|prisma\.|\bnode_modules\b|\n/.test(
      msg,
    );
  if (looksTechnical) {
    return "Something went wrong on our side. Try again - if it keeps happening, the details are in the server logs.";
  }
  return msg;
}

export function rawErrorDetail(raw: unknown): string | null {
  const msg = text(raw);
  if (!msg) return null;
  return friendlyError(raw) === msg ? null : msg;
}
