#!/usr/bin/env node
import { OllamaMCPServer } from './index.js';

const port = parseInt(process.env.PORT || '3456', 10);
const ollamaApi = process.env.OLLAMA_API || 'http://localhost:11434';

const server = new OllamaMCPServer(ollamaApi);

server.start(port).catch((error: Error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.stop().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.stop().then(() => process.exit(0));
});