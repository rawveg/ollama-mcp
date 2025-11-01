import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { generateWithModel, toolDefinition } from '../../src/tools/generate.js';
import { ResponseFormat } from '../../src/types.js';

describe('generateWithModel', () => {
  let ollama: Ollama;
  let mockGenerate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGenerate = vi.fn();
    ollama = {
      generate: mockGenerate,
    } as any;
  });

  it('should generate completion from prompt', async () => {
    mockGenerate.mockResolvedValue({
      response: 'The sky appears blue because...',
      done: true,
    });

    const result = await generateWithModel(
      ollama,
      'llama3.2:latest',
      'Why is the sky blue?',
      {},
      ResponseFormat.MARKDOWN
    );

    expect(typeof result).toBe('string');
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledWith({
      model: 'llama3.2:latest',
      prompt: 'Why is the sky blue?',
      options: {},
      stream: false,
    });
    expect(result).toContain('The sky appears blue because');
  });

  it('should use JSON format when ResponseFormat.JSON is specified', async () => {
    mockGenerate.mockResolvedValue({
      response: '{"answer": "test"}',
      done: true,
    });

    const result = await generateWithModel(
      ollama,
      'llama3.2:latest',
      'Test prompt',
      {},
      ResponseFormat.JSON
    );

    expect(mockGenerate).toHaveBeenCalledWith({
      model: 'llama3.2:latest',
      prompt: 'Test prompt',
      options: {},
      format: 'json',
      stream: false,
    });
  });

  it('should work through toolDefinition handler', async () => {
    mockGenerate.mockResolvedValue({ response: "test", done: true });
    const result = await toolDefinition.handler(
      ollama,
      { model: 'llama3.2:latest', prompt: 'Test prompt', format: 'json' },
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
  });

});