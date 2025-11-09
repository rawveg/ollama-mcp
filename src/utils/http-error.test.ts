import { describe, it, expect } from 'vitest';
import { HttpError } from './http-error.js';

describe('HttpError', () => {
  it('should create an HttpError with message and status', () => {
    // Arrange & Act
    const error = new HttpError('Not found', 404);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error.name).toBe('HttpError');
  });

  it('should create a rate limit error (429)', () => {
    // Arrange & Act
    const error = new HttpError('Rate limit exceeded', 429);

    // Assert
    expect(error.status).toBe(429);
    expect(error.message).toBe('Rate limit exceeded');
  });

  it('should create a server error (500)', () => {
    // Arrange & Act
    const error = new HttpError('Internal server error', 500);

    // Assert
    expect(error.status).toBe(500);
    expect(error.message).toBe('Internal server error');
  });

  it('should have correct error name', () => {
    // Arrange & Act
    const error = new HttpError('Bad request', 400);

    // Assert
    expect(error.name).toBe('HttpError');
  });

  it('should be throwable and catchable', () => {
    // Arrange
    const throwError = () => {
      throw new HttpError('Unauthorized', 401);
    };

    // Act & Assert
    expect(throwError).toThrow(HttpError);
    expect(throwError).toThrow('Unauthorized');

    try {
      throwError();
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(401);
    }
  });

  it('should preserve stack trace', () => {
    // Arrange & Act
    const error = new HttpError('Test error', 500);

    // Assert
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('HttpError');
  });

  it('should create an HttpError with Retry-After header', () => {
    // Arrange & Act
    const error = new HttpError('Rate limit exceeded', 429, '60');

    // Assert
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe('60');
  });

  it('should create an HttpError without Retry-After header', () => {
    // Arrange & Act
    const error = new HttpError('Rate limit exceeded', 429);

    // Assert
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBeUndefined();
  });

  it('should handle Retry-After as HTTP-date string', () => {
    // Arrange & Act
    const dateString = 'Wed, 21 Oct 2025 07:28:00 GMT';
    const error = new HttpError('Rate limit exceeded', 429, dateString);

    // Assert
    expect(error.retryAfter).toBe(dateString);
  });
});
