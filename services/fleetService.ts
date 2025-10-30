import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';
import type { StoredDocument } from './storage/DocumentStorageService';

const logger = createLogger('FleetService');

export interface Fleet {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  classId?: string | null;
  clubId?: string | null;
  region?: string | null;
  whatsappLink?: string | null;
  visibility: 'public' | 'private' | 'club';
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FleetMembership {
  fleet: Fleet;
  role: 'member' | 'owner' | 'captain' | 'coach' | 'support';
  status: 'active' | 'pending' | 'invited' | 'inactive';
  joinedAt?: string | null;
}

export interface FleetMetrics {
  members: number;
  followers: number;
  documents: number;
}

export interface FleetOverview {
  fleet: Fleet;
  metrics: FleetMetrics;
}

export interface FleetResource {
  id: string;
  fleetId: string;
  documentId: string;
  tags: string[];
  sharedBy?: string | null;
  createdAt: string;
  notifyFollowers?: boolean;
  document?: StoredDocument;
  ownerProfile?: {
    id: string;
    fullName?: string | null;
    avatarUrl?: string | null;
  };
}

export interface FleetCourseSummary {
  id: string;
  name: string;
  courseType?: string | null;
  lastUsedDate?: string | null;
  description?: string | null;
  venueId?: string | null;
}

export interface FleetRaceSummary {
  id: string;
  raceName: string;
  startTime?: string | null;
  boatClass?: string | null;
  raceSeries?: string | null;
  venueId?: string | null;
  racingAreaName?: string | null;
  venueName?: string | null;
}

export type FleetActivityType =
  | 'document_uploaded'
  | 'announcement'
  | 'event_created'
  | 'status_update'
  | 'member_joined'
  | 'member_left'
  | 'resource_shared';

export interface FleetActivityEntry {
  id: string;
  fleetId: string;
  actorId?: string | null;
  activityType: FleetActivityType;
  payload: Record<string, unknown>;
  visibility: 'fleet' | 'followers' | 'public';
  createdAt: string;
}

export interface FleetMember {
  id: string;
  fleetId: string;
  userId: string;
  role: FleetMembership['role'];
  status: FleetMembership['status'];
  joinedAt?: string | null;
  invitedBy?: string | null;
  metadata?: Record<string, unknown> | null;
}

class FleetService {
  private mapFleet(row: any): Fleet {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      classId: row.class_id,
      clubId: row.club_id,
      region: row.region,
      whatsappLink: row.whatsapp_link,
      visibility: (row.visibility ?? 'private') as Fleet['visibility'],
      metadata: row.metadata,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getFleetsForUser(userId: string): Promise<FleetMembership[]> {
    const { data, error } = await supabase
      .from('fleet_members')
      .select(
        `
        role,
        status,
        joined_at,
        fleet:fleet_id (
          *
        )
        `,
      )
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      logger.error('Error fetching fleets for user:', error);
      throw error;
    }

    const filtered = (data || []).filter(item => item.fleet);

    const mapped = filtered.map(item => ({
      fleet: this.mapFleet(item.fleet),
      role: (item.role ?? 'member') as FleetMembership['role'],
      status: (item.status ?? 'active') as FleetMembership['status'],
      joinedAt: item.joined_at,
    }));

    return mapped;
  }

  async getFleetOverview(fleetId: string): Promise<FleetOverview> {
    const { data, error } = await supabase
      .from('fleets')
      .select('*')
      .eq('id', fleetId)
      .single();

    if (error || !data) {
      logger.error('Error fetching fleet overview:', error);
      throw error;
    }

    const metrics = await Promise.all([
      this.countMembers(fleetId),
      this.countFollowers(fleetId),
      this.countDocuments(fleetId),
    ]);

    return {
      fleet: this.mapFleet(data),
      metrics: {
        members: metrics[0],
        followers: metrics[1],
        documents: metrics[2],
      },
    };
  }

  async getFleetActivity(fleetId: string, options?: { limit?: number }): Promise<FleetActivityEntry[]> {
    const { data, error } = await supabase
      .from('fleet_activity')
      .select('*')
      .eq('fleet_id', fleetId)
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 25);

    if (error) {
      logger.error('Error fetching fleet activity:', error);
      throw error;
    }

    return (data || []).map(entry => ({
      id: entry.id,
      fleetId: entry.fleet_id,
      actorId: entry.actor_id,
      activityType: entry.activity_type as FleetActivityType,
      payload: entry.payload ?? {},
      visibility: (entry.visibility ?? 'fleet') as FleetActivityEntry['visibility'],
      createdAt: entry.created_at,
    }));
  }

