import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

/**
 * List running models
 */
export async function listRunningModels(
  ollama: Ollama,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.ps();

  return formatResponse(JSON.stringify(response), format);
}
