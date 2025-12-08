/**
 * @fileoverview Unit tests for Logger.
 */

import { Logger, LogLevel } from '../../src/middleware/Logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
  });

  describe('constructor', () => {
    it('should create a new Logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should accept maxLogs and logLevel', () => {
      const customLogger = new Logger(500, LogLevel.WARN);
      expect(customLogger).toBeInstanceOf(Logger);
    });
  });

  describe('log', () => {
    it('should log info message', () => {
      logger.log('Test message');
      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
    });

    it('should include optional data', () => {
      logger.log('Test', { key: 'value' });
      const logs = logger.getLogs();
      expect(logs[0].data).toEqual({ key: 'value' });
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      logger.debug('Debug message');
      const logs = logger.getLogsByLevel(LogLevel.DEBUG);
      expect(logs.length).toBe(1);
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      logger.warn('Warning message');
      const logs = logger.getLogsByLevel(LogLevel.WARN);
      expect(logs.length).toBe(1);
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      logger.error('Error message');
      const logs = logger.getLogsByLevel(LogLevel.ERROR);
      expect(logs.length).toBe(1);
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      logger.log('Test');
      logger.clearLogs();
      expect(logger.getLogs().length).toBe(0);
    });
  });

  describe('setLogLevel', () => {
    it('should filter logs by level', () => {
      logger.setLogLevel(LogLevel.WARN);
      logger.debug('Debug'); // Should not be logged
      logger.warn('Warning'); // Should be logged
      expect(logger.getLogs().length).toBe(1);
    });
  });
});

