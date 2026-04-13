/**
 * Unified AI completion interface.
 *
 * Usage:
 *   import { complete } from '../_shared/ai/provider.ts';
 *
 *   const { text } = await complete({
 *     task: 'extraction',
 *     system: 'You are a data extractor.',
 *     messages: [{ role: 'user', content: 'Extract the race details...' }],
 *     maxOutputTokens: 2048,
 *   });
 *
 * Provider selection:
 *   - Automatically selects model based on task (see config.ts)
 *   - Override per-task via AI_TASK_<TASK> env vars
 *   - Override default provider via AI_PROVIDER env var
 *   - Fallback chain via AI_FALLBACK_CHAIN env var
 */

import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  ProviderName,
} from './types.ts';
import { getModelForTask, getFallbackChain, MODELS } from './config.ts';
import { GeminiProvider } from './providers/gemini.ts';
import { AnthropicProvider } from './providers/anthropic.ts';
import { OpenAICompatibleProvider } from './providers/openai-compatible.ts';

// Re-export types for convenience
export type {
  CompletionRequest,
  CompletionResponse,
  ContentPart,
  InlineDataPart,
  Message,
  TextPart,
} from './types.ts';

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

function createProvider(providerName: ProviderName, modelId: string): AIProvider {
  switch (providerName) {
    case 'gemini':
      return new GeminiProvider(modelId);
    case 'anthropic':
      return new AnthropicProvider(modelId);
    case 'openai-compatible':
      return new OpenAICompatibleProvider(modelId);
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }
}

/**
 * Find a model definition for a fallback provider.
 * Returns the first known model for that provider, or uses a sensible default.
 */
function getDefaultModelForProvider(providerName: ProviderName): string {
  const defaults: Record<ProviderName, string> = {
    gemini: 'gemini-2.5-flash',
    anthropic: 'claude-3-5-haiku-20241022',
    'openai-compatible': 'default', // defers to AI_LOCAL_MODEL
  };
  return defaults[providerName] ?? 'default';
}

// ---------------------------------------------------------------------------
// Main API
// ---------------------------------------------------------------------------

/**
 * Send a completion request to the configured AI provider.
 *
 * Resolves model from task, applies fallback chain on failure.
 */
export async function complete(
  request: CompletionRequest,
): Promise<CompletionResponse> {
  const model = getModelForTask(request.task);
  const primaryProvider = createProvider(model.provider, model.id);

  // Try primary provider
  try {
    return await primaryProvider.complete(request);
  } catch (primaryError) {
    // If no fallback chain, rethrow
    const fallbackChain = getFallbackChain();
    if (fallbackChain.length === 0) {
      throw primaryError;
    }

    console.error(
      `[ai-provider] Primary provider ${model.provider}/${model.id} failed:`,
      primaryError instanceof Error ? primaryError.message : primaryError,
    );

    // Try each fallback provider
    for (const fallbackName of fallbackChain) {
      if (fallbackName === model.provider) continue; // skip the one that just failed

      const fallbackModelId = getDefaultModelForProvider(fallbackName);
      try {
        console.log(`[ai-provider] Falling back to ${fallbackName}/${fallbackModelId}`);
        const fallbackProvider = createProvider(fallbackName, fallbackModelId);
        return await fallbackProvider.complete(request);
      } catch (fallbackError) {
        console.error(
          `[ai-provider] Fallback ${fallbackName} also failed:`,
          fallbackError instanceof Error ? fallbackError.message : fallbackError,
        );
      }
    }

    // All providers failed — rethrow the original error
    throw primaryError;
  }
}
