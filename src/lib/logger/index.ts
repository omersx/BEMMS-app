import { Logger, LoggerOptions, LogEntry, LogLevel } from './types';
import { jsonFormatter, prettyFormatter } from './formatters';

export * from './types';
export { jsonFormatter, prettyFormatter } from './formatters';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

/**
 * Safely parses and normalizes log level string.
 */
function parseLogLevel(levelStr?: string): LogLevel | undefined {
  if (!levelStr) return undefined;
  const normalized = levelStr.toLowerCase() as LogLevel;
  return normalized in LOG_LEVELS ? normalized : undefined;
}

// Determine environment
const isDev = process.env.NODE_ENV !== 'production';
const configuredLevel: LogLevel =
  parseLogLevel(process.env.LOG_LEVEL) || (isDev ? 'debug' : 'info');
const formatter = isDev ? prettyFormatter : jsonFormatter;

/**
 * Safely serializes an unknown error into structured name, message, stack details.
 */
function serializeError(err: unknown): { name: string; message: string; stack?: string } | undefined {
  if (!err) return undefined;

  if (err instanceof Error) {
    return {
      name: err.name || 'Error',
      message: err.message,
      stack: err.stack,
    };
  }

  if (typeof err === 'object') {
    const errorObj = err as Record<string, unknown>;
    return {
      name: typeof errorObj.name === 'string' ? errorObj.name : 'UnknownError',
      message: typeof errorObj.message === 'string' ? errorObj.message : String(err),
      stack: typeof errorObj.stack === 'string' ? errorObj.stack : undefined,
    };
  }

  return {
    name: 'Error',
    message: String(err),
  };
}

/**
 * Factory function creating a structured logger instance.
 *
 * @param options - Configuration options including module name, base context, and min log level.
 * @returns A structured Logger instance.
 */
export function createLogger(options?: LoggerOptions): Logger {
  const minLevel: LogLevel = options?.minLevel || configuredLevel;
  const minLevelNum = LOG_LEVELS[minLevel] ?? LOG_LEVELS.info;

  const shouldLog = (level: LogLevel): boolean => {
    const levelNum = LOG_LEVELS[level] ?? 0;
    return levelNum >= minLevelNum;
  };

  const emit = (
    level: LogLevel,
    message: string,
    err?: unknown,
    data?: Record<string, unknown>
  ): void => {
    try {
      if (!shouldLog(level)) return;

      let parsedError: unknown = err;
      let extraData = data;

      // Detect if caller supplied a plain data object as the error argument
      if (
        err !== undefined &&
        data === undefined &&
        typeof err === 'object' &&
        err !== null &&
        !(err instanceof Error) &&
        !('name' in err || 'message' in err || 'stack' in err)
      ) {
        extraData = err as Record<string, unknown>;
        parsedError = undefined;
      }

      const mergedContext =
        options?.context || extraData
          ? { ...options?.context, ...extraData }
          : undefined;

      const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        module: options?.module,
        context: mergedContext,
        error: serializeError(parsedError),
      };

      const formatted = formatter(entry);

      switch (level) {
        case 'debug':
        case 'info':
          console.log(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
        case 'fatal':
          console.error(formatted);
          break;
      }
    } catch {
      // Logger must never throw errors under any circumstances
      try {
        console.error(`[LOGGER FALLBACK] [${level.toUpperCase()}] ${message}`);
      } catch {
        // Silently swallow in ultimate fallback
      }
    }
  };

  return {
    debug(message: string, data?: Record<string, unknown>): void {
      emit('debug', message, undefined, data);
    },
    info(message: string, data?: Record<string, unknown>): void {
      emit('info', message, undefined, data);
    },
    warn(message: string, data?: Record<string, unknown>): void {
      emit('warn', message, undefined, data);
    },
    error(message: string, error?: unknown, data?: Record<string, unknown>): void {
      emit('error', message, error, data);
    },
    fatal(message: string, error?: unknown, data?: Record<string, unknown>): void {
      emit('fatal', message, error, data);
    },
    child(childOptions: { module?: string; context?: Record<string, unknown> }): Logger {
      return createLogger({
        module: childOptions.module
          ? options?.module
            ? `${options.module}:${childOptions.module}`
            : childOptions.module
          : options?.module,
        context: {
          ...options?.context,
          ...childOptions.context,
        },
        minLevel: options?.minLevel,
      });
    },
  };
}

/**
 * Root logger instance pre-configured for the application.
 */
export const logger = createLogger({ module: 'app' });

/**
 * Convenience function to create a logger instance for a specific module and context.
 *
 * @param module - Module identifier (e.g., 'auth', 'database', 'billing')
 * @param context - Optional default contextual data
 */
export function getLogger(module: string, context?: Record<string, unknown>): Logger {
  return createLogger({ module, context });
}
