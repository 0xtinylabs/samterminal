/**
 * ID generation utilities
 */

import { randomBytes } from 'crypto';

/**
 * Generate a UUID v4
 */
export function uuid(): string {
  const bytes = randomBytes(16);

  // Set version to 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Set variant to RFC4122
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');

  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

/**
 * Generate a short ID (12 characters)
 */
export function shortId(): string {
  return randomBytes(6).toString('hex');
}

/**
 * Generate a nano ID (21 characters, URL-safe)
 */
export function nanoId(size = 21): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = randomBytes(size);
  let id = '';

  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }

  return id;
}

/**
 * Generate a prefixed ID
 */
export function prefixedId(prefix: string): string {
  return `${prefix}_${shortId()}`;
}

/**
 * Validate UUID format
 */
export function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Generate a timestamp-based ID
 */
export function timestampId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString('hex');
  return `${timestamp}-${random}`;
}
