/**
 * Date utilities
 */

/**
 * Get current timestamp in ISO format
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Get current timestamp as Date
 */
export function nowDate(): Date {
  return new Date();
}

/**
 * Get Unix timestamp in seconds
 */
export function unixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get Unix timestamp in milliseconds
 */
export function unixTimestampMs(): number {
  return Date.now();
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Format date to ISO string
 */
export function formatISO(date: Date): string {
  return date.toISOString();
}

/**
 * Format date to Unix timestamp
 */
export function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Create Date from Unix timestamp (seconds)
 */
export function fromUnix(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Create Date from Unix timestamp (milliseconds)
 */
export function fromUnixMs(timestamp: number): Date {
  return new Date(timestamp);
}

/**
 * Add milliseconds to date
 */
export function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

/**
 * Add seconds to date
 */
export function addSeconds(date: Date, seconds: number): Date {
  return addMs(date, seconds * 1000);
}

/**
 * Add minutes to date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return addMs(date, minutes * 60 * 1000);
}

/**
 * Add hours to date
 */
export function addHours(date: Date, hours: number): Date {
  return addMs(date, hours * 60 * 60 * 1000);
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  return addMs(date, days * 24 * 60 * 60 * 1000);
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Get difference between two dates in milliseconds
 */
export function diffMs(date1: Date, date2: Date): number {
  return date1.getTime() - date2.getTime();
}

/**
 * Get difference between two dates in seconds
 */
export function diffSeconds(date1: Date, date2: Date): number {
  return Math.floor(diffMs(date1, date2) / 1000);
}

/**
 * Get difference between two dates in minutes
 */
export function diffMinutes(date1: Date, date2: Date): number {
  return Math.floor(diffMs(date1, date2) / (60 * 1000));
}

/**
 * Get difference between two dates in hours
 */
export function diffHours(date1: Date, date2: Date): number {
  return Math.floor(diffMs(date1, date2) / (60 * 60 * 1000));
}

/**
 * Get difference between two dates in days
 */
export function diffDays(date1: Date, date2: Date): number {
  return Math.floor(diffMs(date1, date2) / (24 * 60 * 60 * 1000));
}

/**
 * Format duration in human readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
