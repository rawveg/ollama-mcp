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

However, this does **not** grant permission to incorporate this project into third-party services or commercial platforms without prior discussion and agreement. While I previously accepted contributions (such as a Dockerfile and related README updates) to support integration with services like **Smithery**, recent actions by a similar service — **Glama** — have required a reassessment of this policy.

Glama has chosen to include open-source MCP projects in their commercial offering without notice or consent, and subsequently created issue requests asking maintainers to perform unpaid work to ensure compatibility with *their* platform. This behaviour — leveraging community labour for profit without dialogue or compensation — is not only inconsiderate, but **ethically problematic**.

As a result, and to protect the integrity of this project and its contributors, the licence has been updated to the **GNU Affero General Public License v3.0 (AGPL-3.0)**. This change ensures that any use of the software — particularly in **commercial or service-based platforms** — must remain fully compliant with the AGPL's terms **and** obtain a separate commercial licence. Merely linking to the original source is not sufficient where the project is being **actively monetised**. If you wish to include this project in a commercial offering, please get in touch **first** to discuss licensing terms.

## License

AGPL v3.0

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=rawveg/ollama-mcp&type=Date)](https://www.star-history.com/#rawveg/ollama-mcp&Date)

## Related

- [Ollama](https://ollama.ai)
- [Model Context Protocol](https://github.com/anthropics/model-context-protocol)

This project was previously MIT-licensed. As of 20th April 2025, it is now licensed under AGPL-3.0 to prevent unauthorised commercial exploitation. If your use of this project predates this change, please refer to the relevant Git tag or commit for the applicable licence.
