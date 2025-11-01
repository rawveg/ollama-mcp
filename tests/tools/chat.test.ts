import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ollama } from 'ollama';
import { chatWithModel, toolDefinition } from '../../src/tools/chat.js';
import { ResponseFormat } from '../../src/types.js';

describe('chatWithModel', () => {
  let ollama: Ollama;
  let mockChat: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockChat = vi.fn();
    ollama = {
      chat: mockChat,
    } as any;
  });

  it('should handle basic chat with single user message', async () => {
    mockChat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: 'Hello! How can I help you today?',
      },
      done: true,
    });

    const messages = [{ role: 'user' as const, content: 'Hello' }];
    const result = await chatWithModel(
      ollama,
      'llama3.2:latest',
      messages,
      {},
      ResponseFormat.MARKDOWN
    );

    expect(typeof result).toBe('string');
    expect(mockChat).toHaveBeenCalledTimes(1);
    expect(mockChat).toHaveBeenCalledWith({
      model: 'llama3.2:latest',
      messages,
      options: {},
      stream: false,
    });
    expect(result).toContain('Hello! How can I help you today?');
  });

  it('should handle chat with system message and options', async () => {
    mockChat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: 'I will be helpful and concise.',
      },
      done: true,
    });

    const messages = [
      { role: 'system' as const, content: 'Be helpful' },
      { role: 'user' as const, content: 'Hello' },
    ];
    const options = { temperature: 0.7, top_p: 0.9 };

    const result = await chatWithModel(
      ollama,
      'llama3.2:latest',
      messages,
      options,
      ResponseFormat.MARKDOWN
    );

    expect(typeof result).toBe('string');
    expect(mockChat).toHaveBeenCalledWith({
      model: 'llama3.2:latest',
      messages,
      options,
      stream: false,
    });
  });

  it('should use JSON format when ResponseFormat.JSON is specified', async () => {
    mockChat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: '{"response": "test"}',
      },
      done: true,
    });

    const messages = [{ role: 'user' as const, content: 'Hello' }];
    const result = await chatWithModel(
      ollama,
      'llama3.2:latest',
      messages,
      {},
      ResponseFormat.JSON
    );

    expect(mockChat).toHaveBeenCalledWith({
      model: 'llama3.2:latest',
      messages,
      options: {},
      format: 'json',
      stream: false,
    });
  });

  it('should handle empty content with fallback', async () => {
    mockChat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: '',
      },
      done: true,
    });

    const messages = [{ role: 'user' as const, content: 'Hello' }];
    const result = await chatWithModel(
      ollama,
      'llama3.2:latest',
      messages,
      {},
      ResponseFormat.MARKDOWN
    );

    expect(typeof result).toBe('string');
  });

  it('should handle tool_calls when present', async () => {
    mockChat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: 'Checking weather',
        tool_calls: [{ function: { name: 'get_weather' } }],
      },
      done: true,
    });

    const messages = [{ role: 'user' as const, content: 'Weather?' }];
    const result = await chatWithModel(
      ollama,
      'llama3.2:latest',
      messages,
      {},
      ResponseFormat.JSON
    );

    expect(result).toContain('tool_calls');
  });

  it('should work through toolDefinition handler', async () => {
    mockChat.mockResolvedValue({ message: { content: "test" }, done: true });
    const result = await toolDefinition.handler(
      ollama,
      { model: 'llama3.2:latest', messages: [{ role: 'user', content: 'test' }], format: 'json' },
      ResponseFormat.JSON
    );

    expect(typeof result).toBe('string');
  });

});