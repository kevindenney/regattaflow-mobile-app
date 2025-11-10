#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { VercelClient } from './vercelClient.js';
import { registerResources } from './resources.js';
import { registerTools } from './tools.js';

async function bootstrap() {
  const config = loadConfig();
  const client = new VercelClient(config);

  const server = new McpServer({
    name: 'regattaflow-vercel-mcp',
    version: '0.1.0',
    description: 'Expose Vercel project telemetry and deploy hooks to Codex via MCP',
  });

  registerResources(server, client);
  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('🚀 RegattaFlow Vercel MCP server ready (stdio)');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Vercel MCP server:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.error('\n🛑 Vercel MCP server shutting down');
  process.exit(0);
});
