import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { VercelClient } from './vercelClient.js';

function buildJsonContent(uri: string, payload: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function buildErrorContent(uri: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return buildJsonContent(uri, { error: message });
}

export function registerResources(server: McpServer, client: VercelClient) {
  server.resource('Vercel Project Metadata', 'vercel://project', async () => {
    try {
      const project = await client.getProject();
      return buildJsonContent('vercel://project', project);
    } catch (error) {
      return buildErrorContent('vercel://project', error);
    }
  });

  server.resource('Recent Vercel Deployments', 'vercel://deployments/latest', async () => {
    try {
      const deployments = await client.getRecentDeployments(5);
      return buildJsonContent('vercel://deployments/latest', deployments);
    } catch (error) {
      return buildErrorContent('vercel://deployments/latest', error);
    }
  });

  server.resource('Production Environment Variables (metadata only)', 'vercel://env/production', async () => {
    try {
      const env = await client.getEnv('production');
      return buildJsonContent('vercel://env/production', env);
    } catch (error) {
      return buildErrorContent('vercel://env/production', error);
    }
  });

  console.error('✅ Registered Vercel MCP resources (project, deployments, env)');
}
