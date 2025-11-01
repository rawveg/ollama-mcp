import type { Ollama } from 'ollama';
import type { ChatMessage, GenerationOptions, Tool } from '../types.js';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { ChatInputSchema } from '../schemas.js';

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

export const toolDefinition: ToolDefinition = {
  name: 'ollama_chat',
  description:
    'Chat with a model using conversation messages. Supports system messages, multi-turn conversations, tool calling, and generation options.',
  inputSchema: {
    type: 'object',
    properties: {
      model: {
        type: 'string',
        description: 'Name of the model to use',
      },
      messages: {
        type: 'array',
        description: 'Array of chat messages',
        items: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['system', 'user', 'assistant'],
            },
            content: {
              type: 'string',
            },
            images: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['role', 'content'],
        },
      },
      tools: {
        type: 'string',
        description: 'Tools that the model can call (optional). Provide as JSON array of tool objects.',
      },
      options: {
        type: 'string',
        description: 'Generation options (optional). Provide as JSON object with settings like temperature, top_p, etc.',
      },
      format: {
        type: 'string',
        enum: ['json', 'markdown'],
        default: 'json',
      },
    },
    required: ['model', 'messages'],
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    const validated = ChatInputSchema.parse(args);
    return chatWithModel(
      ollama,
      validated.model,
      validated.messages,
      validated.options || {},
      format,
      validated.tools.length > 0 ? validated.tools : undefined
    );
  },
};
