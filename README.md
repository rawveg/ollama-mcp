# Ollama MCP Server
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

### Manual Installation
Install globally via npm:

```bash
npm install -g @rawveg/ollama-mcp
```

### Installing in Other MCP Applications

To install the Ollama MCP Server in other MCP-compatible applications (like Cline or Claude Desktop), add the following configuration to your application's MCP settings file:

```json
{
  "mcpServers": {
    "@rawveg/ollama-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@rawveg/ollama-mcp"
      ]
    }
  }
}
```

The settings file location varies by application:
- Claude Desktop: `claude_desktop_config.json` in the Claude app data directory
- Cline: `cline_mcp_settings.json` in the VS Code global storage

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

- `PORT`: Server port (default: 3456). Can be used when running directly:
  ```bash
  # When running directly
  PORT=3457 ollama-mcp
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

This project was previously MIT-licensed. As of 20th April 2025, it is now licensed under AGPL-3.0 to prevent unauthorised commercial exploitation. If your use of this project predates this change, please refer to the relevant Git tag or commit for the applicable licence.