import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { CreateModelInputSchema } from '../schemas.js';

export interface CreateModelOptions {
  model: string;
  from: string;
  system?: string;
  template?: string;
  license?: string;
}

/**
 * Create a model with structured parameters
 */
export async function createModel(
  ollama: Ollama,
  options: CreateModelOptions,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.create({
    model: options.model,
    from: options.from,
    system: options.system,
    template: options.template,
    license: options.license,
    stream: false,
  });

  return formatResponse(JSON.stringify(response), format);
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_create',
  description:
    'Create a new model with structured parameters. Allows customization of model behavior, system prompts, and templates.',
  inputSchema: {
    type: 'object',
    properties: {
      model: {
        type: 'string',
        description: 'Name for the new model',
      },
      from: {
        type: 'string',
        description: 'Base model to derive from (e.g., llama2, llama3)',
      },
      system: {
        type: 'string',
        description: 'System prompt for the model',
      },
      template: {
        type: 'string',
        description: 'Prompt template to use',
      },
      license: {
        type: 'string',
        description: 'License for the model',
      },
      format: {
        type: 'string',
        enum: ['json', 'markdown'],
        default: 'json',
      },
    },
    required: ['model', 'from'],
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    const validated = CreateModelInputSchema.parse(args);
    return createModel(
      ollama,
      {
        model: validated.model,
        from: validated.from,
        system: validated.system,
        template: validated.template,
        license: validated.license,
      },
      format
    );
  },
};
