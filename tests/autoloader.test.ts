import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    readdir: vi.fn(actual.readdir),
  };
});

import { discoverTools, resetToolCache } from '../src/autoloader.js';
import { readdir } from 'fs/promises';

describe('Tool Autoloader', () => {
  beforeEach(() => {
    resetToolCache();
    vi.mocked(readdir).mockClear();
  });

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

  it('should cache discovered tools and call readdir exactly once', async () => {
    // Initial state check
    expect(readdir).not.toHaveBeenCalled();

    // Multiple parallel and sequential calls should only trigger a single readdir
    const [tools1, tools2] = await Promise.all([
      discoverTools(),
      discoverTools()
    ]);
    
    await discoverTools();

    expect(readdir).toHaveBeenCalledTimes(1);
    expect(tools1).toBe(tools2); // Should return the same frozen array
    expect(Object.isFrozen(tools1)).toBe(true);
  });

  it('should clear cache on error', async () => {
    vi.mocked(readdir).mockRejectedValueOnce(new Error('FS Error'));
    
    await expect(discoverTools()).rejects.toThrow('FS Error');
    expect(readdir).toHaveBeenCalledTimes(1);

    // Second call should retry since first failed
    vi.mocked(readdir).mockResolvedValueOnce([]);
    await discoverTools();
    expect(readdir).toHaveBeenCalledTimes(2);
  });
});
