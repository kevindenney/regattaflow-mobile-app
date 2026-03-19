export type WorkspaceDomain = 'sailing' | 'nursing' | 'drawing' | 'fitness' | 'generic';

export function mapInterestSlugToDomain(slug: string | null | undefined): WorkspaceDomain {
  const normalized = String(slug || '').toLowerCase();
  if (!normalized) return 'generic';
  if (normalized.includes('sail') || normalized.includes('regatta')) return 'sailing';
  if (normalized.includes('nurs') || normalized.includes('clinical')) return 'nursing';
  if (normalized.includes('draw') || normalized.includes('art')) return 'drawing';
  if (normalized.includes('health') || normalized.includes('fit') || normalized.includes('golf')) return 'fitness';
  return 'generic';
}
