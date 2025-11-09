import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webFetch } from './web-fetch.js';
import { ResponseFormat } from '../types.js';
import type { Ollama } from 'ollama';

// Mock the retry module
vi.mock('../utils/retry.js', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('webFetch', () => {
  const mockOllama = {} as Ollama;
  const testUrl = 'https://example.com';

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
    await expect(webFetch(mockOllama, testUrl, ResponseFormat.JSON))
      .rejects.toThrow('OLLAMA_API_KEY environment variable is required');
  });

  it('should successfully fetch web page', async () => {
    // Arrange
    const mockResponse = {
      title: 'Test Page',
      content: 'Test content',
      links: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await webFetch(mockOllama, testUrl, ResponseFormat.JSON);

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      'https://ollama.com/api/web_fetch',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: JSON.stringify({ url: testUrl }),
      }
    );
    expect(result).toContain('Test Page');
  });

  it('should use retry logic for web fetch', async () => {
    // Arrange
    const { retryWithBackoff } = await import('../utils/retry.js');
    const mockResponse = {
      title: 'Test Page',
      content: 'Test content',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    await webFetch(mockOllama, testUrl, ResponseFormat.JSON);

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
      title: 'Success after retry',
      content: 'content',
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
    const result = await webFetch(mockOllama, testUrl, ResponseFormat.JSON);

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
    await expect(webFetch(mockOllama, testUrl, ResponseFormat.JSON))
      .rejects.toThrow('Web fetch failed: 500 Internal Server Error');
  });
});
