/**
 * AI Model Configuration
 * 
 * Centralized configuration for Claude model selection with cost optimization.
 * Use getModelForTask() to automatically select the most cost-effective model.
 * 
 * Pricing (per million tokens, as of Dec 2024):
 * - Claude 3 Haiku:     $0.25 input / $1.25 output  (cheapest)
 * - Claude 3.5 Haiku:   $0.80 input / $4.00 output  (3x more)
 * - Claude 3.5 Sonnet:  $3.00 input / $15.00 output (12x more)
 */

export type AIModelId = 
  | 'claude-3-haiku-20240307'      // Cheapest - simple tasks
  | 'claude-3-5-haiku-latest'      // Good balance - most tasks
  | 'claude-3-5-haiku-20241022'    // Pinned version of 3.5 Haiku
  | 'claude-3-5-sonnet-latest'     // Premium - complex reasoning only
  | 'claude-3-5-sonnet-20240620';  // Pinned version of Sonnet

export type TaskComplexity = 'simple' | 'standard' | 'complex';

export interface ModelConfig {
  id: AIModelId;
  name: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  maxTokens: number;
  contextWindow: number;
  recommended: TaskComplexity[];
}

/**
 * Model configurations with pricing and recommendations
 */
export const AI_MODELS: Record<string, ModelConfig> = {
  'claude-3-haiku': {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    maxTokens: 4096,
    contextWindow: 200000,
    recommended: ['simple'],
  },
  'claude-3.5-haiku': {
    id: 'claude-3-5-haiku-latest',
    name: 'Claude 3.5 Haiku',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    maxTokens: 8192,
    contextWindow: 200000,
    recommended: ['standard', 'complex'],
  },
  'claude-3.5-sonnet': {
    id: 'claude-3-5-sonnet-latest',
    name: 'Claude 3.5 Sonnet',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    maxTokens: 8192,
    contextWindow: 200000,
    recommended: ['complex'], // Only for tasks requiring deep reasoning
  },
};

/**
 * Task type to complexity mapping
 * This determines which model tier to use for each task
 */
export const TASK_COMPLEXITY: Record<string, TaskComplexity> = {
  // Simple tasks - use Claude 3 Haiku (cheapest)
  'voice-transcription': 'simple',
  'simple-extraction': 'simple',
  'format-conversion': 'simple',
  'spell-check': 'simple',
  'summarization-short': 'simple',
  
  // Standard tasks - use Claude 3.5 Haiku (good balance)
  'race-strategy': 'standard',
  'coaching-feedback': 'standard',
  'document-parsing': 'standard',
  'race-analysis': 'standard',
  'tuning-recommendations': 'standard',
  'session-planning': 'standard',
  'onboarding-chat': 'standard',
  'learning-summary': 'standard',
  
  // Complex tasks - still use Haiku but with more tokens
  'multi-step-reasoning': 'complex',
  'code-generation': 'complex',
  'detailed-analysis': 'complex',
};

/**
 * Get the recommended model for a specific task type
 * Defaults to Claude 3.5 Haiku for unknown tasks (good balance of cost/quality)
 */
export function getModelForTask(taskType: string): AIModelId {
  const complexity = TASK_COMPLEXITY[taskType] || 'standard';
  
  switch (complexity) {
    case 'simple':
      return 'claude-3-haiku-20240307';
    case 'standard':
    case 'complex':
    default:
      return 'claude-3-5-haiku-latest';
  }
}

/**
 * Get model config by ID
 */
export function getModelConfig(modelId: AIModelId): ModelConfig | undefined {
  return Object.values(AI_MODELS).find(m => m.id === modelId);
}

/**
 * Estimate cost for a request
 */
export function estimateCost(
  modelId: AIModelId,
  inputTokens: number,
  outputTokens: number
): number {
  const config = getModelConfig(modelId);
  if (!config) return 0;
  
  const inputCost = (inputTokens / 1_000_000) * config.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * config.outputCostPer1M;
  
  return inputCost + outputCost;
}

/**
 * Default model for most tasks - balances cost and quality
 */
export const DEFAULT_MODEL: AIModelId = 'claude-3-5-haiku-latest';

/**
 * Budget model for high-volume, simple tasks
 */
export const BUDGET_MODEL: AIModelId = 'claude-3-haiku-20240307';

/**
 * Premium model - use sparingly for complex reasoning
 */
export const PREMIUM_MODEL: AIModelId = 'claude-3-5-sonnet-latest';

