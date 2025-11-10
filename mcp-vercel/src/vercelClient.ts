import type { VercelMcpConfig } from './config.js';

type QueryParams = Record<string, string | number | undefined>;

type DeployTarget = 'production' | 'preview';

const API_BASE = process.env.VERCEL_API_BASE || 'https://api.vercel.com';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: QueryParams;
  body?: Record<string, unknown> | undefined;
}

export class VercelClient {
  constructor(private readonly config: VercelMcpConfig) {}

  private buildUrl(path: string, query?: QueryParams) {
    const url = new URL(path, API_BASE);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;
        url.searchParams.set(key, String(value));
      }
    }

    if (this.config.teamId) {
      url.searchParams.set('teamId', this.config.teamId);
    }

    return url.toString();
  }

  private async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', query, body } = options;
    const url = this.buildUrl(path, query);

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vercel API ${response.status}: ${errorText}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  async getProject() {
    return this.request(`/v9/projects/${this.config.projectId}`);
  }

  async getRecentDeployments(limit = 5) {
    return this.request('/v13/deployments', {
      query: {
        projectId: this.config.projectId,
        limit: String(limit),
      },
    });
  }

  async getEnv(target: DeployTarget = 'production') {
    return this.request(`/v10/projects/${this.config.projectId}/env`, {
      query: {
        target,
        decrypt: 'false',
      },
    });
  }

  async getDeployment(deploymentId: string) {
    return this.request(`/v13/deployments/${deploymentId}`);
  }

  async getDeploymentEvents(deploymentId: string, limit = 50) {
    return this.request(`/v3/deployments/${deploymentId}/events`, {
      query: {
        direction: 'backward',
        limit: String(limit),
      },
    });
  }

  async triggerDeployHook(target: DeployTarget = 'production', payload?: Record<string, unknown>) {
    const url = this.getDeployHookUrl(target);
    if (!url) {
      throw new Error(`No deploy hook configured for target ${target}`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'regattaflow-vercel-mcp/0.1.0',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Deploy hook failed (${response.status}): ${text}`);
    }

    try {
      return text ? JSON.parse(text) : { status: 'ok' };
    } catch (error) {
      return { status: 'ok', body: text };
    }
  }

  private getDeployHookUrl(target: DeployTarget) {
    if (target === 'production') {
      return this.config.prodDeployHookUrl || null;
    }

    return this.config.previewDeployHookUrl || this.config.prodDeployHookUrl || null;
  }
}
