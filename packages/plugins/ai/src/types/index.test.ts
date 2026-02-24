/**
 * AI types tests
 */


import { detectProvider, getDefaultModel, extractText } from './index.js';
import type { ContentBlock, TextContent } from './index.js';

describe('detectProvider', () => {
  describe('OpenAI models', () => {
    it('should detect gpt-4o as openai', () => {
      expect(detectProvider('gpt-4o')).toBe('openai');
    });

    it('should detect gpt-4o-mini as openai', () => {
      expect(detectProvider('gpt-4o-mini')).toBe('openai');
    });

    it('should detect gpt-4-turbo as openai', () => {
      expect(detectProvider('gpt-4-turbo')).toBe('openai');
    });

    it('should detect gpt-3.5-turbo as openai', () => {
      expect(detectProvider('gpt-3.5-turbo')).toBe('openai');
    });

    it('should detect o1 as openai', () => {
      expect(detectProvider('o1')).toBe('openai');
    });

    it('should detect o1-mini as openai', () => {
      expect(detectProvider('o1-mini')).toBe('openai');
    });

    it('should detect o1-preview as openai', () => {
      expect(detectProvider('o1-preview')).toBe('openai');
    });
  });

  describe('Anthropic models', () => {
    it('should detect claude-opus-4-20250514 as anthropic', () => {
      expect(detectProvider('claude-opus-4-20250514')).toBe('anthropic');
    });

    it('should detect claude-sonnet-4-20250514 as anthropic', () => {
      expect(detectProvider('claude-sonnet-4-20250514')).toBe('anthropic');
    });

    it('should detect claude-3-5-sonnet-20241022 as anthropic', () => {
      expect(detectProvider('claude-3-5-sonnet-20241022')).toBe('anthropic');
    });

    it('should detect claude-3-5-haiku-20241022 as anthropic', () => {
      expect(detectProvider('claude-3-5-haiku-20241022')).toBe('anthropic');
    });

    it('should detect claude-3-opus-20240229 as anthropic', () => {
      expect(detectProvider('claude-3-opus-20240229')).toBe('anthropic');
    });
  });

  describe('Ollama models', () => {
    it('should detect llama models as ollama', () => {
      expect(detectProvider('llama3.2')).toBe('ollama');
    });

    it('should detect mistral models as ollama', () => {
      expect(detectProvider('mistral')).toBe('ollama');
    });

    it('should detect models with colon as ollama', () => {
      expect(detectProvider('codellama:7b')).toBe('ollama');
    });
  });

  describe('Custom/unknown models', () => {
    it('should return custom for unknown models', () => {
      expect(detectProvider('unknown-model')).toBe('custom');
    });

    it('should return custom for empty string', () => {
      expect(detectProvider('')).toBe('custom');
    });
  });
});

describe('getDefaultModel', () => {
  it('should return gpt-4o for openai', () => {
    expect(getDefaultModel('openai')).toBe('gpt-4o');
  });

  it('should return claude-sonnet-4-20250514 for anthropic', () => {
    expect(getDefaultModel('anthropic')).toBe('claude-sonnet-4-20250514');
  });

  it('should return llama3.2 for ollama', () => {
    expect(getDefaultModel('ollama')).toBe('llama3.2');
  });

  it('should return gpt-4o for custom', () => {
    expect(getDefaultModel('custom')).toBe('gpt-4o');
  });
});

describe('extractText', () => {
  it('should return string content directly', () => {
    expect(extractText('Hello world')).toBe('Hello world');
  });

  it('should extract text from single text block', () => {
    const content: ContentBlock[] = [{ type: 'text', text: 'Hello' }];
    expect(extractText(content)).toBe('Hello');
  });

  it('should concatenate multiple text blocks', () => {
    const content: ContentBlock[] = [
      { type: 'text', text: 'Hello ' },
      { type: 'text', text: 'world' },
    ];
    expect(extractText(content)).toBe('Hello world');
  });

  it('should ignore non-text blocks', () => {
    const content: ContentBlock[] = [
      { type: 'text', text: 'Hello' },
      {
        type: 'tool_use',
        id: 'tool_1',
        name: 'get_weather',
        input: { location: 'London' },
      },
      { type: 'text', text: ' world' },
    ];
    expect(extractText(content)).toBe('Hello world');
  });

  it('should return empty string for no text blocks', () => {
    const content: ContentBlock[] = [
      {
        type: 'tool_use',
        id: 'tool_1',
        name: 'get_weather',
        input: { location: 'London' },
      },
    ];
    expect(extractText(content)).toBe('');
  });

  it('should handle empty array', () => {
    expect(extractText([])).toBe('');
  });

  it('should handle image blocks correctly', () => {
    const content: ContentBlock[] = [
      { type: 'text', text: 'Before image' },
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: 'abc123' },
      },
      { type: 'text', text: ' after image' },
    ];
    expect(extractText(content)).toBe('Before image after image');
  });

  it('should handle tool_result blocks correctly', () => {
    const content: ContentBlock[] = [
      { type: 'text', text: 'Result: ' },
      {
        type: 'tool_result',
        tool_use_id: 'tool_1',
        content: 'Weather is sunny',
      },
    ];
    expect(extractText(content)).toBe('Result: ');
  });
});
