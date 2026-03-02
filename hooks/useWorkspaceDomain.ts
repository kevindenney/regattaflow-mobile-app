import { useMemo } from 'react';
import { useOrganization } from '@/providers/OrganizationProvider';
import { useInterest } from '@/providers/InterestProvider';

export type WorkspaceDomain = 'sailing' | 'nursing' | 'drawing' | 'fitness' | 'generic';

function mapInterestSlugToDomain(slug: string | null | undefined): WorkspaceDomain {
  const normalized = String(slug || '').toLowerCase();
  if (!normalized) return 'generic';
  if (normalized.includes('sail') || normalized.includes('regatta')) return 'sailing';
  if (normalized.includes('nurs') || normalized.includes('clinical')) return 'nursing';
  if (normalized.includes('draw') || normalized.includes('art')) return 'drawing';
  if (normalized.includes('fit') || normalized.includes('golf')) return 'fitness';
  return 'generic';
}

export function useWorkspaceDomain() {
  const { activeOrganization, activeDomain: orgDomain } = useOrganization();
  const { currentInterest } = useInterest();

  const domain = useMemo<WorkspaceDomain>(() => {
    if (activeOrganization?.id) {
      return orgDomain;
    }
    return mapInterestSlugToDomain(currentInterest?.slug);
  }, [activeOrganization?.id, orgDomain, currentInterest?.slug]);

  return {
    activeDomain: domain,
    isSailingDomain: domain === 'sailing',
    isNursingDomain: domain === 'nursing',
    isDrawingDomain: domain === 'drawing',
    isFitnessDomain: domain === 'fitness',
  };
}

