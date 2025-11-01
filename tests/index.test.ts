import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../src/index.js';

describe('index (main entry point)', () => {
  let processOnSpy: ReturnType<typeof vi.fn>;
  let processExitSpy: ReturnType<typeof vi.fn>;
  let originalProcessOn: typeof process.on;
  let originalProcessExit: typeof process.exit;

  beforeEach(() => {
    // Store original process functions
    originalProcessOn = process.on;
    originalProcessExit = process.exit;

    // Mock process.on to capture SIGINT handler
    processOnSpy = vi.fn();
    process.on = processOnSpy as any;

    // Mock process.exit to prevent actual exits during testing
    processExitSpy = vi.fn();
    process.exit = processExitSpy as any;
  });

  afterEach(() => {
    // Restore original process functions
    process.on = originalProcessOn;
    process.exit = originalProcessExit;
    vi.restoreAllMocks();
  });

  it('should create and connect server', async () => {
    const result = await main();

    // Verify server and transport are returned
    expect(result).toHaveProperty('server');
    expect(result).toHaveProperty('transport');
    expect(result.server).toBeDefined();
    expect(result.transport).toBeDefined();
  });

  it('should register SIGINT handler for graceful shutdown', async () => {
    await main();

    // Verify SIGINT handler was registered
    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
  });

  it('should close server and exit on SIGINT', async () => {
    const result = await main();

    // Get the SIGINT handler that was registered
    const sigintHandler = processOnSpy.mock.calls.find(
      (call) => call[0] === 'SIGINT'
    )?.[1] as () => Promise<void>;

    expect(sigintHandler).toBeDefined();

    // Mock server.close
    const closeSpy = vi.spyOn(result.server, 'close').mockResolvedValue();

    // Call the SIGINT handler
    await sigintHandler();

    // Verify server.close was called and process.exit(0) was called
    expect(closeSpy).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });
});
