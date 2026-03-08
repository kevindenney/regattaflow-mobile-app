function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export type OrgInterestSlug = 'nursing' | 'sail-racing' | 'general';

export function normalizeOrgInterestSlug(value: unknown): OrgInterestSlug {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'nursing') return 'nursing';
  if (normalized === 'sail-racing' || normalized === 'sailing' || normalized === 'sail_racing') return 'sail-racing';
  if (!normalized) return 'general';
  return normalized as OrgInterestSlug;
}

export function resolveOrgInterestSlugFromOrganization(organization: any): string | null {
  if (!organization || typeof organization !== 'object') return null;
  const metadata = (organization as any).metadata;
  const fromColumn = String((organization as any).interest_slug || '').trim();
  const fromMetaSnake = String(metadata?.interest_slug || '').trim();
  const fromMetaCamel = String(metadata?.interestSlug || '').trim();
  const raw = fromColumn || fromMetaSnake || fromMetaCamel;
  if (!raw) return null;
  const normalized = normalizeOrgInterestSlug(raw);
  return normalized === 'general' ? null : normalized;
}

export function orgInterestLabel(slug: string | null): string {
  const normalized = normalizeOrgInterestSlug(slug || '');
  if (normalized === 'general') return 'General';
  const labels: Record<string, string> = {
    nursing: 'Nursing',
    'sail-racing': 'Sail Racing',
    'dragon-class': 'Dragon Class',
    drawing: 'Drawing',
    fitness: 'Fitness',
    golf: 'Golf',
  };
  return labels[normalized] || toTitleCase(normalized);
}

export function orgInterestPillText(slug: string | null): string {
  return `Context: ${orgInterestLabel(slug)}`;
}
