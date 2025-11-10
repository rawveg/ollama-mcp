/**
 * Retry configuration constants for web API calls
 *
 * These values are used by web-fetch and web-search tools when calling
 * the Ollama Cloud API endpoints. They align with the default values
 * in RetryOptions but are extracted here for consistency and maintainability.
 */

import { RetryOptions } from './retry.js';

/**
 * Standard retry configuration for web API calls
 *
 * - maxRetries: 3 retry attempts after the initial call
 * - initialDelay: 1000ms (1 second) before first retry
 * - maxDelay: Uses default from RetryOptions (10000ms)
 */
export const WEB_API_RETRY_CONFIG: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
} as const;

/**
 * Request timeout for web API calls
 *
 * Individual requests timeout after 30 seconds to prevent
 * indefinitely hung connections.
 */
export const WEB_API_TIMEOUT = 30000 as const;
