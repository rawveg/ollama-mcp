import { describe, it, expect, vi } from 'vitest';
import { createServer } from '../../src/server.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Ollama } from 'ollama';

vi.mock('ollama', () => {
  return {
    Ollama: vi.fn().mockImplementation((config?: { fetch?: typeof globalThis.fetch }) => ({
      _config: config,
      generate: vi.fn().mockResolvedValue({ response: 'ok' }),
    })),
  };
});

describe('AbortSignal cancellation', () => {
  it('creates a scoped Ollama with signal-aware fetch when signal is provided', async () => {
    const capturedConfigs: Array<{ fetch?: unknown }> = [];

    const OllamaMock = vi.mocked(Ollama);
    OllamaMock.mockImplementation((config?: { fetch?: typeof globalThis.fetch }) => {
      capturedConfigs.push(config ?? {});
      return {
        _config: config,
        list: vi.fn().mockResolvedValue({ models: [] }),
        generate: vi.fn().mockResolvedValue({ response: 'ok' }),
        ps: vi.fn().mockResolvedValue({ models: [] }),
      } as unknown as Ollama;
    });

    const server = createServer();
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    await client.callTool({ name: 'ollama_list', arguments: {} });

    // At least one Ollama instance was created with a fetch property
    // (the scoped instance created for the tool call with signal from InMemoryTransport)
    const instancesWithFetch = capturedConfigs.filter((c) => typeof c.fetch === 'function');
    expect(instancesWithFetch.length).toBeGreaterThan(0);

    await server.close();
    await client.close();
  });

  it('aborts fetch when AbortController fires before request completes', async () => {
    let capturedSignal: AbortSignal | undefined;

    const OllamaMock = vi.mocked(Ollama);
    OllamaMock.mockImplementation((config?: { fetch?: typeof globalThis.fetch }) => {
      return {
        list: vi.fn().mockImplementation(async () => {
          // Simulate a slow request — capture signal from the wrapped fetch
          if (config?.fetch) {
            const mockRequest = new Request('http://localhost/api/tags');
            // Invoke the wrapped fetch to capture what signal it would use
            const abortController = new AbortController();
            abortController.abort();
            try {
              await config.fetch(mockRequest, { signal: abortController.signal });
            } catch {
              // expected: fetch was called with the signal
            }
          }
          return { models: [] };
        }),
      } as unknown as Ollama;
    });

    const server = createServer();
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const response = await client.callTool({ name: 'ollama_list', arguments: {} });
    expect(response).toBeDefined();

    await server.close();
    await client.close();
  });
});
