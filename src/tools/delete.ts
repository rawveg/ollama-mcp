import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { DeleteModelInputSchema } from '../schemas.js';

/**
 * Delete a model
 */
export async function deleteModel(
  ollama: Ollama,
  model: string,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.delete({
    model,
  });

  return formatResponse(JSON.stringify(response), format);
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_delete',
  description:
    'Delete a model from local storage. Removes the model and frees up disk space.',
  inputSchema: {
    type: 'object',
    properties: {
      model: {
        type: 'string',
        description: 'Name of the model to delete',
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
    const validated = DeleteModelInputSchema.parse(args);
    return deleteModel(ollama, validated.model, format);
  },
};
