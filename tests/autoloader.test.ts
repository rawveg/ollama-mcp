import { describe, it, expect } from 'vitest';
import { discoverTools } from '../src/autoloader.js';

describe('Tool Autoloader', () => {
  it('should discover all .ts files in tools directory', async () => {
    const tools = await discoverTools();

    expect(tools).toBeDefined();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should discover tool metadata from each file', async () => {
    const tools = await discoverTools();

    // Check that each tool has required metadata
    tools.forEach((tool) => {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool).toHaveProperty('handler');

      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(typeof tool.inputSchema).toBe('object');
      expect(typeof tool.handler).toBe('function');
    });
  });
});
