import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webSearch } from './web-search.js';
import { ResponseFormat } from '../types.js';
import type { Ollama } from 'ollama';
import { HttpError } from '../utils/http-error.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('webSearch', () => {
  const mockOllama = {} as Ollama;
  const testQuery = 'test search query';
  const maxResults = 5;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OLLAMA_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.OLLAMA_API_KEY;
  });

  it('should throw error if OLLAMA_API_KEY is not set', async () => {
    // Arrange
    delete process.env.OLLAMA_API_KEY;

    // Act & Assert
    await expect(webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON))
      .rejects.toThrow('OLLAMA_API_KEY environment variable is required');
  });

  it('should successfully perform web search', async () => {
    // Arrange
    const mockResponse = {
      results: [
        { title: 'Result 1', url: 'https://example.com/1', snippet: 'Test snippet 1' },
        { title: 'Result 2', url: 'https://example.com/2', snippet: 'Test snippet 2' },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON);

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      'https://ollama.com/api/web_search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: JSON.stringify({ query: testQuery, max_results: maxResults }),
        signal: expect.any(AbortSignal),
      }
    );
    expect(result).toContain('Result 1');
    expect(result).toContain('Result 2');
  });

  it('should successfully complete on first attempt (no retry needed)', async () => {
    // Arrange
    const mockResponse = {
      results: [
        { title: 'Result 1', url: 'https://example.com/1', snippet: 'Test' },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON);

    // Assert
    expect(result).toContain('Result 1');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 429 rate limit error and eventually succeed', async () => {
    // Arrange
    const mockResponse = {
      results: [
        { title: 'Success after retry', url: 'https://example.com', snippet: 'Test' },
      ],
    };

    // Mock setTimeout to execute immediately (avoid real delays in tests)
    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any) => {
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    // First call returns 429, second call succeeds
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

    // Act
    const result = await webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON);

    // Assert
    expect(result).toContain('Success after retry');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw error on non-429 HTTP errors', async () => {
    // Arrange
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
    });

    // Act & Assert
    await expect(webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON))
      .rejects.toThrow('Web search failed: 500 Internal Server Error');
  });

  it('should throw error on network timeout (no status code)', async () => {
    // Arrange
    const networkError = new Error('Network timeout - no response from server');
    (global.fetch as any).mockRejectedValueOnce(networkError);

    // Act & Assert
    await expect(webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON))
      .rejects.toThrow('Network timeout - no response from server');

    // Should not retry network errors
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should throw error when response.json() fails (malformed JSON)', async () => {
    // Arrange
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Unexpected token < in JSON at position 0');
      },
    });

    // Act & Assert
    await expect(webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON))
      .rejects.toThrow('Unexpected token < in JSON at position 0');
  });

  it('should handle fetch abort/cancel errors', async () => {
    // Arrange
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    (global.fetch as any).mockRejectedValueOnce(abortError);

    // Act & Assert
    // Note: fetchWithTimeout transforms AbortError to timeout message
    await expect(webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON))
      .rejects.toThrow('Request timeout after 30000ms');

    // Should not retry abort errors
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should eventually fail after multiple 429 retries', async () => {
    // Arrange
    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any) => {
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    // Always return 429 (will exhaust retries)
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
    });

    // Act & Assert
    await expect(webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON))
      .rejects.toThrow('Web search failed: 429 Too Many Requests');

    // Should attempt initial + 3 retries = 4 total
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
});
