import { useMemo } from 'react';
import { useOrganization } from '@/providers/OrganizationProvider';
import { useInterest } from '@/providers/InterestProvider';
import { mapInterestSlugToDomain, type WorkspaceDomain } from '@/lib/domain/mapInterestSlugToDomain';

export type { WorkspaceDomain } from '@/lib/domain/mapInterestSlugToDomain';

export function useWorkspaceDomain() {
  const { activeOrganization, activeDomain: orgDomain, activeInterestId: orgInterestId, activeInterestSlug: orgInterestSlug } = useOrganization();
  const { currentInterest } = useInterest();

  const resolvedInterestId = useMemo<string | null>(() => {
    if (activeOrganization?.id) return orgInterestId;
    return currentInterest?.id || null;
  }, [activeOrganization?.id, currentInterest?.id, orgInterestId]);

  const resolvedInterestSlug = useMemo<string | null>(() => {
    if (activeOrganization?.id) return orgInterestSlug;
    return currentInterest?.slug || null;
  }, [activeOrganization?.id, currentInterest?.slug, orgInterestSlug]);

  const domain = useMemo<WorkspaceDomain>(() => {
    if (activeOrganization?.id) {
      return orgDomain;
    }
    return mapInterestSlugToDomain(resolvedInterestSlug);
  }, [activeOrganization?.id, orgDomain, resolvedInterestSlug]);

  const presentationDomain = useMemo<WorkspaceDomain>(() => {
    const fromInterest = mapInterestSlugToDomain(resolvedInterestSlug);
    return fromInterest !== 'generic' ? fromInterest : domain;
  }, [domain, resolvedInterestSlug]);

  return {
    activeInterestId: resolvedInterestId,
    activeInterestSlug: resolvedInterestSlug,
    activeDomain: domain,
    presentationDomain,
    isSailingDomain: domain === 'sailing',
    isNursingDomain: domain === 'nursing',
    isDrawingDomain: domain === 'drawing',
    isFitnessDomain: domain === 'fitness',
    isSailingPresentationDomain: presentationDomain === 'sailing',
    isNursingPresentationDomain: presentationDomain === 'nursing',
    isDrawingPresentationDomain: presentationDomain === 'drawing',
    isFitnessPresentationDomain: presentationDomain === 'fitness',
  };
}
