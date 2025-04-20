// src/index.ts
/**
 * @license
 * Copyright (c) [Your Name or Organisation] [Year]
 *
 * This file is part of [Project Name].
 *
 * [Project Name] is licensed under the GNU Affero General Public License v3.0.
 * You may obtain a copy of the license at https://www.gnu.org/licenses/agpl-3.0.html
 *
 * Unless required by applicable law or agreed to in writing, software distributed
 * under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations.
 */
import express from 'express';
import fetch from 'node-fetch';
import type { Request, Response } from 'express';

export class OllamaMCPServer {
  private app = express();
  private server: any;
  private ollamaApi: string;

  constructor(ollamaApi: string = 'http://localhost:11434') {
    this.ollamaApi = ollamaApi;
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.use(express.json());

    this.app.get('/models', this.listModels.bind(this));
    this.app.post('/models/pull', this.pullModel.bind(this));
    this.app.post('/chat', this.chat.bind(this));
    this.app.get('/models/:name', this.getModelInfo.bind(this));
  }

  private async listModels(req: Request, res: Response) {
    try {
      const response = await fetch(`${this.ollamaApi}/api/tags`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  }

  private async pullModel(req: Request, res: Response) {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    try {
      const response = await fetch(`${this.ollamaApi}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  }

  private async chat(req: Request, res: Response) {
    const { model, messages } = req.body;
    
    if (!model || !messages) {
      return res.status(400).json({ error: 'Model and messages are required' });
    }

    try {
      const response = await fetch(`${this.ollamaApi}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false
        })
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  }

  private async getModelInfo(req: Request, res: Response) {
    const { name } = req.params;
    try {
      const response = await fetch(`${this.ollamaApi}/api/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  }

  public start(port: number = 3456): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, () => {
          console.log(`Ollama MCP Server running on port ${port}`);
          resolve();
        });

        this.server.on('error', (error: Error & { code?: string }) => {
          if (error.code === 'EADDRINUSE') {
            reject(new Error(`Port ${port} is already in use`));
          } else {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default OllamaMCPServer;