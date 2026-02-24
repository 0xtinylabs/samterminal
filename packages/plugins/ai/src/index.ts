/**
 * @samterminal/plugin-ai
 *
 * AI/LLM plugin for SamTerminal - supports OpenAI, Anthropic, and more
 */

// Plugin exports
export { AIPlugin, createAIPlugin, type AIPluginOptions } from './plugin.js';

// Type exports
export type {
  AIProvider,
  OpenAIModel,
  AnthropicModel,
  AIModel,
  MessageRole,
  TextContent,
  ImageContent,
  ToolUseContent,
  ToolResultContent,
  ContentBlock,
  Message,
  Tool,
  ToolProperty,
  CompletionRequest,
  ToolCall,
  CompletionResponse,
  StreamChunk,
  EmbeddingRequest,
  EmbeddingResponse,
  GenerateRequest,
  GenerateResponse,
  SummarizeRequest,
  SummarizeResponse,
  ClassifyRequest,
  ClassifyResponse,
  ExtractRequest,
  ExtractResponse,
  AIPluginConfig,
  ConversationEntry,
  Conversation,
  AIDatabaseAdapter,
} from './types/index.js';

// Utility exports from types
export { detectProvider, getDefaultModel, extractText } from './types/index.js';

// Utils exports
export {
  OpenAIClient,
  createOpenAIClient,
  type OpenAIClientConfig,
} from './utils/openai.js';

export {
  AnthropicClient,
  createAnthropicClient,
  type AnthropicClientConfig,
} from './utils/anthropic.js';

export { AIClient, createAIClient } from './utils/client.js';

export {
  delay,
  retry,
  truncateToTokens,
  splitIntoChunks,
  cosineSimilarity,
  findSimilar,
  generateId,
} from './utils/index.js';

// Provider exports
export { createCompletionProvider } from './providers/completion.js';
export { createEmbeddingProvider } from './providers/embedding.js';
export { createModelsProvider, type ModelInfo, type ModelsQuery } from './providers/models.js';

// Action exports
export { createGenerateAction } from './actions/generate.js';
export { createSummarizeAction } from './actions/summarize.js';
export { createClassifyAction } from './actions/classify.js';
export { createExtractAction } from './actions/extract.js';
export {
  createChatAction,
  clearConversation,
  getConversation,
  type ChatRequest,
  type ChatResponse,
} from './actions/chat.js';
