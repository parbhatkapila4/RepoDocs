type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug'

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
}

const envLevel = (process.env.REPODOC_LOG_LEVEL || process.env.LOG_LEVEL || '').toLowerCase() as LogLevel
const currentLevel: LogLevel = envLevel && envLevel in LEVEL_WEIGHT ? envLevel : 'info'

function shouldLog(level: LogLevel) {
  return LEVEL_WEIGHT[level] <= LEVEL_WEIGHT[currentLevel]
}

function logWithConsole(level: LogLevel, message?: unknown, ...args: unknown[]) {
  if (!shouldLog(level)) {
    return
  }

  const consoleMethod =
    level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.info

  if (message === undefined) {
    consoleMethod(...(args as unknown[]))
    return
  }

  consoleMethod(message, ...args)
}

export const logger = {
  debug(message?: unknown, ...args: unknown[]) {
    logWithConsole('debug', message, ...args)
  },
  info(message?: unknown, ...args: unknown[]) {
    logWithConsole('info', message, ...args)
  },
  warn(message?: unknown, ...args: unknown[]) {
    logWithConsole('warn', message, ...args)
  },
  error(message?: unknown, ...args: unknown[]) {
    logWithConsole('error', message, ...args)
  },
  scoped(scope: string) {
    const prefix = `[${scope}]`
    const scopedLog = (level: LogLevel, message?: unknown, ...args: unknown[]) => {
      if (message === undefined) {
        logWithConsole(level, prefix, ...args)
        return
      }

      if (typeof message === 'string') {
        logWithConsole(level, `${prefix} ${message}`, ...args)
        return
      }

      logWithConsole(level, prefix, message, ...args)
    }

    return {
      debug(message?: unknown, ...args: unknown[]) {
        scopedLog('debug', message, ...args)
      },
      info(message?: unknown, ...args: unknown[]) {
        scopedLog('info', message, ...args)
      },
      warn(message?: unknown, ...args: unknown[]) {
        scopedLog('warn', message, ...args)
      },
      error(message?: unknown, ...args: unknown[]) {
        scopedLog('error', message, ...args)
      },
    }
  },
}
