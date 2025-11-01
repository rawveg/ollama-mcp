import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

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
