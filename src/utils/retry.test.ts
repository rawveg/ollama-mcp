import { describe, it, expect, vi, afterEach } from 'vitest';
import { retryWithBackoff } from './retry.js';

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
    const error429 = new Error('Rate limit exceeded');
    (error429 as any).status = 429;

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
    const error429 = new Error('Rate limit exceeded');
    (error429 as any).status = 429;

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
    const error500 = new Error('Internal server error');
    (error500 as any).status = 500;

    const mockFn = vi.fn().mockRejectedValue(error500);

    // Act & Assert
    await expect(retryWithBackoff(mockFn)).rejects.toThrow('Internal server error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff: 1s, 2s, 4s, 8s', async () => {
    // Arrange
    const error429 = new Error('Rate limit exceeded');
    (error429 as any).status = 429;

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
    // Check that delays follow exponential pattern (ignoring jitter)
    expect(delays[0]).toBeGreaterThanOrEqual(1000);
    expect(delays[0]).toBeLessThan(3000);
    expect(delays[1]).toBeGreaterThanOrEqual(2000);
    expect(delays[1]).toBeLessThan(6000);
    expect(delays[2]).toBeGreaterThanOrEqual(4000);
    expect(delays[2]).toBeLessThan(12000);
  });

  it('should add jitter to prevent thundering herd', async () => {
    // Arrange
    const error429 = new Error('Rate limit exceeded');
    (error429 as any).status = 429;

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
});
