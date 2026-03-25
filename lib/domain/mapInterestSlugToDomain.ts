export type WorkspaceDomain = 'sailing' | 'nursing' | 'drawing' | 'fitness' | 'generic';

/** Map domain slugs (from the interests hierarchy) to WorkspaceDomain values. */
const DOMAIN_SLUG_MAP: Record<string, WorkspaceDomain> = {
  healthcare: 'nursing',
  'creative-arts': 'drawing',
  'sports-outdoors': 'sailing',
  'education-learning': 'generic',
  'agriculture-environment': 'generic',
};

export function mapInterestSlugToDomain(
  slug: string | null | undefined,
  domainSlug?: string | null,
): WorkspaceDomain {
  // Fast path: if we know the parent domain slug, use the direct map
  if (domainSlug) {
    const mapped = DOMAIN_SLUG_MAP[domainSlug];
    if (mapped) return mapped;
  }

  // Fallback: string-matching heuristic for backward compat
  const normalized = String(slug || '').toLowerCase();
  if (!normalized) return 'generic';
  if (normalized.includes('sail') || normalized.includes('regatta')) return 'sailing';
  if (normalized.includes('global-health') || normalized.includes('mayan')) return 'nursing';
  if (normalized.includes('nurs') || normalized.includes('clinical')) return 'nursing';
  if (normalized.includes('draw') || normalized.includes('art')) return 'drawing';
  if (normalized.includes('health') || normalized.includes('fit') || normalized.includes('golf')) return 'fitness';
  if (normalized.includes('paint') || normalized.includes('print')) return 'drawing';
  // lifelong-learning and regenerative-agriculture map to generic
  return 'generic';
}
