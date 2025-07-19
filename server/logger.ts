import { createWriteStream, WriteStream } from 'fs';
import { join } from 'path';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logStream?: WriteStream;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Initialize file logging in production
    if (!this.isDevelopment) {
      try {
        this.logStream = createWriteStream(join(process.cwd(), 'logs', 'app.log'), { flags: 'a' });
      } catch (error) {
        console.error('Failed to initialize log file:', error);
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, data, source } = entry;
    const prefix = source ? `[${source}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}${dataStr}`;
  }

  private writeLog(entry: LogEntry): void {
    const logMessage = this.formatLog(entry);
    
    // Console output with colors in development
    if (this.isDevelopment) {
      const colors = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[36m',
        debug: '\x1b[90m'
      };
      const color = colors[entry.level] || '';
      const reset = '\x1b[0m';
      process.stdout.write(`${color}${logMessage}${reset}\n`);
    } else {
      process.stdout.write(logMessage + '\n');
    }

    // File output in production
    if (this.logStream) {
      this.logStream.write(logMessage + '\n');
    }
  }

  error(message: string, data?: any, source?: string): void {
    if (this.shouldLog('error')) {
      this.writeLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        data,
        source
      });
    }
  }

  warn(message: string, data?: any, source?: string): void {
    if (this.shouldLog('warn')) {
      this.writeLog({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        data,
        source
      });
    }
  }

  info(message: string, data?: any, source?: string): void {
    if (this.shouldLog('info')) {
      this.writeLog({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        data,
        source
      });
    }
  }

  debug(message: string, data?: any, source?: string): void {
    if (this.shouldLog('debug')) {
      this.writeLog({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        data,
        source
      });
    }
  }

  // Security audit logging
  audit(message: string, data: any): void {
    this.info(`AUDIT: ${message}`, data, 'security');
  }

  // Close log stream gracefully
  close(): void {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}

export const logger = new Logger();

// Graceful shutdown
process.on('SIGINT', () => {
  logger.close();
});

process.on('SIGTERM', () => {
  logger.close();
});
