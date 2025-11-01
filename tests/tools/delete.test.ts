import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { deleteModel, toolDefinition } from '../../src/tools/delete.js';
import { ResponseFormat } from '../../src/types.js';

describe('deleteModel', () => {
  let ollama: Ollama;
  let mockDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDelete = vi.fn();
    ollama = {
      delete: mockDelete,
    } as any;
  });

  it('should delete a model', async () => {
    mockDelete.mockResolvedValue({
      status: 'success',
    });

    const result = await deleteModel(
      ollama,
      'my-model:latest',
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
    expect(mockDelete).toHaveBeenCalledWith({
      model: 'my-model:latest',
    });
  });

  it('should work through toolDefinition handler', async () => {
    const result = await toolDefinition.handler(
      ollama,
      { model: 'model-to-delete:latest', format: 'json' },
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
  });

});