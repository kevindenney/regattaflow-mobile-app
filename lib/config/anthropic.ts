import Constants from 'expo-constants';

/**
 * Resolve the Anthropic API key from multiple sources.
 * Falls back to the bundled key used by internal tooling when no env is provided.
 */
export function resolveAnthropicApiKey(): string | undefined {
  const extras =
    Constants.expoConfig?.extra ||
    (Constants as any)?.manifest?.extra ||
    (Constants as any)?.manifest2?.extra ||
    {};

  const candidates: Array<string | undefined> = [
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    process.env.ANTHROPIC_API_KEY,
    extras?.anthropicApiKey,
  ];

  for (const value of candidates) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed && trimmed !== 'placeholder') {
        return trimmed;
      }
    }
  }

  return undefined;
}
