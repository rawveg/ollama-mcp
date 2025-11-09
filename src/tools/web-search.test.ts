import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webSearch } from './web-search.js';
import { ResponseFormat } from '../types.js';
import type { Ollama } from 'ollama';

// Mock the retry module
vi.mock('../utils/retry.js', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

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
      }
    );
    expect(result).toContain('Result 1');
    expect(result).toContain('Result 2');
  });

  it('should use retry logic for web search', async () => {
    // Arrange
    const { retryWithBackoff } = await import('../utils/retry.js');
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
    await webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON);

    // Assert
    expect(retryWithBackoff).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        maxRetries: 3,
        initialDelay: 1000,
      })
    );
  });

  it('should handle 429 rate limit error and retry', async () => {
    // Arrange
    const error429 = new Error('Rate limit exceeded');
    (error429 as any).status = 429;

    const mockResponse = {
      results: [
        { title: 'Success after retry', url: 'https://example.com', snippet: 'Test' },
      ],
    };

    // First call returns 429, second succeeds
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

    // Mock retryWithBackoff to actually retry
    const { retryWithBackoff } = await import('../utils/retry.js');
    (retryWithBackoff as any).mockImplementation(async (fn: any) => {
      try {
        return await fn();
      } catch (error: any) {
        if (error.status === 429) {
          return await fn();
        }
        throw error;
      }
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
    });

    // Act & Assert
    await expect(webSearch(mockOllama, testQuery, maxResults, ResponseFormat.JSON))
      .rejects.toThrow('Web search failed: 500 Internal Server Error');
  });
});
