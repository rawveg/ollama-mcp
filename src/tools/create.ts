import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

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
