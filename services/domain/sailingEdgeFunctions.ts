import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

const ACTIVE_ORG_STORAGE_KEY = 'rf_active_organization_id';
const DOMAIN_CACHE_TTL_MS = 60_000;

type WorkspaceDomain = 'sailing' | 'nursing' | 'drawing' | 'fitness' | 'generic';

type DomainCache = {
  orgId: string | null;
  domain: WorkspaceDomain;
  expiresAt: number;
};

let domainCache: DomainCache | null = null;

const inferDomainFromSlug = (value: string | null | undefined): WorkspaceDomain => {
  const normalized = String(value || '').toLowerCase().trim();
  if (!normalized) return 'generic';
  if (normalized.includes('sail') || normalized.includes('regatta')) return 'sailing';
  if (normalized.includes('nurs') || normalized.includes('clinical')) return 'nursing';
  if (normalized.includes('draw') || normalized.includes('art')) return 'drawing';
  if (normalized.includes('fit') || normalized.includes('golf') || normalized.includes('coach')) return 'fitness';
  return 'generic';
};

const resolveDomainFromOrganization = (organization: any): WorkspaceDomain => {
  if (!organization) return 'generic';
  const metadata = (organization.metadata as Record<string, unknown> | null) || {};

  const domainFromMetadata = inferDomainFromSlug(String((metadata as any).domain || ''));
  if (domainFromMetadata !== 'generic') return domainFromMetadata;

  const interestFromMetadata = inferDomainFromSlug(
    String(
      (metadata as any).active_interest_slug ||
      (metadata as any).interest_slug ||
      '',
    ),
  );
  if (interestFromMetadata !== 'generic') return interestFromMetadata;

  const orgType = String(organization.organization_type || '').toLowerCase().trim();
  if (orgType === 'club') return 'sailing';
  if (orgType === 'institution') return 'nursing';
  return 'generic';
};

const getStoredActiveOrganizationId = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
    }
    return await AsyncStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
  } catch {
    return null;
  }
};

const resolveDomainFromUserMetadata = async (): Promise<WorkspaceDomain> => {
  try {
    const { data } = await supabase.auth.getUser();
    const metadata = (data?.user?.user_metadata as Record<string, unknown> | undefined) || {};
    const activeDomain = inferDomainFromSlug(String(metadata.active_domain || ''));
    if (activeDomain !== 'generic') return activeDomain;
    const domain = inferDomainFromSlug(String(metadata.domain || ''));
    if (domain !== 'generic') return domain;
    const interestDomain = inferDomainFromSlug(String(metadata.active_interest_slug || ''));
    if (interestDomain !== 'generic') return interestDomain;
    return 'generic';
  } catch {
    return 'generic';
  }
};

async function resolveActiveWorkspaceDomain(): Promise<WorkspaceDomain> {
  const orgId = await getStoredActiveOrganizationId();
  const now = Date.now();
  if (domainCache && domainCache.orgId === orgId && domainCache.expiresAt > now) {
    return domainCache.domain;
  }

  if (orgId) {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('organization_type, metadata')
        .eq('id', orgId)
        .maybeSingle();
      const domain = resolveDomainFromOrganization(data);
      domainCache = { orgId, domain, expiresAt: now + DOMAIN_CACHE_TTL_MS };
      return domain;
    } catch {
      // fall through
    }
  }

  const domain = await resolveDomainFromUserMetadata();
  domainCache = { orgId, domain, expiresAt: now + DOMAIN_CACHE_TTL_MS };
  return domain;
}

export const isSailingWorkspaceDomain = async (): Promise<boolean> => {
  const domain = await resolveActiveWorkspaceDomain();
  return domain === 'sailing';
};

export const invokeSailingEdgeFunction = async <T = any>(
  functionName: string,
  options?: { body?: unknown; headers?: Record<string, string> },
): Promise<{ data: T | null; error: any }> => {
  const isSailing = await isSailingWorkspaceDomain();
  if (!isSailing) {
    return {
      data: null,
      error: {
        code: 'DOMAIN_GATED',
        message: `${functionName} is only available in sailing workspaces`,
      },
    };
  }

  return supabase.functions.invoke(functionName, options as any);
};
