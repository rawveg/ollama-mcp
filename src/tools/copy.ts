import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

/**
 * Copy a model
 */
export async function copyModel(
  ollama: Ollama,
  source: string,
  destination: string,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.copy({
    source,
    destination,
  });

  return formatResponse(JSON.stringify(response), format);
}
