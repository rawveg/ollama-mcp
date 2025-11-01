import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { listModels } from '../../src/tools/list.js';
import { ResponseFormat } from '../../src/types.js';

describe('listModels', () => {
  let ollama: Ollama;
  let mockList: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockList = vi.fn();
    ollama = {
      list: mockList,
    } as any;
  });

  it('should return formatted model list in JSON format', async () => {
    mockList.mockResolvedValue({
      models: [
        {
          name: 'llama3.2:latest',
          modified_at: '2024-01-01T00:00:00Z',
          size: 5000000000,
          digest: 'abc123',
        },
      ],
    });

    const result = await listModels(ollama, ResponseFormat.JSON);

    expect(typeof result).toBe('string');
    expect(mockList).toHaveBeenCalledTimes(1);

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('models');
    expect(Array.isArray(parsed.models)).toBe(true);
  });

  it('should return markdown format when specified', async () => {
    mockList.mockResolvedValue({
      models: [
        {
          name: 'llama3.2:latest',
          modified_at: '2024-01-01T00:00:00Z',
          size: 5000000000,
          digest: 'abc123',
        },
      ],
    });

    const result = await listModels(ollama, ResponseFormat.MARKDOWN);

    expect(typeof result).toBe('string');
    expect(mockList).toHaveBeenCalledTimes(1);
    // Markdown format should contain markdown table with headers
    expect(result).toContain('| name');
    expect(result).toContain('llama3.2:latest');
  });
});
