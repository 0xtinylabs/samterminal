/**
 * API Key Validation Utilities
 *
 * Provides validation functions for various API keys used by SAM Terminal plugins.
 * Each validator performs a lightweight HTTP call to verify the key is functional.
 */

import { createLogger } from './logger.js';

const logger = createLogger('Validator');

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * API key definitions with validation info
 */
export interface ApiKeyDefinition {
  /** Environment variable name */
  envVar: string;
  /** Human-readable name */
  name: string;
  /** Which plugins require this key */
  requiredBy: string[];
  /** Whether the key is required or optional */
  required: boolean;
  /** Validation function */
  validate: (key: string) => Promise<ValidationResult>;
}

/**
 * Validate an Alchemy API key by making a simple JSON-RPC call
 */
export async function validateAlchemyKey(key: string): Promise<ValidationResult> {
  try {
    const response = await fetch(`https://base-mainnet.g.alchemy.com/v2/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json() as { result?: string; error?: { message: string } };
      if (data.result) {
        return { valid: true, message: 'Alchemy API key is valid' };
      }
      return { valid: false, message: data.error?.message ?? 'Invalid response from Alchemy' };
    }

    if (response.status === 401 || response.status === 403) {
      return { valid: false, message: 'Invalid Alchemy API key (unauthorized)' };
    }

    return { valid: false, message: `Alchemy returned HTTP ${response.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.debug(`Alchemy validation error: ${message}`);
    return { valid: false, message: `Could not reach Alchemy: ${message}` };
  }
}

/**
 * Validate a Moralis API key
 */
export async function validateMoralisKey(key: string): Promise<ValidationResult> {
  try {
    const response = await fetch('https://deep-index.moralis.io/api/v2.2/block/latest?chain=base', {
      headers: { 'X-API-Key': key },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return { valid: true, message: 'Moralis API key is valid' };
    }

    if (response.status === 401) {
      return { valid: false, message: 'Invalid Moralis API key (unauthorized)' };
    }

    return { valid: false, message: `Moralis returned HTTP ${response.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.debug(`Moralis validation error: ${message}`);
    return { valid: false, message: `Could not reach Moralis: ${message}` };
  }
}

/**
 * Validate a Telegram Bot Token
 */
export async function validateTelegramToken(token: string): Promise<ValidationResult> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json() as { ok: boolean; result?: { username: string } };
      if (data.ok && data.result) {
        return { valid: true, message: `Telegram bot: @${data.result.username}` };
      }
    }

    if (response.status === 401) {
      return { valid: false, message: 'Invalid Telegram bot token (unauthorized)' };
    }

    return { valid: false, message: `Telegram returned HTTP ${response.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.debug(`Telegram validation error: ${message}`);
    return { valid: false, message: `Could not reach Telegram: ${message}` };
  }
}

/**
 * Validate an OpenAI API key
 */
export async function validateOpenAIKey(key: string): Promise<ValidationResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return { valid: true, message: 'OpenAI API key is valid' };
    }

    if (response.status === 401) {
      return { valid: false, message: 'Invalid OpenAI API key (unauthorized)' };
    }

    return { valid: false, message: `OpenAI returned HTTP ${response.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.debug(`OpenAI validation error: ${message}`);
    return { valid: false, message: `Could not reach OpenAI: ${message}` };
  }
}

/**
 * Validate an Anthropic API key
 */
export async function validateAnthropicKey(key: string): Promise<ValidationResult> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      signal: AbortSignal.timeout(10000),
    });

    // 200 means valid, 400 could also mean valid key but bad request format
    if (response.ok || response.status === 400) {
      return { valid: true, message: 'Anthropic API key is valid' };
    }

    if (response.status === 401) {
      return { valid: false, message: 'Invalid Anthropic API key (unauthorized)' };
    }

    return { valid: false, message: `Anthropic returned HTTP ${response.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.debug(`Anthropic validation error: ${message}`);
    return { valid: false, message: `Could not reach Anthropic: ${message}` };
  }
}

/**
 * Validate a 0x (ZeroEx) API key
 */
export async function validateZeroExKey(key: string): Promise<ValidationResult> {
  try {
    const response = await fetch('https://api.0x.org/swap/permit2/price?chainId=8453&sellToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&buyToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&sellAmount=100000000000000', {
      headers: { '0x-api-key': key },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return { valid: true, message: '0x API key is valid' };
    }

    if (response.status === 401 || response.status === 403) {
      return { valid: false, message: 'Invalid 0x API key (unauthorized)' };
    }

    return { valid: false, message: `0x API returned HTTP ${response.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.debug(`0x validation error: ${message}`);
    return { valid: false, message: `Could not reach 0x API: ${message}` };
  }
}

/**
 * All available API key definitions
 */
export const API_KEY_DEFINITIONS: ApiKeyDefinition[] = [
  {
    envVar: 'ALCHEMY_API_KEY',
    name: 'Alchemy API Key',
    requiredBy: ['tokendata', 'walletdata', 'swap'],
    required: true,
    validate: validateAlchemyKey,
  },
  {
    envVar: 'MORALIS_API_KEY',
    name: 'Moralis API Key',
    requiredBy: ['tokendata', 'walletdata'],
    required: true,
    validate: validateMoralisKey,
  },
  {
    envVar: 'MAIN_BOT_TOKEN',
    name: 'Telegram Bot Token',
    requiredBy: ['telegram'],
    required: false,
    validate: validateTelegramToken,
  },
  {
    envVar: 'OPENAI_API_KEY',
    name: 'OpenAI API Key',
    requiredBy: ['ai'],
    required: false,
    validate: validateOpenAIKey,
  },
  {
    envVar: 'ANTHROPIC_API_KEY',
    name: 'Anthropic API Key',
    requiredBy: ['ai'],
    required: false,
    validate: validateAnthropicKey,
  },
  {
    envVar: 'ZEROX_API_KEY',
    name: '0x API Key',
    requiredBy: ['swap'],
    required: false,
    validate: validateZeroExKey,
  },
];

/**
 * Get required API keys for a set of plugins
 */
export function getRequiredKeysForPlugins(plugins: string[]): ApiKeyDefinition[] {
  return API_KEY_DEFINITIONS.filter((def) =>
    def.requiredBy.some((plugin) => plugins.includes(plugin)),
  );
}

/**
 * Validate all configured API keys from environment
 */
export async function validateAllKeys(): Promise<Map<string, ValidationResult>> {
  const results = new Map<string, ValidationResult>();

  for (const def of API_KEY_DEFINITIONS) {
    const value = process.env[def.envVar];
    if (!value || value === '' || value.startsWith('your_')) {
      results.set(def.envVar, { valid: false, message: 'Not set' });
      continue;
    }

    const result = await def.validate(value);
    results.set(def.envVar, result);
  }

  return results;
}

/**
 * Quick check if a string looks like it could be a valid API key (non-empty, non-placeholder)
 */
export function isPlaceholderValue(value: string): boolean {
  const placeholders = [
    'your_',
    'YOUR_',
    'xxx',
    'placeholder',
    'REPLACE_ME',
    'sk-xxx',
    'change_me',
  ];
  return placeholders.some((p) => value.includes(p)) || value.trim() === '';
}
