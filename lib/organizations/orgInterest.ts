function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeOrgInterestSlug(value: unknown): string | null {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized ? normalized : null;
}

export function orgInterestLabel(slug: string | null): string {
  const normalized = normalizeOrgInterestSlug(slug);
  if (!normalized) return 'General';
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
