/**
 * AI Model Configuration
 *
 * Provider-agnostic model registry with cost optimization.
 * Use getModelForTask() to automatically select the most cost-effective model.
 *
 * Pricing (per million tokens):
 * - Gemini 2.5 Flash:    Free tier (15 RPM, 1500 RPD)
 * - Claude 3.5 Haiku:    $0.80 input / $4.00 output
 * - Claude 3.5 Sonnet:   $3.00 input / $15.00 output
 */

export type ProviderName = 'gemini' | 'anthropic' | 'openai-compatible';

export type AIModelId =
  | 'gemini-2.5-flash'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-5-haiku-latest'
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-5-sonnet-20241022';

export type TaskComplexity = 'simple' | 'standard' | 'complex';

export interface ModelConfig {
  id: AIModelId;
  provider: ProviderName;
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
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    name: 'Gemini 2.5 Flash',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    maxTokens: 8192,
    contextWindow: 1_048_576,
    recommended: ['simple', 'standard'],
  },
  'claude-3.5-haiku-pinned': {
    id: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    name: 'Claude 3.5 Haiku',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    maxTokens: 8192,
    contextWindow: 200_000,
    recommended: ['simple', 'standard'],
  },
  'claude-3.5-haiku': {
    id: 'claude-3-5-haiku-latest',
    provider: 'anthropic',
    name: 'Claude 3.5 Haiku',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    maxTokens: 8192,
    contextWindow: 200_000,
    recommended: ['standard', 'complex'],
  },
  'claude-3.5-sonnet': {
    id: 'claude-3-5-sonnet-latest',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    maxTokens: 8192,
    contextWindow: 200_000,
    recommended: ['complex'],
  },
};

/**
 * Task type to complexity mapping
 * This determines which model tier to use for each task
 */
export const TASK_COMPLEXITY: Record<string, TaskComplexity> = {
  // Simple tasks
  'voice-transcription': 'simple',
  'simple-extraction': 'simple',
  'format-conversion': 'simple',
  'spell-check': 'simple',
  'summarization-short': 'simple',

  // Standard tasks
  'race-strategy': 'standard',
  'coaching-feedback': 'standard',
  'document-parsing': 'standard',
  'race-analysis': 'standard',
  'tuning-recommendations': 'standard',
  'session-planning': 'standard',
  'onboarding-chat': 'standard',
  'learning-summary': 'standard',
  'extraction': 'standard',
  'chat': 'standard',
  'playbook': 'standard',
  'briefing': 'standard',
  'generation': 'standard',
  'analysis': 'standard',

  // Complex tasks
  'multi-step-reasoning': 'complex',
  'code-generation': 'complex',
  'detailed-analysis': 'complex',
};

const COMPLEX_TASK_HINTS = ['complex', 'detailed', 'championship', 'multi-step', 'code-generation'];
const SIMPLE_TASK_HINTS = ['simple', 'short', 'spell', 'format', 'transcription'];

function normalizeTaskType(taskType: string): string {
  return String(taskType || '')
    .trim()
    .toLowerCase();
}

export function getTaskComplexity(taskType: string): TaskComplexity {
  const normalizedTaskType = normalizeTaskType(taskType);
  if (!normalizedTaskType) return 'standard';

  const explicit = TASK_COMPLEXITY[normalizedTaskType];
  if (explicit) return explicit;

  if (COMPLEX_TASK_HINTS.some((hint) => normalizedTaskType.includes(hint))) {
    return 'complex';
  }
  if (SIMPLE_TASK_HINTS.some((hint) => normalizedTaskType.includes(hint))) {
    return 'simple';
  }
  return 'standard';
}

/**
 * Get the recommended model for a specific task type.
 * Currently returns Gemini 2.5 Flash for all tasks (free tier).
 * Edge functions handle actual provider routing via AI_PROVIDER / AI_TASK_* env vars.
 */
export function getModelForTask(taskType: string): AIModelId {
  // Edge functions use supabase/functions/_shared/ai/config.ts for actual routing.
  // This client-side config is used for cost estimation and display purposes.
  return 'gemini-2.5-flash';
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

/** Default model for most tasks */
export const DEFAULT_MODEL: AIModelId = 'gemini-2.5-flash';

/** Budget model for high-volume, simple tasks */
export const BUDGET_MODEL: AIModelId = 'gemini-2.5-flash';

/** Premium model - use sparingly for complex reasoning */
export const PREMIUM_MODEL: AIModelId = 'claude-3-5-sonnet-latest';
