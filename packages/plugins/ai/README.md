# @samterminal/plugin-ai

AI/LLM plugin for SamTerminal - supports OpenAI, Anthropic, and more.

## Installation

```bash
pnpm add @samterminal/plugin-ai
```

## Configuration

```typescript
import { AIPlugin } from '@samterminal/plugin-ai';

const aiPlugin = new AIPlugin({
  // API Keys (can also use environment variables)
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  // Default provider and model
  defaultProvider: 'anthropic',
  defaultModel: 'claude-sonnet-4-20250514',

  // Generation defaults
  defaultMaxTokens: 4096,
  defaultTemperature: 0.7,

  // Request settings
  requestTimeout: 60000,
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  },

  // Optional: Database adapter for conversation persistence
  database: myDatabaseAdapter,
});
```

### Environment Variables

- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `OPENAI_ORG_ID` - OpenAI organization ID (optional)
- `OLLAMA_BASE_URL` - Ollama base URL (optional)

## Providers

### ai:completion

Get a chat completion with full control.

```typescript
const result = await core.services.getProvider('ai:completion').get({
  query: {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the capital of France?' },
    ],
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1000,
    temperature: 0.7,
  },
});

console.log(result.data);
// {
//   id: 'msg_...',
//   model: 'claude-sonnet-4-20250514',
//   provider: 'anthropic',
//   content: [{ type: 'text', text: 'The capital of France is Paris...' }],
//   usage: { inputTokens: 25, outputTokens: 50, totalTokens: 75 },
// }
```

### ai:embedding

Generate text embeddings (OpenAI only).

```typescript
const result = await core.services.getProvider('ai:embedding').get({
  query: {
    input: ['Hello world', 'Goodbye world'],
    model: 'text-embedding-3-small',
  },
});

console.log(result.data);
// {
//   embeddings: [[0.1, 0.2, ...], [0.3, 0.4, ...]],
//   usage: { totalTokens: 8 },
// }
```

### ai:models

List available AI models.

```typescript
const result = await core.services.getProvider('ai:models').get({
  query: {
    provider: 'anthropic',
    supportsVision: true,
  },
});

console.log(result.data.models);
// [{ id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', ... }]
```

## Actions

### ai:generate

Simple text generation.

```typescript
const result = await core.services.getAction('ai:generate').execute({
  input: {
    prompt: 'Write a haiku about programming',
    model: 'gpt-4o',
    temperature: 0.9,
  },
});

console.log(result.data.text);
// "Lines of code cascade\nLogic flows like mountain streams\nBugs hide in the mist"
```

### ai:chat

Chat with conversation history.

```typescript
// Start a new conversation
const result1 = await core.services.getAction('ai:chat').execute({
  input: {
    message: 'My name is Alice',
    system: 'You are a friendly assistant.',
  },
});

console.log(result1.data.conversationId); // 'abc123'

// Continue the conversation
const result2 = await core.services.getAction('ai:chat').execute({
  input: {
    message: 'What is my name?',
    conversationId: 'abc123',
  },
});

console.log(result2.data.message); // 'Your name is Alice!'
```

### ai:summarize

Summarize text.

```typescript
const result = await core.services.getAction('ai:summarize').execute({
  input: {
    text: 'Long article text here...',
    style: 'bullets', // 'concise' | 'detailed' | 'bullets'
    maxLength: 100, // approximate words
  },
});

console.log(result.data.summary);
// "• Key point 1\n• Key point 2\n• Key point 3"
```

### ai:classify

Classify text into categories.

```typescript
const result = await core.services.getAction('ai:classify').execute({
  input: {
    text: 'I love this product! Best purchase ever!',
    labels: ['positive', 'negative', 'neutral'],
  },
});

console.log(result.data.classifications);
// [{ label: 'positive', confidence: 0.95 }]
```

### ai:extract

Extract structured data from text.

```typescript
const result = await core.services.getAction('ai:extract').execute({
  input: {
    text: 'John Smith is 30 years old and lives in New York.',
    schema: {
      name: { type: 'string', description: 'Person name' },
      age: { type: 'number', description: 'Age in years' },
      city: { type: 'string', description: 'City of residence' },
    },
  },
});

console.log(result.data.data);
// { name: 'John Smith', age: 30, city: 'New York' }
```

## Tool Use (Function Calling)

```typescript
const tools = [
  {
    name: 'get_weather',
    description: 'Get weather for a location',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
      },
      required: ['location'],
    },
  },
];

const result = await aiPlugin.getClient()!.complete({
  messages: [{ role: 'user', content: 'What is the weather in Paris?' }],
  tools,
  toolChoice: 'auto',
});

if (result.toolCalls) {
  for (const call of result.toolCalls) {
    console.log(`Tool: ${call.name}, Input: ${JSON.stringify(call.input)}`);
    // Tool: get_weather, Input: {"location":"Paris"}
  }
}
```

## Streaming

```typescript
const stream = aiPlugin.getClient()!.stream({
  messages: [{ role: 'user', content: 'Tell me a story' }],
});

for await (const chunk of stream) {
  if (chunk.type === 'text_delta') {
    process.stdout.write(chunk.text ?? '');
  }
}
```

## Direct API Access

```typescript
// Get underlying clients
const openai = aiPlugin.getClient()?.getOpenAIClient();
const anthropic = aiPlugin.getClient()?.getAnthropicClient();

// Quick generate
const text = await aiPlugin.generate('Write a poem about clouds');
```

## Utilities

```typescript
import {
  cosineSimilarity,
  findSimilar,
  splitIntoChunks,
  truncateToTokens,
} from '@samterminal/plugin-ai';

// Calculate embedding similarity
const similarity = cosineSimilarity(embedding1, embedding2);

// Find similar items
const similar = findSimilar(queryEmbedding, items, 5);

// Split text for processing
const chunks = splitIntoChunks(longText, 4000);

// Truncate to token limit
const truncated = truncateToTokens(text, 1000);
```

## Supported Models

### OpenAI
- `gpt-4o` - Latest GPT-4 with vision
- `gpt-4o-mini` - Smaller, faster GPT-4
- `gpt-4-turbo` - GPT-4 Turbo
- `o1` - Reasoning model
- `o1-mini` - Smaller reasoning model

### Anthropic
- `claude-opus-4-20250514` - Most capable Claude
- `claude-sonnet-4-20250514` - Balanced performance
- `claude-3-5-sonnet-20241022` - Previous Sonnet
- `claude-3-5-haiku-20241022` - Fast and efficient

## Database Adapter

Implement `AIDatabaseAdapter` for conversation persistence:

```typescript
interface AIDatabaseAdapter {
  saveConversation(conversation: Conversation): Promise<void>;
  getConversation(id: string): Promise<Conversation | null>;
  listConversations(options?: { limit?: number; offset?: number }): Promise<Conversation[]>;
  deleteConversation(id: string): Promise<void>;
  logUsage(data: {
    provider: AIProvider;
    model: string;
    inputTokens: number;
    outputTokens: number;
    timestamp: number;
  }): Promise<void>;
}
```

## License

MIT
