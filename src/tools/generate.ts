import type { Ollama } from 'ollama';
import type { GenerationOptions } from '../types.js';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { GenerateInputSchema } from '../schemas.js';

/**
 * Generate completion from a prompt
 */
export async function generateWithModel(
  ollama: Ollama,
  model: string,
  prompt: string,
  options: GenerationOptions,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.generate({
    model,
    prompt,
    options,
    format: format === ResponseFormat.JSON ? 'json' : undefined,
    stream: false,
  });

  return formatResponse(response.response, format);
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_generate',
  description:
    'Generate completion from a prompt. Simpler than chat, useful for single-turn completions.',
  inputSchema: {
    type: 'object',
    properties: {
      model: {
        type: 'string',
        description: 'Name of the model to use',
      },
      prompt: {
        type: 'string',
        description: 'The prompt to generate from',
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
    required: ['model', 'prompt'],
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    const validated = GenerateInputSchema.parse(args);
    return generateWithModel(
      ollama,
      validated.model,
      validated.prompt,
      validated.options || {},
      format
    );
  },
};
