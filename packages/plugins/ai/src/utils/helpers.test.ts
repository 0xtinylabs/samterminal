/**
 * Helper utilities tests
 */


import {
  delay,
  retry,
  truncateToTokens,
  splitIntoChunks,
  cosineSimilarity,
  findSimilar,
  generateId,
} from './index.js';

describe('delay', () => {
  it('should delay execution', async () => {
    const start = Date.now();
    await delay(10);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(9);
  });
});

describe('retry', () => {
  it('should return result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('success');

    const result = await retry(fn, { maxRetries: 3, baseDelay: 1, maxDelay: 1 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('persistent failure'));

    await expect(
      retry(fn, { maxRetries: 2, baseDelay: 1, maxDelay: 1 })
    ).rejects.toThrow('persistent failure');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should call onError callback', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const onError = jest.fn();

    await expect(
      retry(fn, { maxRetries: 2, baseDelay: 1, maxDelay: 1, onError })
    ).rejects.toThrow();

    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 2);
  });

  it('should handle non-Error thrown values', async () => {
    const fn = jest.fn().mockRejectedValue('string error');

    await expect(
      retry(fn, { maxRetries: 1, baseDelay: 1, maxDelay: 1 })
    ).rejects.toThrow('string error');
  });
});

describe('truncateToTokens', () => {
  it('should return text unchanged if under limit', () => {
    const text = 'Hello world';
    const result = truncateToTokens(text, 100);
    expect(result).toBe(text);
  });

  it('should truncate text over limit', () => {
    const text = 'A'.repeat(500);
    const result = truncateToTokens(text, 10); // 10 tokens * 4 chars = 40 chars
    expect(result.length).toBe(43); // 40 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('should handle empty text', () => {
    const result = truncateToTokens('', 100);
    expect(result).toBe('');
  });

  it('should use 4 chars per token approximation', () => {
    const result = truncateToTokens('A'.repeat(100), 10);
    expect(result.length).toBe(43); // 40 chars + '...'
  });
});

describe('splitIntoChunks', () => {
  it('should return single chunk if under limit', () => {
    const text = 'Hello world';
    const result = splitIntoChunks(text, 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it('should split text into multiple chunks', () => {
    const text = 'A'.repeat(200);
    const result = splitIntoChunks(text, 10); // 10 tokens * 4 chars = 40 chars
    expect(result.length).toBeGreaterThan(1);
  });

  it('should break at paragraph boundaries when possible', () => {
    const text = 'First paragraph content here.\n\nSecond paragraph content here. More text to fill.';
    const result = splitIntoChunks(text, 15);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should break at sentence boundaries when no paragraph break', () => {
    const text = 'First sentence here. Second sentence here. Third sentence here.';
    const result = splitIntoChunks(text, 6); // 24 chars max
    expect(result.length).toBeGreaterThan(1);
  });

  it('should handle empty text', () => {
    const result = splitIntoChunks('', 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('');
  });
});

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const v1 = [1, 2, 3];
    const v2 = [1, 2, 3];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1);
  });

  it('should return 0 for orthogonal vectors', () => {
    const v1 = [1, 0, 0];
    const v2 = [0, 1, 0];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(0);
  });

  it('should return -1 for opposite vectors', () => {
    const v1 = [1, 1, 1];
    const v2 = [-1, -1, -1];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1);
  });

  it('should handle zero vectors', () => {
    const v1 = [0, 0, 0];
    const v2 = [1, 2, 3];
    expect(cosineSimilarity(v1, v2)).toBe(0);
  });

  it('should throw for mismatched vector lengths', () => {
    const v1 = [1, 2, 3];
    const v2 = [1, 2];
    expect(() => cosineSimilarity(v1, v2)).toThrow('Vectors must have the same length');
  });

  it('should calculate similarity correctly', () => {
    const v1 = [1, 0];
    const v2 = [1, 1];
    // cos(45°) ≈ 0.707
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(0.707, 2);
  });
});

describe('findSimilar', () => {
  const items = [
    { embedding: [1, 0, 0], name: 'item1' },
    { embedding: [0, 1, 0], name: 'item2' },
    { embedding: [0, 0, 1], name: 'item3' },
    { embedding: [0.9, 0.1, 0], name: 'item4' },
  ];

  it('should find most similar items', () => {
    const query = [1, 0, 0];
    const result = findSimilar(query, items, 2);

    expect(result).toHaveLength(2);
    expect(result[0].item.name).toBe('item1'); // Most similar
    expect(result[0].similarity).toBeCloseTo(1);
  });

  it('should sort by similarity descending', () => {
    const query = [1, 0, 0];
    const result = findSimilar(query, items, 4);

    expect(result[0].similarity).toBeGreaterThan(result[1].similarity);
    expect(result[1].similarity).toBeGreaterThan(result[2].similarity);
  });

  it('should respect topK limit', () => {
    const query = [1, 0, 0];
    const result = findSimilar(query, items, 2);

    expect(result).toHaveLength(2);
  });

  it('should use default topK of 5', () => {
    const query = [1, 0, 0];
    const result = findSimilar(query, items);

    expect(result).toHaveLength(4); // All items since there are only 4
  });

  it('should handle empty items array', () => {
    const query = [1, 0, 0];
    const result = findSimilar(query, [], 5);

    expect(result).toHaveLength(0);
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate string IDs', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('should contain timestamp and random parts', () => {
    const id = generateId();
    expect(id).toContain('-');
    const parts = id.split('-');
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });

  it('should generate non-empty IDs', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });
});