  async getFleetMembers(fleetId: string): Promise<FleetMember[]> {
    const { data, error } = await supabase
      .from('fleet_members')
      .select('*')
      .eq('fleet_id', fleetId)
      .order('joined_at', { ascending: false });

    if (error) {
      logger.error('Error fetching fleet members:', error);
      throw error;
    }

    return (data || []).map(member => ({
      id: member.id,
      fleetId: member.fleet_id,
      userId: member.user_id,
      role: (member.role ?? 'member') as FleetMembership['role'],
      status: (member.status ?? 'active') as FleetMembership['status'],
      joinedAt: member.joined_at,
      invitedBy: member.invited_by,
      metadata: member.metadata,
    }));
  }

  async followFleet(userId: string, fleetId: string, preferences?: {
    notifyOnDocuments?: boolean;
    notifyOnAnnouncements?: boolean;
    notifyOnEvents?: boolean;
  }): Promise<void> {
    const payload = {
      follower_id: userId,
      fleet_id: fleetId,
      notify_on_documents: preferences?.notifyOnDocuments ?? true,
      notify_on_announcements: preferences?.notifyOnAnnouncements ?? true,
      notify_on_events: preferences?.notifyOnEvents ?? true,
    };

    const { error } = await supabase
      .from('fleet_followers')
      .upsert(payload, { onConflict: 'fleet_id,follower_id' });

    if (error) {
      logger.error('Error following fleet:', error);
      throw error;
    }
  }

  async unfollowFleet(userId: string, fleetId: string): Promise<void> {
    const { error } = await supabase
      .from('fleet_followers')
      .delete()
      .eq('fleet_id', fleetId)
      .eq('follower_id', userId);

    if (error) {
      logger.error('Error unfollowing fleet:', error);
      throw error;
    }
  }

  async joinFleet(userId: string, fleetId: string, role: FleetMembership['role'] = 'member'): Promise<void> {
    const { error } = await supabase
      .from('fleet_members')
      .upsert(
        {
          fleet_id: fleetId,
          user_id: userId,
          role,
          status: 'active',
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'fleet_id,user_id' }
      );

    if (error) {
      logger.error('Error joining fleet:', error);
      throw error;
    }
  }

  async leaveFleet(userId: string, fleetId: string): Promise<void> {
    const { error } = await supabase
      .from('fleet_members')
      .delete()
      .eq('fleet_id', fleetId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error leaving fleet:', error);
      throw error;
    }
  }

  async getFleetResources(
    fleetId: string,
    options?: { limit?: number }
  ): Promise<FleetResource[]> {
    const { data, error } = await supabase
      .from('fleet_documents')
      .select('*')
      .eq('fleet_id', fleetId)
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 12);

    if (error) {
      logger.error('Error fetching fleet resources:', error);
      throw error;
    }

    if (!data?.length) {
      return [];
    }

    const documentIds = data
      .map(entry => entry.document_id)
      .filter((id): id is string => Boolean(id));

    const ownerIds = data
      .map(entry => entry.shared_by)
      .filter((id): id is string => Boolean(id));

    let documentsById: Record<string, StoredDocument> = {};
    if (documentIds.length) {
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('*')
        .in('id', documentIds);

      if (docError) {
        logger.warn('Unable to load documents for fleet resources:', docError);
      } else {
        documentsById = Object.fromEntries(
          (documents || []).map(doc => [
            doc.id,
            {
              id: doc.id,
              user_id: doc.user_id,
              filename: doc.filename,
              file_type: doc.file_type,
              file_size: doc.file_size,
              storage_path: doc.storage_path,
              public_url: doc.public_url,
              metadata: doc.metadata,
              created_at: doc.created_at,
              updated_at: doc.updated_at,
            } satisfies StoredDocument,
          ])
        );
      }
    }

    let ownersById: Record<string, { id: string; full_name?: string | null; avatar_url?: string | null }> = {};
    if (ownerIds.length) {
      const { data: owners, error: ownerError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', ownerIds);

      if (ownerError) {
        logger.warn('Unable to load owners for fleet resources:', ownerError);
      } else {
        ownersById = Object.fromEntries((owners || []).map(owner => [owner.id, owner]));
      }
    }

    return data.map(entry => ({
      id: entry.id,
      fleetId: entry.fleet_id,
      documentId: entry.document_id,
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      sharedBy: entry.shared_by,
      notifyFollowers: entry.notify_followers ?? false,
      createdAt: entry.created_at,
      document: entry.document_id ? documentsById[entry.document_id] : undefined,
      ownerProfile: entry.shared_by
        ? {
            id: entry.shared_by,
            fullName: ownersById[entry.shared_by]?.full_name,
            avatarUrl: ownersById[entry.shared_by]?.avatar_url,
          }
        : undefined,
    }));
  }

