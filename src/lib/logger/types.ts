/**
 * Structured Logger Types
 * Zero-dependency, production-grade logging types for BEMMS application.
 */

/**
 * Log severity levels in increasing order of severity.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Structured log entry representation.
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string; // ISO 8601
  module?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  // Additional structured data
  [key: string]: unknown;
}

/**
 * Configuration options for initializing or deriving a logger instance.
 */
export interface LoggerOptions {
  module?: string;
  context?: Record<string, unknown>;
  minLevel?: LogLevel;
}

/**
 * Structured logger interface.
 */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: unknown, data?: Record<string, unknown>): void;
  fatal(message: string, error?: unknown, data?: Record<string, unknown>): void;
  child(options: { module?: string; context?: Record<string, unknown> }): Logger;
}
