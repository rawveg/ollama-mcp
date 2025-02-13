# Ollama MCP Server
[![smithery badge](https://smithery.ai/badge/@rawveg/ollama-mcp)](https://smithery.ai/server/@rawveg/ollama-mcp)

An MCP (Model Context Protocol) server for Ollama that enables seamless integration between Ollama's local LLM models and MCP-compatible applications like Claude Desktop.

## Features

- List available Ollama models
- Pull new models from Ollama
- Chat with models using Ollama's chat API
- Get detailed model information
- Automatic port management
- Environment variable configuration

## Prerequisites

- Node.js (v16 or higher)
- npm
- Ollama installed and running locally

## Installation

### Installing via Smithery

To install Ollama MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@rawveg/ollama-mcp):

```bash
npx -y @smithery/cli install @rawveg/ollama-mcp --client claude
```

### Manual Installation
Install globally via npm:

```bash
npm install -g @rawveg/ollama-mcp
```

## Usage

### Starting the Server

Simply run:

```bash
ollama-mcp
```

The server will start on port 3456 by default. You can specify a different port using the PORT environment variable:

```bash
PORT=3457 ollama-mcp
```

### Environment Variables

- `PORT`: Server port (default: 3456). Can be used both when running directly and during Smithery installation:
  ```bash
  # When running directly
  PORT=3457 ollama-mcp

  # When installing via Smithery
  PORT=3457 npx -y @smithery/cli install @rawveg/ollama-mcp --client claude
  ```
- `OLLAMA_API`: Ollama API endpoint (default: http://localhost:11434)

### API Endpoints

- `GET /models` - List available models
- `POST /models/pull` - Pull a new model
- `POST /chat` - Chat with a model
- `GET /models/:name` - Get model details

## Development

1. Clone the repository:
```bash
git clone https://github.com/rawveg/ollama-mcp.git
cd ollama-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related

- [Ollama](https://ollama.ai)
- [Model Context Protocol](https://github.com/anthropics/model-context-protocol)
