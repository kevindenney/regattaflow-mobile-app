import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  token: z.string().min(1, 'VERCEL_TOKEN is required'),
  projectId: z.string().min(1, 'VERCEL_PROJECT_ID is required'),
  teamId: z.string().optional(),
  prodDeployHookUrl: z.string().url().optional(),
  previewDeployHookUrl: z.string().url().optional(),
});

export type VercelMcpConfig = z.infer<typeof configSchema>;

export function loadConfig(): VercelMcpConfig {
  const parsed = configSchema.safeParse({
    token: process.env.VERCEL_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID,
    teamId: process.env.VERCEL_TEAM_ID || undefined,
    prodDeployHookUrl: process.env.VERCEL_PROD_DEPLOY_HOOK_URL || undefined,
    previewDeployHookUrl: process.env.VERCEL_PREVIEW_DEPLOY_HOOK_URL || undefined,
  });

  if (!parsed.success) {
    console.error('❌ Invalid MCP configuration:');
    for (const issue of parsed.error.issues) {
      console.error(` - ${issue.message}`);
    }
    process.exit(1);
  }

  return parsed.data;
}
