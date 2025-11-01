import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { listRunningModels, toolDefinition } from '../../src/tools/ps.js';
import { ResponseFormat } from '../../src/types.js';

describe('listRunningModels', () => {
  let ollama: Ollama;
  let mockPs: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPs = vi.fn();
    ollama = {
      ps: mockPs,
    } as any;
  });

  it('should list running models', async () => {
    mockPs.mockResolvedValue({
      models: [
        {
          name: 'llama3.2:latest',
          size: 5000000000,
        },
      ],
    });

    const result = await listRunningModels(ollama, ResponseFormat.JSON);

    expect(typeof result).toBe('string');
    expect(mockPs).toHaveBeenCalledTimes(1);

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('models');
  });

  it('should work through toolDefinition handler', async () => {
    mockPs.mockResolvedValue({
      models: [
        {
          name: 'llama3.2:latest',
          size: 5000000000,
        },
      ],
    });

    const result = await toolDefinition.handler(
      ollama,
      { format: 'json' },
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
    expect(mockPs).toHaveBeenCalledTimes(1);
  });
});
