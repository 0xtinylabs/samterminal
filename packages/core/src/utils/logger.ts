/**
 * Structured Logger
 *
 * Features:
 * - JSON format output for production
 * - Pretty print for development
 * - Context information (service, user, request, operation)
 * - Error details (message, stack, code)
 * - Log rotation support (file transport)
 * - Environment-based configuration
 */

import type { LogLevel, LogEntry } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Log level priorities (lower = more verbose)
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Context information for structured logging
 */
export interface LogContext {
  /** Service or module name */
  service?: string;
  /** User identifier */
  userId?: string;
  /** Request/correlation ID for tracing */
  requestId?: string;
  /** Operation/function name */
  operation?: string;
  /** Additional context data */
  [key: string]: unknown;
}

/**
 * Error details for structured logging
 */
export interface ErrorDetails {
  /** Error message */
  message: string;
  /** Error name/type */
  name: string;
  /** Stack trace */
  stack?: string;
  /** Error code (if available) */
  code?: string | number;
  /** Cause (if available) */
  cause?: unknown;
}

/**
 * Structured log entry for JSON output
 */
export interface StructuredLogEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Service/module name */
  service?: string;
  /** User ID */
  userId?: string;
  /** Request/correlation ID */
  requestId?: string;
  /** Operation name */
  operation?: string;
  /** Error details */
  error?: ErrorDetails;
  /** Additional metadata */
  meta?: Record<string, unknown>;
  /** Process ID */
  pid?: number;
  /** Hostname */
  hostname?: string;
}

/**
 * Log rotation configuration
 */
export interface LogRotationConfig {
  /** Enable file logging */
  enabled: boolean;
  /** Log file path */
  filePath: string;
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Maximum number of files to keep (default: 5) */
  maxFiles?: number;
  /** Compress rotated files */
  compress?: boolean;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level */
  level: LogLevel;
  /** Logger prefix/name */
  prefix?: string;
  /** Include timestamps */
  timestamps?: boolean;
  /** Enable colors (development) */
  colors?: boolean;
  /** Use JSON format (production) */
  json?: boolean;
  /** Include process ID */
  includePid?: boolean;
  /** Include hostname */
  includeHostname?: boolean;
  /** Default context */
  defaultContext?: LogContext;
  /** Log rotation config */
  rotation?: LogRotationConfig;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  timestamps: true,
  colors: process.env.NODE_ENV !== 'production',
  json: process.env.NODE_ENV === 'production',
  includePid: process.env.NODE_ENV === 'production',
  includeHostname: false,
};

/**
 * ANSI color codes
 */
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
} as const;

/**
 * Get hostname safely
 */
function getHostname(): string {
  try {
    return process.env.HOSTNAME || 'unknown';
  } catch (_error) {
    return 'unknown';
  }
}

/**
 * Structured Logger class
 */
export class Logger {
  private config: LoggerConfig;
  private context?: string;
  private defaultContext: LogContext;
  private fileStream?: fs.WriteStream;
  private currentFileSize: number = 0;
  private rotationIndex: number = 0;
  private rotating = false;

  constructor(config: Partial<LoggerConfig> = {}, context?: string) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.context = context;
    this.defaultContext = config.defaultContext || {};

    // Initialize file logging if configured
    if (this.config.rotation?.enabled) {
      this.initFileLogging();
    }

