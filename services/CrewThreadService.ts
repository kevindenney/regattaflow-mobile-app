/**
 * CrewThreadService
 *
 * Service for managing persistent crew chat threads.
 * Handles CRUD operations for threads, members, and messages.
 */

import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CrewThreadService');

// =============================================================================
// TYPES
// =============================================================================

export type ThreadType = 'direct' | 'group' | 'fleet' | 'crew';

export interface CrewThread {
  id: string;
  name: string;
  ownerId: string;
  avatarEmoji: string;
  threadType: ThreadType;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageUserId: string | null;
  role: 'owner' | 'admin' | 'member';
  memberCount?: number;
  // For direct threads, the other user's info
  otherUser?: {
    id: string;
    fullName: string | null;
    avatarEmoji: string | null;
    avatarColor: string | null;
  } | null;
}

export interface CrewThreadMember {
  id: string;
  threadId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  lastReadAt: string;
  // Profile data
  fullName?: string;
  avatarEmoji?: string;
  avatarColor?: string;
}

export interface CrewThreadMessage {
  id: string;
  threadId: string;
  userId: string;
  message: string;
  messageType: 'text' | 'system' | 'image';
  createdAt: string;
  // Profile data
  profile?: {
    fullName: string | null;
    avatarEmoji: string | null;
    avatarColor: string | null;
  };
}

export interface CreateThreadInput {
  name: string;
  avatarEmoji?: string;
  threadType?: ThreadType;
  memberIds?: string[]; // User IDs to add as initial members
}

// =============================================================================
// SERVICE
// =============================================================================

export class CrewThreadService {
  /**
   * Get all threads for the current user
   */
  static async getMyThreads(options?: { type?: ThreadType }): Promise<CrewThread[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.debug('No user authenticated, returning empty threads');
        return [];
      }

      let query = supabase
        .from('crew_threads_with_details')
        .select('*')
        .eq('member_user_id', user.id)
        .order('updated_at', { ascending: false });

      // Filter by type if specified
      if (options?.type) {
        query = query.eq('thread_type', options.type);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to get threads:', error);
        return [];
      }

      // Get member counts for each thread
      const threadIds = (data || []).map((t: any) => t.id);
      const { data: memberCounts } = await supabase
        .from('crew_thread_members')
        .select('thread_id')
        .in('thread_id', threadIds);

      const countMap = new Map<string, number>();
      (memberCounts || []).forEach((m: any) => {
        countMap.set(m.thread_id, (countMap.get(m.thread_id) || 0) + 1);
      });

      // For direct threads, fetch the other user's profile
      const directThreadIds = (data || [])
        .filter((t: any) => t.thread_type === 'direct')
        .map((t: any) => t.id);

      const otherUserMap = new Map<string, any>();

