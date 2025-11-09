/**
 * Options for retry behavior
 */
export interface RetryOptions {
  maxRetries?: number;
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
  return (
    error instanceof Error &&
    'status' in error &&
    (error as any).status === 429
  );
}

/**
 * Retry a function with exponential backoff on rate limit errors
 *
 * @param fn - The function to retry
 * @param options - Retry options
 * @returns The result of the function
 * @throws The last error if max retries exceeded or non-429 error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000 } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on 429 rate limit errors
      if (!isRateLimitError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted our attempts
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

  throw lastError;
}
