import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { copyModel } from '../../src/tools/copy.js';
import { ResponseFormat } from '../../src/types.js';

describe('copyModel', () => {
  let ollama: Ollama;
  let mockCopy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCopy = vi.fn();
    ollama = {
      copy: mockCopy,
    } as any;
  });

  it('should copy a model', async () => {
    mockCopy.mockResolvedValue({
      status: 'success',
    });

    const result = await copyModel(
      ollama,
      'model-a:latest',
      'model-b:latest',
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
    expect(mockCopy).toHaveBeenCalledWith({
      source: 'model-a:latest',
      destination: 'model-b:latest',
    });
  });
});
