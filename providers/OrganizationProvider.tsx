import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';

export type OrganizationType =
  | 'club'
  | 'institution'
  | 'association'
  | 'business'
  | 'community'
  | 'other';

export type WorkspaceDomain = 'sailing' | 'nursing' | 'drawing' | 'fitness' | 'generic';
type ResolvedActiveInterest = {
  id: string | null;
  slug: string | null;
};

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string | null;
  organization_type: OrganizationType;
  verification_mode: string | null;
  allowed_email_domains: string[] | null;
  metadata: Record<string, unknown> | null;
  is_active: boolean;
};

export type OrganizationMembershipRecord = {
  id: string;
  organization_id: string;
  role: string;
  status: string;
  is_verified: boolean;
  verification_source: string | null;
  joined_at: string | null;
  organization: OrganizationRecord | null;
};

type RawOrganizationMembershipRecord = Omit<OrganizationMembershipRecord, 'organization'> & {
  organization: OrganizationRecord | OrganizationRecord[] | null;
};

type OrganizationVisibilityDefault = 'public' | 'org_members';
type MembershipLoadDebug = {
  startedAt: string;
  finishedAt: string | null;
  hasSession: boolean;
  userId: string | null;
  phase: 'start' | 'success' | 'error' | 'timeout';
  table: 'organization_memberships';
  errorMessage: string | null;
  errorCode: string | null;
  errorDetails: string | null;
  errorHint: string | null;
};
type MembershipLoadErrorPayload = {
  userId: string | null;
  table: 'organization_memberships';
  message: string;
  code: string | null;
  details: string | null;
  hint: string | null;
  status: number | null;
  timedOut: boolean;
  hasSession: boolean;
};

type OrganizationContextValue = {
  loading: boolean;
  ready: boolean;
  membershipLoadAttempt: number;
  membershipLoadError: string | null;
  membershipLoadDebug: MembershipLoadDebug | null;
  membershipLoadErrorPayload: MembershipLoadErrorPayload | null;
  memberships: OrganizationMembershipRecord[];
  activeOrganizationId: string | null;
  activeMembership: OrganizationMembershipRecord | null;
  activeOrganization: OrganizationRecord | null;
  activeInterestId: string | null;
  activeInterestSlug: string | null;
  activeDomain: WorkspaceDomain;
  isSailingDomain: boolean;
  isNursingDomain: boolean;
  setActiveOrganizationId: (organizationId: string | null) => Promise<void>;
  refreshMemberships: () => Promise<void>;
  canManageActiveOrganization: boolean;
  defaultContentVisibility: OrganizationVisibilityDefault;
  updateDefaultContentVisibility: (visibility: OrganizationVisibilityDefault) => Promise<void>;
};

const ACTIVE_STATUSES = new Set(['active', 'verified']);
const MANAGER_ROLES = new Set(['owner', 'admin', 'manager', 'faculty', 'instructor']);
const STORAGE_KEY = 'rf_active_organization_id';

const Ctx = createContext<OrganizationContextValue>({
  loading: false,
  ready: false,
  membershipLoadAttempt: 0,
  membershipLoadError: null,
  membershipLoadDebug: null,
  membershipLoadErrorPayload: null,
  memberships: [],
  activeOrganizationId: null,
  activeMembership: null,
  activeOrganization: null,
  activeInterestId: null,
  activeInterestSlug: null,
  activeDomain: 'generic',
  isSailingDomain: false,
  isNursingDomain: false,
  setActiveOrganizationId: async () => {},
  refreshMemberships: async () => {},
  canManageActiveOrganization: false,
  defaultContentVisibility: 'public',
  updateDefaultContentVisibility: async () => {},
});

