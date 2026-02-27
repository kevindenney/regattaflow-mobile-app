import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClubMember,
  MemberFilters,
  clubMemberService,
} from '@/services/ClubMemberService';
import { ClubRole, normalizeClubRole } from '@/types/club';

interface UseClubMembersOptions {
  enabled?: boolean;
  filters?: MemberFilters;
}

interface UseClubMembersResult {
  members: ClubMember[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  groupedByRole: Record<ClubRole, ClubMember[]>;
}

const createEmptyGrouped = (): Record<ClubRole, ClubMember[]> => ({
  admin: [],
  race_admin: [],
  volunteer_results: [],
  member: [],
  guest: [],
});

export function useClubMembers(
  clubId?: string,
  options: UseClubMembersOptions = {}
): UseClubMembersResult {
  const { enabled = true, filters } = options;

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(enabled && clubId));
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  const activeContextRef = useRef(`${clubId ?? ''}|${enabled ? '1' : '0'}`);

  useEffect(() => {
    activeContextRef.current = `${clubId ?? ''}|${enabled ? '1' : '0'}`;
  }, [clubId, enabled]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  const fetchMembers = useCallback(async () => {
    const runId = ++fetchRunIdRef.current;
    const contextKey = `${clubId ?? ''}|${enabled ? '1' : '0'}`;
    const canCommit = () =>
      isMountedRef.current &&
      runId === fetchRunIdRef.current &&
      activeContextRef.current === contextKey;

    if (!clubId || !enabled) {
      if (!canCommit()) return;
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await clubMemberService.getClubMembers(clubId, filters);
      if (!canCommit()) return;
      setMembers(results);
    } catch (err) {
      if (!canCommit()) return;
      setError(err as Error);
      setMembers([]);
    } finally {
      if (!canCommit()) return;
      setLoading(false);
    }
  }, [clubId, enabled, filters]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const groupedByRole = useMemo(() => {
    const grouped = createEmptyGrouped();
    members.forEach((member) => {
      const normalizedRole = normalizeClubRole(member.role);
      grouped[normalizedRole].push(member);
    });
    return grouped;
  }, [members]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
    groupedByRole,
  };
}
