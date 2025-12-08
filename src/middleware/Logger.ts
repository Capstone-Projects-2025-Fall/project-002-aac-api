/**
 * @fileoverview Logging and telemetry hooks for the SDK.
 * @module middleware/Logger
 */

/**
 * Logging levels for telemetry.
 * 
 * @public
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Log entry structure.
 * 
 * @public
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: unknown;
}

/**
 * Logger for SDK events and telemetry.
 * 
 * Provides structured logging for debugging, monitoring, and analytics.
 * Can be extended to send logs to external services.
 * 
 * @example
 * ```typescript
 * const logger = new Logger();
 * logger.log('Client started', { userId: '123' });
 * logger.error('Failed to connect', error);
 * ```
 * 
 * @public
 */
export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number;
  private logLevel: LogLevel;
  private onLogCallback?: (entry: LogEntry) => void;

  /**
   * Creates a new Logger instance.
   * 
   * @param maxLogs - Maximum number of logs to keep in memory
   * @param logLevel - Minimum log level to record
   */
  constructor(maxLogs: number = 1000, logLevel: LogLevel = LogLevel.INFO) {
    this.maxLogs = maxLogs;
    this.logLevel = logLevel;
  }

  /**
   * Logs an info-level message.
   * 
   * @param message - Log message
   * @param data - Optional additional data
   */
  log(message: string, data?: unknown): void {
    this.addLog(LogLevel.INFO, message, data);
  }

  /**
   * Logs a debug-level message.
   * 
   * @param message - Log message
   * @param data - Optional additional data
   */
  debug(message: string, data?: unknown): void {
    this.addLog(LogLevel.DEBUG, message, data);
  }

  /**
   * Logs a warning-level message.
   * 
   * @param message - Log message
   * @param data - Optional additional data
   */
  warn(message: string, data?: unknown): void {
    this.addLog(LogLevel.WARN, message, data);
  }

  /**
   * Logs an error-level message.
   * 
   * @param message - Log message
   * @param data - Optional additional data
   */
  error(message: string, data?: unknown): void {
    this.addLog(LogLevel.ERROR, message, data);
  }

  /**
   * Adds a log entry.
   * 
   * @private
   */
  private addLog(level: LogLevel, message: string, data?: unknown): void {
    if (this.shouldLog(level)) {
      const entry: LogEntry = {
        level,
        message,
        timestamp: Date.now(),
        data
      };

      this.logs.push(entry);

      // Maintain max log size
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }

      // Call external callback if set
      if (this.onLogCallback) {
        this.onLogCallback(entry);
      }
    }
  }

  /**
   * Checks if a log level should be recorded.
   * 
   * @private
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  /**
   * Gets all logs.
   * 
   * @returns Array of log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Gets logs filtered by level.
   * 
   * @param level - Log level to filter by
   * @returns Array of filtered log entries
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clears all logs.
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Sets a callback for external log handling (e.g., sending to analytics service).
   * 
   * @param callback - Function to call for each log entry
   */
  setOnLogCallback(callback: (entry: LogEntry) => void): void {
    this.onLogCallback = callback;
  }

  /**
   * Sets the minimum log level.
   * 
   * @param level - New minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

