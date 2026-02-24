/**
 * AI types for @samterminal/plugin-ai
 */

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic' | 'ollama' | 'custom';

/**
 * Supported models by provider
 */
export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'o1'
  | 'o1-mini'
  | 'o1-preview';

export type AnthropicModel =
  | 'claude-opus-4-20250514'
  | 'claude-sonnet-4-20250514'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307';

export type AIModel = OpenAIModel | AnthropicModel | string;

/**
 * Message role in conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Content block types
 */
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  source: {
    type: 'base64' | 'url';
    media_type?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data?: string;
    url?: string;
  };
}

export interface ToolUseContent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  type: 'tool_result';
  tool_use_id: string;
  content: string | ContentBlock[];
  is_error?: boolean;
}

export type ContentBlock = TextContent | ImageContent | ToolUseContent | ToolResultContent;

/**
 * Chat message
 */
export interface Message {
  role: MessageRole;
  content: string | ContentBlock[];
  name?: string;
}

/**
 * Tool/Function definition
 */
export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, ToolProperty>;
    required?: string[];
  };
}

export interface ToolProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: ToolProperty;
  properties?: Record<string, ToolProperty>;
}

/**
 * Completion request
 */
export interface CompletionRequest {
  /** Messages in the conversation */
  messages: Message[];

  /** Model to use */
  model?: AIModel;

  /** Provider to use (auto-detected from model if not specified) */
  provider?: AIProvider;

  /** System prompt (prepended to messages) */
  system?: string;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Temperature (0-2) */
  temperature?: number;

  /** Top-p sampling */
  topP?: number;

  /** Stop sequences */
  stopSequences?: string[];

  /** Tools available for the model */
  tools?: Tool[];

  /** Tool choice: auto, none, or specific tool name */
  toolChoice?: 'auto' | 'none' | { name: string };

  /** Stream the response */
  stream?: boolean;

  /** Metadata for tracking */
  metadata?: Record<string, unknown>;
}

/**
 * Tool call in response
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Completion response
 */
export interface CompletionResponse {
  /** Unique response ID */
  id: string;

  /** Model used */
  model: string;

  /** Provider used */
  provider: AIProvider;

  /** Response content */
  content: ContentBlock[];

  /** Tool calls made by the model */
  toolCalls?: ToolCall[];

  /** Stop reason */
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';

  /** Token usage */
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  /** Response timestamp */
  timestamp: number;
}

/**
 * Streaming chunk
 */
export interface StreamChunk {
  type: 'text_delta' | 'tool_use_start' | 'tool_use_delta' | 'message_stop';
  text?: string;
  toolCall?: Partial<ToolCall>;
}

/**
 * Embedding request
 */
export interface EmbeddingRequest {
  /** Text(s) to embed */
  input: string | string[];

  /** Model to use */
  model?: string;

  /** Provider to use */
  provider?: AIProvider;

  /** Dimensions for the embedding (if supported) */
  dimensions?: number;
}

/**
 * Embedding response
 */
export interface EmbeddingResponse {
  /** Model used */
  model: string;

  /** Provider used */
  provider: AIProvider;

  /** Embeddings */
  embeddings: number[][];

  /** Token usage */
  usage: {
    totalTokens: number;
  };

  /** Response timestamp */
  timestamp: number;
}

/**
 * Text generation (simple) request
 */
export interface GenerateRequest {
  /** Prompt text */
  prompt: string;

  /** System prompt */
  system?: string;

  /** Model to use */
  model?: AIModel;

  /** Provider to use */
  provider?: AIProvider;

  /** Maximum tokens */
  maxTokens?: number;

  /** Temperature */
  temperature?: number;

  /** Stream the response */
  stream?: boolean;
}

/**
 * Text generation response
 */
export interface GenerateResponse {
  /** Generated text */
  text: string;

  /** Model used */
  model: string;

  /** Provider used */
  provider: AIProvider;

  /** Token usage */
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  /** Response timestamp */
  timestamp: number;
}

/**
 * Summarization request
 */
export interface SummarizeRequest {
  /** Text to summarize */
  text: string;

  /** Maximum summary length in words (approximate) */
  maxLength?: number;

  /** Summary style */
  style?: 'concise' | 'detailed' | 'bullets';

