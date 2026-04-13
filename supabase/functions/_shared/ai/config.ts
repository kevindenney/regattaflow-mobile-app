/**
 * AI Model Configuration & Task Routing
 *
 * Model selection is driven by environment variables:
 *   AI_PROVIDER        — default provider (gemini | anthropic | openai-compatible)
 *   AI_TASK_<TASK>      — per-task model override, e.g. AI_TASK_EXTRACTION=gemini-2.5-flash
 *   AI_FALLBACK_CHAIN   — comma-separated provider fallback order
 *   AI_LOCAL_URL        — base URL for openai-compatible provider (Ollama, vLLM, etc.)
 *   AI_LOCAL_MODEL      — model name for openai-compatible provider
 */

import type { ModelDefinition, ProviderName } from './types.ts';

// ---------------------------------------------------------------------------
// Known models
// ---------------------------------------------------------------------------

export const MODELS: Record<string, ModelDefinition> = {
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    displayName: 'Gemini 2.5 Flash',
    costPer1MInput: 0,    // free tier
    costPer1MOutput: 0,
    maxOutputTokens: 8192,
    contextWindow: 1_048_576,
  },
  'claude-3-5-haiku-20241022': {
    id: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Haiku',
    costPer1MInput: 0.80,
    costPer1MOutput: 4.00,
    maxOutputTokens: 8192,
    contextWindow: 200_000,
  },
  'claude-3-5-sonnet-latest': {
    id: 'claude-3-5-sonnet-latest',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Sonnet',
    costPer1MInput: 3.00,
    costPer1MOutput: 15.00,
    maxOutputTokens: 8192,
    contextWindow: 200_000,
  },
};

// ---------------------------------------------------------------------------
// Default task → model mapping
// ---------------------------------------------------------------------------

const DEFAULT_TASK_MODELS: Record<string, string> = {
  extraction: 'gemini-2.5-flash',
  analysis: 'gemini-2.5-flash',
  generation: 'gemini-2.5-flash',
  chat: 'gemini-2.5-flash',
  briefing: 'gemini-2.5-flash',
  playbook: 'gemini-2.5-flash',
};

const DEFAULT_MODEL = 'gemini-2.5-flash';

// ---------------------------------------------------------------------------
// Environment helpers (cached reads)
// ---------------------------------------------------------------------------

function env(key: string): string | undefined {
  try {
    return Deno.env.get(key);
  } catch {
    // Deno.env may throw if permission denied; fall through to default
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the default provider name from environment.
 */
export function getDefaultProvider(): ProviderName {
  const raw = env('AI_PROVIDER');
  if (raw === 'anthropic' || raw === 'gemini' || raw === 'openai-compatible') {
    return raw;
  }
  return 'gemini';
}

/**
 * Resolve the model to use for a given task.
 *
 * Priority:
 *   1. AI_TASK_<TASK> env var (e.g. AI_TASK_EXTRACTION=claude-3-5-haiku-20241022)
 *   2. DEFAULT_TASK_MODELS mapping
 *   3. DEFAULT_MODEL
 */
export function getModelForTask(task?: string): ModelDefinition {
  if (task) {
    const envKey = `AI_TASK_${task.toUpperCase().replace(/-/g, '_')}`;
    const envModel = env(envKey);
    if (envModel && MODELS[envModel]) {
      return MODELS[envModel];
    }
    const defaultModel = DEFAULT_TASK_MODELS[task];
    if (defaultModel && MODELS[defaultModel]) {
      return MODELS[defaultModel];
    }
  }
  return MODELS[DEFAULT_MODEL];
}

/**
 * Get the fallback provider chain.
 * Returns an ordered list of provider names to try.
 */
export function getFallbackChain(): ProviderName[] {
  const raw = env('AI_FALLBACK_CHAIN');
  if (raw) {
    return raw
      .split(',')
      .map(s => s.trim())
      .filter((s): s is ProviderName =>
        s === 'gemini' || s === 'anthropic' || s === 'openai-compatible'
      );
  }
  return [];
}

/**
 * Get the OpenAI-compatible endpoint URL (for Ollama, vLLM, Groq, etc.)
 */
export function getLocalUrl(): string {
  return env('AI_LOCAL_URL') ?? 'http://localhost:11434/v1';
}

/**
 * Get the model name for the OpenAI-compatible provider.
 */
export function getLocalModel(): string {
  return env('AI_LOCAL_MODEL') ?? 'llama3.2';
}

/**
 * Estimate cost for a request in USD.
 */
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const model = MODELS[modelId];
  if (!model) return 0;
  return (
    (inputTokens / 1_000_000) * model.costPer1MInput +
    (outputTokens / 1_000_000) * model.costPer1MOutput
  );
}
