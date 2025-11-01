import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

/**
 * Pull a model from the Ollama registry
 */
export async function pullModel(
  ollama: Ollama,
  model: string,
  insecure: boolean,
  format: ResponseFormat
): Promise<string> {
  const response = await ollama.pull({
    model,
    insecure,
    stream: false,
  });

  return formatResponse(JSON.stringify(response), format);
}
