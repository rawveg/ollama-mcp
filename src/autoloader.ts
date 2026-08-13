import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
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

  // Filter for .js files (production) or .ts files (development)
  // Exclude test files and declaration files
  const toolFiles = files.filter(
    (file) =>
      (file.endsWith('.js') || file.endsWith('.ts')) &&
      !file.includes('.test.') &&
      !file.endsWith('.d.ts')
  );

  const tools: ToolDefinition[] = [];

  for (const file of toolFiles) {
    const toolPath = join(toolsDir, file);
    // Convert to a file:// URL so dynamic import works on Windows, where an
    // absolute path like "C:\..." is otherwise rejected by the ESM loader
    // ("Only URLs with a scheme in: file, data, and node are supported").
    const module = await import(pathToFileURL(toolPath).href);

    // Check if module exports tool metadata
    if (module.toolDefinition) {
      tools.push(module.toolDefinition);
    }
  }

  return tools;
}
