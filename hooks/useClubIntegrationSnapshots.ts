import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { ClubRole, normalizeClubRole } from '@/types/club';
import type { PostgrestError } from '@supabase/supabase-js';
import { isMissingRelationError } from '@/lib/utils/supabaseSchemaFallback';
import { createLogger } from '@/lib/utils/logger';

interface ClubDetails {
  id: string;
  name: string;
  location?: string;
  country?: string;
  website?: string;
  contact_email?: string;
  description?: string;
  facilities?: string[] | null;
  metadata?: Record<string, any> | null;
}

const logger = createLogger('useClubIntegrationSnapshots');

export interface ClubMembershipRecord {
  id: string;
  club_id?: string;
  membership_type?: string;
  status?: string;
  role?: ClubRole | string | null;
  member_number?: string;
  joined_date?: string;
  joined_at?: string;
  expiry_date?: string;
  payment_status?: string;
  total_volunteer_hours?: number;
  yacht_clubs?: ClubDetails | null;
  club?: ClubDetails | null;
  clubs?: ClubDetails | null;
  club_profiles?: ClubDetails | null;
}

export interface ClubRegattaSnapshot {
  id: string;
  name: string;
  eventType?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  entryFee?: number | null;
  currency?: string | null;
  norUrl?: string | null;
  siUrl?: string | null;
  resultsUrl?: string | null;
  venueId?: string | null;
}

export interface ClubEventSnapshot {
  id: string;
  title: string;
  eventType?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  registrationOpens?: string | null;
  registrationCloses?: string | null;
  venueId?: string | null;
  locationName?: string | null;
  maxParticipants?: number | null;
}

export interface ClubDocumentSnapshot {
  id: string;
  title: string;
  documentType?: string | null;
  publishDate?: string | null;
  url?: string | null;
  parsed?: boolean | null;
}

export interface ClubServiceSnapshot {
  id: string;
  serviceType?: string | null;
  businessName?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  specialties?: string[] | null;
  classesSupported?: string[] | null;
  preferredByClub?: boolean | null;
}

export interface ClubInsightSnapshot {
  outstandingDues: boolean;
  openRegistrations: number;
  volunteerNeeds: number;
  newDocuments: number;
  nextAction?: string | null;
}

export interface ClubIntegrationSnapshot {
  clubId: string;
  club: {
    id: string;
    name: string;
    location?: string;
    country?: string;
    website?: string;
    contactEmail?: string;
    description?: string;
    facilities?: string[];
  };
  membership: {
    membershipType?: string;
    status?: string;
    role: ClubRole;
    memberNumber?: string;
    joinedDate?: string;
    expiryDate?: string;
    paymentStatus?: string;
    volunteerHours?: number;
  };
  regattas: ClubRegattaSnapshot[];
  events: ClubEventSnapshot[];
  documents: ClubDocumentSnapshot[];
  services: ClubServiceSnapshot[];
  insights: ClubInsightSnapshot;
}

interface IntegrationState {
  snapshots: ClubIntegrationSnapshot[];
  loading: boolean;
  error: string | null;
}

interface ClubRaceCalendarRow {
  id: string;
  club_id: string | null;
  event_name: string | null;
  event_type: string | null;
  registration_status: string | null;
  start_date: string | null;
  end_date: string | null;
  entry_fee: number | null;
  currency: string | null;
  nor_url: string | null;
  si_url: string | null;
  results_url: string | null;
  venue_id: string | null;
}

interface ClubEventRow {
  id: string;
  club_id: string | null;
  title: string | null;
  event_type: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_opens: string | null;
  registration_closes: string | null;
  venue_id: string | null;
  location_name: string | null;
  max_participants: number | null;
}

interface ClubDocumentRow {
  id: string;
  club_id: string | null;
  title: string | null;
  document_type: string | null;
  publish_date: string | null;
  url: string | null;
  parsed: boolean | null;
}

interface ClubServiceRow {
  id: string;
  club_id: string | null;
  service_type: string | null;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  specialties: string[] | null;
  classes_supported: string[] | null;
  preferred_by_club: boolean | null;
}

type QueryResult<T> = {
  data: T[] | null;
  error: PostgrestError | null;
};

