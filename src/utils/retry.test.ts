import { describe, it, expect, vi, afterEach } from 'vitest';
import { retryWithBackoff, fetchWithTimeout } from './retry.js';
import { HttpError } from './http-error.js';

describe('retryWithBackoff', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully execute function on first attempt', async () => {
    // Arrange
    const mockFn = vi.fn().mockResolvedValue('success');

    // Act
    const result = await retryWithBackoff(mockFn);

    // Assert
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on 429 rate limit error with exponential backoff', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429);

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any) => {
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act
    const result = await retryWithBackoff(mockFn, { maxRetries: 3, initialDelay: 1000 });

    // Assert
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries exceeded', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429);

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any) => {
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi.fn().mockRejectedValue(error429);

    // Act & Assert
    await expect(retryWithBackoff(mockFn, { maxRetries: 2, initialDelay: 100 }))
      .rejects.toThrow('Rate limit exceeded');
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should not retry on non-429 errors', async () => {
    // Arrange
    const error500 = new HttpError('Internal server error', 500);

    const mockFn = vi.fn().mockRejectedValue(error500);

    // Act & Assert
    await expect(retryWithBackoff(mockFn)).rejects.toThrow('Internal server error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff with jitter: 1-2s, 2-4s, 4-8s', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429);

    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      // Immediately execute callback to avoid timing issues
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act
    await retryWithBackoff(mockFn, { maxRetries: 4, initialDelay: 1000 });

    // Assert
    // Check that delays follow exponential pattern with jitter
    // Formula: exponentialDelay + jitter where jitter = random() * exponentialDelay
    // Attempt 0: 1000 + (0 to 1000) = 1000-2000ms
    expect(delays[0]).toBeGreaterThanOrEqual(1000);
    expect(delays[0]).toBeLessThan(2000);

    // Attempt 1: 2000 + (0 to 2000) = 2000-4000ms
    expect(delays[1]).toBeGreaterThanOrEqual(2000);
    expect(delays[1]).toBeLessThan(4000);

    // Attempt 2: 4000 + (0 to 4000) = 4000-8000ms
    expect(delays[2]).toBeGreaterThanOrEqual(4000);
    expect(delays[2]).toBeLessThan(8000);
  });

  it('should add jitter to prevent thundering herd', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429);

    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    vi.spyOn(Math, 'random').mockReturnValue(0.5); // Fixed jitter for testing

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act
    await retryWithBackoff(mockFn, { maxRetries: 2, initialDelay: 1000 });

    // Assert
    // Delay should be 1000 + (1000 * 0.5) = 1500ms
    expect(delays[0]).toBe(1500);
  });

  it('should respect maxRetries exactly (3 retries = 4 total attempts)', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429);

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any) => {
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act
    const result = await retryWithBackoff(mockFn, { maxRetries: 3, initialDelay: 100 });

    // Assert
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it('should throw after exactly maxRetries attempts (not maxRetries + 1)', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429);

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any) => {
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi.fn().mockRejectedValue(error429);

    // Act & Assert
    await expect(retryWithBackoff(mockFn, { maxRetries: 3, initialDelay: 100 }))
      .rejects.toThrow('Rate limit exceeded');

    // Should be called 4 times: initial attempt + 3 retries
    expect(mockFn).toHaveBeenCalledTimes(4);
  });

  it('should not retry on network timeout errors (no status code)', async () => {
    // Arrange
    const networkError = new Error('Network timeout');
    // Intentionally don't add status property - simulates timeout/network errors

    const mockFn = vi.fn().mockRejectedValue(networkError);

    // Act & Assert
    await expect(retryWithBackoff(mockFn, { maxRetries: 3 }))
      .rejects.toThrow('Network timeout');

    // Should only be called once (no retries for non-HTTP errors)
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should not retry on non-HttpError errors', async () => {
    // Arrange
    const genericError = new Error('Something went wrong');

    const mockFn = vi.fn().mockRejectedValue(genericError);

    // Act & Assert
    await expect(retryWithBackoff(mockFn, { maxRetries: 3 }))
      .rejects.toThrow('Something went wrong');

    // Should only be called once
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle maximum retries with high initial delay', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429);
    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi.fn().mockRejectedValue(error429);

    // Act & Assert
    await expect(retryWithBackoff(mockFn, { maxRetries: 5, initialDelay: 10000 }))
      .rejects.toThrow('Rate limit exceeded');

    // Verify delays grow exponentially even with high initial delay
    // Attempt 0: 10000 + jitter (10000-20000ms)
    expect(delays[0]).toBeGreaterThanOrEqual(10000);
    expect(delays[0]).toBeLessThan(20000);

    // Attempt 1: 20000 + jitter (20000-40000ms)
    expect(delays[1]).toBeGreaterThanOrEqual(20000);
    expect(delays[1]).toBeLessThan(40000);

    // Attempt 2: 40000 + jitter (40000-80000ms)
    expect(delays[2]).toBeGreaterThanOrEqual(40000);
    expect(delays[2]).toBeLessThan(80000);

    // Should attempt maxRetries + 1 times (initial + 5 retries)
    expect(mockFn).toHaveBeenCalledTimes(6);
  });

  it('should cap delays at maxDelay when specified', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429);
    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi.fn().mockRejectedValue(error429);

    // Act & Assert
    await expect(retryWithBackoff(mockFn, {
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 5000
    })).rejects.toThrow('Rate limit exceeded');

    // All delays should be capped at maxDelay (5000ms) + jitter
    // Without cap: 1000, 2000, 4000, 8000, 16000 (before jitter)
    // With cap: 1000, 2000, 4000, 5000, 5000 (before jitter)
    // With jitter: delays[3] and delays[4] should be < 10000 (5000 + max jitter 5000)

    // First three delays should follow exponential pattern
    expect(delays[0]).toBeGreaterThanOrEqual(1000);
    expect(delays[0]).toBeLessThan(2000);

    expect(delays[1]).toBeGreaterThanOrEqual(2000);
    expect(delays[1]).toBeLessThan(4000);

    expect(delays[2]).toBeGreaterThanOrEqual(4000);
    expect(delays[2]).toBeLessThan(8000);

    // Fourth and fifth delays should be capped at maxDelay + jitter
    expect(delays[3]).toBeGreaterThanOrEqual(5000);
    expect(delays[3]).toBeLessThan(10000); // 5000 + max jitter of 5000

    expect(delays[4]).toBeGreaterThanOrEqual(5000);
    expect(delays[4]).toBeLessThan(10000); // 5000 + max jitter of 5000
  });

  it('should allow unbounded growth when maxDelay is not specified (backward compatibility)', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429);
    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act
    await retryWithBackoff(mockFn, { maxRetries: 3, initialDelay: 1000 });

    // Assert - delays should grow without bounds
    // Attempt 0: 1000 + jitter (1000-2000ms)
    expect(delays[0]).toBeGreaterThanOrEqual(1000);
    expect(delays[0]).toBeLessThan(2000);

    // Attempt 1: 2000 + jitter (2000-4000ms)
    expect(delays[1]).toBeGreaterThanOrEqual(2000);
    expect(delays[1]).toBeLessThan(4000);
  });

  it('should handle maxDelay smaller than initialDelay', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429);
    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act - maxDelay (500) is less than initialDelay (1000)
    await retryWithBackoff(mockFn, {
      maxRetries: 2,
      initialDelay: 1000,
      maxDelay: 500
    });

    // Assert - delay should be capped at maxDelay + jitter from the start
    expect(delays[0]).toBeGreaterThanOrEqual(500);
    expect(delays[0]).toBeLessThan(1000); // 500 + max jitter of 500
  });

  it('should use Retry-After header value in seconds when provided', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429, '5'); // 5 seconds
    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act
    await retryWithBackoff(mockFn, { maxRetries: 2, initialDelay: 1000 });

    // Assert - should use 5000ms from Retry-After instead of exponential backoff
    expect(delays[0]).toBe(5000);
  });

  it('should use Retry-After header value as HTTP-date when provided', async () => {
    // Arrange
    const futureDate = new Date(Date.now() + 3000); // 3 seconds from now
    const error429 = new HttpError('Rate limit exceeded', 429, futureDate.toUTCString());
    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act
    await retryWithBackoff(mockFn, { maxRetries: 2, initialDelay: 1000 });

    // Assert - should use calculated delay from date (approximately 3000ms)
    // Allow wider tolerance due to timing variations in test execution
    expect(delays[0]).toBeGreaterThanOrEqual(2000);
    expect(delays[0]).toBeLessThan(4000);
  });

  it('should fallback to exponential backoff if Retry-After is invalid', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429, 'invalid-value');
    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act
    await retryWithBackoff(mockFn, { maxRetries: 2, initialDelay: 1000 });

    // Assert - should fallback to exponential backoff (1000-2000ms)
    expect(delays[0]).toBeGreaterThanOrEqual(1000);
    expect(delays[0]).toBeLessThan(2000);
  });

  it('should respect maxDelay even with Retry-After header', async () => {
    // Arrange
    const error429 = new HttpError('Rate limit exceeded', 429, '20'); // 20 seconds
    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act - maxDelay is 5000ms, but Retry-After says 20000ms
    await retryWithBackoff(mockFn, { maxRetries: 2, initialDelay: 1000, maxDelay: 5000 });

    // Assert - should be capped at maxDelay
    expect(delays[0]).toBe(5000);
  });

  it('should handle negative or past Retry-After dates gracefully', async () => {
    // Arrange
    const pastDate = new Date(Date.now() - 5000); // 5 seconds ago
    const error429 = new HttpError('Rate limit exceeded', 429, pastDate.toUTCString());
    const delays: number[] = [];

    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
      delays.push(delay);
      Promise.resolve().then(() => callback());
      return 0 as any;
    }) as any);

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce('success');

    // Act
    await retryWithBackoff(mockFn, { maxRetries: 2, initialDelay: 1000 });

    // Assert - should use minimum delay (0ms or fallback to exponential)
    expect(delays[0]).toBeGreaterThanOrEqual(0);
    expect(delays[0]).toBeLessThan(2000);
  });
});

describe('fetchWithTimeout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully fetch when request completes before timeout', async () => {
    // Arrange
    const mockResponse = { ok: true, status: 200 } as Response;
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    // Act
    const result = await fetchWithTimeout('https://example.com', undefined, 5000);

    // Assert
    expect(result).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
      signal: expect.any(AbortSignal),
    });
  });

  it('should timeout when request takes too long', async () => {
    // Arrange - Create a fetch that respects abort signal
    const slowFetch = vi.fn((url: string, options?: RequestInit) =>
      new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => resolve({ ok: true }), 200);

        // Listen for abort signal
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            const error: any = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }
      })
    );
    global.fetch = slowFetch as any;

    // Act & Assert
    await expect(fetchWithTimeout('https://example.com', undefined, 50))
      .rejects.toThrow('Request timeout after 50ms');
  });

  it('should pass through non-abort errors', async () => {
    // Arrange - Create a fetch that throws a network error
    const networkError = new Error('Network failure');
    global.fetch = vi.fn().mockRejectedValue(networkError);

    // Act & Assert
    await expect(fetchWithTimeout('https://example.com'))
      .rejects.toThrow('Network failure');
  });
});
