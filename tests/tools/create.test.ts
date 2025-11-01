import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { createModel, toolDefinition } from '../../src/tools/create.js';
import { ResponseFormat } from '../../src/types.js';

describe('createModel', () => {
  let ollama: Ollama;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCreate = vi.fn();
    ollama = {
      create: mockCreate,
    } as any;
  });

  it('should create a model with structured parameters', async () => {
    mockCreate.mockResolvedValue({
      status: 'success',
    });

    const result = await createModel(
      ollama,
      {
        model: 'my-model:latest',
        from: 'llama3.2',
        system: 'You are a helpful assistant',
      },
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'my-model:latest',
      from: 'llama3.2',
      system: 'You are a helpful assistant',
      template: undefined,
      license: undefined,
      stream: false,
    });
  });

  it('should work through toolDefinition handler', async () => {
    mockCreate.mockResolvedValue({
      status: 'success',
    });

    const result = await toolDefinition.handler(
      ollama,
      { model: 'my-custom-model:latest', from: 'llama3.2', format: 'json' },
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
  });

});