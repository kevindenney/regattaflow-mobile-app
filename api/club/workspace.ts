import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../middleware/auth';

type WorkspaceResponse = {
  club: Record<string, any> | null;
  created: boolean;
  membership?: {
    role: string | null;
    source: 'owner' | 'staff' | 'member' | 'unknown';
  } | null;
};

const safeWrap = <T,>(value: T | null | undefined, fallback: T): T => {
  return value === null || value === undefined ? fallback : value;
};

const normalizeClubRecord = (club: any): Record<string, any> => {
  if (!club) {
    return {};
  }

  const organizationName =
    club.organization_name ??
    club.club_name ??
    club.name ??
    'Club Workspace';

  return {
    ...club,
    id: club.id,
    user_id: club.user_id ?? null,
    club_name: club.club_name ?? organizationName,
    organization_name: organizationName,
    website_url: club.website_url ?? club.website ?? null,
    verification_status: club.verification_status ?? null,
    verification_method: club.verification_method ?? null,
    onboarding_completed: safeWrap<boolean | null | undefined>(
      club.onboarding_completed,
      false
    ),
    city: club.city ?? null,
    country: club.country ?? null,
    timezone: club.timezone ?? club.default_timezone ?? null,
    contact_email:
      club.contact_email ??
      club.primary_email ??
      club.email ??
      null,
    created_at: club.created_at ?? null,
    updated_at: club.updated_at ?? null,
  };
};

const ensureStaffRecord = async (
  supabase: AuthenticatedRequest['supabase'],
  clubId: string,
  userId: string
) => {
  const { error } = await supabase
    .from('club_staff')
    .upsert(
      {
        club_id: clubId,
        user_id: userId,
        role: 'admin',
        active: true,
      },
      { onConflict: 'club_id,user_id' }
    );

  if (error && error.code === '42703') {
    // Column `active` might not exist in older schemas – retry without it
    await supabase
      .from('club_staff')
      .upsert(
        {
          club_id: clubId,
          user_id: userId,
          role: 'admin',
        },
        { onConflict: 'club_id,user_id' }
      );
  }
};

