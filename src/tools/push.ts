import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { PushModelInputSchema } from '../schemas.js';

/**
 * Push a model to the Ollama registry
 */
export async function pushModel(
  ollama: Ollama,
  model: string,
  insecure: boolean,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.push({
    model,
    insecure,
    stream: false,
  });

  return formatResponse(JSON.stringify(response), format);
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_push',
  description:
    'Push a model to the Ollama registry. Uploads a local model to make it available remotely.',
  inputSchema: {
    type: 'object',
    properties: {
      model: {
        type: 'string',
        description: 'Name of the model to push',
      },
      insecure: {
        type: 'boolean',
        description: 'Allow insecure connections',
        default: false,
      },
      format: {
        type: 'string',
        enum: ['json', 'markdown'],
        default: 'json',
      },
    },
    required: ['model'],
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    const validated = PushModelInputSchema.parse(args);
    return pushModel(ollama, validated.model, validated.insecure, format);
  },
};
