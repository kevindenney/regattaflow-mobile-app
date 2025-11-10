#!/usr/bin/env node

/**
 * RegattaFlow MCP Server
 *
 * Exposes sailing-related resources and tools for Claude Skills integration:
 * - Resources: Weather data, bathymetry, race information, tidal data
 * - Tools: Race analysis, route planning, performance metrics
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { registerResources } from './resources/index.js';
import { registerTools } from './tools/index.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

/**
 * Main MCP server instance
 */
const server = new McpServer({
  name: 'regattaflow-mcp-server',
  version: '1.0.0',
  description: 'MCP server providing sailing data and tools for RegattaFlow',
});

/**
 * Initialize the server with resources and tools
 */
async function initializeServer() {
  console.error('🚀 Initializing RegattaFlow MCP Server...');

  // Register resources (data sources)
  registerResources(server);
  console.error('✅ Resources registered');

  // Register tools (actions/computations)
  registerTools(server);
  console.error('✅ Tools registered');

  console.error('✅ RegattaFlow MCP Server initialized successfully');
}

/**
 * Start the server
 */
async function main() {
  try {
    await initializeServer();

    // Create stdio transport for communication
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error('🎯 RegattaFlow MCP Server running on stdio transport');
    console.error('📡 Waiting for client connections...');
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('\n⏹️  Shutting down RegattaFlow MCP Server...');
  await server.close();
  process.exit(0);
});

// Start the server
main();
