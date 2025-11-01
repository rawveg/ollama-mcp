import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { pullModel, toolDefinition } from '../../src/tools/pull.js';
import { ResponseFormat } from '../../src/types.js';

describe('pullModel', () => {
  let ollama: Ollama;
  let mockPull: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPull = vi.fn();
    ollama = {
      pull: mockPull,
    } as any;
  });

  it('should pull a model from registry', async () => {
    mockPull.mockResolvedValue({
      status: 'success',
    });

    const result = await pullModel(
      ollama,
      'llama3.2:latest',
      false,
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
    expect(mockPull).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledWith({
      model: 'llama3.2:latest',
      insecure: false,
      stream: false,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('status');
  });

  it('should work through toolDefinition handler', async () => {
    const result = await toolDefinition.handler(
      ollama,
      { model: 'llama3.2:latest', format: 'json' },
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
  });

});