const ensureProfileRecord = async (
  supabase: AuthenticatedRequest['supabase'],
  clubId: string,
  userId: string,
  organizationName: string
) => {
  const { error } = await supabase
    .from('club_profiles')
    .upsert(
      {
        id: clubId,
        user_id: userId,
        club_name: organizationName,
        organization_name: organizationName,
        website_url: null,
        verification_status: 'pending',
        verification_method: 'manual',
      },
      { onConflict: 'id' }
    );

  if (error && error.code === '42703') {
    // Older schema without organization_name – retry with minimal payload
    await supabase
      .from('club_profiles')
      .upsert(
        {
          id: clubId,
          user_id: userId,
          club_name: organizationName,
          website_url: null,
          verification_status: 'pending',
          verification_method: 'manual',
        },
        { onConflict: 'id' }
      );
  }
};

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  const method = req.method ?? 'GET';

  if (method !== 'GET' && method !== 'POST') {
    res.setHeader('Allow', 'GET,POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ensure =
    method === 'POST' ||
    req.query.ensure === '1' ||
    req.query.ensure === 'true';

  const { supabase } = req;
  const userId = req.auth.userId;

  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, user_type')
    .eq('id', userId)
    .maybeSingle();

  if (userError) {
    console.error('[club/workspace] Failed to load user profile', userError);
    res.status(500).json({ error: 'Failed to load user profile' });
    return;
  }

  const preferClubCreation = userRecord?.user_type === 'club';

  const findExistingClub = async () => {
    // 🔍 DEBUG: Log lookup attempts
    console.log('[club/workspace] findExistingClub for userId:', userId);

    // Attempt 1: club_profiles where contact_email matches user email (owner lookup)
    // Note: club_profiles doesn't have user_id, so we check via club_staff
    
    // Attempt 2: staff membership (PRIMARY method - club_staff.club_id → club_profiles.id)
    const staff = await supabase
      .from('club_staff')
      .select('club_id, role, active')
      .eq('user_id', userId)
      .limit(10);

    console.log('[club/workspace] club_staff lookup result:', staff.data, staff.error);

    if (staff.data && staff.data.length > 0) {
      const activeStaff = staff.data.find((row: any) => row.active !== false && row.is_active !== false) ?? staff.data[0];
      console.log('[club/workspace] Found active staff record:', activeStaff);
      
      if (activeStaff?.club_id) {
        // club_staff.club_id references club_profiles.id (not clubs.id!)
        const club = await supabase
          .from('club_profiles')
          .select('*')
          .eq('id', activeStaff.club_id)
          .maybeSingle();

        console.log('[club/workspace] club_profiles lookup result:', club.data, club.error);

        if (club.data) {
          return {
            club: club.data,
            membership: {
              role: activeStaff.role ?? 'staff',
              source: 'staff' as const,
            },
          };
        }
      }
    }

    // Attempt 3: Try the clubs table as fallback (legacy lookup)
    const owned = await supabase
      .from('clubs')
      .select('*')
      .eq('email', userRecord?.email)
      .maybeSingle();

    console.log('[club/workspace] clubs table lookup result:', owned.data, owned.error);

    if (owned.data) {
      return { club: owned.data, membership: { role: 'admin', source: 'owner' as const } };
    }

    // Attempt 4: member roster
    const members = await supabase
      .from('club_members')
      .select('club_id, role')
      .eq('user_id', userId)
      .limit(10);

    if (members.data && members.data.length > 0) {
      const activeMember =
        members.data.find((row: any) => row.active !== false && row.is_active !== false) ??
        members.data[0];

      if (activeMember?.club_id) {
        const club = await supabase
          .from('club_profiles')
          .select('*')
          .eq('id', activeMember.club_id)
          .maybeSingle();

        if (club.data) {
          return {
            club: club.data,
            membership: {
              role: activeMember.role ?? 'member',
              source: 'member' as const,
            },
          };
        }
      }
    }

    console.log('[club/workspace] No club found for user');
    return { club: null, membership: null };
  };

  let created = false;
  const existing = await findExistingClub();
  let club = existing.club;
  let membership: WorkspaceResponse['membership'] = existing.membership;

  if (!club && ensure && preferClubCreation) {
    const fallbackName =
      userRecord?.full_name ||
      (userRecord?.email ? userRecord.email.split('@')[0] : null) ||
      'New Club';

    const now = new Date().toISOString();
    
    // Create in club_profiles table (matches the FK from club_staff)
    const insertPayload = {
      organization_name: fallbackName,
      club_type: 'yacht_club',
      contact_email: userRecord?.email,
      onboarding_completed: false,
      created_at: now,
      updated_at: now,
    };

    console.log('[club/workspace] Creating new club_profile:', insertPayload);

    const insertion = await supabase
      .from('club_profiles')
      .insert(insertPayload)
      .select('*')
      .maybeSingle();

    if (insertion.error) {
      if (insertion.error.code === '23505') {
        // Duplicate - try to find existing by email
        const retry = await supabase
          .from('club_profiles')
          .select('*')
          .eq('contact_email', userRecord?.email)
          .maybeSingle();

        club = retry.data ?? null;
      } else {
        console.error('[club/workspace] Failed to create club workspace', insertion.error);
        res.status(500).json({ error: 'Failed to create club workspace' });
        return;
      }
    } else {
      club = insertion.data ?? null;
      created = !!club;
      console.log('[club/workspace] Created new club_profile:', club);
    }

    if (club) {
      membership = {
        role: 'admin',
        source: 'owner',
      };
      try {
        await ensureStaffRecord(supabase, club.id, userId);
      } catch (relError) {
        console.warn('[club/workspace] Failed to ensure staff record', relError);
      }
    }
  }

  if (!club) {
    res.status(200).json({
      club: null,
      created: false,
      membership,
    });
    return;
  }

  const normalized = normalizeClubRecord(club);

  if (!membership) {
    membership = {
      role: normalized.user_id === userId ? 'admin' : null,
      source: normalized.user_id === userId ? 'owner' : 'unknown',
    };
  }

  const response: WorkspaceResponse = {
    club: normalized,
    created,
    membership,
  };

  res.status(200).json(response);
};

export default withAuth(handler);
