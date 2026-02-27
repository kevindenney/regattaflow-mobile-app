import type { RaceStrategy } from '@/services/aiService';

export function isDocumentSelectionCancelled(error: unknown): boolean {
  const message = typeof (error as { message?: unknown })?.message === 'string'
    ? (error as { message: string }).message
    : '';
  if (message.includes('[AI_STRATEGY_DOCUMENT_CANCELLED]')) {
    return true;
  }
  return (
    message === 'Document selection canceled'
  );
}

export function normalizeStrategyUploadError(error: unknown): string {
  const rawMessage = (error as { message?: unknown })?.message;
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
  const normalized = message.toLowerCase();
  if (!message) {
    return 'Unable to generate strategy from this document.';
  }
  if (normalized.includes('[ai_strategy_extraction_failed]')) {
    return 'Could not extract course details from this document. Try a clearer PDF or image.';
  }
  if (normalized.includes('[ai_strategy_no_waypoints]')) {
    return 'No usable course marks were detected in this document.';
  }
  if (normalized.includes('[ai_strategy_generation_failed]')) {
    return 'Strategy generation failed. Please try again.';
  }
  if (normalized.includes('[ai_strategy_empty_response]')) {
    return 'AI returned an empty strategy response. Please retry.';
  }
  if (normalized.includes('[ai_strategy_document_read_failed]')) {
    return 'The selected document could not be read on this device.';
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Network issue while generating strategy. Check your connection and retry.';
  }
  return message;
}

export function deriveStrategySummary(strategy: RaceStrategy): string {
  return (
    strategy.pre_start_plan?.positioning ||
    strategy.upwind_strategy?.tack_plan ||
    'AI-generated race strategy'
  );
}

export function deriveConfidencePercent(confidenceScore: unknown): number {
  const value = Number(confidenceScore || 0);
  if (!Number.isFinite(value)) {
    return 0;
  }
  // Accept both normalized ratios and percentages.
  // Values in (1, 2] are treated as ratio-like overages and clamped to 100%.
  const normalized = value <= 2 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}