  async getFleetCourses(params: { clubId?: string | null; limit?: number }): Promise<FleetCourseSummary[]> {
    if (!params.clubId) {
      return [];
    }

    try {
      let query = supabase
        .from('race_courses')
        .select('id, name, course_type, last_used_date, description, venue_id')
        .eq('club_id', params.clubId)
        .order('last_used_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching fleet courses:', error);
        throw error;
      }

      return (data || []).map(course => ({
        id: course.id,
        name: course.name,
        courseType: course.course_type,
        lastUsedDate: course.last_used_date,
        description: course.description,
        venueId: course.venue_id,
      }));
    } catch (error) {
      logger.warn('Unable to load fleet courses - returning empty set', error);
      return [];
    }
  }

  async getFleetUpcomingRaces(params: { classId?: string | null; limit?: number }): Promise<FleetRaceSummary[]> {
    if (!params.classId) {
      return [];
    }

    try {
      let query = supabase
        .from('race_events')
        .select('id, race_name, start_time, boat_class, race_series, venue_id, racing_area_name')
        .eq('boat_class', params.classId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching fleet upcoming races:', error);
        throw error;
      }

      const venueIds = (data || [])
        .map(event => event.venue_id)
        .filter((id): id is string => Boolean(id));

      let venuesById: Record<string, string> = {};
      if (venueIds.length) {
        const { data: venues, error: venuesError } = await supabase
          .from('sailing_venues')
          .select('id, name')
          .in('id', venueIds);

        if (venuesError) {
          logger.warn('Unable to load venue names for upcoming races:', venuesError);
        } else {
          venuesById = Object.fromEntries((venues || []).map(venue => [venue.id, venue.name]));
        }
      }

      return (data || []).map(event => ({
        id: event.id,
        raceName: event.race_name,
        startTime: event.start_time,
        boatClass: event.boat_class,
        raceSeries: event.race_series,
        venueId: event.venue_id,
        racingAreaName: event.racing_area_name,
        venueName: event.venue_id ? venuesById[event.venue_id] ?? null : null,
      }));
    } catch (error) {
      logger.warn('Unable to load upcoming fleet races - returning empty list', error);
      return [];
    }
  }

  private async countMembers(fleetId: string): Promise<number> {
    const { count, error } = await supabase
      .from('fleet_members')
      .select('*', { count: 'exact', head: true })
      .eq('fleet_id', fleetId)
      .eq('status', 'active');

    if (error) {
      logger.error('Error counting fleet members:', error);
      return 0;
    }

    return count ?? 0;
  }

  private async countFollowers(fleetId: string): Promise<number> {
    const { count, error } = await supabase
      .from('fleet_followers')
      .select('*', { count: 'exact', head: true })
      .eq('fleet_id', fleetId);

    if (error) {
      logger.error('Error counting fleet followers:', error);
      return 0;
    }

    return count ?? 0;
  }

  private async countDocuments(fleetId: string): Promise<number> {
    const { count, error } = await supabase
      .from('fleet_documents')
      .select('*', { count: 'exact', head: true })
      .eq('fleet_id', fleetId);

    if (error) {
      logger.error('Error counting fleet documents:', error);
      return 0;
    }

    return count ?? 0;
  }

  /**
   * Share a document with a fleet
   */
  async shareDocumentWithFleet(params: {
    fleetId: string;
    documentId: string;
    sharedBy: string;
    tags?: string[];
    notifyFollowers?: boolean;
  }): Promise<void> {
    const { error } = await supabase
      .from('fleet_documents')
      .insert({
        fleet_id: params.fleetId,
        document_id: params.documentId,
        shared_by: params.sharedBy,
        tags: params.tags || [],
        notify_followers: params.notifyFollowers ?? false,
      });

    if (error) {
      logger.error('Error sharing document with fleet:', error);
      throw error;
    }

    // TODO: If notify_followers is true, create notifications for fleet followers
  }
}

export const fleetService = new FleetService();
