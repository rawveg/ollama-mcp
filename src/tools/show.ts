import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { ShowModelInputSchema } from '../schemas.js';

/**
 * Show information about a specific model
 */
export async function showModel(
  ollama: Ollama,
  model: string,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.show({ model });

  return formatResponse(JSON.stringify(response), format);
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_show',
  description:
    'Show detailed information about a specific model including modelfile, parameters, and architecture details.',
  inputSchema: {
    type: 'object',
    properties: {
      model: {
        type: 'string',
        description: 'Name of the model to show',
      },
      format: {
        type: 'string',
        enum: ['json', 'markdown'],
        description: 'Output format (default: json)',
        default: 'json',
      },
    },
    required: ['model'],
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    const validated = ShowModelInputSchema.parse(args);
    return showModel(ollama, validated.model, format);
  },
};
