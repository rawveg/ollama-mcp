import type { Ollama } from 'ollama';
import type { ChatMessage, GenerationOptions, Tool } from '../types.js';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

/**
 * Chat with a model using conversation messages
 */
export async function chatWithModel(
  ollama: Ollama,
  model: string,
  messages: ChatMessage[],
  options: GenerationOptions,
  format: ResponseFormat,
  tools?: Tool[]
): Promise<string> {
  // Determine format parameter for Ollama API
  let ollamaFormat: 'json' | undefined = undefined;
  if (format === ResponseFormat.JSON) {
    ollamaFormat = 'json';
  }

  const response = await ollama.chat({
    model,
    messages,
    tools,
    options,
    format: ollamaFormat,
    stream: false,
  });

  // Extract content with fallback
  let content = response.message.content;
  if (!content) {
    content = '';
  }

  const tool_calls = response.message.tool_calls;

  // If the response includes tool calls, include them in the output
  let hasToolCalls = false;
  if (tool_calls) {
    if (tool_calls.length > 0) {
      hasToolCalls = true;
    }
  }

  if (hasToolCalls) {
    const fullResponse = {
      content,
      tool_calls,
    };
    return formatResponse(JSON.stringify(fullResponse), format);
  }

  return formatResponse(content, format);
}