  /** Model to use */
  model?: AIModel;

  /** Provider to use */
  provider?: AIProvider;
}

/**
 * Summarization response
 */
export interface SummarizeResponse {
  /** Summary text */
  summary: string;

  /** Model used */
  model: string;

  /** Provider used */
  provider: AIProvider;

  /** Token usage */
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  /** Response timestamp */
  timestamp: number;
}

/**
 * Classification request
 */
export interface ClassifyRequest {
  /** Text to classify */
  text: string;

  /** Possible labels */
  labels: string[];

  /** Model to use */
  model?: AIModel;

  /** Provider to use */
  provider?: AIProvider;

  /** Allow multiple labels */
  multiLabel?: boolean;
}

/**
 * Classification response
 */
export interface ClassifyResponse {
  /** Classification results */
  classifications: Array<{
    label: string;
    confidence: number;
  }>;

  /** Model used */
  model: string;

  /** Provider used */
  provider: AIProvider;

  /** Response timestamp */
  timestamp: number;
}

/**
 * Extraction request
 */
export interface ExtractRequest {
  /** Text to extract from */
  text: string;

  /** Schema of data to extract */
  schema: Record<string, ToolProperty>;

  /** Model to use */
  model?: AIModel;

  /** Provider to use */
  provider?: AIProvider;
}

/**
 * Extraction response
 */
export interface ExtractResponse {
  /** Extracted data */
  data: Record<string, unknown>;

  /** Model used */
  model: string;

  /** Provider used */
  provider: AIProvider;

  /** Response timestamp */
  timestamp: number;
}

/**
 * Plugin configuration
 */
export interface AIPluginConfig {
  /** Default provider */
  defaultProvider?: AIProvider;

  /** Default model */
  defaultModel?: AIModel;

  /** OpenAI API key */
  openaiApiKey?: string;

  /** OpenAI organization ID */
  openaiOrgId?: string;

  /** OpenAI base URL (for proxies) */
  openaiBaseUrl?: string;

  /** Anthropic API key */
  anthropicApiKey?: string;

  /** Anthropic base URL (for proxies) */
  anthropicBaseUrl?: string;

  /** Ollama base URL */
  ollamaBaseUrl?: string;

  /** Default max tokens */
  defaultMaxTokens?: number;

  /** Default temperature */
  defaultTemperature?: number;

  /** Request timeout in milliseconds */
  requestTimeout?: number;

  /** Retry configuration */
  retry?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
}

/**
 * Conversation memory entry
 */
export interface ConversationEntry {
  id: string;
  role: MessageRole;
  content: string | ContentBlock[];
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Conversation history
 */
export interface Conversation {
  id: string;
  entries: ConversationEntry[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * Database adapter for AI persistence
 */
export interface AIDatabaseAdapter {
  /** Save a conversation */
  saveConversation(conversation: Conversation): Promise<void>;

  /** Get a conversation by ID */
  getConversation(id: string): Promise<Conversation | null>;

  /** List conversations */
  listConversations(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Conversation[]>;

  /** Delete a conversation */
  deleteConversation(id: string): Promise<void>;

  /** Log usage for analytics */
  logUsage(data: {
    provider: AIProvider;
    model: string;
    inputTokens: number;
    outputTokens: number;
    timestamp: number;
  }): Promise<void>;
}

/**
 * Detect provider from model name
 */
export function detectProvider(model: string): AIProvider {
  if (model.startsWith('gpt-') || model.startsWith('o1')) {
    return 'openai';
  }
  if (model.startsWith('claude-')) {
    return 'anthropic';
  }
  if (model.includes(':') || model.startsWith('llama') || model.startsWith('mistral')) {
    return 'ollama';
  }
  return 'custom';
}

/**
 * Get default model for provider
 */
export function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o';
    case 'anthropic':
      return 'claude-sonnet-4-20250514';
    case 'ollama':
      return 'llama3.2';
    default:
      return 'gpt-4o';
  }
}

/**
 * Extract text from content blocks
 */
export function extractText(content: string | ContentBlock[]): string {
  if (typeof content === 'string') {
    return content;
  }

  return content
    .filter((block): block is TextContent => block.type === 'text')
    .map((block) => block.text)
    .join('');
}
