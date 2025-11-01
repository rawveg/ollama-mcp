/**
 * Core types for Ollama MCP Server
 */

import type { Ollama } from 'ollama';

/**
 * Response format for tool outputs
 */
export enum ResponseFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
}

/**
 * Generation options that can be passed to Ollama models
 */
export interface GenerationOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_predict?: number;
  repeat_penalty?: number;
  seed?: number;
  stop?: string[];
}

/**
 * Message role for chat
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  images?: string[];
  tool_calls?: ToolCall[];
}

/**
 * Tool definition for function calling
 */
export interface Tool {
  type: string;
  function: {
    name?: string;
    description?: string;
    parameters?: {
      type?: string;
      required?: string[];
      properties?: {
        [key: string]: {
          type?: string | string[];
          description?: string;
          enum?: any[];
        };
      };
    };
  };
}

/**
 * Tool call made by the model
 */
export interface ToolCall {
  function: {
    name: string;
    arguments: {
      [key: string]: any;
    };
  };
}

/**
 * Base tool context passed to all tool implementations
 */
export interface ToolContext {
  ollama: Ollama;
}

/**
 * Tool result with content and format
 */
export interface ToolResult {
  content: string;
  format: ResponseFormat;
}

/**
 * Error types specific to Ollama operations
 */
export class OllamaError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}

export class ModelNotFoundError extends OllamaError {
  constructor(modelName: string) {
    super(
      `Model not found: ${modelName}. Use ollama_list to see available models.`
    );
    this.name = 'ModelNotFoundError';
  }
}

export class NetworkError extends OllamaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'NetworkError';
  }
}

/**
 * Web search result
 */
export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
}

/**
 * Web fetch result
 */
export interface WebFetchResult {
  title: string;
  content: string;
  links: string[];
}
