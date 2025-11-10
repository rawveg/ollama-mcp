import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { WebSearchInputSchema } from '../schemas.js';
import { retryWithBackoff, fetchWithTimeout } from '../utils/retry.js';
import { HttpError } from '../utils/http-error.js';

/**
 * Perform a web search using Ollama's web search API
 */
export async function webSearch(
  ollama: Ollama,
  query: string,
  maxResults: number,
  format: ResponseFormat
): Promise<string> {
  // Web search requires direct API call as it's not in the SDK
  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OLLAMA_API_KEY environment variable is required for web search'
    );
  }

  return retryWithBackoff(
    async () => {
      const response = await fetchWithTimeout('https://ollama.com/api/web_search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          max_results: maxResults,
        }),
      }, 30000); // 30 second timeout

      if (!response.ok) {
        const retryAfter = response.headers.get('retry-after') ?? undefined;
        throw new HttpError(
          `Web search failed: ${response.status} ${response.statusText}`,
          response.status,
          retryAfter
        );
      }

      const data = await response.json();
      return formatResponse(JSON.stringify(data), format);
    },
    { maxRetries: 3, initialDelay: 1000 } // maxDelay defaults to 10000ms
  );
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_web_search',
  description:
    'Perform a web search using Ollama\'s web search API. Augments models with latest information to reduce hallucinations. Requires OLLAMA_API_KEY environment variable.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query string',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return (1-10, default 5)',
        default: 5,
      },
      format: {
        type: 'string',
        enum: ['json', 'markdown'],
        default: 'json',
      },
    },
    required: ['query'],
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    const validated = WebSearchInputSchema.parse(args);
    return webSearch(ollama, validated.query, validated.max_results, format);
  },
};
