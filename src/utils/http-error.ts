/**
 * Custom error class for HTTP errors with status codes
 */
export class HttpError extends Error {
  /**
   * Create an HTTP error
   * @param message - Error message
   * @param status - HTTP status code
   * @param retryAfter - Optional Retry-After header value (seconds or date string)
   */
  constructor(
    message: string,
    public status: number,
    public retryAfter?: string
  ) {
    super(message);
    this.name = 'HttpError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }
}