    // Ensure file stream is closed on process exit
    if (this.fileStream) {
      const closeStream = () => {
        this.fileStream?.end();
      };
      process.on('exit', closeStream);
      process.on('SIGINT', closeStream);
      process.on('SIGTERM', closeStream);
    }
  }

  /**
   * Initialize file logging with rotation
   */
  private initFileLogging(): void {
    if (!this.config.rotation?.enabled || !this.config.rotation.filePath) {
      return;
    }

    const logDir = path.dirname(this.config.rotation.filePath);

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.openLogFile();
  }

  /**
   * Open log file for writing
   */
  private openLogFile(): void {
    if (!this.config.rotation?.filePath) return;

    const filePath = this.getRotatedFilePath();
    this.fileStream = fs.createWriteStream(filePath, { flags: 'a' });

    // Get current file size
    try {
      const stats = fs.statSync(filePath);
      this.currentFileSize = stats.size;
    } catch (_error) {
      this.currentFileSize = 0;
    }
  }

  /**
   * Get rotated file path
   */
  private getRotatedFilePath(): string {
    if (!this.config.rotation?.filePath) return '';

    if (this.rotationIndex === 0) {
      return this.config.rotation.filePath;
    }

    const ext = path.extname(this.config.rotation.filePath);
    const base = path.basename(this.config.rotation.filePath, ext);
    const dir = path.dirname(this.config.rotation.filePath);

    return path.join(dir, `${base}.${this.rotationIndex}${ext}`);
  }

  /**
   * Rotate log file if needed
   */
  private rotateIfNeeded(entrySize: number): void {
    if (!this.config.rotation?.enabled) return;

    const maxSize = this.config.rotation.maxSize || 10 * 1024 * 1024; // 10MB default

    if (this.currentFileSize + entrySize > maxSize) {
      this.rotate();
    }
  }

  /**
   * Perform log rotation
   */
  private rotate(): void {
    if (!this.config.rotation?.filePath || this.rotating) return;

    this.rotating = true;
    try {
      // Close current file
      this.fileStream?.end();

      const maxFiles = this.config.rotation.maxFiles || 5;
      const basePath = this.config.rotation.filePath;
      const ext = path.extname(basePath);
      const baseNoExt = basePath.slice(0, -ext.length || undefined);

      // Rotate existing files
      for (let i = maxFiles - 1; i >= 1; i--) {
        const oldPath = i === 1 ? basePath : `${baseNoExt}.${i - 1}${ext}`;
        const newPath = `${baseNoExt}.${i}${ext}`;

        try {
          if (fs.existsSync(oldPath)) {
            if (i === maxFiles - 1) {
              fs.unlinkSync(oldPath); // Remove oldest
            } else {
              fs.renameSync(oldPath, newPath);
            }
          }
        } catch (_error) {
          // Ignore rotation errors
        }
      }

      // Open new file
      this.currentFileSize = 0;
      this.openLogFile();
    } finally {
      this.rotating = false;
    }
  }

  /**
   * Create a child logger with a context
   */
  child(context: string, additionalContext?: LogContext): Logger {
    return new Logger(
      {
        ...this.config,
        defaultContext: { ...this.defaultContext, ...additionalContext },
      },
      context,
    );
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  /**
   * Extract error details from Error object
   */
  private extractErrorDetails(error: Error): ErrorDetails {
    const details: ErrorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };

    // Extract code if available
    if ('code' in error) {
      details.code = (error as Error & { code?: string | number }).code;
    }

    // Extract cause if available (ES2022+)
    if ('cause' in error) {
      details.cause = (error as Error & { cause?: unknown }).cause;
    }

    return details;
  }

  /**
   * Build structured log entry
   */
  private buildStructuredEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    meta?: Record<string, unknown>,
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    // Add service/context
    const ctx = { ...this.defaultContext, ...context };
    if (ctx.service || this.config.prefix) {
      entry.service = ctx.service || this.config.prefix;
    }
    // Store context separately for backward-compatible formatting
    if (this.context) {
      (entry as StructuredLogEntry & { _context?: string })._context = this.context;
      if (!entry.service) {
        entry.service = this.context;
      }
    }

    // Add context fields
    if (ctx.userId) entry.userId = ctx.userId;
    if (ctx.requestId) entry.requestId = ctx.requestId;
    if (ctx.operation) entry.operation = ctx.operation;

    // Add error details
    if (error) {
      entry.error = this.extractErrorDetails(error);
    }

    // Add metadata
    const { service, userId, requestId, operation, ...restContext } = ctx;
    const combinedMeta = { ...restContext, ...meta };
    if (Object.keys(combinedMeta).length > 0) {
      entry.meta = combinedMeta;
    }

    // Add process info
    if (this.config.includePid) {
      entry.pid = process.pid;
    }
    if (this.config.includeHostname) {
      entry.hostname = getHostname();
    }

    return entry;
  }

  /**
   * Format log message for pretty print (development)
   */
  private formatPretty(entry: StructuredLogEntry): string {
    const parts: string[] = [];

    // Timestamp
    if (this.config.timestamps) {
      if (this.config.colors) {
        parts.push(`${COLORS.dim}${entry.timestamp}${COLORS.reset}`);
      } else {
        parts.push(entry.timestamp);
      }
    }

    // Level
    const levelStr = entry.level.toUpperCase().padEnd(5);
    if (this.config.colors) {
      parts.push(`${COLORS[entry.level]}${levelStr}${COLORS.reset}`);
    } else {
      parts.push(levelStr);
    }

    // Service/Prefix
    const entryWithContext = entry as StructuredLogEntry & { _context?: string };
    const hasContext = entryWithContext._context;
    const serviceOnly = hasContext && entry.service === hasContext ? undefined : entry.service;

    if (serviceOnly) {
      if (this.config.colors) {
        parts.push(`${COLORS.dim}[${serviceOnly}]${COLORS.reset}`);
      } else {
        parts.push(`[${serviceOnly}]`);
      }
    }
    if (hasContext) {
      if (this.config.colors) {
        parts.push(`${COLORS.dim}[${hasContext}]${COLORS.reset}`);
      } else {
        parts.push(`[${hasContext}]`);
      }
    }

    // Context IDs
    const contextParts: string[] = [];
    if (entry.requestId) contextParts.push(`req:${entry.requestId}`);
    if (entry.userId) contextParts.push(`user:${entry.userId}`);
    if (entry.operation) contextParts.push(`op:${entry.operation}`);

    if (contextParts.length > 0) {
      if (this.config.colors) {
        parts.push(`${COLORS.dim}(${contextParts.join(' ')})${COLORS.reset}`);
      } else {
        parts.push(`(${contextParts.join(' ')})`);
      }
    }

    // Message
    parts.push(entry.message);

    // Meta
    if (entry.meta && Object.keys(entry.meta).length > 0) {
      parts.push(JSON.stringify(entry.meta));
    }

    // Error
    if (entry.error) {
      if (this.config.colors) {
        parts.push(`${COLORS.error}[${entry.error.name}: ${entry.error.message}]${COLORS.reset}`);
      } else {
        parts.push(`[${entry.error.name}: ${entry.error.message}]`);
      }
      if (entry.error.stack && entry.level === 'error') {
        parts.push(`\nstack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Write to file if configured
   */
  private writeToFile(entry: StructuredLogEntry): void {
    if (!this.fileStream || !this.config.rotation?.enabled || this.rotating) return;

    const jsonLine = JSON.stringify(entry) + '\n';
    this.rotateIfNeeded(Buffer.byteLength(jsonLine));
    if (!this.rotating) {
      this.fileStream.write(jsonLine);
      this.currentFileSize += Buffer.byteLength(jsonLine);
    }
  }

  /**
   * Log a message
   */
  private log(
    level: LogLevel,
    message: string,
    contextOrMeta?: LogContext | Record<string, unknown>,
    error?: Error,
    meta?: Record<string, unknown>,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // Parse arguments
    let context: LogContext | undefined;
    let finalMeta: Record<string, unknown> | undefined;

    if (contextOrMeta) {
      // Check if it's a LogContext (has specific keys) or just meta
      const hasContextKeys =
        'service' in contextOrMeta ||
        'userId' in contextOrMeta ||
        'requestId' in contextOrMeta ||
        'operation' in contextOrMeta;

      if (hasContextKeys) {
        context = contextOrMeta as LogContext;
        finalMeta = meta;
      } else {
        finalMeta = contextOrMeta;
      }
    } else {
      // When contextOrMeta is undefined, use meta directly
      finalMeta = meta;
    }

    // Build structured entry
    const entry = this.buildStructuredEntry(level, message, context, error, finalMeta);

    // Output based on format
    let output: string;
    if (this.config.json) {
      output = JSON.stringify(entry);
    } else {
      output = this.formatPretty(entry);
    }

    // Console output
    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }

    // File output (always JSON)
    this.writeToFile(entry);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, context: LogContext, meta?: Record<string, unknown>): void;
  debug(
    message: string,
    contextOrMeta?: LogContext | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ): void {
    this.log('debug', message, contextOrMeta, undefined, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, unknown>): void;
  info(message: string, context: LogContext, meta?: Record<string, unknown>): void;
  info(
    message: string,
    contextOrMeta?: LogContext | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ): void {
    this.log('info', message, contextOrMeta, undefined, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, context: LogContext, meta?: Record<string, unknown>): void;
  warn(
    message: string,
    contextOrMeta?: LogContext | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ): void {
    this.log('warn', message, contextOrMeta, undefined, meta);
  }

  /**
   * Log error message
   */
  error(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error: Error, meta?: Record<string, unknown>): void;
  error(message: string, context: LogContext, meta?: Record<string, unknown>): void;
  error(message: string, context: LogContext, error: Error, meta?: Record<string, unknown>): void;
  error(
    message: string,
    contextOrErrorOrMeta?: LogContext | Error | Record<string, unknown>,
    errorOrMeta?: Error | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ): void {
    let context: LogContext | undefined;
    let error: Error | undefined;
    let finalMeta: Record<string, unknown> | undefined;

    if (contextOrErrorOrMeta instanceof Error) {
      error = contextOrErrorOrMeta;
      finalMeta = errorOrMeta as Record<string, unknown>;
    } else if (contextOrErrorOrMeta) {
      const hasContextKeys =
        'service' in contextOrErrorOrMeta ||
        'userId' in contextOrErrorOrMeta ||
        'requestId' in contextOrErrorOrMeta ||
        'operation' in contextOrErrorOrMeta;

      if (hasContextKeys) {
        context = contextOrErrorOrMeta as LogContext;
        if (errorOrMeta instanceof Error) {
          error = errorOrMeta;
          finalMeta = meta;
        } else {
          finalMeta = errorOrMeta as Record<string, unknown>;
        }
      } else {
        finalMeta = contextOrErrorOrMeta as Record<string, unknown>;
      }
    }

    this.log('error', message, context, error, finalMeta);
  }

  /**
   * Create a log entry object (for compatibility)
   */
  createEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      meta,
    };
  }

  /**
   * Create structured log entry
   */
  createStructuredEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    meta?: Record<string, unknown>,
  ): StructuredLogEntry {
    return this.buildStructuredEntry(level, message, context, error, meta);
  }

  /**
   * Close file stream
   */
  close(): void {
    this.fileStream?.end();
  }

  /**
   * With context - fluent API for adding context
   */
  withContext(context: LogContext): ContextualLogger {
    return new ContextualLogger(this, context);
  }

  /**
   * With request ID - shorthand for common use case
   */
  withRequestId(requestId: string): ContextualLogger {
    return this.withContext({ requestId });
  }

  /**
   * With user ID - shorthand for common use case
   */
  withUserId(userId: string): ContextualLogger {
    return this.withContext({ userId });
  }

  /**
   * With operation - shorthand for common use case
   */
  withOperation(operation: string): ContextualLogger {
    return this.withContext({ operation });
  }
}

/**
 * Contextual logger wrapper for fluent API
 */
export class ContextualLogger {
  constructor(
    private logger: Logger,
    private context: LogContext,
  ) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, this.context, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, this.context, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, this.context, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (error) {
      this.logger.error(message, this.context, error, meta);
    } else {
      this.logger.error(message, this.context, meta);
    }
  }

  withContext(additionalContext: LogContext): ContextualLogger {
    return new ContextualLogger(this.logger, { ...this.context, ...additionalContext });
  }
}

/**
 * Create a logger instance
 */
export function createLogger(config: Partial<LoggerConfig> = {}, context?: string): Logger {
  return new Logger(config, context);
}

/**
 * Create a logger with file rotation
 */
export function createFileLogger(
  filePath: string,
  config: Partial<LoggerConfig> = {},
): Logger {
  return new Logger({
    ...config,
    rotation: {
      enabled: true,
      filePath,
      maxSize: config.rotation?.maxSize || 10 * 1024 * 1024,
      maxFiles: config.rotation?.maxFiles || 5,
    },
  });
}

/**
 * Default logger instance
 */
export const logger = createLogger({ prefix: 'SamTerminal' });

/**
 * Export types for consumers
 */
export type { LogLevel, LogEntry };
