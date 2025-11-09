import { HttpError } from './http-error.js';

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Number of retry attempts after the initial call (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds before first retry (default: 1000ms) */
  initialDelay?: number;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a rate limit error (429)
 */
function isRateLimitError(error: unknown): boolean {
  return error instanceof HttpError && error.status === 429;
}

/**
 * Retry a function with exponential backoff on rate limit errors
 *
 * Uses exponential backoff with jitter to prevent thundering herd:
 * - Attempt 0: 1-2 seconds (1s + 0-1s jitter)
 * - Attempt 1: 2-4 seconds (2s + 0-2s jitter)
 * - Attempt 2: 4-8 seconds (4s + 0-4s jitter)
 * - And so on...
 *
 * @param fn - The function to retry
 * @param options - Retry options (maxRetries: number of retry attempts after initial call)
 * @returns The result of the function
 * @throws The last error if max retries exceeded or non-429 error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Only retry on 429 rate limit errors
      // Throw immediately for any other error type
      if (!isRateLimitError(error)) {
        throw error;
      }

      // Throw if we've exhausted all retry attempts
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = initialDelay * Math.pow(2, attempt);
      const jitter = Math.random() * exponentialDelay;
      const totalDelay = exponentialDelay + jitter;

      await sleep(totalDelay);
    }
  }

  // This line is unreachable due to the throw statements above,
  // but TypeScript requires it for exhaustiveness checking
  throw new Error('Unexpected: retry loop completed without return or throw');
}
