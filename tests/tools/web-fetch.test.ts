import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { webFetch } from '../../src/tools/web-fetch.js';
import { ResponseFormat } from '../../src/types.js';

describe('webFetch', () => {
  let ollama: Ollama;

  beforeEach(() => {
    ollama = {} as any;
    // Set API key for tests
    process.env.OLLAMA_API_KEY = 'test-api-key';
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  it('should fetch a web page', async () => {
    const mockResponse = {
      title: 'Ollama',
      content: 'Cloud models are now available in Ollama...',
      links: [
        'https://ollama.com/',
        'https://ollama.com/models',
        'https://github.com/ollama/ollama',
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await webFetch(
      ollama,
      'https://ollama.com',
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://ollama.com/api/web_fetch',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: JSON.stringify({
          url: 'https://ollama.com',
        }),
      }
    );

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('title');
    expect(parsed).toHaveProperty('content');
    expect(parsed).toHaveProperty('links');
    expect(Array.isArray(parsed.links)).toBe(true);
  });

  it('should throw error when OLLAMA_API_KEY is not set', async () => {
    delete process.env.OLLAMA_API_KEY;

    await expect(
      webFetch(ollama, 'https://ollama.com', ResponseFormat.JSON)
    ).rejects.toThrow(
      'OLLAMA_API_KEY environment variable is required for web fetch'
    );
  });

  it('should throw error when fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(
      webFetch(ollama, 'https://example.com/notfound', ResponseFormat.JSON)
    ).rejects.toThrow('Web fetch failed: 404 Not Found');
  });
});
