import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webFetch } from '../../src/tools/web-fetch.js';
import { ResponseFormat } from '../../src/types.js';
import type { Ollama } from 'ollama';
import { HttpError } from '../../src/utils/http-error.js';

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
        signal: expect.any(AbortSignal),
      }
    );
    expect(result).toContain('Test Page');
  });

  it('should successfully complete on first attempt (no retry needed)', async () => {
    // Arrange
    const mockResponse = {
      title: 'Test Page',
      content: 'Test content',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await webFetch(mockOllama, testUrl, ResponseFormat.JSON);

    // Assert
    expect(result).toContain('Test Page');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 429 rate limit error and eventually succeed', async () => {
    // Arrange
    const mockResponse = {
      title: 'Success after retry',
      content: 'content',
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
    const result = await webFetch(mockOllama, testUrl, ResponseFormat.JSON);

    // Assert
    expect(result).toContain('Success after retry');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw error on non-retryable HTTP errors', async () => {
    // Arrange - 501 Not Implemented is not retried
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 501,
      statusText: 'Not Implemented',
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
    });

    // Act & Assert
    await expect(webFetch(mockOllama, testUrl, ResponseFormat.JSON))
      .rejects.toThrow('Web fetch failed: 501 Not Implemented');
  });

  it('should throw error on network timeout (no status code)', async () => {
    // Arrange
    const networkError = new Error('Network timeout - no response from server');
    (global.fetch as any).mockRejectedValueOnce(networkError);

    // Act & Assert
    await expect(webFetch(mockOllama, testUrl, ResponseFormat.JSON))
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
    await expect(webFetch(mockOllama, testUrl, ResponseFormat.JSON))
      .rejects.toThrow('Unexpected token < in JSON at position 0');
  });

  it('should handle fetch abort/cancel errors', async () => {
    // Arrange
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    (global.fetch as any).mockRejectedValueOnce(abortError);

    // Act & Assert
    // Note: fetchWithTimeout transforms AbortError to timeout message
    await expect(webFetch(mockOllama, testUrl, ResponseFormat.JSON))
      .rejects.toThrow('Request to https://ollama.com/api/web_fetch timed out after 30000ms');

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
    await expect(webFetch(mockOllama, testUrl, ResponseFormat.JSON))
      .rejects.toThrow('Web fetch failed: 429 Too Many Requests');

    // Should attempt initial + 3 retries = 4 total
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
});
