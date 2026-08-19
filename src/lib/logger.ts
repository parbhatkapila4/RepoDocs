function debugEnabled(): boolean {
  const flag = process.env.REPODOC_DEBUG?.trim().toLowerCase();
  if (flag === "1" || flag === "true") return true;
  if (flag === "0" || flag === "false") return false;
  return process.env.NODE_ENV === "development";
}

export const log = {
  debug(...args: unknown[]): void {
    if (debugEnabled()) console.log(...args);
  },
  info(...args: unknown[]): void {
    console.log(...args);
  },
  warn(...args: unknown[]): void {
    console.warn(...args);
  },
  error(...args: unknown[]): void {
    console.error(...args);
  },
};

export const isDebugEnabled = debugEnabled;
