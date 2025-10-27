import { supabase } from './supabase';

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
    console.log('[FleetService] getFleetsForUser called with userId:', userId);

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

    console.log('[FleetService] Raw query result:', { data, error, dataCount: data?.length });

    if (error) {
      console.error('[FleetService] Error fetching fleets for user:', error);
      throw error;
    }

    const filtered = (data || []).filter(item => item.fleet);
    console.log('[FleetService] After filtering null fleets:', {
      original: data?.length,
      filtered: filtered.length,
      nullFleets: data?.filter(item => !item.fleet).length
    });

    const mapped = filtered.map(item => ({
      fleet: this.mapFleet(item.fleet),
      role: (item.role ?? 'member') as FleetMembership['role'],
      status: (item.status ?? 'active') as FleetMembership['status'],
      joinedAt: item.joined_at,
    }));

    console.log('[FleetService] Returning mapped fleets:', mapped.length, mapped);
    return mapped;
  }

  async getFleetOverview(fleetId: string): Promise<FleetOverview> {
    const { data, error } = await supabase
      .from('fleets')
      .select('*')
      .eq('id', fleetId)
      .single();

    if (error || !data) {
      console.error('Error fetching fleet overview:', error);
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
      console.error('Error fetching fleet activity:', error);
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
      console.error('Error fetching fleet members:', error);
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
      console.error('Error following fleet:', error);
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
      console.error('Error unfollowing fleet:', error);
      throw error;
    }
  }

  private async countMembers(fleetId: string): Promise<number> {
    const { count, error } = await supabase
      .from('fleet_members')
      .select('*', { count: 'exact', head: true })
      .eq('fleet_id', fleetId)
      .eq('status', 'active');

    if (error) {
      console.error('Error counting fleet members:', error);
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
      console.error('Error counting fleet followers:', error);
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
      console.error('Error counting fleet documents:', error);
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
      console.error('Error sharing document with fleet:', error);
      throw error;
    }

    // TODO: If notify_followers is true, create notifications for fleet followers
  }
}

export const fleetService = new FleetService();
