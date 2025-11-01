/**
 * MCP Server creation and configuration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Ollama } from 'ollama';
import { discoverTools } from './autoloader.js';
import { ResponseFormat } from './types.js';

/**
 * Create and configure the MCP server with tool handlers
 */
export function createServer(ollamaInstance?: Ollama): Server {
  // Initialize Ollama client
  const ollamaConfig: {
    host: string;
    headers?: Record<string, string>;
  } = {
    host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
  };

  // Add API key header if OLLAMA_API_KEY is set
  if (process.env.OLLAMA_API_KEY) {
    ollamaConfig.headers = {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    };
  }

  const ollama = ollamaInstance || new Ollama(ollamaConfig);

  // Create MCP server
  const server = new Server(
    {
      name: 'ollama-mcp',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = await discoverTools();

    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;

      // Discover all tools
      const tools = await discoverTools();

      // Find the matching tool
      const tool = tools.find((t) => t.name === name);

      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Determine format from args
      const formatArg = (args as Record<string, unknown>).format;
      const format =
        formatArg === 'markdown' ? ResponseFormat.MARKDOWN : ResponseFormat.JSON;

      // Call the tool handler
      const result = await tool.handler(
        ollama,
        args as Record<string, unknown>,
        format
      );

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
