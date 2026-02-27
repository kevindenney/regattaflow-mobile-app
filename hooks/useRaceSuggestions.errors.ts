import type { SuggestionDiagnostics } from '@/services/RaceSuggestionService';

export function buildSuggestionsUnavailableError(
  diagnostics: SuggestionDiagnostics | null | undefined
): Error | null {
  const failedSources = diagnostics?.failedSources || [];
  if (failedSources.length === 0) {
    return null;
  }

  const failedSourceDiagnostics = (diagnostics?.sources || []).filter((source) => source.failed);
  const failedMessages = failedSourceDiagnostics
    .map((source) => source.errorMessage?.toLowerCase() || '')
    .filter(Boolean);

  const isRlsMessage = (message: string) =>
    message.includes('row-level security')
    || message.includes('permission denied')
    || message.includes('not authorized');
  const isNetworkMessage = (message: string) =>
    message.includes('network')
    || message.includes('fetch')
    || message.includes('timeout')
    || message.includes('503')
    || message.includes('502')
    || message.includes('429');

  const hasFailedMessages = failedMessages.length > 0;
  const allRls = hasFailedMessages && failedMessages.every(isRlsMessage);
  const allNetwork = hasFailedMessages && failedMessages.every(isNetworkMessage);

  const tagged = new Error(`Suggestion sources unavailable: ${failedSources.join(', ')}`);
  (tagged as any).code = allRls
    ? 'RACE_SUGGESTIONS_RLS'
    : allNetwork
    ? 'RACE_SUGGESTIONS_NETWORK'
    : 'RACE_SUGGESTIONS_SOURCES_UNAVAILABLE';
  (tagged as any).cause = failedSourceDiagnostics;
  return tagged;
}

export function normalizeSuggestionError(error: unknown): Error {
  const message = (error as { message?: unknown })?.message;
  const normalizedMessage = typeof message === 'string' ? message.toLowerCase() : '';

  if (
    normalizedMessage.includes('permission denied') ||
    normalizedMessage.includes('row-level security') ||
    normalizedMessage.includes('not authorized')
  ) {
    const tagged = new Error('[RACE_SUGGESTIONS_RLS] Suggestion sources unavailable due to access policy restrictions.');
    (tagged as any).cause = message;
    return tagged;
  }

  if (normalizedMessage.includes('network') || normalizedMessage.includes('fetch')) {
    const tagged = new Error('[RACE_SUGGESTIONS_NETWORK] Unable to load race suggestions due to a network issue.');
    (tagged as any).cause = message;
    return tagged;
  }
  if (normalizedMessage.includes('[race_suggestions_service_failure]')) {
    const tagged = new Error('Suggestion sources unavailable: service_failure');
    (tagged as any).cause = message;
    return tagged;
  }

  if (typeof message === 'string' && message.trim()) {
    return new Error(message.trim());
  }

  return new Error('Unable to load race suggestions right now.');
}

export function extractSuggestionFailureSources(
  diagnosticsFailedSources: string[] | null | undefined,
  errorMessage: string | null | undefined
): string[] {
  if (diagnosticsFailedSources?.length) {
    return diagnosticsFailedSources;
  }

  const message = errorMessage || '';
  const prefix = 'Suggestion sources unavailable:';
  const prefixIndex = message.indexOf(prefix);
  if (prefixIndex === -1) {
    return [];
  }

  return message
    .slice(prefixIndex + prefix.length)
    .split(',')
    .map((source) => source.trim())
    .filter(Boolean);
}
