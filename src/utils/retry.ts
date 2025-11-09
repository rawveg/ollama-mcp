import { HttpError } from './http-error.js';

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Number of retry attempts after the initial call (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds before first retry (default: 1000ms) */
  initialDelay?: number;
  /** Maximum delay in milliseconds to cap exponential backoff (default: Infinity) */
  maxDelay?: number;
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
 * Parse Retry-After header value to milliseconds
 * Supports both delay-seconds and HTTP-date formats
 * @param retryAfter - Retry-After header value
 * @returns Delay in milliseconds, or null if invalid
 */
function parseRetryAfter(retryAfter: string | undefined): number | null {
  if (!retryAfter) {
    return null;
  }

  // Try parsing as seconds (integer)
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  // Try parsing as HTTP-date
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    const delay = date.getTime() - Date.now();
    // Only use if it's a future date
    return delay > 0 ? delay : 0;
  }

  return null;
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
  const { maxRetries = 3, initialDelay = 1000, maxDelay = Infinity } = options;

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

      // Check if error has Retry-After header
      let delay: number;
      const retryAfterDelay = error instanceof HttpError ? parseRetryAfter(error.retryAfter) : null;

      if (retryAfterDelay !== null) {
        // Use Retry-After header value, capped at maxDelay
        delay = Math.min(retryAfterDelay, maxDelay);
      } else {
        // Calculate delay with exponential backoff, capped at maxDelay
        const exponentialDelay = Math.min(
          initialDelay * Math.pow(2, attempt),
          maxDelay
        );
        const jitter = Math.random() * exponentialDelay;
        delay = exponentialDelay + jitter;
      }

      await sleep(delay);
    }
  }

  // This line is unreachable due to the throw statements above,
  // but TypeScript requires it for exhaustiveness checking
  throw new Error('Unexpected: retry loop completed without return or throw');
}
