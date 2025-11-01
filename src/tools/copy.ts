import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { CopyModelInputSchema } from '../schemas.js';

/**
 * Copy a model
 */
export async function copyModel(
  ollama: Ollama,
  source: string,
  destination: string,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.copy({
    source,
    destination,
  });

  return formatResponse(JSON.stringify(response), format);
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_copy',
  description:
    'Copy a model. Creates a duplicate of an existing model with a new name.',
  inputSchema: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'Name of the source model',
      },
      destination: {
        type: 'string',
        description: 'Name for the copied model',
      },
      format: {
        type: 'string',
        enum: ['json', 'markdown'],
        default: 'json',
      },
    },
    required: ['source', 'destination'],
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    const validated = CopyModelInputSchema.parse(args);
    return copyModel(ollama, validated.source, validated.destination, format);
  },
};
