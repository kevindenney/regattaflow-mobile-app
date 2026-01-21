/**
 * RaceCollaborationService
 *
 * Service for managing race card collaboration:
 * - Inviting crew members to races
 * - Managing collaborator access levels
 * - Real-time chat between collaborators
 * - Subscription to changes
 *
 * Follows the TeamRaceEntryService.ts pattern.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { isUuid } from '@/utils/uuid';
import {
  RaceCollaborator,
  RaceMessage,
  RaceCollaboratorRow,
  RaceMessageRow,
  AccessLevel,
  MessageType,
  JoinRaceResult,
  CreateInviteResult,
  rowToRaceCollaborator,
  rowToRaceMessage,
} from '@/types/raceCollaboration';

const logger = createLogger('RaceCollaborationService');

/**
 * Service for managing race collaboration
 */
class RaceCollaborationServiceClass {
  // =========================================================================
  // COLLABORATOR CRUD
  // =========================================================================

  /**
   * Create an invite for a race (owner only)
   * Uses RPC function to handle invite code generation
   */
  async createInvite(
    regattaId: string,
    accessLevel: AccessLevel = 'view',
    displayName?: string,
    role?: string
  ): Promise<{ collaboratorId: string; inviteCode: string }> {
    const { data, error } = await supabase.rpc('create_race_collaborator_invite', {
      p_regatta_id: regattaId,
      p_access_level: accessLevel,
      p_display_name: displayName || null,
      p_role: role || null,
    });

    if (error) {
      logger.error('Failed to create invite:', error);
      throw error;
    }

    const result = data as CreateInviteResult;
    if (!result.success) {
      throw new Error(result.error || 'Failed to create invite');
    }

    logger.info('Created invite', { regattaId, inviteCode: result.invite_code });
    return {
      collaboratorId: result.collaborator_id!,
      inviteCode: result.invite_code!,
    };
  }

  /**
   * Join a race via invite code
   */
  async joinByInviteCode(
    inviteCode: string,
    displayName?: string,
    role?: string
  ): Promise<{ regattaId: string; collaboratorId: string }> {
    const { data, error } = await supabase.rpc('join_race_by_invite_code', {
      p_invite_code: inviteCode.toUpperCase(),
      p_display_name: displayName || null,
      p_role: role || null,
    });

    if (error) {
      logger.error('Failed to join race:', error);
      throw error;
    }

    const result = data as JoinRaceResult;
    if (!result.success) {
      throw new Error(result.error || 'Failed to join race');
    }

    logger.info('Joined race', { inviteCode, regattaId: result.regatta_id });
    return {
      regattaId: result.regatta_id!,
      collaboratorId: result.collaborator_id!,
    };
  }

  /**
   * Get all collaborators for a race
   * Fetches basic collaborator data, then enriches with profile info
   */
  async getCollaborators(regattaId: string): Promise<RaceCollaborator[]> {
    // Skip query if regattaId is not a valid UUID (e.g., demo-race)
    if (!isUuid(regattaId)) {
      logger.debug('Skipping getCollaborators for non-UUID regattaId:', regattaId);
      return [];
    }

    // First, get the basic collaborator data
    const { data: collaborators, error } = await supabase
      .from('race_collaborators')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to get collaborators:', error);
      throw error;
    }

    if (!collaborators || collaborators.length === 0) {
      return [];
    }

    // Get unique user IDs that have values
    const userIds = collaborators
      .map((c) => c.user_id)
      .filter((id): id is string => !!id);

