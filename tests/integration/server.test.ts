import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Ollama } from 'ollama';

// Mock the Ollama SDK
vi.mock('ollama', () => {
  return {
    Ollama: vi.fn().mockImplementation(() => ({
      list: vi.fn().mockResolvedValue({
        models: [
          {
            name: 'llama2:latest',
            size: 3825819519,
            digest: 'abc123',
            modified_at: '2024-01-01T00:00:00Z',
          },
        ],
      }),
      ps: vi.fn().mockResolvedValue({
        models: [
          {
            name: 'llama2:latest',
            size: 3825819519,
            size_vram: 3825819519,
          },
        ],
      }),
    })),
  };
});

describe('MCP Server Integration', () => {
  let server: Server;
  let client: Client;
  let serverTransport: InMemoryTransport;
  let clientTransport: InMemoryTransport;

  beforeAll(async () => {
    // Create transport pair
    [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();

    // Import and create server
    const { createServer } = await import('../../src/server.js');

    // Create a mock Ollama instance
    const mockOllama = new Ollama({ host: 'http://localhost:11434' });
    server = createServer(mockOllama);

    // Create client
    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect both
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
  });

  afterAll(async () => {
    await server.close();
    await client.close();
  });

  it('should list available tools', async () => {
    const response = await client.listTools();

    expect(response.tools).toBeDefined();
    expect(Array.isArray(response.tools)).toBe(true);
    expect(response.tools.length).toBeGreaterThan(0);

    // Check that tools have expected properties
    const tool = response.tools[0];
    expect(tool).toHaveProperty('name');
    expect(tool).toHaveProperty('description');
    expect(tool).toHaveProperty('inputSchema');
  });

  it('should call ollama_list tool', async () => {
    const response = await client.callTool({
      name: 'ollama_list',
      arguments: {
        format: 'json',
      },
    });

    expect(response.content).toBeDefined();
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.content[0].type).toBe('text');
  });

  it('should call ollama_ps tool', async () => {
    const response = await client.callTool({
      name: 'ollama_ps',
      arguments: {
        format: 'json',
      },
    });

    expect(response.content).toBeDefined();
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.content[0].type).toBe('text');
  });

  it('should return error for unknown tool', async () => {
    const response = await client.callTool({
      name: 'ollama_unknown',
      arguments: {},
    });

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('Unknown tool');
  });
});
