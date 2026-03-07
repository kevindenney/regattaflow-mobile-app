import { supabase } from '@/services/supabase';
import { isUuid } from '@/utils/uuid';

export type OrganizationJoinMode = 'invite_only' | 'request_to_join' | 'open_join';

export type DiscoverableOrganization = {
  id: string;
  name: string;
  slug: string | null;
  join_mode: OrganizationJoinMode;
};

type SearchOrganizationsInput = {
  query: string;
  limit?: number;
};

type RequestJoinInput = {
  orgId: string;
  mode: OrganizationJoinMode;
};

export type RequestJoinResult = {
  status: 'active' | 'pending' | 'blocked' | 'existing';
  membershipStatus: 'active' | 'pending' | 'rejected' | null;
  message: string;
};

const DEFAULT_LIMIT = 12;

function normalizeJoinMode(value: unknown): OrganizationJoinMode {
  if (value === 'open_join' || value === 'request_to_join' || value === 'invite_only') {
    return value;
  }
  return 'invite_only';
}

function normalizeMembershipStatus(value: unknown): 'active' | 'pending' | 'rejected' | null {
  if (value === 'active' || value === 'pending' || value === 'rejected') {
    return value;
  }
  return null;
}

function escapeLike(value: string): string {
  return value.replace(/[%_]/g, '');
}

class OrganizationDiscoveryService {
  async searchOrganizations(input: SearchOrganizationsInput): Promise<DiscoverableOrganization[]> {
    const limit = Math.max(1, Math.min(input.limit || DEFAULT_LIMIT, 50));
    const queryText = String(input.query || '').trim();

    let request = supabase
      .from('organizations')
      .select('id,name,slug,join_mode')
      .eq('is_active', true)
      .order('name', {ascending: true})
      .limit(limit);

    if (queryText.length > 0) {
      const q = escapeLike(queryText);
      request = request.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    const { data, error } = await request;
    if (error) throw error;

    return (data || [])
      .filter((row: any) => isUuid(row?.id))
      .map((row: any) => ({
        id: row.id,
        name: String(row.name || ''),
        slug: row.slug || null,
        join_mode: normalizeJoinMode(row.join_mode),
      }))
      .filter((row) => row.name.length > 0);
  }

  async requestJoin(input: RequestJoinInput): Promise<RequestJoinResult> {
    if (!isUuid(input.orgId)) {
      return {
        status: 'blocked',
        membershipStatus: null,
        message: 'Invalid organization id.',
      };
    }

    if (input.mode === 'invite_only') {
      return {
        status: 'blocked',
        membershipStatus: null,
        message: 'Invite required.',
      };
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const userId = authData?.user?.id || null;
    if (!userId || !isUuid(userId)) {
      return {
        status: 'blocked',
        membershipStatus: null,
        message: 'Sign in required.',
      };
    }

    const { data: existingRows, error: existingError } = await supabase
      .from('organization_memberships')
      .select('status,membership_status')
      .eq('organization_id', input.orgId)
      .eq('user_id', userId)
      .order('created_at', {ascending: false})
      .limit(1);

    if (existingError) throw existingError;

    const existing = Array.isArray(existingRows) ? existingRows[0] : null;
    const existingStatus = String(existing?.status || '').toLowerCase();
    const existingMembershipStatus = normalizeMembershipStatus(existing?.membership_status);

    if (existing) {
      if (existingStatus === 'active' || existingMembershipStatus === 'active') {
        return {
          status: 'existing',
          membershipStatus: 'active',
          message: 'Already a member.',
        };
      }
      if (existingStatus === 'pending' || existingMembershipStatus === 'pending' || existingStatus === 'invited') {
        return {
          status: 'existing',
          membershipStatus: 'pending',
          message: 'Request already pending.',
        };
      }
      if (existingMembershipStatus === 'rejected' || existingStatus === 'rejected') {
        return {
          status: 'existing',
          membershipStatus: 'rejected',
          message: 'Request already reviewed.',
        };
      }
    }

    const nextStatus = input.mode === 'open_join' ? 'active' : 'pending';
    const nextMembershipStatus = input.mode === 'open_join' ? 'active' : 'pending';

    const { error: insertError } = await supabase
      .from('organization_memberships')
      .insert({
        organization_id: input.orgId,
        user_id: userId,
        role: 'member',
        status: nextStatus,
        membership_status: nextMembershipStatus,
        is_verified: nextStatus === 'active',
        verification_source: input.mode === 'open_join' ? 'open_join' : 'request_to_join',
        joined_at: nextStatus === 'active' ? new Date().toISOString() : null,
      });

    if (insertError) throw insertError;

    return {
      status: nextStatus,
      membershipStatus: nextMembershipStatus,
      message: nextStatus === 'active' ? 'Joined organization.' : 'Request sent.',
    };
  }
}

export const organizationDiscoveryService = new OrganizationDiscoveryService();
