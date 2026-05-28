/**
 * Logger Utility
 * Simple logging system for the extension
 * Helps with debugging and error tracking
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private isDevelopment = true; // Set to false in production

  /**
   * Log a debug message
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   */
  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp,
    };

    // Add to internal log array
    this.logs.push(entry);

    // Keep only the last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    this.logToConsole(entry);
  }

  /**
   * Log to browser console
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level}] [${entry.timestamp}]`;
    const message = entry.message;

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(prefix, message, entry.data);
        }
        break;
      case LogLevel.INFO:
        console.info(prefix, message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, entry.data);
        break;
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Set development mode
   */
  setDevelopment(isDevelopment: boolean): void {
    this.isDevelopment = isDevelopment;
  }
}

// Export singleton instance
export const logger = new Logger();
