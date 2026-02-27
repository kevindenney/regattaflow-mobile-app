/**
 * Resolve the Anthropic API key from multiple sources.
 * Security policy: only server-side ANTHROPIC_API_KEY is accepted.
 */
export function resolveAnthropicApiKey(): string | undefined {
  if (typeof window !== 'undefined') {
    return undefined;
  }

  const value = process.env.ANTHROPIC_API_KEY;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'placeholder') return undefined;
  return trimmed;
}
