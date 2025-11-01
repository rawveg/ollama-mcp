import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { showModel } from '../../src/tools/show.js';
import { ResponseFormat } from '../../src/types.js';

describe('showModel', () => {
  let ollama: Ollama;
  let mockShow: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockShow = vi.fn();
    ollama = {
      show: mockShow,
    } as any;
  });

  it('should return model information in JSON format', async () => {
    mockShow.mockResolvedValue({
      modelfile: 'FROM llama3.2\nPARAMETER temperature 0.7',
      parameters: 'temperature 0.7',
      template: 'template content',
      details: {
        parent_model: '',
        format: 'gguf',
        family: 'llama',
        families: ['llama'],
        parameter_size: '3B',
        quantization_level: 'Q4_0',
      },
    });

    const result = await showModel(ollama, 'llama3.2:latest', ResponseFormat.JSON);

    expect(typeof result).toBe('string');
    expect(mockShow).toHaveBeenCalledWith({ model: 'llama3.2:latest' });
    expect(mockShow).toHaveBeenCalledTimes(1);

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('modelfile');
    expect(parsed).toHaveProperty('details');
  });
});
