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
  private logs: { level: LogLevel; message: string; timestamp: number; data?: unknown }[] = [];
  private maxLogs: number;
  private logLevel: LogLevel;
  private currentLevel: LogLevel = LogLevel.DEBUG;
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
    this.currentLevel = logLevel;
  }

  /**
   * Gets the numeric value of a log level for comparison.
   * 
   * @private
   */
  private getLevelValue(level: LogLevel): number {
    const levelMap: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };
    return levelMap[level];
  }

  /**
   * Logs an info-level message.
   * 
   * @param message - Log message
   * @param data - Optional additional data
   */
  log(message: string, data?: unknown): void {
    if (this.getLevelValue(LogLevel.INFO) < this.getLevelValue(this.currentLevel)) {
      return;
    }
    this.logs.push({
      level: LogLevel.INFO,
      message,
      timestamp: Date.now(),
      data
    });
    this.maintainMaxLogs();
  }

  /**
   * Logs a debug-level message.
   * 
   * @param message - Log message
   */
  public debug(message: string): void {
    if (this.getLevelValue(LogLevel.DEBUG) < this.getLevelValue(this.currentLevel)) {
      return;
    }
    this.logs.push({
      level: LogLevel.DEBUG,
      message,
      timestamp: Date.now()
    });
    this.maintainMaxLogs();
  }

  /**
   * Logs a warning-level message.
   * 
   * @param message - Log message
   */
  public warn(message: string): void {
    if (this.getLevelValue(LogLevel.WARN) < this.getLevelValue(this.currentLevel)) {
      return;
    }
    this.logs.push({
      level: LogLevel.WARN,
      message,
      timestamp: Date.now()
    });
    this.maintainMaxLogs();
  }

  /**
   * Logs an error-level message.
   * 
   * @param message - Log message
   */
  public error(message: string): void {
    if (this.getLevelValue(LogLevel.ERROR) < this.getLevelValue(this.currentLevel)) {
      return;
    }
    this.logs.push({
      level: LogLevel.ERROR,
      message,
      timestamp: Date.now()
    });
    this.maintainMaxLogs();
  }

  /**
   * Maintains maximum log size by removing oldest entries.
   * 
   * @private
   */
  private maintainMaxLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
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
    return [...this.logs] as LogEntry[];
  }

  /**
   * Gets logs filtered by level.
   * 
   * @param level - Log level to filter by
   * @returns Array of filtered log entries
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level) as LogEntry[];
  }

  /**
   * Clears all logs.
   * 
   * @public
   */
  public clearLogs(): void {
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
  public setLogLevel(level: LogLevel): void {
    this.currentLevel = level;
    this.logLevel = level;
  }
}

