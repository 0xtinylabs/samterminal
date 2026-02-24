/**
 * Verification code utilities
 */

/**
 * Characters used for verification codes
 */
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a random verification code
 * @param length - Code length (default: 4)
 */
export function generateVerificationCode(length = 4): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS[randomIndex];
  }
  return code;
}

/**
 * Validate a verification code
 * @param input - User input
 * @param expected - Expected code
 * @returns Whether codes match (case-insensitive)
 */
export function validateCode(input: string, expected: string): boolean {
  return input.toUpperCase().trim() === expected.toUpperCase().trim();
}

/**
 * Generate a bot start link
 * @param botUsername - Bot username (without @)
 * @param ref - Reference parameter for start
 */
export function generateBotLink(botUsername: string, ref: string): string {
  return `https://t.me/${botUsername}?start=${ref}`;
}
