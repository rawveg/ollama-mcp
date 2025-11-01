/**
 * Zod schemas for MCP tool input validation
 */

import { z } from 'zod';

/**
 * Response format enum schema
 */
export const ResponseFormatSchema = z.enum(['markdown', 'json']);

/**
 * Generation options schema
 */
export const GenerationOptionsSchema = z
  .object({
    temperature: z.number().min(0).max(2).optional(),
    top_p: z.number().min(0).max(1).optional(),
    top_k: z.number().min(0).optional(),
    num_predict: z.number().int().positive().optional(),
    repeat_penalty: z.number().min(0).optional(),
    seed: z.number().int().optional(),
    stop: z.array(z.string()).optional(),
  })
  .optional();

/**
 * Tool schema for function calling
 */
export const ToolSchema = z.object({
  type: z.string(),
  function: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    parameters: z
      .object({
        type: z.string().optional(),
        required: z.array(z.string()).optional(),
        properties: z.record(z.any()).optional(),
      })
      .optional(),
  }),
});

/**
 * Chat message schema
 */
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  images: z.array(z.string()).optional(),
});

/**
 * Schema for ollama_list tool
 */
export const ListModelsInputSchema = z.object({
  format: ResponseFormatSchema.default('json'),
});

/**
 * Schema for ollama_show tool
 */
export const ShowModelInputSchema = z.object({
  model: z.string().min(1),
  format: ResponseFormatSchema.default('json'),
});

/**
 * Helper to parse JSON string or return default value
 */
const parseJsonOrDefault = <T>(defaultValue: T) =>
  z.string().optional().transform((val, ctx) => {
    if (!val || val.trim() === '') {
      return defaultValue;
    }
    try {
      return JSON.parse(val) as T;
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid JSON format',
      });
      return z.NEVER;
    }
  });

/**
 * Schema for ollama_chat tool
 */
export const ChatInputSchema = z.object({
  model: z.string().min(1),
  messages: z.array(ChatMessageSchema).min(1),
  tools: parseJsonOrDefault([]).pipe(z.array(ToolSchema)),
  options: parseJsonOrDefault({}).pipe(GenerationOptionsSchema),
  format: ResponseFormatSchema.default('json'),
  stream: z.boolean().default(false),
});

/**
 * Schema for ollama_generate tool
 */
export const GenerateInputSchema = z.object({
  model: z.string().min(1),
  prompt: z.string(),
  options: parseJsonOrDefault({}).pipe(GenerationOptionsSchema),
  format: ResponseFormatSchema.default('json'),
  stream: z.boolean().default(false),
});

/**
 * Schema for ollama_embed tool
 */
export const EmbedInputSchema = z.object({
  model: z.string().min(1),
  input: z.string().transform((val, ctx) => {
    const trimmed = val.trim();
    // If it looks like a JSON array, try to parse it
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          // Validate all elements are strings
          const allStrings = parsed.every((item) => typeof item === 'string');
          if (allStrings) {
            return parsed as string[];
          } else {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'Input is a JSON array but contains non-string elements',
            });
            return z.NEVER;
          }
        }
      } catch (e) {
        // Failed to parse as JSON, treat as plain string
      }
    }
    // Return as plain string
    return trimmed;
  }),
  format: ResponseFormatSchema.default('json'),
});

/**
 * Schema for ollama_pull tool
 */
export const PullModelInputSchema = z.object({
  model: z.string().min(1),
  insecure: z.boolean().default(false),
  format: ResponseFormatSchema.default('json'),
});

/**
 * Schema for ollama_push tool
 */
export const PushModelInputSchema = z.object({
  model: z.string().min(1),
  insecure: z.boolean().default(false),
  format: ResponseFormatSchema.default('json'),
});

/**
 * Schema for ollama_create tool
 */
export const CreateModelInputSchema = z.object({
  model: z.string().min(1),
  from: z.string().min(1),
  system: z.string().optional(),
  template: z.string().optional(),
  license: z.string().optional(),
  format: ResponseFormatSchema.default('json'),
});

/**
 * Schema for ollama_delete tool
 */
export const DeleteModelInputSchema = z.object({
  model: z.string().min(1),
  format: ResponseFormatSchema.default('json'),
});

/**
 * Schema for ollama_copy tool
 */
export const CopyModelInputSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  format: ResponseFormatSchema.default('json'),
});

/**
 * Schema for ollama_ps tool (list running models)
 */
export const PsInputSchema = z.object({
  format: ResponseFormatSchema.default('json'),
});

/**
 * Schema for ollama_abort tool
 */
export const AbortRequestInputSchema = z.object({
  model: z.string().min(1),
});

/**
 * Schema for ollama_web_search tool
 */
export const WebSearchInputSchema = z.object({
  query: z.string().min(1),
  max_results: z.number().int().min(1).max(10).default(5),
  format: ResponseFormatSchema.default('json'),
});

/**
 * Schema for ollama_web_fetch tool
 */
export const WebFetchInputSchema = z.object({
  url: z.string().url().min(1),
  format: ResponseFormatSchema.default('json'),
});
