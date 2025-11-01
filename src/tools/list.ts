import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

/**
 * List all available models
 */
export async function listModels(
  ollama: Ollama,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.list();

  return formatResponse(JSON.stringify(response), format);
}
