/**
 * CLI logger utilities
 */

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

let currentLevel: LogLevel = 'info';

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  success: 1,
  warn: 2,
  error: 3,
};

/**
 * Set log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * Get current log level
 */
export function getLogLevel(): LogLevel {
  return currentLevel;
}

/**
 * Check if level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[currentLevel];
}

/**
 * Format message with prefix
 */
function formatMessage(prefix: string, message: string, color: (text: string) => string): string {
  return `${color(prefix)} ${message}`;
}

/**
 * Log debug message
 */
export function debug(message: string, ...args: unknown[]): void {
  if (shouldLog('debug')) {
    console.log(formatMessage('[DEBUG]', message, chalk.gray), ...args);
  }
}

/**
 * Log info message
 */
export function info(message: string, ...args: unknown[]): void {
  if (shouldLog('info')) {
    console.log(formatMessage('[INFO]', message, chalk.blue), ...args);
  }
}

/**
 * Log success message
 */
export function success(message: string, ...args: unknown[]): void {
  if (shouldLog('success')) {
    console.log(formatMessage('[OK]', message, chalk.green), ...args);
  }
}

/**
 * Log warning message
 */
export function warn(message: string, ...args: unknown[]): void {
  if (shouldLog('warn')) {
    console.log(formatMessage('[WARN]', message, chalk.yellow), ...args);
  }
}

/**
 * Log error message
 */
export function error(message: string, ...args: unknown[]): void {
  if (shouldLog('error')) {
    console.error(formatMessage('[ERROR]', message, chalk.red), ...args);
  }
}

/**
 * Log a blank line
 */
export function blank(): void {
  console.log();
}

/**
 * Log a title/header
 */
export function title(message: string): void {
  console.log();
  console.log(chalk.bold.cyan(message));
  console.log(chalk.gray('─'.repeat(message.length)));
}

/**
 * Log a step in a process
 */
export function step(stepNum: number, total: number, message: string): void {
  console.log(chalk.gray(`[${stepNum}/${total}]`), message);
}

/**
 * Create a logger instance
 */
export function createLogger(prefix?: string) {
  const p = prefix ? `[${prefix}]` : '';

  return {
    debug: (msg: string, ...args: unknown[]) => debug(`${p} ${msg}`, ...args),
    info: (msg: string, ...args: unknown[]) => info(`${p} ${msg}`, ...args),
    success: (msg: string, ...args: unknown[]) => success(`${p} ${msg}`, ...args),
    warn: (msg: string, ...args: unknown[]) => warn(`${p} ${msg}`, ...args),
    error: (msg: string, ...args: unknown[]) => error(`${p} ${msg}`, ...args),
  };
}

export const logger = {
  debug,
  info,
  success,
  warn,
  error,
  blank,
  title,
  step,
  setLevel: setLogLevel,
  getLevel: getLogLevel,
};
