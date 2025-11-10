import { describe, it, expect } from 'vitest';
import { WEB_API_RETRY_CONFIG, WEB_API_TIMEOUT } from '../../src/utils/retry-config.js';

describe('Retry Configuration Constants', () => {
  it('should define WEB_API_RETRY_CONFIG with correct default values', () => {
    // Assert - Verify configuration matches documented defaults
    expect(WEB_API_RETRY_CONFIG).toEqual({
      maxRetries: 3,
      initialDelay: 1000,
    });
  });

  it('should define WEB_API_TIMEOUT with correct value', () => {
    // Assert - Verify timeout matches documented 30 second limit
    expect(WEB_API_TIMEOUT).toBe(30000);
  });

  it('should use values consistent with retry.ts defaults', () => {
    // Assert - Ensure retry config doesn't override maxDelay
    // (maxDelay should use the default 10000ms from RetryOptions)
    expect(WEB_API_RETRY_CONFIG).not.toHaveProperty('maxDelay');
  });
});
