import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabase';

export interface ClubMembershipRecord {
  id: string;
  club_id?: string;
  membership_type?: string;
  status?: string;
  role?: string;
  member_number?: string;
  joined_date?: string;
  joined_at?: string;
  expiry_date?: string;
  payment_status?: string;
  total_volunteer_hours?: number;
  yacht_clubs?: {
    id: string;
    name: string;
    location?: string;
    country?: string;
    website?: string;
    contact_email?: string;
    description?: string;
    facilities?: string[] | null;
    metadata?: Record<string, any> | null;
  } | null;
  club?: {
    id: string;
    name: string;
    location?: string;
    country?: string;
    website?: string;
    contact_email?: string;
    description?: string;
    facilities?: string[] | null;
    metadata?: Record<string, any> | null;
  } | null;
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
    role?: string;
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

const isMissingTableError = (error: any) => {
  if (!error) return false;
  const message = typeof error?.message === 'string' ? error.message : '';
  return message.includes('relation') || message.includes('does not exist');
};

async function fetchSafely<T>(query: any): Promise<T[]> {
  try {
    const { data, error } = await query;

    if (error) {
      if (isMissingTableError(error)) {
        return [];
      }

      throw error;
    }

    return data || [];
  } catch (error: any) {
    if (isMissingTableError(error)) {
      return [];
    }

    throw error;
  }
}

const extractClubDetails = (membership: ClubMembershipRecord) => {
  return membership.yacht_clubs || membership.club || null;
};

export function useClubIntegrationSnapshots(memberships: ClubMembershipRecord[]) {
  const [state, setState] = useState<IntegrationState>({
    snapshots: [],
    loading: false,
    error: null,
  });

  const clubIds = useMemo(() => {
    const ids = memberships
      .map((membership) => extractClubDetails(membership)?.id || membership.club_id)
      .filter((id): id is string => Boolean(id));

    return Array.from(new Set(ids));
  }, [memberships]);

  const normalizedMemberships = useMemo(() => {
    return memberships
      .map((membership) => {
        const club = extractClubDetails(membership);
        const clubId = club?.id || membership.club_id;

        if (!clubId || !club) return null;

        return {
          clubId,
          club,
          membership,
        };
      })
      .filter((item): item is { clubId: string; club: NonNullable<ReturnType<typeof extractClubDetails>>; membership: ClubMembershipRecord } => Boolean(item));
  }, [memberships]);

  const fetchSnapshots = useCallback(async () => {
    if (clubIds.length === 0) {
      setState({
        snapshots: [],
        loading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const todayIso = new Date().toISOString();
      const fourteenDaysAgoMs = Date.now() - 14 * 24 * 60 * 60 * 1000;

      const [regattaRows, eventRows, documentRows, serviceRows] = await Promise.all([
        fetchSafely(
          supabase
            .from('club_race_calendar')
            .select(`
              id,
              club_id,
              event_name,
              event_type,
              registration_status,
              start_date,
              end_date,
              entry_fee,
              currency,
              nor_url,
              si_url,
              results_url,
              venue_id
            `)
            .in('club_id', clubIds)
            .gte('start_date', todayIso)
            .order('start_date', { ascending: true })
            .limit(clubIds.length * 6)
        ),
        fetchSafely(
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
            .in('club_id', clubIds)
            .gte('start_date', todayIso)
            .order('start_date', { ascending: true })
            .limit(clubIds.length * 6)
        ),
        fetchSafely(
          supabase
            .from('club_documents')
            .select(`
              id,
              club_id,
              title,
              document_type,
              publish_date,
              url,
              parsed
            `)
            .in('club_id', clubIds)
            .order('publish_date', { ascending: false })
            .limit(clubIds.length * 10)
        ),
        fetchSafely(
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
            .in('club_id', clubIds)
            .order('preferred_by_club', { ascending: false })
        ),
      ]);

      const snapshotMap = new Map<string, ClubIntegrationSnapshot>();

      normalizedMemberships.forEach(({ clubId, club, membership }) => {
        snapshotMap.set(clubId, {
          clubId,
          club: {
            id: club.id,
            name: club.name,
            location: club.location || undefined,
            country: club.country || undefined,
            website: club.website || undefined,
            contactEmail: club.contact_email || undefined,
            description: club.description || undefined,
            facilities: Array.isArray(club.facilities)
              ? (club.facilities as string[])
              : typeof club.facilities === 'string'
              ? [club.facilities]
              : [],
          },
          membership: {
            membershipType: membership.membership_type,
            status: membership.status,
            role: membership.role,
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

      regattaRows.forEach((row: any) => {
        const clubId = row.club_id;
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

      eventRows.forEach((row: any) => {
        const clubId = row.club_id;
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

      documentRows.forEach((row: any) => {
        const clubId = row.club_id;
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

      serviceRows.forEach((row: any) => {
        const clubId = row.club_id;
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
          specialties: Array.isArray(row.specialties) ? (row.specialties as string[]) : null,
          classesSupported: Array.isArray(row.classes_supported) ? (row.classes_supported as string[]) : null,
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

      setState({
        snapshots: Array.from(snapshotMap.values()),
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('[useClubIntegrationSnapshots] Failed to fetch club snapshots', error);
      setState({
        snapshots: [],
        loading: false,
        error: error?.message || 'Failed to load club data',
      });
    }
  }, [clubIds, normalizedMemberships]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  return {
    ...state,
    refetch: fetchSnapshots,
  };
}
