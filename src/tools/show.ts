import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

/**
 * Show information about a specific model
 */
export async function showModel(
  ollama: Ollama,
  model: string,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.show({ model });

  return formatResponse(JSON.stringify(response), format);
}
