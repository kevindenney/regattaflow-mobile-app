/**
 * Base Agent Service
 * Foundation for autonomous AI agents using Anthropic's SDK
 * Provides tool execution framework, error handling, and configuration
 *
 * IMPORTANT: This service should ONLY be used server-side (Edge Functions, Node.js).
 * For browser usage, create Supabase Edge Functions that call these agents.
 *
 * Example:
 * - ❌ Browser → Agent.run() (exposes API keys)
 * - ✅ Browser → Supabase Edge Function → Agent.run() (secure)
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Tool definition using Zod schemas for type safety
export interface AgentTool {
  name: string;
  description: string;
  input_schema: z.ZodTypeAny;
  execute: (input: any) => Promise<any>;
}

export interface AgentConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AgentRunOptions {
  userMessage: string;
  context?: Record<string, any>;
  maxIterations?: number;
}

export interface AgentRunResult {
  success: boolean;
  result: any;
  iterations: number;
  toolsUsed: string[];
  toolResults?: Record<string, any>; // Map of tool name to its last result
  error?: string;
}

/**
 * Detect if code is running in a browser environment
 */
function isBrowserEnvironment(): boolean {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return true;
  }
  return false;
}

export class BaseAgentService {
  protected client: Anthropic | null = null;
  protected tools: Map<string, AgentTool> = new Map();
  protected config: Required<AgentConfig>;
  private isServerSide: boolean;

  constructor(config: AgentConfig = {}) {
    // Detect environment
    this.isServerSide = !isBrowserEnvironment();

    if (!this.isServerSide) {

      // Don't throw immediately - allow imports and instantiation
      // Only fail when run() is actually called
      this.config = {
        model: config.model || 'claude-3-5-haiku-latest',
        maxTokens: config.maxTokens || 4096,
        temperature: config.temperature || 0.7,
        systemPrompt: config.systemPrompt || 'You are a helpful AI assistant for RegattaFlow, a sailing race strategy platform.',
      };
      return; // Skip Anthropic client creation
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

    if (!apiKey) {

    }

    // Server-side only - no dangerouslyAllowBrowser needed
    this.client = new Anthropic({
      apiKey: apiKey || 'dummy-key-for-development',
    });

    this.config = {
      model: config.model || 'claude-3-5-haiku-latest',
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      systemPrompt: config.systemPrompt || 'You are a helpful AI assistant for RegattaFlow, a sailing race strategy platform.',
    };

  }

  /**
   * Register a custom tool for the agent to use
   */
  protected registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Convert Zod schema to Anthropic tool input schema format
   */
  private zodToAnthropicSchema(zodSchema: z.ZodTypeAny): any {
    // Convert Zod schema to JSON Schema format expected by Anthropic
    // This is a simplified conversion - extend as needed for complex schemas

    if (zodSchema instanceof z.ZodObject) {
      const shape = zodSchema._def.shape;
      const properties: Record<string, any> = {};
      const required: string[] = [];

      Object.entries(shape).forEach(([key, value]) => {
        properties[key] = this.zodSchemaToJsonSchema(value as z.ZodTypeAny);
        if (!(value as z.ZodTypeAny).isOptional()) {
          required.push(key);
        }
      });

      return {
        type: 'object',
        properties,
        required,
      };
    }

    return this.zodSchemaToJsonSchema(zodSchema);
  }

  /**
   * Convert individual Zod schema types to JSON Schema
   */
  private zodSchemaToJsonSchema(schema: z.ZodTypeAny): any {
    if (schema instanceof z.ZodString) {
      return { type: 'string', description: schema.description || '' };
    }
    if (schema instanceof z.ZodNumber) {
      return { type: 'number', description: schema.description || '' };
    }
    if (schema instanceof z.ZodBoolean) {
      return { type: 'boolean', description: schema.description || '' };
    }
    if (schema instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.zodSchemaToJsonSchema(schema._def.type as any),
        description: schema.description || '',
      };
    }
    if (schema instanceof z.ZodObject) {
      const shape = schema._def.shape;
      const properties: Record<string, any> = {};
      const required: string[] = [];

      Object.entries(shape).forEach(([key, value]) => {
        properties[key] = this.zodSchemaToJsonSchema(value as z.ZodTypeAny);
        if (!(value as z.ZodTypeAny).isOptional()) {
          required.push(key);
        }
      });

      return {
        type: 'object',
        properties,
        required,
      };
    }
    if (schema instanceof z.ZodOptional) {
      return this.zodSchemaToJsonSchema(schema._def.innerType as any);
    }

    // Default fallback
    return { type: 'string', description: schema.description || '' };
  }

