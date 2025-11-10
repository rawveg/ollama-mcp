import { HttpError } from './http-error.js';

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Number of retry attempts after the initial call (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds before first retry (default: 1000ms) */
  initialDelay?: number;
  /** Maximum delay in milliseconds to cap exponential backoff (default: 10000ms) */
  maxDelay?: number;
  /** Request timeout in milliseconds (default: 30000ms) */
  timeout?: number;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable based on HTTP status code
 *
 * Retryable errors include:
 * - 429 (Too Many Requests) - Rate limiting
 * - 500 (Internal Server Error) - Transient server issues
 * - 502 (Bad Gateway) - Gateway/proxy received invalid response
 * - 503 (Service Unavailable) - Server temporarily unable to handle request
 * - 504 (Gateway Timeout) - Gateway/proxy did not receive timely response
 *
 * These errors are typically transient and safe to retry for idempotent operations.
 * Other 5xx errors (501, 505, 506, 508, etc.) indicate permanent configuration
 * or implementation issues and should not be retried.
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof HttpError)) {
    return false;
  }

  const retryableStatuses = [429, 500, 502, 503, 504];
  return retryableStatuses.includes(error.status);
}

/**
 * Fetch with timeout support using AbortController
 *
 * Note: Creates an internal AbortController for timeout management.
 * External cancellation via options.signal is not supported - any signal
 * passed in options will be overridden by the internal timeout signal.
 *
 * @param url - URL to fetch
 * @param options - Fetch options (signal will be overridden)
 * @param timeout - Timeout in milliseconds (default: 30000ms)
 * @returns Fetch response
 * @throws Error if request times out
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    // Always clear timeout to prevent memory leaks and race conditions.
    // If fetch completes exactly at timeout boundary, clearTimeout ensures
    // the timeout callback doesn't execute after we've already returned.
    clearTimeout(timeoutId);
  }
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
 * Uses exponential backoff with full jitter to prevent thundering herd:
 * - Attempt 0: 0-1 seconds (random in range [0, 1s])
 * - Attempt 1: 0-2 seconds (random in range [0, 2s])
 * - Attempt 2: 0-4 seconds (random in range [0, 4s])
 * - And so on...
 *
 * Retry attempts are logged to console.debug for debugging and telemetry purposes,
 * including attempt number, delay, and error message.
 *
 * @param fn - The function to retry
 * @param options - Retry options (maxRetries: number of retry attempts after initial call)
 * @returns The result of the function
 * @throws The last error if max retries exceeded or non-retryable error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Only retry on transient errors (429, 500, 502, 503, 504)
      // Throw immediately for any other error type
      if (!isRetryableError(error)) {
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
        // Calculate delay with exponential backoff and full jitter, capped at maxDelay
        const exponentialDelay = Math.min(
          initialDelay * Math.pow(2, attempt),
          maxDelay
        );
        // Full jitter: random value between 0 and exponentialDelay
        delay = Math.random() * exponentialDelay;
      }

      // Log retry attempt for debugging/telemetry
      console.debug(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms delay`,
        {
          delay: Math.round(delay),
          error: error instanceof Error ? error.message : String(error)
        }
      );

      await sleep(delay);
    }
  }

  // This line is unreachable due to the throw statements above,
  // but TypeScript requires it for exhaustiveness checking
  throw new Error('Unexpected: retry loop completed without return or throw');
}
