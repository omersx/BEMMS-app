import { LogEntry, LogLevel } from './types';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: ANSI.cyan,
  info: ANSI.green,
  warn: ANSI.yellow,
  error: ANSI.red,
  fatal: `${ANSI.bold}${ANSI.magenta}`,
};

const MAX_VALUE_LENGTH = 1000;

/**
 * Returns a JSON replacer function that safely handles circular references and BigInt values.
 */
function getCircularReplacer(): (key: string, value: unknown) => unknown {
  const seen = new WeakSet();
  return (_key: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  };
}

/**
 * Formats a Date/ISO timestamp to local HH:mm:ss.SSS representation.
 */
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const millis = String(date.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${millis}`;
  } catch {
    return isoString;
  }
}

/**
 * Truncates string representations that exceed 1000 characters.
 */
function truncateValue(str: string): string {
  if (str.length > MAX_VALUE_LENGTH) {
    return `${str.slice(0, MAX_VALUE_LENGTH)}... [truncated]`;
  }
  return str;
}

/**
 * Formats a single context property value safely, truncating if necessary.
 */
function formatContextValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return truncateValue(value);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return '[Function]';
  if (typeof value === 'object') {
    try {
      const json = JSON.stringify(value, getCircularReplacer());
      return truncateValue(json);
    } catch {
      return truncateValue(String(value));
    }
  }
  return truncateValue(String(value));
}

/**
 * Single-line JSON formatter for production environments (machine-parseable).
 * Handles circular references and never throws.
 */
export function jsonFormatter(entry: LogEntry): string {
  try {
    return JSON.stringify(entry, getCircularReplacer());
  } catch (error) {
    return JSON.stringify({
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp,
      module: entry.module,
      formatError: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Colorized, human-readable formatter for development environments using ANSI escape codes.
 *
 * Output format:
 * HH:mm:ss.SSS LEVEL [module] message
 *   key=value
 *   error stack
 */
export function prettyFormatter(entry: LogEntry): string {
  try {
    const timeStr = `${ANSI.gray}${formatTimestamp(entry.timestamp)}${ANSI.reset}`;
    const levelColor = LEVEL_COLORS[entry.level] || ANSI.reset;
    const levelUpper = entry.level.toUpperCase().padEnd(5);
    const levelStr = `${levelColor}${levelUpper}${ANSI.reset}`;
    const moduleStr = entry.module ? `${ANSI.gray}[${entry.module}]${ANSI.reset} ` : '';
    const messageStr = entry.message;

    let output = `${timeStr} ${levelStr} ${moduleStr}${messageStr}`;

    // Format context key=value pairs
    if (entry.context && Object.keys(entry.context).length > 0) {
      for (const [key, val] of Object.entries(entry.context)) {
        output += `\n  ${ANSI.dim}${key}=${ANSI.reset}${formatContextValue(val)}`;
      }
    }

    // Format any extra top-level structured attributes
    const standardKeys = new Set(['level', 'message', 'timestamp', 'module', 'context', 'error']);
    for (const [key, val] of Object.entries(entry)) {
      if (!standardKeys.has(key)) {
        output += `\n  ${ANSI.dim}${key}=${ANSI.reset}${formatContextValue(val)}`;
      }
    }

    // Format error stack if present
    if (entry.error) {
      const errorContent = entry.error.stack || `${entry.error.name}: ${entry.error.message}`;
      output += `\n${ANSI.red}${errorContent}${ANSI.reset}`;
    }

    return output;
  } catch (err) {
    // Fail-safe plain string output
    return `${entry.timestamp} ${entry.level.toUpperCase()} ${entry.message}`;
  }
}