  /**
   * Execute a tool by name with validated input
   */
  private async executeTool(toolName: string, input: any): Promise<any> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    try {
      // Validate input against schema
      const validatedInput = tool.input_schema.parse(input);

      // Execute the tool
      const result = await tool.execute(validatedInput);

      return result;
    } catch (error: any) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  /**
   * Run the agent with user message and context
   * Agent will autonomously decide which tools to call and in what order
   */
  async run(options: AgentRunOptions): Promise<AgentRunResult> {
    // Check if running in browser
    if (!this.isServerSide || !this.client) {
      const errorMessage = `
🚨 SECURITY ERROR: Cannot run agent in the browser!

This would expose your Anthropic API key to attackers.

SOLUTION:
1. Create a Supabase Edge Function for this agent
2. Call the Edge Function from your browser code instead

Example:
  // ❌ DON'T DO THIS (browser)
  const agent = new MyAgent();
  await agent.run({ userMessage: "..." });

  // ✅ DO THIS INSTEAD (browser → Edge Function)
  const { data } = await supabase.functions.invoke('my-agent-function', {
    body: { message: "..." }
  });

See: supabase/functions/extract-race-details/index.ts for an example
`;
      console.error(errorMessage);
      return {
        success: false,
        result: null,
        iterations: 0,
        toolsUsed: [],
        error: 'BaseAgentService cannot run in the browser. Use Supabase Edge Functions instead.',
      };
    }

    const { userMessage, context = {}, maxIterations = 10 } = options;

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: this.buildUserPrompt(userMessage, context),
      },
    ];

    let iterations = 0;
    const toolsUsed: string[] = [];
    const toolResults: Record<string, any> = {}; // Track tool results

    try {
      while (iterations < maxIterations) {
        iterations++;

        // Convert tools to Anthropic format
        const anthropicTools = Array.from(this.tools.values()).map(tool => ({
          name: tool.name,
          description: tool.description,
          input_schema: this.zodToAnthropicSchema(tool.input_schema),
        }));

        // Call Claude with tools
        const response = await this.client.messages.create({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: this.config.systemPrompt,
          messages,
          tools: anthropicTools,
        });

        // Check if agent wants to use a tool
        if (response.stop_reason === 'tool_use') {
          const toolUseBlocks = response.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
          );

          if (toolUseBlocks.length === 0) {
            throw new Error('Agent requested tool use but no tools were specified');
          }

          // Execute all requested tools
          const toolResultMessages: Anthropic.MessageParam[] = [];

          for (const toolUse of toolUseBlocks) {
            toolsUsed.push(toolUse.name);

            try {
              const result = await this.executeTool(toolUse.name, toolUse.input);

              // Store the tool result for later access
              toolResults[toolUse.name] = result;

              toolResultMessages.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(result),
                  },
                ],
              });
            } catch (error: any) {
              // Return error to agent so it can decide how to proceed
              toolResultMessages.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: JSON.stringify({
                      error: error.message,
                      tool: toolUse.name,
                    }),
                    is_error: true,
                  },
                ],
              });
            }
          }

          // Add assistant response and tool results to conversation
          messages.push({
            role: 'assistant',
            content: response.content,
          });
          messages.push(...toolResultMessages);

          // Continue the loop - agent will decide what to do next
          continue;
        }

        // Agent finished without requesting tools - extract final response
        if (response.stop_reason === 'end_turn') {
          const textContent = response.content.find(
            (block): block is Anthropic.TextBlock => block.type === 'text'
          );

          return {
            success: true,
            result: textContent?.text || 'Agent completed without text response',
            iterations,
            toolsUsed,
            toolResults, // Include tool results
          };
        }

        // Unexpected stop reason
        throw new Error(`Unexpected stop reason: ${response.stop_reason}`);
      }

      // Max iterations reached
      return {
        success: false,
        result: null,
        iterations,
        toolsUsed,
        toolResults, // Include tool results even on failure
        error: 'Maximum iterations reached without completion',
      };
    } catch (error: any) {

      return {
        success: false,
        result: null,
        iterations,
        toolsUsed,
        toolResults, // Include tool results even on error
        error: error.message,
      };
    }
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(userMessage: string, context: Record<string, any>): string {
    if (Object.keys(context).length === 0) {
      return userMessage;
    }

    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    return `${userMessage}\n\nContext:\n${contextStr}`;
  }

  /**
   * Get statistics about registered tools
   */
  getToolStats() {
    return {
      totalTools: this.tools.size,
      toolNames: Array.from(this.tools.keys()),
    };
  }
}

export default BaseAgentService;
