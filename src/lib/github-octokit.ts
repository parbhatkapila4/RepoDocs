import { Octokit } from "octokit";

const MAX_RATE_LIMIT_RETRY_AFTER_S = 120;

type ThrottleOctokit = {
  log: {
    warn: (msg: string) => void;
    info: (msg: string) => void;
  };
};

type ThrottleOptions = {
  method: string;
  url: string;
  request: { retryCount: number };
};

export function createGitHubOctokit(auth?: string | null): Octokit {
  return new Octokit({
    auth: auth || undefined,
    throttle: {
      onRateLimit(
        retryAfter: number,
        options: ThrottleOptions,
        octokit: ThrottleOctokit
      ) {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );
        if (options.request.retryCount > 0) {
          return false;
        }
        if (retryAfter > MAX_RATE_LIMIT_RETRY_AFTER_S) {
          octokit.log.warn(
            `Not auto-retrying GitHub: rate limit reset in ${retryAfter}s (cap ${MAX_RATE_LIMIT_RETRY_AFTER_S}s). Use a token or wait.`
          );
          return false;
        }
        octokit.log.info(`Retrying GitHub request after ${retryAfter}s`);
        return true;
      },
      onSecondaryRateLimit(
        retryAfter: number,
        options: ThrottleOptions,
        octokit: ThrottleOctokit
      ) {
        octokit.log.warn(
          `Secondary rate limit for ${options.method} ${options.url}`
        );
        if (options.request.retryCount > 0) {
          return false;
        }
        if (retryAfter > MAX_RATE_LIMIT_RETRY_AFTER_S) {
          octokit.log.warn(
            `Not auto-retrying GitHub secondary limit (wait ${retryAfter}s > cap)`
          );
          return false;
        }
        octokit.log.info(`Retrying after secondary rate limit, ${retryAfter}s`);
        return true;
      },
    },
  });
}
