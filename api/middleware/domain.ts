export type WorkspaceDomain = 'sailing' | 'nursing' | 'drawing' | 'fitness' | 'generic';

export type DomainResolutionInput = {
  organizationType?: string | null;
  activeInterestId?: string | null;
  activeInterestSlug?: string | null;
};

function inferDomainFromInterest(value: string | null | undefined): WorkspaceDomain {
  const normalized = String(value || '').toLowerCase().trim();
  if (!normalized) return 'generic';
  if (normalized.includes('sail') || normalized.includes('regatta')) return 'sailing';
  if (normalized.includes('nurs') || normalized.includes('clinical')) return 'nursing';
  if (normalized.includes('draw') || normalized.includes('art')) return 'drawing';
  if (normalized.includes('fit') || normalized.includes('golf') || normalized.includes('coach')) return 'fitness';
  return 'generic';
}

export function resolveWorkspaceDomainForAuth(input: DomainResolutionInput): WorkspaceDomain {
  const orgType = String(input.organizationType || '').toLowerCase().trim();

  // Security-sensitive gating always trusts persisted organization_type first.
  if (orgType === 'club') return 'sailing';
  if (orgType === 'institution') return 'nursing';

  const fromSlug = inferDomainFromInterest(input.activeInterestSlug);
  if (fromSlug !== 'generic') return fromSlug;

  const fromId = inferDomainFromInterest(input.activeInterestId);
  if (fromId !== 'generic') return fromId;

  return 'generic';
}

export function resolveWorkspaceDomainForPresentation(input: DomainResolutionInput): WorkspaceDomain {
  const fromSlug = inferDomainFromInterest(input.activeInterestSlug);
  if (fromSlug !== 'generic') return fromSlug;

  const fromId = inferDomainFromInterest(input.activeInterestId);
  if (fromId !== 'generic') return fromId;

  return resolveWorkspaceDomainForAuth(input);
}
