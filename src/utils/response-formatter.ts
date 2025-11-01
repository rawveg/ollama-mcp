import { markdownTable } from 'markdown-table';
import { ResponseFormat } from '../types.js';

/**
 * Format response content based on the specified format
 */
export function formatResponse(
  content: string,
  format: ResponseFormat
): string {
  if (format === ResponseFormat.JSON) {
    // For JSON format, validate and potentially wrap errors
    try {
      // Try to parse to validate it's valid JSON
      JSON.parse(content);
      return content;
    } catch {
      // If not valid JSON, wrap in error object
      return JSON.stringify({
        error: 'Invalid JSON content',
        raw_content: content,
      });
    }
  }

  // Format as markdown
  try {
    const data = JSON.parse(content);
    return jsonToMarkdown(data);
  } catch {
    // If not valid JSON, return as-is
    return content;
  }
}

/**
 * Convert JSON data to markdown format
 */
function jsonToMarkdown(data: any, indent: string = ''): string {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return `${indent}_null_`;
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return `${indent}${String(data)}`;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `${indent}_empty array_`;
    }

    // Check if array of objects with consistent keys (table format)
    if (
      data.length > 0 &&
      typeof data[0] === 'object' &&
      !Array.isArray(data[0]) &&
      data[0] !== null
    ) {
      return arrayToMarkdownTable(data, indent);
    }

    // Array of primitives or mixed types
    return data
      .map((item) => `${indent}- ${jsonToMarkdown(item, '')}`)
      .join('\n');
  }

  // Handle objects
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return `${indent}_empty object_`;
  }

  return entries
    .map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ');
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return `${indent}**${formattedKey}:**\n${jsonToMarkdown(value, indent + '  ')}`;
        }
        return `${indent}**${formattedKey}:**\n${jsonToMarkdown(value, indent + '  ')}`;
      }
      return `${indent}**${formattedKey}:** ${value}`;
    })
    .join('\n');
}

/**
 * Convert array of objects to markdown table using markdown-table library
 */
function arrayToMarkdownTable(data: any[], indent: string = ''): string {
  if (data.length === 0) return `${indent}_empty_`;

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach((item) => {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach((key) => allKeys.add(key));
    }
  });
  const keys = Array.from(allKeys);

  // Format headers (replace underscores with spaces)
  const headers = keys.map((k) => k.replace(/_/g, ' '));

  // Build table data
  const tableData = data.map((item) => {
    return keys.map((key) => {
      const value = item[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
  });

  // Generate markdown table
  const table = markdownTable([headers, ...tableData]);

  // Add indent to each line if needed
  if (indent) {
    return table
      .split('\n')
      .map((line) => indent + line)
      .join('\n');
  }

  return table;
}
