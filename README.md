<div align="center">

# 🦙 Ollama MCP Server

**Supercharge your AI assistant with local LLM access**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-green)](https://github.com/anthropics/model-context-protocol)
[![Coverage](https://img.shields.io/badge/Coverage-96%25-brightgreen)](https://github.com/rawveg/ollama-mcp)

An MCP (Model Context Protocol) server that exposes the complete Ollama SDK as MCP tools, enabling seamless integration between your local LLM models and MCP-compatible applications like Claude Desktop and Cline.

[Features](#-features) • [Installation](#-installation) • [Available Tools](#-available-tools) • [Configuration](#-configuration) • [Development](#-development)

</div>

---

## ✨ Features

- 🔧 **14 Comprehensive Tools** - Full access to Ollama's SDK functionality
- 🔄 **Hot-Swap Architecture** - Automatic tool discovery with zero-config
- 🎯 **Type-Safe** - Built with TypeScript and Zod validation
- 📊 **High Test Coverage** - 96%+ coverage with comprehensive test suite
- 🚀 **Zero Dependencies** - Minimal footprint, maximum performance
- 🔌 **Drop-in Integration** - Works with Claude Desktop, Cline, and other MCP clients
- 🌐 **Web Tools** - Built-in web search and fetch capabilities

## 📦 Installation

### Quick Start with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "ollama": {
      "command": "npx",
      "args": ["-y", "ollama-mcp"]
    }
  }
}
```

### Global Installation

```bash
npm install -g ollama-mcp
```

### For Cline (VS Code)

Add to your Cline MCP settings (`cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "ollama": {
      "command": "npx",
      "args": ["-y", "ollama-mcp"]
    }
  }
}
```

## 🛠️ Available Tools

### Model Management
| Tool | Description |
|------|-------------|
| `ollama_list` | List all available local models |
| `ollama_show` | Get detailed information about a specific model |
| `ollama_pull` | Download models from Ollama library |
| `ollama_push` | Push models to Ollama library |
| `ollama_copy` | Create a copy of an existing model |
| `ollama_delete` | Remove models from local storage |
| `ollama_create` | Create custom models from Modelfile |

### Model Operations
| Tool | Description |
|------|-------------|
| `ollama_ps` | List currently running models |
| `ollama_generate` | Generate text completions |
| `ollama_chat` | Interactive chat with models (supports tools/functions) |
| `ollama_embed` | Generate embeddings for text |

### Web Tools
| Tool | Description |
|------|-------------|
| `ollama_web_search` | Search the web with customizable result limits |
| `ollama_web_fetch` | Fetch and parse web page content |

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Ollama server endpoint |
| `OLLAMA_API_KEY` | - | Optional API key for authentication |

### Custom Ollama Host

```json
{
  "mcpServers": {
    "ollama": {
      "command": "npx",
      "args": ["-y", "ollama-mcp"],
      "env": {
        "OLLAMA_HOST": "http://localhost:11434"
      }
    }
  }
}
```

### With API Key

```json
{
  "mcpServers": {
    "ollama": {
      "command": "npx",
      "args": ["-y", "ollama-mcp"],
      "env": {
        "OLLAMA_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 🎯 Usage Examples

### Chat with a Model

```typescript
// MCP clients can invoke:
{
  "tool": "ollama_chat",
  "arguments": {
    "model": "llama3.2:latest",
    "messages": [
      { "role": "user", "content": "Explain quantum computing" }
    ]
  }
}
```

### Generate Embeddings

```typescript
{
  "tool": "ollama_embed",
  "arguments": {
    "model": "nomic-embed-text",
    "input": ["Hello world", "Embeddings are great"]
  }
}
```

### Web Search

```typescript
{
  "tool": "ollama_web_search",
  "arguments": {
    "query": "latest AI developments",
    "max_results": 5
  }
}
```

## 🏗️ Architecture

This server uses a **hot-swap autoloader** pattern:

```
src/
├── index.ts          # Entry point (27 lines)
├── server.ts         # MCP server creation
├── autoloader.ts     # Dynamic tool discovery
└── tools/            # Tool implementations
    ├── chat.ts       # Each exports toolDefinition
    ├── generate.ts
    └── ...
```

**Key Benefits:**
- Add new tools by dropping files in `src/tools/`
- Zero server code changes required
- Each tool is independently testable
- 100% function coverage on all tools

## 🧪 Development

### Prerequisites

- Node.js v16+
- npm or pnpm
- Ollama running locally

### Setup

```bash
# Clone repository
git clone https://github.com/rawveg/ollama-mcp.git
cd ollama-mcp

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

```
Statements   : 96.37%
Branches     : 84.82%
Functions    : 100%
Lines        : 96.37%
```

### Adding a New Tool

1. Create `src/tools/your-tool.ts`:

```typescript
import { ToolDefinition } from '../autoloader.js';
import { Ollama } from 'ollama';
import { ResponseFormat } from '../types.js';

export const toolDefinition: ToolDefinition = {
  name: 'ollama_your_tool',
  description: 'Your tool description',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string' }
    },
    required: ['param']
  },
  handler: async (ollama, args, format) => {
    // Implementation
    return 'result';
  }
};
```

2. Create tests in `tests/tools/your-tool.test.ts`
3. Done! The autoloader discovers it automatically.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Write tests** - We maintain 96%+ coverage
4. **Commit** with clear messages (`git commit -m 'Add amazing feature'`)
5. **Push** to your branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Code Quality Standards

- All new tools must export `toolDefinition`
- Maintain ≥80% test coverage
- Follow existing TypeScript patterns
- Use Zod schemas for input validation

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0).

See [LICENSE](LICENSE) for details.

## 🔗 Related Projects

- [Ollama](https://ollama.ai) - Get up and running with large language models locally
- [Model Context Protocol](https://github.com/anthropics/model-context-protocol) - Open standard for AI assistant integration
- [Claude Desktop](https://claude.ai/desktop) - Anthropic's desktop application
- [Cline](https://github.com/cline/cline) - VS Code AI assistant

## 🙏 Acknowledgments

Built with:
- [Ollama SDK](https://github.com/ollama/ollama-js) - Official Ollama JavaScript library
- [MCP SDK](https://github.com/anthropics/model-context-protocol) - Model Context Protocol SDK
- [Zod](https://zod.dev) - TypeScript-first schema validation

---

<div align="center">

**[⬆ back to top](#-ollama-mcp-server)**

Made with ❤️ by [Tim Green](https://github.com/rawveg)

</div>
