import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClubMember,
  MemberFilters,
  clubMemberService,
} from '@/services/ClubMemberService';
import { ClubRole } from '@/types/club';

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
  race_officer: [],
  scorer: [],
  communications: [],
  treasurer: [],
  membership_manager: [],
  sailing_manager: [],
  race_committee: [],
  instructor: [],
  secretary: [],
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

  const fetchMembers = useCallback(async () => {
    if (!clubId || !enabled) {
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await clubMemberService.getClubMembers(clubId, filters);
      setMembers(results);
    } catch (err) {
      setError(err as Error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [clubId, enabled, filters]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const groupedByRole = useMemo(() => {
    const grouped = createEmptyGrouped();
    members.forEach((member) => {
      grouped[member.role].push(member);
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