const getStoredActiveOrganizationId = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.localStorage.getItem(STORAGE_KEY);
    }
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeActiveOrganizationId = async (organizationId: string | null): Promise<void> => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (organizationId) {
        window.localStorage.setItem(STORAGE_KEY, organizationId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }
    if (organizationId) {
      await AsyncStorage.setItem(STORAGE_KEY, organizationId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // no-op
  }
};

const isOrgSchemaMissingError = (error: any): boolean => {
  if (!error) return false;
  const code = String(error?.code ?? '');
  const message = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`.toLowerCase();
  return (
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('organization_memberships') ||
    message.includes('organizations')
  );
};

function normalizeMembershipRow(row: RawOrganizationMembershipRecord): OrganizationMembershipRecord {
  const organization = Array.isArray(row.organization) ? (row.organization[0] ?? null) : (row.organization ?? null);
  return {
    ...row,
    organization,
  };
}

function dedupeMemberships(rows: OrganizationMembershipRecord[]): OrganizationMembershipRecord[] {
  const byOrgId = new Map<string, OrganizationMembershipRecord>();
  for (const row of rows) {
    if (!row.organization_id) continue;
    if (!byOrgId.has(row.organization_id)) {
      byOrgId.set(row.organization_id, row);
    }
  }

  const seenNameType = new Set<string>();
  const deduped: OrganizationMembershipRecord[] = [];
  for (const row of byOrgId.values()) {
    const orgName = row.organization?.name?.trim().toLowerCase() || '';
    const orgType = row.organization?.organization_type || '';
    const orgSlug = row.organization?.slug?.trim().toLowerCase() || '';
    const nameTypeKey = orgSlug || `${orgType}|${orgName}`;

    if (nameTypeKey && seenNameType.has(nameTypeKey)) {
      continue;
    }
    if (nameTypeKey) {
      seenNameType.add(nameTypeKey);
    }
    deduped.push(row);
  }

  return deduped;
}

function resolveWorkspaceDomain(org: OrganizationRecord | null): WorkspaceDomain {
  if (!org) return 'generic';

  const metadata = (org.metadata as any) || {};
  const domainFromMetadata = String(metadata?.domain || '').toLowerCase().trim();
  if (domainFromMetadata.includes('sail')) return 'sailing';
  if (domainFromMetadata.includes('nurs')) return 'nursing';
  if (domainFromMetadata.includes('draw') || domainFromMetadata.includes('art')) return 'drawing';
  if (domainFromMetadata.includes('fit') || domainFromMetadata.includes('coach')) return 'fitness';

  const interestSlug = String(
    metadata?.active_interest_slug ||
      metadata?.interest_slug ||
      '',
  )
    .toLowerCase()
    .trim();
  if (interestSlug.includes('sail') || interestSlug.includes('regatta')) return 'sailing';
  if (interestSlug.includes('nurs') || interestSlug.includes('clinical')) return 'nursing';
  if (interestSlug.includes('draw') || interestSlug.includes('art')) return 'drawing';
  if (interestSlug.includes('fit') || interestSlug.includes('golf')) return 'fitness';

  if (org.organization_type === 'institution') return 'nursing';
  if (org.organization_type === 'club') return 'sailing';
  return 'generic';
}

function normalizeInterestSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const next = value.trim().toLowerCase();
  return next.length > 0 ? next : null;
}

function normalizeInterestId(value: unknown): string | null {
  if (typeof value === 'string') {
    const next = value.trim();
    return next.length > 0 ? next : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function resolveActiveInterest(metadata: Record<string, unknown>): ResolvedActiveInterest {
  const nested = (metadata.active_interest as Record<string, unknown> | undefined) || {};
  const id =
    normalizeInterestId(metadata.active_interest_id) ||
    normalizeInterestId(metadata.interest_id) ||
    normalizeInterestId(nested.id) ||
    null;
  const slug =
    normalizeInterestSlug(metadata.active_interest_slug) ||
    normalizeInterestSlug(metadata.interest_slug) ||
    normalizeInterestSlug(nested.slug) ||
    null;

  return { id, slug };
}

function defaultInterestSlugForDomain(domain: WorkspaceDomain): string | null {
  if (domain === 'sailing') return 'sail-racing';
  if (domain === 'nursing') return 'nursing';
  if (domain === 'drawing') return 'drawing';
  if (domain === 'fitness') return 'fitness';
  return null;
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, signedIn } = useAuth();
  const signedInRef = React.useRef(signedIn);
  const userIdRef = React.useRef<string | null>(user?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [membershipLoadAttempt, setMembershipLoadAttempt] = useState(0);
  const [membershipLoadError, setMembershipLoadError] = useState<string | null>(null);
  const [membershipLoadDebug, setMembershipLoadDebug] = useState<MembershipLoadDebug | null>(null);
  const [membershipLoadErrorPayload, setMembershipLoadErrorPayload] = useState<MembershipLoadErrorPayload | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMembershipRecord[]>([]);
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null);

  useEffect(() => {
    signedInRef.current = signedIn;
    userIdRef.current = user?.id ?? null;
  }, [signedIn, user?.id]);

  const refreshMemberships = useCallback(async () => {
    const currentSignedIn = signedInRef.current;
    const currentUserId = userIdRef.current;
    const startedAt = new Date().toISOString();
    setMembershipLoadAttempt((prev) => prev + 1);
    setMembershipLoadDebug({
      startedAt,
      finishedAt: null,
      hasSession: false,
      userId: currentUserId,
      phase: 'start',
      table: 'organization_memberships',
      errorMessage: null,
      errorCode: null,
      errorDetails: null,
      errorHint: null,
    });
    let hasSession = false;
    try {
      const sessionTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('SESSION_TIMEOUT'));
        }, 10000);
      });
      const { data: sessionData } = await Promise.race([supabase.auth.getSession(), sessionTimeout]);
      hasSession = Boolean(sessionData?.session);
      setMembershipLoadDebug({
        startedAt,
        finishedAt: null,
        hasSession: true,
        userId: currentUserId,
        phase: 'start',
        table: 'organization_memberships',
        errorMessage: null,
        errorCode: null,
        errorDetails: null,
        errorHint: null,
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : String(error ?? '');
      const timedOut = rawMessage === 'SESSION_TIMEOUT';
      const payload: MembershipLoadErrorPayload = {
        userId: currentUserId,
        table: 'organization_memberships',
        message: rawMessage || 'Unknown session load error',
        code: typeof (error as any)?.code === 'string' ? (error as any).code : null,
        details: typeof (error as any)?.details === 'string' ? (error as any).details : null,
        hint: typeof (error as any)?.hint === 'string' ? (error as any).hint : null,
        status: typeof (error as any)?.status === 'number'
          ? (error as any).status
          : typeof (error as any)?.statusCode === 'number'
            ? (error as any).statusCode
            : null,
        timedOut,
        hasSession: false,
      };
      console.error('[OrganizationProvider] Session load failed', payload);
      setMembershipLoadError('Could not load organizations. Retry.');
      setMembershipLoadErrorPayload(payload);
      setMembershipLoadDebug({
        startedAt,
        finishedAt: new Date().toISOString(),
        hasSession: false,
        userId: currentUserId,
        phase: timedOut ? 'timeout' : 'error',
        table: 'organization_memberships',
        errorMessage: timedOut ? 'SESSION_TIMEOUT' : (rawMessage || 'Unknown session load error'),
        errorCode: payload.code,
        errorDetails: payload.details,
        errorHint: payload.hint,
      });
      setMemberships([]);
      setActiveOrganizationIdState(null);
      setLoading(false);
      setReady(true);
      return;
    }
    if (!currentSignedIn || !currentUserId || !hasSession) {
      setMembershipLoadError(null);
      setMembershipLoadErrorPayload(null);
      setMembershipLoadDebug({
        startedAt,
        finishedAt: new Date().toISOString(),
        hasSession,
        userId: currentUserId,
        phase: 'error',
        table: 'organization_memberships',
        errorMessage: 'No active session',
        errorCode: null,
        errorDetails: null,
        errorHint: null,
      });
      setMemberships([]);
      setActiveOrganizationIdState(null);
      setLoading(false);
      setReady(true);
      return;
    }

    setLoading(true);
    setMembershipLoadError(null);
    setMembershipLoadErrorPayload(null);
    try {
      const membershipsQuery = supabase
        .from('organization_memberships')
        .select(
          'id, organization_id, role, status, is_verified, verification_source, joined_at, organization:organizations(id, name, slug, organization_type, verification_mode, allowed_email_domains, metadata, is_active)',
        )
        .eq('user_id', currentUserId)
        .in('status', ['active', 'verified', 'pending', 'invited'])
        .order('created_at', { ascending: false });
      const membershipsTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('ORG_MEMBERSHIP_TIMEOUT'));
        }, 10000);
      });
      const { data, error } = await Promise.race([membershipsQuery, membershipsTimeout]);

      if (error) {
        if (isOrgSchemaMissingError(error)) {
          setMembershipLoadError(null);
          setMembershipLoadErrorPayload(null);
          setMemberships([]);
          setActiveOrganizationIdState(null);
          setReady(true);
          return;
        }
        throw error;
      }

      const normalized = ((data || []) as RawOrganizationMembershipRecord[]).map(normalizeMembershipRow);
      const rows = dedupeMemberships(normalized);
      setMemberships(rows);

      const storedId = await getStoredActiveOrganizationId();
      const activeRows = rows.filter((row) => ACTIVE_STATUSES.has((row.status as any) ?? null));
      const activeInstitutionRows = activeRows.filter(
        (row) => row.organization?.organization_type === 'institution'
      );
      const activeInstitutionManagerRows = activeInstitutionRows.filter((row) =>
        MANAGER_ROLES.has((row.role as any) ?? null)
      );

      const preferredMembership =
        (storedId ? activeRows.find((row) => row.organization_id === storedId) : null) ||
        activeInstitutionManagerRows[0] ||
        activeInstitutionRows[0] ||
        activeRows.find((row) => MANAGER_ROLES.has((row.role as any) ?? null)) ||
        activeRows[0] ||
        rows[0] ||
        null;

      const nextId = preferredMembership?.organization_id ?? null;
      setActiveOrganizationIdState(nextId);
      await storeActiveOrganizationId(nextId);
      setMembershipLoadDebug({
        startedAt,
        finishedAt: new Date().toISOString(),
        hasSession: true,
        userId: currentUserId,
        phase: 'success',
        table: 'organization_memberships',
        errorMessage: null,
        errorCode: null,
        errorDetails: null,
        errorHint: null,
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : String(error ?? '');
      const timedOut = rawMessage === 'ORG_MEMBERSHIP_TIMEOUT';
      const { data: latestSessionData } = await supabase.auth.getSession();
      const latestHasSession = Boolean(latestSessionData?.session);
      const payload: MembershipLoadErrorPayload = {
        userId: currentUserId,
        table: 'organization_memberships',
        message: rawMessage || 'Unknown membership load error',
        code: typeof (error as any)?.code === 'string' ? (error as any).code : null,
        details: typeof (error as any)?.details === 'string' ? (error as any).details : null,
        hint: typeof (error as any)?.hint === 'string' ? (error as any).hint : null,
        status: typeof (error as any)?.status === 'number'
          ? (error as any).status
          : typeof (error as any)?.statusCode === 'number'
            ? (error as any).statusCode
            : null,
        timedOut,
        hasSession: latestHasSession,
      };
      console.error('[OrganizationProvider] Membership load failed', payload);
      setMembershipLoadDebug({
        startedAt,
        finishedAt: new Date().toISOString(),
        hasSession: latestHasSession,
        userId: currentUserId,
        phase: timedOut ? 'timeout' : 'error',
        table: 'organization_memberships',
        errorMessage: rawMessage || 'Unknown membership load error',
        errorCode: payload.code,
        errorDetails: payload.details,
        errorHint: payload.hint,
      });
      if (rawMessage === 'ORG_MEMBERSHIP_TIMEOUT') {
        setMembershipLoadError('Could not load organizations. Retry.');
      } else {
        const errorCode = typeof (error as any)?.code === 'string' ? (error as any).code : null;
        setMembershipLoadError(`Could not load organizations. ${rawMessage || 'Retry.'}${errorCode ? ` (${errorCode})` : ''}`);
      }
      setMembershipLoadErrorPayload(payload);
      setMemberships([]);
      setActiveOrganizationIdState(null);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshMemberships();
  }, [refreshMemberships, signedIn, user?.id]);

  const setActiveOrganizationId = useCallback(async (organizationId: string | null) => {
    setActiveOrganizationIdState(organizationId);
    await storeActiveOrganizationId(organizationId);
  }, []);

  const activeMembership = useMemo(() => {
    if (!activeOrganizationId) return null;
    return memberships.find((row) => row.organization_id === activeOrganizationId) ?? null;
  }, [activeOrganizationId, memberships]);

  const activeOrganization = activeMembership?.organization ?? null;
  const activeOrgMetadata = useMemo<Record<string, unknown>>(
    () => ((activeOrganization?.metadata as Record<string, unknown> | null) || {}),
    [activeOrganization?.metadata]
  );
  const resolvedActiveInterest = useMemo<ResolvedActiveInterest>(
    () => resolveActiveInterest(activeOrgMetadata),
    [activeOrgMetadata]
  );
  const activeInterestId = resolvedActiveInterest.id;
  const activeDomain = useMemo<WorkspaceDomain>(
    () => resolveWorkspaceDomain(activeOrganization),
    [activeOrganization]
  );
  const activeInterestSlug = useMemo<string | null>(
    () => resolvedActiveInterest.slug || defaultInterestSlugForDomain(activeDomain),
    [activeDomain, resolvedActiveInterest.slug]
  );
  const isSailingDomain = activeDomain === 'sailing';
  const isNursingDomain = activeDomain === 'nursing';

  const canManageActiveOrganization = useMemo(() => {
    if (!activeMembership) return false;
    return ACTIVE_STATUSES.has((activeMembership.status as any) ?? null)
      && MANAGER_ROLES.has((activeMembership.role as any) ?? null);
  }, [activeMembership]);

  const defaultContentVisibility: OrganizationVisibilityDefault = useMemo(() => {
    const raw = activeOrganization?.metadata?.default_content_visibility;
    return raw === 'org_members' ? 'org_members' : 'public';
  }, [activeOrganization?.metadata]);

  const updateDefaultContentVisibility = useCallback(
    async (visibility: OrganizationVisibilityDefault) => {
      if (!activeOrganization?.id || !canManageActiveOrganization) return;
      const metadata = {
        ...(activeOrganization.metadata || {}),
        default_content_visibility: visibility,
      };

      const { error } = await supabase
        .from('organizations')
        .update({ metadata })
        .eq('id', activeOrganization.id);

      if (error) throw error;

      await refreshMemberships();
    },
    [activeOrganization?.id, activeOrganization?.metadata, canManageActiveOrganization, refreshMemberships],
  );

  const value = useMemo<OrganizationContextValue>(
    () => ({
      loading,
      ready,
      membershipLoadAttempt,
      membershipLoadError,
      membershipLoadDebug,
      membershipLoadErrorPayload,
      memberships,
      activeOrganizationId,
      activeMembership,
      activeOrganization,
      activeInterestId,
      activeInterestSlug,
      activeDomain,
      isSailingDomain,
      isNursingDomain,
      setActiveOrganizationId,
      refreshMemberships,
      canManageActiveOrganization,
      defaultContentVisibility,
      updateDefaultContentVisibility,
    }),
    [
      loading,
      ready,
      membershipLoadAttempt,
      membershipLoadError,
      membershipLoadDebug,
      membershipLoadErrorPayload,
      memberships,
      activeOrganizationId,
      activeMembership,
      activeOrganization,
      activeInterestId,
      activeInterestSlug,
      activeDomain,
      isSailingDomain,
      isNursingDomain,
      setActiveOrganizationId,
      refreshMemberships,
      canManageActiveOrganization,
      defaultContentVisibility,
      updateDefaultContentVisibility,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrganization() {
  return useContext(Ctx);
}
