import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

/**
 * Push a model to the Ollama registry
 */
export async function pushModel(
  ollama: Ollama,
  model: string,
  insecure: boolean,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.push({
    model,
    insecure,
    stream: false,
  });

  return formatResponse(JSON.stringify(response), format);
}
