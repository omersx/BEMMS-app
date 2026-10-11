import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, getLogger, jsonFormatter, prettyFormatter, LogEntry } from '../index';

describe('Logger Module', () => {
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createLogger and log levels', () => {
    it('should log messages according to minLevel', () => {
      const logger = createLogger({ minLevel: 'warn' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit debug and info to console.log', () => {
      const logger = createLogger({ minLevel: 'debug' });

      logger.debug('debug test');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);

      logger.info('info test');
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should emit warn to console.warn and fatal to console.error', () => {
      const logger = createLogger({ minLevel: 'debug' });

      logger.warn('warning test');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

      logger.fatal('fatal error');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should properly serialize errors', () => {
      const logger = createLogger({ minLevel: 'error' });
      const testError = new Error('Database connection failed');

      logger.error('Query failed', testError, { query: 'SELECT 1' });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should support passing data object as error parameter', () => {
      const logger = createLogger({ minLevel: 'error' });
      logger.error('Something failed', { code: 500, detail: 'timeout' });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('child logger', () => {
    it('should inherit and merge module path and context', () => {
      const parent = createLogger({
        module: 'parent',
        context: { env: 'test', requestId: '123' },
        minLevel: 'info',
      });

      const child = parent.child({
        module: 'child',
        context: { operation: 'read' },
      });

      child.info('Child operation');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLogger helper', () => {
    it('should instantiate logger with module identifier and context', () => {
      const log = getLogger('audit', { tenant: 'org-1' });
      expect(log).toBeDefined();
      expect(typeof log.info).toBe('function');
      expect(typeof log.error).toBe('function');
    });
  });

  describe('formatters', () => {
    it('jsonFormatter should produce valid JSON', () => {
      const entry: LogEntry = {
        level: 'info',
        message: 'Test JSON message',
        timestamp: new Date().toISOString(),
        module: 'test-mod',
        context: { count: 42, active: true },
      };

      const result = jsonFormatter(entry);
      const parsed = JSON.parse(result);

      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('Test JSON message');
      expect(parsed.module).toBe('test-mod');
      expect(parsed.context.count).toBe(42);
    });

    it('jsonFormatter should handle circular references safely', () => {
      const circularObj: any = { name: 'cyclic' };
      circularObj.self = circularObj;

      const entry: LogEntry = {
        level: 'warn',
        message: 'Circular test',
        timestamp: new Date().toISOString(),
        context: circularObj,
      };

      const result = jsonFormatter(entry);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.context.self).toBe('[Circular]');
    });

    it('prettyFormatter should format human-readable output with ANSI colors', () => {
      const entry: LogEntry = {
        level: 'error',
        message: 'Something broke',
        timestamp: '2026-10-11T14:00:00.000Z',
        module: 'system',
        context: { service: 'api' },
        error: {
          name: 'Error',
          message: 'Broken connection',
          stack: 'Error: Broken connection\n  at index.ts:1',
        },
      };

      const result = prettyFormatter(entry);
      expect(result).toContain('ERROR');
      expect(result).toContain('system');
      expect(result).toContain('Something broke');
      expect(result).toContain('service=');
      expect(result).toContain('api');
      expect(result).toContain('Broken connection');
    });
  });
});
