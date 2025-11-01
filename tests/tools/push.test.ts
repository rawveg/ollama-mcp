import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { pushModel, toolDefinition } from '../../src/tools/push.js';
import { ResponseFormat } from '../../src/types.js';

describe('pushModel', () => {
  let ollama: Ollama;
  let mockPush: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPush = vi.fn();
    ollama = {
      push: mockPush,
    } as any;
  });

  it('should push a model to registry', async () => {
    mockPush.mockResolvedValue({
      status: 'success',
    });

    const result = await pushModel(
      ollama,
      'my-model:latest',
      false,
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
    expect(mockPush).toHaveBeenCalledWith({
      model: 'my-model:latest',
      insecure: false,
      stream: false,
    });
  });

  it('should work through toolDefinition handler', async () => {
    const result = await toolDefinition.handler(
      ollama,
      { model: 'my-model:latest', format: 'json' },
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
  });

});