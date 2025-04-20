#!/usr/bin/env node
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
import { OllamaMCPServer } from './index.js';

const port = parseInt(process.env.PORT || '3456', 10);
const ollamaApi = process.env.OLLAMA_API || 'http://localhost:11434';

const server = new OllamaMCPServer(ollamaApi);

server.start(port).catch((error: Error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.stop().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.stop().then(() => process.exit(0));
});