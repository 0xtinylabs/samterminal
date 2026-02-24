/**
 * Chat action with conversation management
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type {
  AIPluginConfig,
  CompletionRequest,
  CompletionResponse,
  AIDatabaseAdapter,
  Conversation,
  ConversationEntry,
  Message,
} from '../types/index.js';
import { extractText } from '../types/index.js';
import type { AIClient } from '../utils/client.js';
import { generateId } from '../utils/index.js';

export interface ChatRequest {
  /** Message to send */
  message: string;

  /** Conversation ID (for continuing a conversation) */
  conversationId?: string;

  /** System prompt */
  system?: string;

  /** Model to use */
  model?: string;

  /** Provider to use */
  provider?: 'openai' | 'anthropic';

  /** Maximum tokens */
  maxTokens?: number;

  /** Temperature */
  temperature?: number;

  /** Include history in response */
  includeHistory?: boolean;
}

export interface ChatResponse {
  /** Response message */
  message: string;

  /** Conversation ID */
  conversationId: string;

  /** Model used */
  model: string;

  /** Provider used */
  provider: string;

  /** Token usage */
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  /** Conversation history (if requested) */
  history?: Message[];

  /** Response timestamp */
  timestamp: number;
}

// In-memory conversation store (fallback when no database adapter)
const conversations = new Map<string, Conversation>();
const CONVERSATION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CONVERSATIONS = 1000;

/**
 * Cleanup stale conversations from in-memory store
 */
function cleanupConversations(): void {
  const now = Date.now();
  for (const [id, conv] of conversations) {
    if (now - conv.updatedAt > CONVERSATION_TTL_MS) {
      conversations.delete(id);
    }
  }
  // If still over limit, remove oldest
  if (conversations.size > MAX_CONVERSATIONS) {
    const sorted = [...conversations.entries()].sort(
      ([, a], [, b]) => a.updatedAt - b.updatedAt,
    );
    const toRemove = sorted.slice(0, conversations.size - MAX_CONVERSATIONS);
    for (const [id] of toRemove) {
      conversations.delete(id);
    }
  }
}

export function createChatAction(
  getClient: () => AIClient | null,
  getDatabase: () => AIDatabaseAdapter | undefined,
  config: AIPluginConfig,
): Action {
  return {
    name: 'ai:chat',
    description: 'Chat with AI, maintaining conversation history',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as ChatRequest;

      if (!input.message) {
        return {
          success: false,
          error: 'Message is required',
        };
      }

      if (typeof input.message !== 'string' || input.message.length > 100000) {
        return {
          success: false,
          error: 'Message must be a string under 100,000 characters',
        };
      }

      try {
        const client = getClient();
        if (!client) {
          return {
            success: false,
            error: 'No AI provider configured',
          };
        }

        const database = getDatabase();

        // Get or create conversation
        let conversation: Conversation;
        const conversationId = input.conversationId ?? generateId();

        if (input.conversationId) {
          // Try to load existing conversation
          if (database) {
            const existing = await database.getConversation(input.conversationId);
            if (existing) {
              conversation = existing;
            } else {
              return {
                success: false,
                error: `Conversation ${input.conversationId} not found`,
              };
            }
          } else {
            const existing = conversations.get(input.conversationId);
            if (existing) {
              conversation = existing;
            } else {
              return {
                success: false,
                error: `Conversation ${input.conversationId} not found`,
              };
            }
          }
        } else {
          // Create new conversation
          conversation = {
            id: conversationId,
            entries: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        }

        // Build messages from history
        const messages: Message[] = conversation.entries.map((entry) => ({
          role: entry.role,
          content: entry.content,
        }));

        // Add new user message
        const userEntry: ConversationEntry = {
          id: generateId(),
          role: 'user',
          content: input.message,
          timestamp: Date.now(),
        };
        conversation.entries.push(userEntry);
        messages.push({ role: 'user', content: input.message });

        // Get completion
        const response = await client.complete({
          messages,
          model: input.model,
          provider: input.provider,
          system: input.system,
          maxTokens: input.maxTokens ?? config.defaultMaxTokens,
          temperature: input.temperature ?? config.defaultTemperature,
        });

        const responseText = extractText(response.content);

        // Add assistant response to conversation
        const assistantEntry: ConversationEntry = {
          id: generateId(),
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
          metadata: {
            model: response.model,
            provider: response.provider,
            usage: response.usage,
          },
        };
        conversation.entries.push(assistantEntry);
        conversation.updatedAt = Date.now();

        // Save conversation
        if (database) {
          await database.saveConversation(conversation);

          // Log usage
          await database.logUsage({
            provider: response.provider,
            model: response.model,
            inputTokens: response.usage.inputTokens,
            outputTokens: response.usage.outputTokens,
            timestamp: Date.now(),
          });
        } else {
          // Cleanup stale conversations periodically
          cleanupConversations();
          conversations.set(conversationId, conversation);
        }

        const result: ChatResponse = {
          message: responseText,
          conversationId,
          model: response.model,
          provider: response.provider,
          usage: response.usage,
          timestamp: response.timestamp,
        };

        if (input.includeHistory) {
          result.history = messages.concat([
            { role: 'assistant', content: responseText },
          ]);
        }

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Chat failed',
        };
      }
    },
  };
}

/**
 * Clear in-memory conversation (for testing/cleanup)
 */
export function clearConversation(conversationId: string): boolean {
  return conversations.delete(conversationId);
}

/**
 * Get conversation from in-memory store
 */
export function getConversation(conversationId: string): Conversation | undefined {
  return conversations.get(conversationId);
}
