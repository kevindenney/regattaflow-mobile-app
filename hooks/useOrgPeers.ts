/**
 * useOrgPeers — Fetch members of an organization for "people you might know"
 *
 * Returns up to `limit` active members (excluding the current user) with
 * their profile info. Used in onboarding org-welcome and org pages.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';

export interface OrgPeer {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface UseOrgPeersOptions {
  limit?: number;
}

export function useOrgPeers(
  orgId: string | null | undefined,
  options: UseOrgPeersOptions = {},
) {
  const { user } = useAuth();
  const { limit = 10 } = options;

  return useQuery({
    queryKey: ['org-peers', orgId, user?.id],
    queryFn: async (): Promise<OrgPeer[]> => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('organization_members')
        .select('user_id, role, users!inner(id, full_name, avatar_url)')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .neq('user_id', user?.id ?? '')
        .limit(limit);

      if (error) {
        console.warn('[useOrgPeers] Failed to fetch peers:', error.message);
        return [];
      }

      return (data ?? []).map((row: any) => ({
        id: row.users.id,
        full_name: row.users.full_name,
        avatar_url: row.users.avatar_url,
        role: row.role,
      }));
    },
    enabled: !!orgId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
