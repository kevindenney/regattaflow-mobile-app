/**
 * Base Agent Service
 * Foundation for autonomous AI agents using Anthropic's SDK
 * Provides tool execution framework, error handling, and configuration
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
  error?: string;
}

export class BaseAgentService {
  protected client: Anthropic;
  protected tools: Map<string, AgentTool> = new Map();
  protected config: Required<AgentConfig>;

  constructor(config: AgentConfig = {}) {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ Anthropic API key not found. Agent functionality will be limited.');
      // Create client anyway for development - will fail at runtime if used
    }

    this.client = new Anthropic({
      apiKey: apiKey || 'dummy-key-for-development',
    });

    this.config = {
      model: config.model || 'claude-sonnet-4-5-20250929',
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      systemPrompt: config.systemPrompt || 'You are a helpful AI assistant for RegattaFlow, a sailing race strategy platform.',
    };

    console.log('🤖 BaseAgentService initialized with model:', this.config.model);
  }

  /**
   * Register a custom tool for the agent to use
   */
  protected registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
    console.log(`🔧 Registered tool: ${tool.name}`);
  }

  /**
   * Convert Zod schema to Anthropic tool input schema format
   */
  private zodToAnthropicSchema(zodSchema: z.ZodTypeAny): any {
    // Convert Zod schema to JSON Schema format expected by Anthropic
    // This is a simplified conversion - extend as needed for complex schemas

    if (zodSchema instanceof z.ZodObject) {
      const shape = zodSchema._def.shape();
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
        items: this.zodSchemaToJsonSchema(schema.element),
        description: schema.description || '',
      };
    }
    if (schema instanceof z.ZodObject) {
      const shape = schema._def.shape();
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
      return this.zodSchemaToJsonSchema(schema.unwrap());
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

    console.log(`🔧 Executing tool: ${toolName}`, input);

    try {
      // Validate input against schema
      const validatedInput = tool.input_schema.parse(input);

      // Execute the tool
      const result = await tool.execute(validatedInput);

      console.log(`✅ Tool ${toolName} completed successfully`);
      return result;
    } catch (error: any) {
      console.error(`❌ Tool ${toolName} failed:`, error);
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  /**
   * Run the agent with user message and context
   * Agent will autonomously decide which tools to call and in what order
   */
  async run(options: AgentRunOptions): Promise<AgentRunResult> {
    const { userMessage, context = {}, maxIterations = 10 } = options;

    console.log('🤖 Agent starting with message:', userMessage);

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: this.buildUserPrompt(userMessage, context),
      },
    ];

    let iterations = 0;
    const toolsUsed: string[] = [];

    try {
      while (iterations < maxIterations) {
        iterations++;
        console.log(`🤖 Agent iteration ${iterations}/${maxIterations}`);

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

        console.log('🤖 Agent response:', response.stop_reason);

        // Check if agent wants to use a tool
        if (response.stop_reason === 'tool_use') {
          const toolUseBlocks = response.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
          );

          if (toolUseBlocks.length === 0) {
            throw new Error('Agent requested tool use but no tools were specified');
          }

          // Execute all requested tools
          const toolResults: Anthropic.MessageParam[] = [];

          for (const toolUse of toolUseBlocks) {
            toolsUsed.push(toolUse.name);

            try {
              const result = await this.executeTool(toolUse.name, toolUse.input);

              toolResults.push({
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
              toolResults.push({
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
          messages.push(...toolResults);

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
        error: 'Maximum iterations reached without completion',
      };
    } catch (error: any) {
      console.error('❌ Agent run failed:', error);
      return {
        success: false,
        result: null,
        iterations,
        toolsUsed,
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
