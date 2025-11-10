import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { WebFetchInputSchema } from '../schemas.js';
import { retryWithBackoff, fetchWithTimeout } from '../utils/retry.js';
import { HttpError } from '../utils/http-error.js';
import { WEB_API_RETRY_CONFIG, WEB_API_TIMEOUT } from '../utils/retry-config.js';

/**
 * Fetch a web page using Ollama's web fetch API
 */
export async function webFetch(
  ollama: Ollama,
  url: string,
  format: ResponseFormat
): Promise<string> {
  // Web fetch requires direct API call as it's not in the SDK
  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OLLAMA_API_KEY environment variable is required for web fetch'
    );
  }

  return retryWithBackoff(
    async () => {
      const response = await fetchWithTimeout(
        'https://ollama.com/api/web_fetch',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            url,
          }),
        },
        WEB_API_TIMEOUT
      );

      if (!response.ok) {
        const retryAfter = response.headers.get('retry-after') ?? undefined;
        throw new HttpError(
          `Web fetch failed: ${response.status} ${response.statusText}`,
          response.status,
          retryAfter
        );
      }

      const data = await response.json();
      return formatResponse(JSON.stringify(data), format);
    },
    WEB_API_RETRY_CONFIG
  );
}

export const toolDefinition: ToolDefinition = {
  name: 'ollama_web_fetch',
  description:
    'Fetch a web page by URL using Ollama\'s web fetch API. Returns the page title, content, and links. Requires OLLAMA_API_KEY environment variable.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch',
      },
      format: {
        type: 'string',
        enum: ['json', 'markdown'],
        default: 'json',
      },
    },
    required: ['url'],
  },
  handler: async (ollama: Ollama, args: Record<string, unknown>, format: ResponseFormat) => {
    const validated = WebFetchInputSchema.parse(args);
    return webFetch(ollama, validated.url, format);
  },
};
