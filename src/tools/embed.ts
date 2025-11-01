import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { EmbedInputSchema } from '../schemas.js';

/**
 * Generate embeddings for text input
 */
export async function embedWithModel(
  ollama: Ollama,
  model: string,
  input: string | string[],
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.embed({
    model,
    input,
  });

  return formatResponse(JSON.stringify(response), format);
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_embed',
  description:
    'Generate embeddings for text input. Returns numerical vector representations.',
  inputSchema: {
    type: 'object',
    properties: {
      model: {
        type: 'string',
        description: 'Name of the model to use',
      },
      input: {
        type: 'string',
        description:
          'Text input. For batch processing, provide a JSON-encoded array of strings, e.g., ["text1", "text2"]',
      },
      format: {
        type: 'string',
        enum: ['json', 'markdown'],
        default: 'json',
      },
    },
    required: ['model', 'input'],
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    const validated = EmbedInputSchema.parse(args);
    return embedWithModel(ollama, validated.model, validated.input, format);
  },
};