    // Fetch profile data for those users if we have any
    let profilesMap: Record<string, any> = {};
    let sailorProfilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const [profilesResult, sailorProfilesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', userIds),
        supabase
          .from('sailor_profiles')
          .select('user_id, avatar_emoji, avatar_color, full_name')
          .in('user_id', userIds),
      ]);

      if (profilesResult.data) {
        profilesMap = Object.fromEntries(
          profilesResult.data.map((p) => [p.id, p])
        );
      }
      if (sailorProfilesResult.data) {
        sailorProfilesMap = Object.fromEntries(
          sailorProfilesResult.data.map((p) => [p.user_id, p])
        );
      }
    }

    // Combine collaborator data with profile info
    return collaborators.map((row: any) => {
      const profile = profilesMap[row.user_id];
      const sailorProfile = sailorProfilesMap[row.user_id];

      return {
        ...rowToRaceCollaborator(row as RaceCollaboratorRow),
        profile: profile || sailorProfile
          ? {
              fullName: sailorProfile?.full_name || profile?.full_name,
              avatarEmoji: sailorProfile?.avatar_emoji,
              avatarColor: sailorProfile?.avatar_color,
              email: profile?.email,
            }
          : undefined,
      };
    });
  }

  /**
   * Get a single collaborator by ID
   */
  async getCollaborator(collaboratorId: string): Promise<RaceCollaborator | null> {
    const { data, error } = await supabase
      .from('race_collaborators')
      .select('*')
      .eq('id', collaboratorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get collaborator:', error);
      throw error;
    }

    // Fetch profile data if user_id exists
    let profile = undefined;
    if (data.user_id) {
      const [profileResult, sailorProfileResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .eq('id', data.user_id)
          .single(),
        supabase
          .from('sailor_profiles')
          .select('user_id, avatar_emoji, avatar_color, full_name')
          .eq('user_id', data.user_id)
          .single(),
      ]);

      const p = profileResult.data;
      const sp = sailorProfileResult.data;
      if (p || sp) {
        profile = {
          fullName: sp?.full_name || p?.full_name,
          avatarEmoji: sp?.avatar_emoji,
          avatarColor: sp?.avatar_color,
          email: p?.email,
        };
      }
    }

    return {
      ...rowToRaceCollaborator(data as RaceCollaboratorRow),
      profile,
    };
  }

  /**
   * Update collaborator access level (owner only)
   */
  async updateAccessLevel(collaboratorId: string, accessLevel: AccessLevel): Promise<void> {
    const { error } = await supabase
      .from('race_collaborators')
      .update({ access_level: accessLevel })
      .eq('id', collaboratorId);

    if (error) {
      logger.error('Failed to update access level:', error);
      throw error;
    }

    logger.info('Updated access level', { collaboratorId, accessLevel });
  }

  /**
   * Update collaborator display name or role
   */
  async updateCollaborator(
    collaboratorId: string,
    updates: { displayName?: string; role?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('race_collaborators')
      .update({
        display_name: updates.displayName,
        role: updates.role,
      })
      .eq('id', collaboratorId);

    if (error) {
      logger.error('Failed to update collaborator:', error);
      throw error;
    }
  }

  /**
   * Remove a collaborator (owner or self)
   */
  async removeCollaborator(collaboratorId: string): Promise<void> {
    const { error } = await supabase
      .from('race_collaborators')
      .delete()
      .eq('id', collaboratorId);

    if (error) {
      logger.error('Failed to remove collaborator:', error);
      throw error;
    }

    logger.info('Removed collaborator', { collaboratorId });
  }

  /**
   * Accept a pending invite (changes status from 'pending' to 'accepted')
   */
  async acceptInvite(collaboratorId: string): Promise<void> {
    const { error } = await supabase
      .from('race_collaborators')
      .update({
        status: 'accepted',
        joined_at: new Date().toISOString(),
      })
      .eq('id', collaboratorId);

    if (error) {
      logger.error('Failed to accept invite:', error);
      throw error;
    }

    logger.info('Accepted invite', { collaboratorId });
  }

  /**
   * Decline a pending invite (changes status from 'pending' to 'declined')
   */
  async declineInvite(collaboratorId: string): Promise<void> {
    const { error } = await supabase
      .from('race_collaborators')
      .update({
        status: 'declined',
      })
      .eq('id', collaboratorId);

    if (error) {
      logger.error('Failed to decline invite:', error);
      throw error;
    }

    logger.info('Declined invite', { collaboratorId });
  }

  /**
   * Directly invite a specific user to a race
   * Creates a pending invite that appears in their timeline
   */
  async inviteUser(
    regattaId: string,
    targetUserId: string,
    accessLevel: AccessLevel = 'view'
  ): Promise<{ collaboratorId: string; inviteCode: string }> {
    const { data, error } = await supabase.rpc('create_direct_invite', {
      p_regatta_id: regattaId,
      p_target_user_id: targetUserId,
      p_access_level: accessLevel,
    });

    if (error) {
      logger.error('Failed to invite user:', error);
      throw error;
    }

    const result = data as { success: boolean; error?: string; collaborator_id?: string; invite_code?: string };
    if (!result.success) {
      throw new Error(result.error || 'Failed to invite user');
    }

    logger.info('Invited user to race', { regattaId, targetUserId, collaboratorId: result.collaborator_id });
    return {
      collaboratorId: result.collaborator_id!,
      inviteCode: result.invite_code!,
    };
  }

  /**
   * Check if current user has access to a race
   */
  async checkAccess(regattaId: string): Promise<{
    hasAccess: boolean;
    accessLevel?: AccessLevel;
    isOwner: boolean;
    collaboratorId?: string;
  }> {
    // Skip query if regattaId is not a valid UUID (e.g., demo-race)
    if (!isUuid(regattaId)) {
      logger.debug('checkAccess: Skipping for non-UUID regattaId:', regattaId);
      return { hasAccess: false, isOwner: false };
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      logger.debug('checkAccess: No authenticated user');
      return { hasAccess: false, isOwner: false };
    }

    logger.debug('checkAccess: Checking access for user', { userId: user.user.id, regattaId });

    // Check if user is owner
    const { data: regatta, error: regattaError } = await supabase
      .from('regattas')
      .select('created_by')
      .eq('id', regattaId)
      .single();

    if (regattaError) {
      logger.warn('checkAccess: Failed to fetch regatta', regattaError);
    }

    logger.debug('checkAccess: Regatta result', {
      regattaCreatedBy: regatta?.created_by,
      userId: user.user.id,
      match: regatta?.created_by === user.user.id
    });

    if (regatta?.created_by === user.user.id) {
      logger.debug('checkAccess: User is owner');
      return { hasAccess: true, accessLevel: 'full', isOwner: true };
    }

    // Check if user is collaborator
    const { data: collaborator, error: collabError } = await supabase
      .from('race_collaborators')
      .select('id, access_level, status')
      .eq('regatta_id', regattaId)
      .eq('user_id', user.user.id)
      .single();

    if (collabError && collabError.code !== 'PGRST116') {
      logger.warn('checkAccess: Failed to fetch collaborator', collabError);
    }

    if (collaborator && collaborator.status === 'accepted') {
      logger.debug('checkAccess: User is collaborator', { accessLevel: collaborator.access_level });
      return {
        hasAccess: true,
        accessLevel: collaborator.access_level as AccessLevel,
        isOwner: false,
        collaboratorId: collaborator.id,
      };
    }

    logger.debug('checkAccess: User has no access');
    return { hasAccess: false, isOwner: false };
  }

  // =========================================================================
  // MESSAGING
  // =========================================================================

  /**
   * Get messages for a race
   */
  async getMessages(regattaId: string, limit: number = 100): Promise<RaceMessage[]> {
    // Skip query if regattaId is not a valid UUID (e.g., demo-race)
    if (!isUuid(regattaId)) {
      logger.debug('Skipping getMessages for non-UUID regattaId:', regattaId);
      return [];
    }

    const { data: messages, error } = await supabase
      .from('race_messages')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error('Failed to get messages:', error);
      throw error;
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(messages.map((m) => m.user_id))];

    // Fetch profile data
    let profilesMap: Record<string, any> = {};
    let sailorProfilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const [profilesResult, sailorProfilesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds),
        supabase
          .from('sailor_profiles')
          .select('user_id, avatar_emoji, avatar_color, full_name')
          .in('user_id', userIds),
      ]);

      if (profilesResult.data) {
        profilesMap = Object.fromEntries(
          profilesResult.data.map((p) => [p.id, p])
        );
      }
      if (sailorProfilesResult.data) {
        sailorProfilesMap = Object.fromEntries(
          sailorProfilesResult.data.map((p) => [p.user_id, p])
        );
      }
    }

    return messages.map((row: any) => {
      const profile = profilesMap[row.user_id];
      const sailorProfile = sailorProfilesMap[row.user_id];

      return {
        ...rowToRaceMessage(row as RaceMessageRow),
        profile: profile || sailorProfile
          ? {
              fullName: sailorProfile?.full_name || profile?.full_name,
              avatarEmoji: sailorProfile?.avatar_emoji,
              avatarColor: sailorProfile?.avatar_color,
            }
          : undefined,
      };
    });
  }

  /**
   * Send a message
   */
  async sendMessage(
    regattaId: string,
    message: string,
    messageType: MessageType = 'text'
  ): Promise<RaceMessage> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('race_messages')
      .insert({
        regatta_id: regattaId,
        user_id: user.user.id,
        message,
        message_type: messageType,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }

    logger.info('Sent message', { regattaId, messageType });
    return rowToRaceMessage(data as RaceMessageRow);
  }

  /**
   * Delete a message (own messages only)
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('race_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      logger.error('Failed to delete message:', error);
      throw error;
    }
  }

  // =========================================================================
  // REALTIME SUBSCRIPTIONS
  // =========================================================================

  /**
   * Subscribe to collaborator changes for real-time updates
   * Returns unsubscribe function
   */
  subscribeToCollaborators(
    regattaId: string,
    callback: (collaborators: RaceCollaborator[]) => void
  ): () => void {
    // Skip subscription if regattaId is not a valid UUID (e.g., demo-race)
    if (!isUuid(regattaId)) {
      logger.debug('Skipping subscribeToCollaborators for non-UUID regattaId:', regattaId);
      return () => {}; // No-op unsubscribe
    }

    const channel = supabase
      .channel(`race-collaborators:${regattaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'race_collaborators',
          filter: `regatta_id=eq.${regattaId}`,
        },
        async () => {
          // Refetch all collaborators on any change
          const collaborators = await this.getCollaborators(regattaId);
          callback(collaborators);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Subscribe to message changes for real-time chat
   * Returns unsubscribe function
   */
  subscribeToMessages(
    regattaId: string,
    callback: (messages: RaceMessage[]) => void
  ): () => void {
    // Skip subscription if regattaId is not a valid UUID (e.g., demo-race)
    if (!isUuid(regattaId)) {
      logger.debug('Skipping subscribeToMessages for non-UUID regattaId:', regattaId);
      return () => {}; // No-op unsubscribe
    }

    const channel = supabase
      .channel(`race-messages:${regattaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'race_messages',
          filter: `regatta_id=eq.${regattaId}`,
        },
        async () => {
          // Refetch all messages on any change
          const messages = await this.getMessages(regattaId);
          callback(messages);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

// Export singleton instance
export const RaceCollaborationService = new RaceCollaborationServiceClass();

// Export type for dependency injection
export type RaceCollaborationServiceType = typeof RaceCollaborationService;
