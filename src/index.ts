#!/usr/bin/env node

/**
 * Ollama MCP Server - Main entry point
 * Exposes Ollama SDK functionality through MCP tools
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

/**
 * Main function to start the MCP server
 * Exported for testing purposes
 */
export async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  return { server, transport };
}

// Only run if this is the main module (not being imported for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
