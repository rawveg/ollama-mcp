import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { webSearch, toolDefinition } from '../../src/tools/web-search.js';
import { ResponseFormat } from '../../src/types.js';

describe('webSearch', () => {
  let ollama: Ollama;

  beforeEach(() => {
    ollama = {} as any;
    // Set API key for tests
    process.env.OLLAMA_API_KEY = 'test-api-key';
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  it('should perform a web search', async () => {
    const mockResponse = {
      results: [
        {
          title: 'Ollama',
          url: 'https://ollama.com/',
          content: 'Cloud models are now available...',
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await webSearch(
      ollama,
      'what is ollama?',
      5,
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://ollama.com/api/web_search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: JSON.stringify({
          query: 'what is ollama?',
          max_results: 5,
        }),
      }
    );

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('results');
    expect(Array.isArray(parsed.results)).toBe(true);
  });

  it('should throw error when OLLAMA_API_KEY is not set', async () => {
    delete process.env.OLLAMA_API_KEY;

    await expect(
      webSearch(ollama, 'test query', 5, ResponseFormat.JSON)
    ).rejects.toThrow(
      'OLLAMA_API_KEY environment variable is required for web search'
    );
  });

  it('should throw error when search fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(
      webSearch(ollama, 'test query', 5, ResponseFormat.JSON)
    ).rejects.toThrow('Web search failed: 500 Internal Server Error');
  });

  it('should work through toolDefinition handler', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] })
    });
    const result = await toolDefinition.handler(
      ollama,
      { query: 'test query', max_results: 5, format: 'json' },
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
  });

});