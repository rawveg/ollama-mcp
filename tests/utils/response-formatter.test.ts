import { describe, it, expect } from 'vitest';
import { formatResponse } from '../../src/utils/response-formatter.js';
import { ResponseFormat } from '../../src/types.js';

describe('formatResponse', () => {
  it('should return plain text as-is for markdown format', () => {
    const content = 'Hello, world!';
    const result = formatResponse(content, ResponseFormat.MARKDOWN);

    expect(result).toBe(content);
  });

  it('should convert JSON object to markdown format', () => {
    const jsonObject = { message: 'Hello', count: 42 };
    const content = JSON.stringify(jsonObject);
    const result = formatResponse(content, ResponseFormat.MARKDOWN);

    expect(result).toContain('**message:** Hello');
    expect(result).toContain('**count:** 42');
  });

  it('should convert JSON array to markdown table', () => {
    const content = JSON.stringify({
      models: [
        { name: 'model1', size: 100 },
        { name: 'model2', size: 200 },
      ],
    });
    const result = formatResponse(content, ResponseFormat.MARKDOWN);

    // Check for markdown table elements (markdown-table adds proper spacing)
    expect(result).toContain('| name');
    expect(result).toContain('| size');
    expect(result).toContain('model1');
    expect(result).toContain('model2');
    expect(result).toContain('100');
    expect(result).toContain('200');
  });

  it('should parse and stringify JSON content', () => {
    const jsonObject = { message: 'Hello', count: 42 };
    const content = JSON.stringify(jsonObject);
    const result = formatResponse(content, ResponseFormat.JSON);

    const parsed = JSON.parse(result);
    expect(parsed).toEqual(jsonObject);
  });

  it('should wrap non-JSON content in error object for JSON format', () => {
    const content = 'This is not JSON';
    const result = formatResponse(content, ResponseFormat.JSON);

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('error');
    expect(parsed.error).toContain('Invalid JSON');
    expect(parsed).toHaveProperty('raw_content');
  });

  it('should format object with array value', () => {
    const content = JSON.stringify({
      name: 'test',
      items: ['a', 'b', 'c'],
    });
    const result = formatResponse(content, ResponseFormat.MARKDOWN);

    expect(result).toContain('**name:** test');
    expect(result).toContain('**items:**');
    expect(result).toContain('- a');
  });

  it('should format object with nested object value', () => {
    const content = JSON.stringify({
      user: 'alice',
      details: { age: 30, city: 'NYC' },
    });
    const result = formatResponse(content, ResponseFormat.MARKDOWN);

    expect(result).toContain('**user:** alice');
    expect(result).toContain('**details:**');
    expect(result).toContain('**age:** 30');
  });
});
