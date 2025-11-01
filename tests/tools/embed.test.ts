import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { embedWithModel, toolDefinition } from '../../src/tools/embed.js';
import { ResponseFormat } from '../../src/types.js';

describe('embedWithModel', () => {
  let ollama: Ollama;
  let mockEmbed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockEmbed = vi.fn();
    ollama = {
      embed: mockEmbed,
    } as any;
  });

  it('should generate embeddings for single input', async () => {
    mockEmbed.mockResolvedValue({
      embeddings: [[0.1, 0.2, 0.3, 0.4, 0.5]],
    });

    const result = await embedWithModel(
      ollama,
      'llama3.2:latest',
      'Hello world',
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
    expect(mockEmbed).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalledWith({
      model: 'llama3.2:latest',
      input: 'Hello world',
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('embeddings');
    expect(Array.isArray(parsed.embeddings)).toBe(true);
  });

  it('should work through toolDefinition handler', async () => {
    mockEmbed.mockResolvedValue({
      embeddings: [[0.1, 0.2, 0.3]],
    });

    const result = await toolDefinition.handler(
      ollama,
      { model: 'llama3.2:latest', input: 'Test input', format: 'json' },
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
  });

});