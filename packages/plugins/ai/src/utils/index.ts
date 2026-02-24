/**
 * Utilities for @samterminal/plugin-ai
 */

export {
  OpenAIClient,
  createOpenAIClient,
  type OpenAIClientConfig,
} from './openai.js';

export {
  AnthropicClient,
  createAnthropicClient,
  type AnthropicClientConfig,
} from './anthropic.js';

export { AIClient, createAIClient } from './client.js';

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, onError } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (onError) {
        onError(lastError, attempt);
      }

      if (attempt < maxRetries) {
        const delayMs = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Truncate text to max tokens (approximate)
 * Uses a rough estimate of 4 characters per token
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const approxCharsPerToken = 4;
  const maxChars = maxTokens * approxCharsPerToken;

  if (text.length <= maxChars) {
    return text;
  }

  return text.slice(0, maxChars) + '...';
}

/**
 * Split text into chunks for processing
 */
export function splitIntoChunks(text: string, maxTokens: number): string[] {
  const approxCharsPerToken = 4;
  const maxChars = maxTokens * approxCharsPerToken;

  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);

    // Try to break at sentence or paragraph boundary
    if (end < text.length) {
      const lastParagraph = text.lastIndexOf('\n\n', end);
      const lastSentence = text.lastIndexOf('. ', end);
      const lastSpace = text.lastIndexOf(' ', end);

      if (lastParagraph > start + maxChars / 2) {
        end = lastParagraph + 2;
      } else if (lastSentence > start + maxChars / 2) {
        end = lastSentence + 2;
      } else if (lastSpace > start) {
        end = lastSpace + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Find most similar items by embedding
 */
export function findSimilar(
  queryEmbedding: number[],
  items: Array<{ embedding: number[]; [key: string]: unknown }>,
  topK: number = 5,
): Array<{ item: (typeof items)[0]; similarity: number }> {
  const scored = items.map((item) => ({
    item,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
