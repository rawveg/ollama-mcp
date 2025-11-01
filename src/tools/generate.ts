import type { Ollama } from 'ollama';
import type { GenerationOptions } from '../types.js';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

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