      if (directThreadIds.length > 0) {
        // Get all members of direct threads
        const { data: directMembers } = await supabase
          .from('crew_thread_members')
          .select('thread_id, user_id')
          .in('thread_id', directThreadIds)
          .neq('user_id', user.id);

        if (directMembers && directMembers.length > 0) {
          const otherUserIds = [...new Set(directMembers.map((m: any) => m.user_id))];
          const { data: otherProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_emoji, avatar_color')
            .in('id', otherUserIds);

          // Build a map from thread_id to the other user's profile
          const profileMap = new Map<string, any>();
          (otherProfiles || []).forEach((p: any) => {
            profileMap.set(p.id, p);
          });

          directMembers.forEach((m: any) => {
            const profile = profileMap.get(m.user_id);
            if (profile) {
              otherUserMap.set(m.thread_id, {
                id: profile.id,
                fullName: profile.full_name,
                avatarEmoji: profile.avatar_emoji,
                avatarColor: profile.avatar_color,
              });
            }
          });
        }
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        avatarEmoji: row.avatar_emoji || '⛵',
        threadType: (row.thread_type || 'group') as ThreadType,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        unreadCount: row.unread_count || 0,
        lastMessage: row.last_message,
        lastMessageAt: row.last_message_at,
        lastMessageUserId: row.last_message_user_id || null,
        role: row.role as 'owner' | 'admin' | 'member',
        memberCount: countMap.get(row.id) || 1,
        otherUser: otherUserMap.get(row.id) || null,
      }));
    } catch (error) {
      logger.error('getMyThreads failed:', error);
      return [];
    }
  }

  /**
   * Get a single thread by ID
   */
  static async getThread(threadId: string): Promise<CrewThread | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('crew_threads_with_details')
        .select('*')
        .eq('id', threadId)
        .eq('member_user_id', user.id)
        .single();

      if (error) {
        logger.error('Failed to get thread:', error);
        return null;
      }

      // Get member count
      const { count } = await supabase
        .from('crew_thread_members')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', threadId);

      // For direct threads, get the other user's info
      let otherUser = null;
      if (data.thread_type === 'direct') {
        const { data: otherMember } = await supabase
          .from('crew_thread_members')
          .select('user_id')
          .eq('thread_id', threadId)
          .neq('user_id', user.id)
          .single();

        if (otherMember) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_emoji, avatar_color')
            .eq('id', otherMember.user_id)
            .single();

          if (profile) {
            otherUser = {
              id: profile.id,
              fullName: profile.full_name,
              avatarEmoji: profile.avatar_emoji,
              avatarColor: profile.avatar_color,
            };
          }
        }
      }

      return {
        id: data.id,
        name: data.name,
        ownerId: data.owner_id,
        avatarEmoji: data.avatar_emoji || '⛵',
        threadType: (data.thread_type || 'group') as ThreadType,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        unreadCount: data.unread_count || 0,
        lastMessage: data.last_message,
        lastMessageAt: data.last_message_at,
        lastMessageUserId: data.last_message_user_id || null,
        role: data.role as 'owner' | 'admin' | 'member',
        memberCount: count || 1,
        otherUser,
      };
    } catch (error) {
      logger.error('getThread failed:', error);
      return null;
    }
  }

  /**
   * Create a new thread
   */
  static async createThread(input: CreateThreadInput): Promise<CrewThread | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const threadType = input.threadType || 'group';

      // Create the thread
      const { data: thread, error: threadError } = await supabase
        .from('crew_threads')
        .insert({
          name: input.name,
          owner_id: user.id,
          avatar_emoji: input.avatarEmoji || (threadType === 'direct' ? '💬' : '⛵'),
          thread_type: threadType,
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Add owner as first member
      const { error: memberError } = await supabase
        .from('crew_thread_members')
        .insert({
          thread_id: thread.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        // Rollback thread creation
        await supabase.from('crew_threads').delete().eq('id', thread.id);
        throw memberError;
      }

      // Add additional members if provided
      if (input.memberIds && input.memberIds.length > 0) {
        const additionalMembers = input.memberIds
          .filter((id) => id !== user.id)
          .map((userId) => ({
            thread_id: thread.id,
            user_id: userId,
            role: 'member',
          }));

        if (additionalMembers.length > 0) {
          await supabase.from('crew_thread_members').insert(additionalMembers);
        }
      }

      return {
        id: thread.id,
        name: thread.name,
        ownerId: thread.owner_id,
        avatarEmoji: thread.avatar_emoji || '⛵',
        threadType: (thread.thread_type || 'group') as ThreadType,
        createdAt: thread.created_at,
        updatedAt: thread.updated_at,
        unreadCount: 0,
        lastMessage: null,
        lastMessageAt: null,
        lastMessageUserId: null,
        role: 'owner',
        memberCount: 1 + (input.memberIds?.filter((id) => id !== user.id).length || 0),
        otherUser: null,
      };
    } catch (error) {
      logger.error('createThread failed:', error);
      return null;
    }
  }

  /**
   * Update a thread
   */
  static async updateThread(
    threadId: string,
    updates: { name?: string; avatarEmoji?: string }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crew_threads')
        .update({
          name: updates.name,
          avatar_emoji: updates.avatarEmoji,
          updated_at: new Date().toISOString(),
        })
        .eq('id', threadId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('updateThread failed:', error);
      return false;
    }
  }

  /**
   * Delete a thread
   */
  static async deleteThread(threadId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crew_threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('deleteThread failed:', error);
      return false;
    }
  }

  /**
   * Get threads with unread messages
   */
  static async getUnreadThreads(): Promise<CrewThread[]> {
    const allThreads = await this.getMyThreads();
    return allThreads.filter((t) => t.unreadCount > 0);
  }

  /**
   * Get only group-type threads (excludes direct messages)
   */
  static async getGroupThreads(): Promise<CrewThread[]> {
    const allThreads = await this.getMyThreads();
    return allThreads.filter((t) => t.threadType !== 'direct');
  }

  /**
   * Get or create a direct message thread with another user
   */
  static async getOrCreateDirectThread(otherUserId: string): Promise<CrewThread | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use the database function to find or create the thread
      const { data, error } = await supabase.rpc('find_or_create_direct_thread', {
        other_user_id: otherUserId,
      });

      if (error) {
        logger.error('getOrCreateDirectThread rpc failed:', error);
        // Fallback: try to find existing thread manually
        return this.findOrCreateDirectThreadFallback(user.id, otherUserId);
      }

      // Fetch the full thread data
      if (data) {
        return this.getThread(data);
      }

      return null;
    } catch (error) {
      logger.error('getOrCreateDirectThread failed:', error);
      return null;
    }
  }

  /**
   * Fallback method if RPC is not available
   */
  private static async findOrCreateDirectThreadFallback(
    currentUserId: string,
    otherUserId: string
  ): Promise<CrewThread | null> {
    try {
      // Look for existing direct thread
      const allThreads = await this.getMyThreads({ type: 'direct' });
      const existingThread = allThreads.find((t) => t.otherUser?.id === otherUserId);

      if (existingThread) {
        return existingThread;
      }

      // Get other user's name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', otherUserId)
        .single();

      // Create new direct thread
      return this.createThread({
        name: profile?.full_name || 'Direct Message',
        avatarEmoji: '💬',
        threadType: 'direct',
        memberIds: [otherUserId],
      });
    } catch (error) {
      logger.error('findOrCreateDirectThreadFallback failed:', error);
      return null;
    }
  }

  // ===========================================================================
  // MEMBERS
  // ===========================================================================

  /**
   * Get members of a thread
   */
  static async getThreadMembers(threadId: string): Promise<CrewThreadMember[]> {
    try {
      // First get members
      const { data: members, error: membersError } = await supabase
        .from('crew_thread_members')
        .select('*')
        .eq('thread_id', threadId);

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      // Then get profiles for all member user IDs
      const userIds = members.map((m: any) => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_emoji, avatar_color')
        .in('id', userIds);

      if (profilesError) {
        logger.warn('Failed to load profiles for members:', profilesError);
      }

      // Create a map for quick profile lookup
      const profileMap = new Map<string, any>();
      (profiles || []).forEach((p: any) => {
        profileMap.set(p.id, p);
      });

      return members.map((row: any) => {
        const profile = profileMap.get(row.user_id);
        return {
          id: row.id,
          threadId: row.thread_id,
          userId: row.user_id,
          role: row.role as 'owner' | 'admin' | 'member',
          joinedAt: row.joined_at,
          lastReadAt: row.last_read_at,
          fullName: profile?.full_name || null,
          avatarEmoji: profile?.avatar_emoji || null,
          avatarColor: profile?.avatar_color || null,
        };
      });
    } catch (error) {
      logger.error('getThreadMembers failed:', error);
      return [];
    }
  }

  /**
   * Add a member to a thread
   */
  static async addMember(threadId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crew_thread_members')
        .insert({
          thread_id: threadId,
          user_id: userId,
          role: 'member',
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('addMember failed:', error);
      return false;
    }
  }

  /**
   * Remove a member from a thread
   */
  static async removeMember(threadId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crew_thread_members')
        .delete()
        .eq('thread_id', threadId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('removeMember failed:', error);
      return false;
    }
  }

  /**
   * Leave a thread (current user)
   */
  static async leaveThread(threadId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      return this.removeMember(threadId, user.id);
    } catch (error) {
      logger.error('leaveThread failed:', error);
      return false;
    }
  }

  /**
   * Mark thread as read (update last_read_at)
   */
  static async markAsRead(threadId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('crew_thread_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('markAsRead failed:', error);
      return false;
    }
  }

  // ===========================================================================
  // MESSAGES
  // ===========================================================================

  /**
   * Get messages for a thread
   */
  static async getMessages(
    threadId: string,
    options?: { limit?: number; before?: string }
  ): Promise<CrewThreadMessage[]> {
    try {
      let query = supabase
        .from('crew_thread_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.before) {
        query = query.lt('created_at', options.before);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Batch-load profiles
      const userIds = [...new Set((data || []).map((m: any) => m.user_id))];
      const profileMap = new Map<string, any>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_emoji, avatar_color')
          .in('id', userIds);

        (profiles || []).forEach((p: any) => {
          profileMap.set(p.id, {
            fullName: p.full_name,
            avatarEmoji: p.avatar_emoji,
            avatarColor: p.avatar_color,
          });
        });
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        threadId: row.thread_id,
        userId: row.user_id,
        message: row.message,
        messageType: row.message_type as 'text' | 'system' | 'image',
        createdAt: row.created_at,
        profile: profileMap.get(row.user_id) || null,
      }));
    } catch (error) {
      logger.error('getMessages failed:', error);
      return [];
    }
  }

  /**
   * Send a message to a thread
   */
  static async sendMessage(
    threadId: string,
    message: string,
    messageType: 'text' | 'system' = 'text'
  ): Promise<CrewThreadMessage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('crew_thread_messages')
        .insert({
          thread_id: threadId,
          user_id: user.id,
          message: message.trim(),
          message_type: messageType,
        })
        .select()
        .single();

      if (error) throw error;

      // Get profile for return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_emoji, avatar_color')
        .eq('id', user.id)
        .maybeSingle();

      return {
        id: data.id,
        threadId: data.thread_id,
        userId: data.user_id,
        message: data.message,
        messageType: data.message_type as 'text' | 'system' | 'image',
        createdAt: data.created_at,
        profile: profile
          ? {
              fullName: profile.full_name,
              avatarEmoji: profile.avatar_emoji,
              avatarColor: profile.avatar_color,
            }
          : null,
      };
    } catch (error) {
      logger.error('sendMessage failed:', error);
      return null;
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crew_thread_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('deleteMessage failed:', error);
      return false;
    }
  }

  // ===========================================================================
  // UTILS
  // ===========================================================================

  /**
   * Get total unread count across all threads
   */
  static async getTotalUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from('crew_threads_with_details')
        .select('unread_count')
        .eq('member_user_id', user.id);

      if (error) throw error;

      return (data || []).reduce((sum: number, row: any) => sum + (row.unread_count || 0), 0);
    } catch (error) {
      logger.error('getTotalUnreadCount failed:', error);
      return 0;
    }
  }

  /**
   * Search for users to add to a thread
   */
  static async searchUsers(query: string): Promise<{
    users: Array<{
      id: string;
      fullName: string;
      avatarEmoji: string | null;
      avatarColor: string | null;
    }>;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { users: [], error: 'Not authenticated' };

      // Search profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .neq('id', user.id)
        .ilike('full_name', `%${query}%`)
        .limit(10);

      if (profilesError) {
        logger.warn('searchUsers profiles query failed:', profilesError.message);
        return { users: [], error: 'Search unavailable' };
      }

      if (!profiles || profiles.length === 0) {
        return { users: [] };
      }

      // Get sailor_profiles for avatar data
      const userIds = profiles.map(p => p.id);
      const { data: sailorProfiles } = await supabase
        .from('sailor_profiles')
        .select('user_id, avatar_emoji, avatar_color')
        .in('user_id', userIds);

      // Create a map of user_id -> avatar data
      const avatarMap = new Map<string, { emoji: string | null; color: string | null }>();
      for (const sp of sailorProfiles || []) {
        avatarMap.set(sp.user_id, {
          emoji: sp.avatar_emoji,
          color: sp.avatar_color,
        });
      }

      return {
        users: profiles.map((p: any) => {
          const avatar = avatarMap.get(p.id);
          return {
            id: p.id,
            fullName: p.full_name || 'Unknown',
            avatarEmoji: avatar?.emoji || null,
            avatarColor: avatar?.color || null,
          };
        }),
      };
    } catch (error: any) {
      logger.error('searchUsers failed:', error);
      return { users: [], error: error.message || 'Search failed' };
    }
  }
}

export default CrewThreadService;
