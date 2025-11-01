#!/usr/bin/env node

/**
 * Ollama MCP Server
 * Exposes Ollama SDK functionality through MCP tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Ollama } from 'ollama';
import { listModels } from './tools/list.js';
import { showModel } from './tools/show.js';
import { chatWithModel } from './tools/chat.js';
import { generateWithModel } from './tools/generate.js';
import { embedWithModel } from './tools/embed.js';
import { pullModel } from './tools/pull.js';
import { pushModel } from './tools/push.js';
import { createModel } from './tools/create.js';
import { deleteModel } from './tools/delete.js';
import { copyModel } from './tools/copy.js';
import { listRunningModels } from './tools/ps.js';
import { webSearch } from './tools/web-search.js';
import { webFetch } from './tools/web-fetch.js';
import {
  ListModelsInputSchema,
  ShowModelInputSchema,
  ChatInputSchema,
  GenerateInputSchema,
  EmbedInputSchema,
  PullModelInputSchema,
  PushModelInputSchema,
  CreateModelInputSchema,
  DeleteModelInputSchema,
  CopyModelInputSchema,
  PsInputSchema,
  WebSearchInputSchema,
  WebFetchInputSchema,
} from './schemas.js';
import { ResponseFormat } from './types.js';

// Initialize Ollama client
const ollamaConfig: {
  host: string;
  headers?: Record<string, string>;
} = {
  host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
};

// Add API key header if OLLAMA_API_KEY is set
if (process.env.OLLAMA_API_KEY) {
  ollamaConfig.headers = {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  };
}

const ollama = new Ollama(ollamaConfig);

// Create MCP server
const server = new Server(
  {
    name: 'ollama-mcp',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'ollama_list',
        description:
          'List all available Ollama models installed locally. Returns model names, sizes, and modification dates.',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              description: 'Output format (default: json)',
              default: 'json',
            },
          },
        },
      },
      {
        name: 'ollama_show',
        description:
          'Show detailed information about a specific model including modelfile, parameters, and architecture details.',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'Name of the model to show',
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              description: 'Output format (default: json)',
              default: 'json',
            },
          },
          required: ['model'],
        },
      },
      {
        name: 'ollama_chat',
        description:
          'Chat with a model using conversation messages. Supports system messages, multi-turn conversations, tool calling, and generation options.',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'Name of the model to use',
            },
            messages: {
              type: 'array',
              description: 'Array of chat messages',
              items: {
                type: 'object',
                properties: {
                  role: {
                    type: 'string',
                    enum: ['system', 'user', 'assistant'],
                  },
                  content: {
                    type: 'string',
                  },
                  images: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['role', 'content'],
              },
            },
            tools: {
              type: 'string',
              description: 'Tools that the model can call (optional). Provide as JSON array of tool objects.',
            },
            options: {
              type: 'string',
              description: 'Generation options (optional). Provide as JSON object with settings like temperature, top_p, etc.',
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
          required: ['model', 'messages'],
        },
      },
      {
        name: 'ollama_generate',
        description:
          'Generate completion from a prompt. Simpler than chat, useful for single-turn completions.',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'Name of the model to use',
            },
            prompt: {
              type: 'string',
              description: 'The prompt to generate from',
            },
            options: {
              type: 'string',
              description: 'Generation options (optional). Provide as JSON object with settings like temperature, top_p, etc.',
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
          required: ['model', 'prompt'],
        },
      },
      {
        name: 'ollama_embed',
        description:
          'Generate embeddings for text input. Returns numerical vector representations.',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'Name of the model to use',
            },
            input: {
              type: 'string',
              description:
                'Text input. For batch processing, provide a JSON-encoded array of strings, e.g., ["text1", "text2"]',
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
          required: ['model', 'input'],
        },
      },
      {
        name: 'ollama_pull',
        description:
          'Pull a model from the Ollama registry. Downloads the model to make it available locally.',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'Name of the model to pull',
            },
            insecure: {
              type: 'boolean',
              description: 'Allow insecure connections',
              default: false,
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
          required: ['model'],
        },
      },
      {
        name: 'ollama_push',
        description:
          'Push a model to the Ollama registry. Uploads a local model to make it available remotely.',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'Name of the model to push',
            },
            insecure: {
              type: 'boolean',
              description: 'Allow insecure connections',
              default: false,
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
          required: ['model'],
        },
      },
      {
        name: 'ollama_create',
        description:
          'Create a new model with structured parameters. Allows customization of model behavior, system prompts, and templates.',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'Name for the new model',
            },
            from: {
              type: 'string',
              description: 'Base model to derive from (e.g., llama2, llama3)',
            },
            system: {
              type: 'string',
              description: 'System prompt for the model',
            },
            template: {
              type: 'string',
              description: 'Prompt template to use',
            },
            license: {
              type: 'string',
              description: 'License for the model',
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
          required: ['model', 'from'],
        },
      },
      {
        name: 'ollama_delete',
        description:
          'Delete a model from local storage. Removes the model and frees up disk space.',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'Name of the model to delete',
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
          required: ['model'],
        },
      },
      {
        name: 'ollama_copy',
        description:
          'Copy a model. Creates a duplicate of an existing model with a new name.',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'Name of the source model',
            },
            destination: {
              type: 'string',
              description: 'Name for the copied model',
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
          required: ['source', 'destination'],
        },
      },
      {
        name: 'ollama_ps',
        description:
          'List running models. Shows which models are currently loaded in memory.',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
        },
      },
      {
        name: 'ollama_web_search',
        description:
          'Perform a web search using Ollama\'s web search API. Augments models with latest information to reduce hallucinations. Requires OLLAMA_API_KEY environment variable.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query string',
            },
            max_results: {
              type: 'number',
              description: 'Maximum number of results to return (1-10, default 5)',
              default: 5,
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'ollama_web_fetch',
        description:
          'Fetch a web page by URL using Ollama\'s web fetch API. Returns the page title, content, and links. Requires OLLAMA_API_KEY environment variable.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to fetch',
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              default: 'json',
            },
          },
          required: ['url'],
        },
      },
    ],
  };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'ollama_list': {
        const validated = ListModelsInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await listModels(ollama, format);

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_show': {
        const validated = ShowModelInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await showModel(ollama, validated.model, format);

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_chat': {
        const validated = ChatInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await chatWithModel(
          ollama,
          validated.model,
          validated.messages,
          validated.options || {},
          format,
          validated.tools.length > 0 ? validated.tools : undefined
        );

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_generate': {
        const validated = GenerateInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await generateWithModel(
          ollama,
          validated.model,
          validated.prompt,
          validated.options || {},
          format
        );

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_embed': {
        const validated = EmbedInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await embedWithModel(
          ollama,
          validated.model,
          validated.input,
          format
        );

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_pull': {
        const validated = PullModelInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await pullModel(
          ollama,
          validated.model,
          validated.insecure,
          format
        );

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_push': {
        const validated = PushModelInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await pushModel(
          ollama,
          validated.model,
          validated.insecure,
          format
        );

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_create': {
        const validated = CreateModelInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await createModel(
          ollama,
          {
            model: validated.model,
            from: validated.from,
            system: validated.system,
            template: validated.template,
            license: validated.license,
          },
          format
        );

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_delete': {
        const validated = DeleteModelInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await deleteModel(ollama, validated.model, format);

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_copy': {
        const validated = CopyModelInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await copyModel(
          ollama,
          validated.source,
          validated.destination,
          format
        );

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_ps': {
        const validated = PsInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await listRunningModels(ollama, format);

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_web_search': {
        const validated = WebSearchInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await webSearch(
          ollama,
          validated.query,
          validated.max_results,
          format
        );

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'ollama_web_fetch': {
        const validated = WebFetchInputSchema.parse(args);
        const format =
          validated.format === 'markdown'
            ? ResponseFormat.MARKDOWN
            : ResponseFormat.JSON;
        const result = await webFetch(ollama, validated.url, format);

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
