import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { VercelClient } from './vercelClient.js';

type DeployTarget = 'production' | 'preview';

const deploymentArgsShape = {
  deploymentId: z.string().describe('Vercel deployment ID or URL id'),
};
const deploymentArgsSchema = z.object(deploymentArgsShape);

const deploymentLogsArgsShape = {
  deploymentId: z.string().describe('Deployment ID to fetch logs for'),
  limit: z.number().int().min(1).max(200).optional().describe('Number of log events to return (default 50)'),
};
const deploymentLogsArgsSchema = z.object(deploymentLogsArgsShape);

const deployHookArgsShape = {
  target: z.enum(['production', 'preview']).default('production').describe('Deploy hook target to trigger'),
  payload: z.record(z.any()).optional().describe('Optional JSON body sent to the deploy hook'),
};
const deployHookArgsSchema = z.object(deployHookArgsShape);

function buildToolResponse(payload: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function registerTools(server: McpServer, client: VercelClient) {
  server.registerTool(
    'get_vercel_deployment',
    {
      description: 'Fetch metadata for a specific Vercel deployment',
      inputSchema: deploymentArgsShape,
    },
    async (args: z.infer<typeof deploymentArgsSchema>) => {
      const deployment = await client.getDeployment(args.deploymentId);
      return buildToolResponse(deployment);
    }
  );

  server.registerTool(
    'get_vercel_logs',
    {
      description: 'Retrieve structured log events for a Vercel deployment',
      inputSchema: deploymentLogsArgsShape,
    },
    async (args: z.infer<typeof deploymentLogsArgsSchema>) => {
      const events = await client.getDeploymentEvents(args.deploymentId, args.limit ?? 50);
      return buildToolResponse(events);
    }
  );

  server.registerTool(
    'trigger_vercel_deploy_hook',
    {
      description: 'Trigger a Vercel deploy hook to kick off a new build (production or preview)',
      inputSchema: deployHookArgsShape,
    },
    async (args: z.infer<typeof deployHookArgsSchema>) => {
      const target = args.target as DeployTarget;
      const result = await client.triggerDeployHook(target, args.payload);
      return buildToolResponse({ target, result });
    }
  );

  console.error('✅ Registered Vercel MCP tools (deployment details, logs, deploy hook)');
}
