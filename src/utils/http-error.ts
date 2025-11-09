/**
 * Custom error class for HTTP errors with status codes
 */
export class HttpError extends Error {
  /**
   * Create an HTTP error
   * @param message - Error message
   * @param status - HTTP status code
   */
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'HttpError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }
}
