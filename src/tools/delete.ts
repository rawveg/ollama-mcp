import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

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
