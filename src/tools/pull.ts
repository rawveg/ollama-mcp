import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { PullModelInputSchema } from '../schemas.js';

/**
 * Pull a model from the Ollama registry
 */
export async function pullModel(
  ollama: Ollama,
  model: string,
  insecure: boolean,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.pull({
    model,
    insecure,
    stream: false,
  });

  return formatResponse(JSON.stringify(response), format);
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_pull',
  description:
    'Pull a model from the Ollama registry. Downloads the model to make it available locally.',
  inputSchema: {
    type: 'object',
    properties: {
      model: {
        type: 'string',
        description: 'Name of the model to pull',
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
    const validated = PullModelInputSchema.parse(args);
    return pullModel(ollama, validated.model, validated.insecure, format);
  },
};
