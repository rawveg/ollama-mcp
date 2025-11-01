import type { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';
import { formatResponse } from '../utils/response-formatter.js';

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

  const response = await fetch('https://ollama.com/api/web_search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Web search failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return formatResponse(JSON.stringify(data), format);
}
