function debugEnabled(): boolean {
  const flag = process.env.REPODOC_DEBUG?.trim().toLowerCase();
  if (flag === "1" || flag === "true") return true;
  if (flag === "0" || flag === "false") return false;
  return process.env.NODE_ENV === "development";
}

export type LogContext = Record<string, unknown>;
type Level = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  with(ctx: LogContext): Logger;
}

function serializeDetail(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}

const CONSOLE: Record<Level, (...args: unknown[]) => void> = {
  debug: console.log,
  info: console.log,
  warn: console.warn,
  error: console.error,
};

function emit(level: Level, ctx: LogContext, args: unknown[]): void {
  if (level === "debug" && !debugEnabled()) return;
  const write = CONSOLE[level];

  if (process.env.NODE_ENV === "production") {
    const msg = typeof args[0] === "string" ? (args[0] as string) : undefined;
    const detail = (msg === undefined ? args : args.slice(1)).map(
      serializeDetail,
    );
    write(
      JSON.stringify({
        ts: new Date().toISOString(),
        level,
        ...(msg !== undefined ? { msg } : {}),
        ...ctx,
        ...(detail.length > 0 ? { detail } : {}),
      }),
    );
    return;
  }

  const keys = Object.keys(ctx);
  if (keys.length > 0) {
    write(`[${keys.map((k) => `${k}=${String(ctx[k])}`).join(" ")}]`, ...args);
  } else {
    write(...args);
  }
}

function makeLogger(ctx: LogContext): Logger {
  return {
    debug: (...args) => emit("debug", ctx, args),
    info: (...args) => emit("info", ctx, args),
    warn: (...args) => emit("warn", ctx, args),
    error: (...args) => emit("error", ctx, args),
    with: (extra) => makeLogger({ ...ctx, ...extra }),
  };
}

export const log = makeLogger({});
export const isDebugEnabled = debugEnabled;
