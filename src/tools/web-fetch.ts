import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';
import type { ToolDefinition } from '../autoloader.js';
import { WebFetchInputSchema } from '../schemas.js';

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

  const response = await fetch('https://ollama.com/api/web_fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Web fetch failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return formatResponse(JSON.stringify(data), format);
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
