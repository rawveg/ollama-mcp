import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { PsInputSchema } from '../schemas.js';

/**
 * List running models
 */
export async function listRunningModels(
  ollama: Ollama,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.ps();

  return formatResponse(JSON.stringify(response), format);
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_ps',
  description:
    'List running models. Shows which models are currently loaded in memory.',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['json', 'markdown'],
        default: 'json',
      },
    },
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    PsInputSchema.parse(args);
    return listRunningModels(ollama, format);
  },
};
