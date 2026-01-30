/**
 * Enhanced Claude Client with MCP and Skills Support
 *
 * This client extends the basic Claude client to support:
 * 1. Claude Skills API integration
 * 2. MCP (Model Context Protocol) integration
 * 3. Combined Skills + MCP workflows
 */

import Constants from 'expo-constants';
import { ClaudeClient, ClaudeModel, ClaudeMessage } from './ClaudeClient';
import { skillManagementService } from './SkillManagementService';

export interface SkillConfig {
  skillId: string;
  version?: string;
}

export interface MCPResource {
  uri: string;
  mimeType?: string;
}

export interface MCPTool {
  name: string;
  description?: string;
  input_schema?: any;
}

export interface EnhancedClaudeRequest {
  model: ClaudeModel;
  system?: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
  temperature?: number;

  // Skills integration
  skills?: SkillConfig[];

  // MCP integration
  mcpResources?: MCPResource[];
  mcpTools?: MCPTool[];

  // Code execution (required for Skills)
  enableCodeExecution?: boolean;
}

export interface EnhancedClaudeResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
  raw: any;
  skillsUsed?: string[];
  toolsUsed?: string[];
}

/**
 * Enhanced Claude client with Skills and MCP support
 */
export class EnhancedClaudeClient extends ClaudeClient {
  constructor(apiKey?: string) {
    // Try to get API key from multiple sources
    // Priority: explicit parameter > expo-constants > env vars
    const finalApiKey =
      apiKey ||
      Constants?.expoConfig?.extra?.anthropicApiKey ||
      process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_API_KEY;

    super(finalApiKey);
  }

  /**
   * Create a message with Skills and/or MCP support
   */
  async createEnhancedMessage(
    request: EnhancedClaudeRequest
  ): Promise<EnhancedClaudeResponse> {
    const start = Date.now();

    // Build the request body
    const body: any = {
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.4,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: [{ type: 'text', text: msg.content }],
      })),
    };

    // Add system prompt if provided
    if (request.system) {
      body.system = request.system;
    }

    // Configure beta features and container
    const betas: string[] = [];
    const container: any = {};

    // Add Skills support if requested
    if (request.skills && request.skills.length > 0) {
      betas.push('skills-2025-10-02');

      container.skills = request.skills.map(skill => ({
        type: 'anthropic',
        skill_id: skill.skillId,
        version: skill.version || 'latest',
      }));
    }

    // Add code execution if explicitly enabled and model supports it
    // Note: claude-3-haiku-20240307 does NOT support code_execution
    if (request.enableCodeExecution && !request.model.includes('haiku')) {
      betas.push('code-execution-2025-08-25');

      if (!body.tools) {
        body.tools = [];
      }

      body.tools.push({
        type: 'code_execution_20250825',
        name: 'code_execution',
      });
    }

    // Add MCP resources if provided
    if (request.mcpResources && request.mcpResources.length > 0) {
      // MCP resources are typically added via system context
      const resourceContext = this.formatMCPResources(request.mcpResources);
      if (resourceContext) {
        body.system = body.system
          ? `${body.system}\n\n${resourceContext}`
          : resourceContext;
      }
    }

    // Add MCP tools if provided
    if (request.mcpTools && request.mcpTools.length > 0) {
      if (!body.tools) {
        body.tools = [];
      }

      // Convert MCP tools to Claude tool format
      body.tools.push(
        ...request.mcpTools.map(tool => ({
          name: tool.name,
          description: tool.description || '',
          input_schema: tool.input_schema || { type: 'object', properties: {} },
        }))
      );
    }

    // Add betas and container to request
    if (betas.length > 0) {
      body.betas = betas;
    }

    if (Object.keys(container).length > 0) {
      body.container = container;
    }

    // Make the API request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };

    // Add beta headers if needed
    if (betas.length > 0) {
      headers['anthropic-beta'] = betas.join(',');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errorBody}`);
    }

    const json = await response.json();

    // Extract text from response
    const text = Array.isArray(json.content)
      ? json.content.map((item: any) => item.text ?? '').join('\n').trim()
      : json.content?.text ?? '';

    // Track which skills and tools were used
    const skillsUsed: string[] = [];
    const toolsUsed: string[] = [];

    if (Array.isArray(json.content)) {
      json.content.forEach((item: any) => {
        if (item.type === 'tool_use') {
          toolsUsed.push(item.name);
        }
      });
    }

    const durationMs = Date.now() - start;

    return {
      text,
      tokensIn: json?.usage?.input_tokens ?? 0,
      tokensOut: json?.usage?.output_tokens ?? 0,
      raw: { ...json, durationMs },
      skillsUsed: skillsUsed.length > 0 ? skillsUsed : undefined,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    };
  }

  /**
   * Helper to create a request with race strategy skills
   */
  async createRaceStrategyRequest(
    message: string,
    context?: {
      raceData?: any;
      weatherData?: any;
      tidalData?: any;
      bathymetryData?: any;
    }
  ): Promise<EnhancedClaudeResponse> {
    // Initialize skills
    const raceStrategySkillId = await skillManagementService.initializeRaceStrategySkill();
    const tidalSkillId = await skillManagementService.initializeTidalOpportunismSkill();
    const slackWindowSkillId = await skillManagementService.initializeSlackWindowSkill();

    const skills: SkillConfig[] = [];

    if (raceStrategySkillId) {
      skills.push({ skillId: raceStrategySkillId });
    }
    if (tidalSkillId) {
      skills.push({ skillId: tidalSkillId });
    }
    if (slackWindowSkillId) {
      skills.push({ skillId: slackWindowSkillId });
    }

    // Build system prompt with context
    let systemPrompt = 'You are an expert sailing race strategist with access to specialized skills.';

    if (context) {
      systemPrompt += '\n\nContext available:';
      if (context.raceData) {
        systemPrompt += `\n- Race Data: ${JSON.stringify(context.raceData)}`;
      }
      if (context.weatherData) {
        systemPrompt += `\n- Weather Data: ${JSON.stringify(context.weatherData)}`;
      }
      if (context.tidalData) {
        systemPrompt += `\n- Tidal Data: ${JSON.stringify(context.tidalData)}`;
      }
      if (context.bathymetryData) {
        systemPrompt += `\n- Bathymetry Data: ${JSON.stringify(context.bathymetryData)}`;
      }
    }

    return this.createEnhancedMessage({
      model: 'claude-3-haiku-20240307', // Switched from Sonnet (75% cost savings)
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      skills,
      enableCodeExecution: true,
      maxTokens: 4096,
    });
  }

  /**
   * Format MCP resources for system context
   */
  private formatMCPResources(resources: MCPResource[]): string {
    if (resources.length === 0) return '';

    let context = '# Available Resources\n\n';
    context += 'The following data sources are available:\n\n';

    resources.forEach(resource => {
      context += `- ${resource.uri}`;
      if (resource.mimeType) {
        context += ` (${resource.mimeType})`;
      }
      context += '\n';
    });

    return context;
  }
}

// Export singleton instance
export const enhancedClaudeClient = new EnhancedClaudeClient();