async function fetchSafely<T>(query: PromiseLike<QueryResult<T>>): Promise<T[]> {
  try {
    const { data, error } = await query;

    if (error) {
      if (isMissingRelationError(error)) {
        return [];
      }

      throw error;
    }

    return data || [];
  } catch (error: unknown) {
    if (isMissingRelationError(error)) {
      return [];
    }

    throw error;
  }
}

const extractClubDetails = (membership: ClubMembershipRecord): ClubDetails | null => {
  return (
    (membership.yacht_clubs as ClubDetails | null | undefined) ??
    membership.club_profiles ??
    membership.club ??
    membership.clubs ??
    null
  );
};

type NormalizedMembership = {
  clubId: string;
  club: ClubDetails;
  membership: ClubMembershipRecord;
};

const isNonNull = <T>(value: T | null | undefined): value is T => value != null;

type UseClubIntegrationSnapshotsReturn = IntegrationState & {
  refetch: () => Promise<void>;
};

export function useClubIntegrationSnapshots(
  memberships: ClubMembershipRecord[]
): UseClubIntegrationSnapshotsReturn {
  const [state, setState] = useState<IntegrationState>({
    snapshots: [],
    loading: false,
    error: null,
  });
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  // Stable key for the set of club IDs.
  const clubIdsKey = useMemo(() => {
    const ids = memberships
      .map((membership) => extractClubDetails(membership)?.id || membership.club_id)
      .filter((id): id is string => Boolean(id));

    return Array.from(new Set(ids)).sort().join(',');
  }, [memberships]);

  // Stable key for membership state changes on those clubs.
  // This avoids stale snapshots when role/status/payment changes for the same club IDs.
  const membershipsKey = useMemo(() => {
    const signatures = memberships
      .map((membership) => {
        const clubId = extractClubDetails(membership)?.id || membership.club_id;
        if (!clubId) return null;
        const role = normalizeClubRole((membership.role as string | null | undefined) ?? null);
        const status = membership.status || '';
        const membershipType = membership.membership_type || '';
        const paymentStatus = membership.payment_status || '';
        const joinedDate = membership.joined_date || membership.joined_at || '';
        const expiryDate = membership.expiry_date || '';
        return [
          clubId,
          role,
          status,
          membershipType,
          paymentStatus,
          joinedDate,
          expiryDate,
        ].join('|');
      })
      .filter((signature): signature is string => Boolean(signature));

    return Array.from(new Set(signatures)).sort().join(',');
  }, [memberships]);

  const fetchSnapshots = useCallback(async () => {
    const runId = ++fetchRunIdRef.current;
    const canCommit = () => isMountedRef.current && runId === fetchRunIdRef.current;

    const currentClubIds = clubIdsKey.split(',').filter(Boolean);

    // Compute normalizedMemberships inside the callback to avoid dependency issues
    const normalizedMemberships = memberships
      .map<NormalizedMembership | null>((membership) => {
        const club = extractClubDetails(membership);
        const clubId = club?.id ?? membership.club_id ?? null;

        if (!clubId) {
          return null;
        }

        return {
          clubId,
          club: club ?? {
            id: clubId,
            name: 'Sailing Club',
          },
          membership,
        };
      })
      .filter(isNonNull);
    if (currentClubIds.length === 0) {
      if (!canCommit()) return;
      setState({
        snapshots: [],
        loading: false,
        error: null,
      });
      return;
    }

    if (!canCommit()) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const todayIso = new Date().toISOString();
      const todayDate = todayIso.split('T')[0];
      const fourteenDaysAgoMs = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const fallbackClubById = new Map<string, ClubDetails>();
      const nonFatalErrors: string[] = [];

      const unresolvedClubIds = Array.from(
        new Set(
          normalizedMemberships
            .filter(({ club }) => !club?.name || club.name === 'Sailing Club')
            .map(({ clubId }) => clubId)
        )
      );

      if (unresolvedClubIds.length > 0) {
        const clubsResult = await supabase
          .from('clubs')
          .select('id, name, address, website, email, description')
          .in('id', unresolvedClubIds);

        if (!clubsResult.error && clubsResult.data) {
          clubsResult.data.forEach((club: any) => {
            if (!club?.id) return;
            fallbackClubById.set(club.id, {
              id: club.id,
              name: club.name || 'Sailing Club',
              location: club.address || undefined,
              website: club.website || undefined,
              contact_email: club.email || undefined,
              description: club.description || undefined,
            });
          });
        }

        const stillMissingClubIds = unresolvedClubIds.filter((clubId) => !fallbackClubById.has(clubId));
        if (stillMissingClubIds.length > 0) {
          const profilesResult = await supabase
            .from('club_profiles')
            .select('id, club_name, organization_name, city, country, website_url, contact_email, description')
            .in('id', stillMissingClubIds);

          if (!profilesResult.error && profilesResult.data) {
            profilesResult.data.forEach((profile: any) => {
              if (!profile?.id) return;
              fallbackClubById.set(profile.id, {
                id: profile.id,
                name: profile.organization_name || profile.club_name || 'Sailing Club',
                location: profile.city || undefined,
                country: profile.country || undefined,
                website: profile.website_url || undefined,
                contact_email: profile.contact_email || undefined,
                description: profile.description || undefined,
              });
            });
          }
        }

        const stillMissingAfterProfiles = unresolvedClubIds.filter((clubId) => !fallbackClubById.has(clubId));
        if (stillMissingAfterProfiles.length > 0) {
          const yachtResult = await supabase
            .from('yacht_clubs')
            .select('id, name, location, country, website, contact_email, description, facilities, metadata')
            .in('id', stillMissingAfterProfiles);

          if (!yachtResult.error && yachtResult.data) {
            yachtResult.data.forEach((club: any) => {
              if (!club?.id) return;
              fallbackClubById.set(club.id, {
                id: club.id,
                name: club.name || 'Sailing Club',
                location: club.location || undefined,
                country: club.country || undefined,
                website: club.website || undefined,
                contact_email: club.contact_email || undefined,
                description: club.description || undefined,
                facilities: Array.isArray(club.facilities) ? club.facilities : [],
                metadata:
                  club.metadata && typeof club.metadata === 'object'
                    ? (club.metadata as Record<string, any>)
                    : null,
              });
            });
          }
        }

        const stillMissingAfterYacht = unresolvedClubIds.filter((clubId) => !fallbackClubById.has(clubId));
        if (stillMissingAfterYacht.length > 0) {
          const globalResult = await supabase
            .from('global_clubs')
            .select('id, name, city, country, website, description, platform_club_id, logo_url')
            .or(
              `id.in.(${stillMissingAfterYacht.join(',')}),platform_club_id.in.(${stillMissingAfterYacht.join(',')})`
            );

          if (!globalResult.error && globalResult.data) {
            globalResult.data.forEach((club: any) => {
              const record = {
                id: club?.platform_club_id || club?.id,
                name: club?.name || 'Sailing Club',
                location: club?.city || undefined,
                country: club?.country || undefined,
                website: club?.website || undefined,
                description: club?.description || undefined,
                metadata:
                  club?.logo_url
                    ? { logo_url: club.logo_url, source_table: 'global_clubs' }
                    : { source_table: 'global_clubs' },
              } satisfies ClubDetails;

              if (club?.id && stillMissingAfterYacht.includes(club.id)) {
                fallbackClubById.set(club.id, record);
              }
              if (club?.platform_club_id && stillMissingAfterYacht.includes(club.platform_club_id)) {
                fallbackClubById.set(club.platform_club_id, record);
              }
            });
          }
        }
      }

      const fetchSoftly = async <T>(
        label: string,
        query: PromiseLike<QueryResult<T>>
      ): Promise<T[]> => {
        try {
          return await fetchSafely(query);
        } catch (error: unknown) {
          const message =
            typeof error === 'object' &&
            error &&
            'message' in error &&
            typeof (error as { message?: unknown }).message === 'string'
              ? (error as { message: string }).message
              : 'Unknown error';
          nonFatalErrors.push(`${label}: ${message}`);
          logger.warn(`Non-fatal ${label} fetch failure`, error);
          return [];
        }
      };

      const [regattaRows, eventRows, documentRows, serviceRows] = await Promise.all([
        fetchSoftly<ClubRaceCalendarRow>(
          'club_race_calendar',
          supabase
            .from('club_race_calendar')
            .select(`
              id,
              club_id,
              event_name,
              event_type,
              start_date,
              end_date
            `)
            .in('club_id', currentClubIds)
            .gte('start_date', todayDate)
            .order('start_date', { ascending: true })
            .limit(currentClubIds.length * 6)
        ),
        fetchSoftly<ClubEventRow>(
          'club_events',
          supabase
            .from('club_events')
            .select(`
              id,
              club_id,
              title,
              event_type,
              status,
              start_date,
              end_date,
              registration_opens,
              registration_closes,
              venue_id,
              location_name,
              max_participants
            `)
            .in('club_id', currentClubIds)
            .gte('start_date', todayDate)
            .order('start_date', { ascending: true })
            .limit(currentClubIds.length * 6)
        ),
        fetchSoftly<ClubDocumentRow>(
          'club_ai_documents',
          supabase
            .from('club_ai_documents')
            .select(`
              id,
              club_id,
              title,
              document_type,
              publish_date,
              url,
              parsed
            `)
            .in('club_id', currentClubIds)
            .order('publish_date', { ascending: false })
            .limit(currentClubIds.length * 10)
        ),
        fetchSoftly<ClubServiceRow>(
          'club_services',
          supabase
            .from('club_services')
            .select(`
              id,
              club_id,
              service_type,
              business_name,
              contact_name,
              email,
              phone,
              website,
              specialties,
              classes_supported,
              preferred_by_club
            `)
            .in('club_id', currentClubIds)
            .order('preferred_by_club', { ascending: false })
        ),
      ]);

      const snapshotMap = new Map<string, ClubIntegrationSnapshot>();

      normalizedMemberships.forEach(({ clubId, club, membership }) => {
        const resolvedClub = fallbackClubById.get(clubId) || club;
        const normalizedRole = normalizeClubRole(
          (membership.role as string | null | undefined) ?? null
        );

        snapshotMap.set(clubId, {
          clubId,
          club: {
            id: resolvedClub.id,
            name: resolvedClub.name,
            location: resolvedClub.location || undefined,
            country: resolvedClub.country || undefined,
            website: resolvedClub.website || undefined,
            contactEmail: resolvedClub.contact_email || undefined,
            description: resolvedClub.description || undefined,
            facilities: Array.isArray(resolvedClub.facilities) ? [...resolvedClub.facilities] : [],
            metadata:
              resolvedClub.metadata && typeof resolvedClub.metadata === 'object'
                ? { ...resolvedClub.metadata }
                : undefined,
          },
          membership: {
            membershipType: membership.membership_type,
            status: membership.status,
            role: normalizedRole,
            memberNumber: membership.member_number,
            joinedDate: membership.joined_date || membership.joined_at,
            expiryDate: membership.expiry_date,
            paymentStatus: membership.payment_status,
            volunteerHours: membership.total_volunteer_hours,
          },
          regattas: [],
          events: [],
          documents: [],
          services: [],
          insights: {
            outstandingDues: false,
            openRegistrations: 0,
            volunteerNeeds: 0,
            newDocuments: 0,
            nextAction: null,
          },
        });
      });

      regattaRows.forEach((row) => {
        const clubId = row.club_id ?? undefined;
        const snapshot = clubId ? snapshotMap.get(clubId) : undefined;
        if (!snapshot) return;

        const regatta: ClubRegattaSnapshot = {
          id: row.id,
          name: row.event_name || 'Regatta',
          eventType: row.event_type,
          status: row.registration_status,
          startDate: row.start_date,
          endDate: row.end_date,
          entryFee: row.entry_fee,
          currency: row.currency,
          norUrl: row.nor_url,
          siUrl: row.si_url,
          resultsUrl: row.results_url,
          venueId: row.venue_id,
        };

        snapshot.regattas.push(regatta);
      });

      eventRows.forEach((row) => {
        const clubId = row.club_id ?? undefined;
        const snapshot = clubId ? snapshotMap.get(clubId) : undefined;
        if (!snapshot) return;

        const event: ClubEventSnapshot = {
          id: row.id,
          title: row.title || 'Club Event',
          eventType: row.event_type,
          status: row.status,
          startDate: row.start_date,
          endDate: row.end_date,
          registrationOpens: row.registration_opens,
          registrationCloses: row.registration_closes,
          venueId: row.venue_id,
          locationName: row.location_name,
          maxParticipants: row.max_participants,
        };

        snapshot.events.push(event);
      });

      documentRows.forEach((row) => {
        const clubId = row.club_id ?? undefined;
        const snapshot = clubId ? snapshotMap.get(clubId) : undefined;
        if (!snapshot) return;

        const document: ClubDocumentSnapshot = {
          id: row.id,
          title: row.title || 'Club Document',
          documentType: row.document_type,
          publishDate: row.publish_date,
          url: row.url,
          parsed: row.parsed,
        };

        snapshot.documents.push(document);
      });

      serviceRows.forEach((row) => {
        const clubId = row.club_id ?? undefined;
        const snapshot = clubId ? snapshotMap.get(clubId) : undefined;
        if (!snapshot) return;

        const service: ClubServiceSnapshot = {
          id: row.id,
          serviceType: row.service_type,
          businessName: row.business_name,
          contactName: row.contact_name,
          email: row.email,
          phone: row.phone,
          website: row.website,
          specialties: Array.isArray(row.specialties) ? row.specialties : null,
          classesSupported: Array.isArray(row.classes_supported) ? row.classes_supported : null,
          preferredByClub: row.preferred_by_club,
        };

        snapshot.services.push(service);
      });

      const now = Date.now();

      snapshotMap.forEach((snapshot) => {
        const outstandingDues =
          snapshot.membership.paymentStatus === 'overdue' ||
          (snapshot.membership.expiryDate ? new Date(snapshot.membership.expiryDate).getTime() < now : false);

        const openRegistrations = snapshot.regattas.filter((regatta) => {
          if (regatta.status === 'registration_open') return true;

          const startTime = regatta.startDate ? new Date(regatta.startDate).getTime() : null;
          return Boolean(startTime && startTime > now);
        }).length;

        const volunteerNeeds = snapshot.events.filter((event) => {
          if (!event.eventType) return false;
          const type = event.eventType.toLowerCase();
          return type.includes('maintenance') || type.includes('training') || type.includes('volunteer');
        }).length;

        const newDocuments = snapshot.documents.filter((document) => {
          if (!document.publishDate) return false;
          const publishedAt = new Date(document.publishDate).getTime();
          if (Number.isNaN(publishedAt)) return false;
          return publishedAt >= fourteenDaysAgoMs;
        }).length;

        let nextAction: string | null = null;
        if (outstandingDues) {
          nextAction = 'Pay club dues';
        } else if (openRegistrations > 0) {
          nextAction = 'Complete race registration';
        } else if (volunteerNeeds > 0) {
          nextAction = 'Fill volunteer shifts';
        } else if (snapshot.documents.length > 0) {
          nextAction = 'Review latest club bulletin';
        }

        snapshot.insights = {
          outstandingDues,
          openRegistrations,
          volunteerNeeds,
          newDocuments,
          nextAction,
        };

        snapshot.regattas.sort((a, b) => {
          const aTime = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
          const bTime = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        });

        snapshot.events.sort((a, b) => {
          const aTime = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
          const bTime = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        });
      });

      if (!canCommit()) return;
      setState({
        snapshots: Array.from(snapshotMap.values()),
        loading: false,
        error:
          nonFatalErrors.length > 0
            ? `Some club data is temporarily unavailable (${nonFatalErrors.length} source${nonFatalErrors.length > 1 ? 's' : ''}).`
            : null,
      });
    } catch (error: unknown) {
      logger.error('Failed to fetch club snapshots', error);
      const message =
        typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Failed to load club data';
      if (!canCommit()) return;
      // Preserve last known-good snapshots so transient backend failures
      // don't force the Clubs screen into a false empty state.
      setState((prev) => ({
        snapshots: prev.snapshots,
        loading: false,
        error: message,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubIdsKey, membershipsKey]); // memberships is accessed via closure and re-keyed by membershipsKey.

  useEffect(() => {
    void fetchSnapshots();
  }, [fetchSnapshots]);

  return {
    ...state,
    refetch: fetchSnapshots,
  };
}
