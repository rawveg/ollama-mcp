import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';

/**
 * List all available models
 */
export async function listModels(
  ollama: Ollama,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.list();

  return formatResponse(JSON.stringify(response), format);
}

/**
 * Tool metadata definition
 */
export const toolDefinition: ToolDefinition = {
  name: 'ollama_list',
  description:
    'List all available Ollama models installed locally. Returns model names, sizes, and modification dates.',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['json', 'markdown'],
        description: 'Output format (default: json)',
        default: 'json',
      },
    },
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    return listModels(ollama, format);
  },
};
