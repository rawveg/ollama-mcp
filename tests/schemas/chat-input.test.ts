import { describe, it, expect } from 'vitest';
import { ChatInputSchema } from '../../src/schemas.js';

describe('ChatInputSchema', () => {
  it('should validate valid chat input with messages', () => {
    const input = {
      model: 'llama3.2:latest',
      messages: [
        { role: 'user', content: 'Hello' },
      ],
      format: 'json',
    };

    const result = ChatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should parse tools from JSON string', () => {
    const input = {
      model: 'llama3.2:latest',
      messages: [{ role: 'user', content: 'Test' }],
      tools: JSON.stringify([
        {
          type: 'function',
          function: { name: 'get_weather', description: 'Get weather' },
        },
      ]),
    };

    const result = ChatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.data.tools)).toBe(true);
      expect(result.data.tools[0].function.name).toBe('get_weather');
    }
  });

  it('should default tools to empty array when not provided', () => {
    const input = {
      model: 'llama3.2:latest',
      messages: [{ role: 'user', content: 'Test' }],
    };

    const result = ChatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tools).toEqual([]);
    }
  });

  it('should parse options from JSON string', () => {
    const input = {
      model: 'llama3.2:latest',
      messages: [{ role: 'user', content: 'Test' }],
      options: JSON.stringify({ temperature: 0.7, top_p: 0.9 }),
    };

    const result = ChatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.options).toEqual({ temperature: 0.7, top_p: 0.9 });
    }
  });

  it('should reject invalid JSON in tools field', () => {
    const input = {
      model: 'llama3.2:latest',
      messages: [{ role: 'user', content: 'Test' }],
      tools: 'not valid json{',
    };

    const result = ChatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject missing model field', () => {
    const input = {
      messages: [{ role: 'user', content: 'Test' }],
    };

    const result = ChatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject empty messages array', () => {
    const input = {
      model: 'llama3.2:latest',
      messages: [],
    };

    const result = ChatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
