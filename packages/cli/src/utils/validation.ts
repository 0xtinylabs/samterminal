/**
 * CLI input validation utilities
 */

/**
 * Validate npm package name
 * Based on npm naming rules: lowercase, max 214 chars, no special chars except - and .
 */
export function isValidPackageName(name: string): boolean {
  if (!name || name.length > 214) return false;
  // Scoped packages: @scope/name
  if (name.startsWith('@')) {
    const match = /^@[a-z0-9-~][a-z0-9-._~]*\/[a-z0-9-~][a-z0-9-._~]*$/.test(name);
    return match;
  }
  return /^[a-z0-9-~][a-z0-9-._~]*$/.test(name);
}

/**
 * Validate project name (alphanumeric, hyphens, underscores)
 */
export function isValidProjectName(name: string): boolean {
  if (!name || name.length > 214) return false;
  return /^[a-zA-Z0-9-_]+$/.test(name);
}

/**
 * Validate environment variable value
 */
export function isValidEnvValue(value: string): boolean {
  // Block shell metacharacters and control characters
  return /^[a-zA-Z0-9_./:@=+-]+$/.test(value);
}

/**
 * Validate port number
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}
