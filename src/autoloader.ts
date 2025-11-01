import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Ollama } from 'ollama';
import { ResponseFormat } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Represents a tool's metadata and handler function
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (
    ollama: Ollama,
    args: Record<string, unknown>,
    format: ResponseFormat
  ) => Promise<string>;
}

/**
 * Discover and load all tools from the tools directory
 */
export async function discoverTools(): Promise<ToolDefinition[]> {
  const toolsDir = join(__dirname, 'tools');
  const files = await readdir(toolsDir);

  // Filter for .ts and .js files
  const toolFiles = files.filter(
    (file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.test.ts')
  );

  const tools: ToolDefinition[] = [];

  for (const file of toolFiles) {
    const toolPath = join(toolsDir, file);
    const module = await import(toolPath);

    // Check if module exports tool metadata
    if (module.toolDefinition) {
      tools.push(module.toolDefinition);
    }
  }

  return tools;
}
