/**
 * Crew Management Service
 * Manages crew members, invites, and team collaboration
 */

import { supabase } from './supabase';

export type CrewRole = 'helmsman' | 'tactician' | 'trimmer' | 'bowman' | 'pit' | 'grinder' | 'other';
export type CrewAccessLevel = 'view' | 'edit' | 'full';
export type CrewStatus = 'active' | 'pending' | 'inactive';

export interface CrewMember {
  id: string;
  sailorId: string;
  classId: string;
  userId?: string;
  email: string;
  name: string;
  role: CrewRole;
  accessLevel: CrewAccessLevel;
  status: CrewStatus;
  inviteToken?: string;
  inviteSentAt?: string;
  inviteAcceptedAt?: string;
  notes?: string;
  performanceNotes: Array<{ date: string; race: string; note: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CrewInvite {
  email: string;
  name: string;
  role: CrewRole;
  accessLevel?: CrewAccessLevel;
  notes?: string;
}

class CrewManagementService {
  /**
   * Get all crew members for a sailor's class
   */
  async getCrewForClass(sailorId: string, classId: string): Promise<CrewMember[]> {
    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('sailor_id', sailorId)
      .eq('class_id', classId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching crew members:', error);
      throw error;
    }

    return this.mapCrewMembers(data || []);
  }

  /**
   * Get all crew members across all sailor's classes
   */
  async getAllCrew(sailorId: string): Promise<CrewMember[]> {
    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('sailor_id', sailorId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching all crew members:', error);
      throw error;
    }

    return this.mapCrewMembers(data || []);
  }

  /**
   * Invite a new crew member
   */
  async inviteCrewMember(
    sailorId: string,
    classId: string,
    invite: CrewInvite
  ): Promise<CrewMember> {
    const { data, error } = await supabase
      .from('crew_members')
      .insert({
        sailor_id: sailorId,
        class_id: classId,
        email: invite.email.toLowerCase(),
        name: invite.name,
        role: invite.role,
        access_level: invite.accessLevel || 'view',
        status: 'pending',
        notes: invite.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inviting crew member:', error);
      throw error;
    }

    // TODO: Send email invite with token
    // await this.sendInviteEmail(data);

    return this.mapCrewMember(data);
  }

  /**
   * Update crew member details
   */
  async updateCrewMember(
    crewMemberId: string,
    updates: Partial<{
      name: string;
      role: CrewRole;
      accessLevel: CrewAccessLevel;
      status: CrewStatus;
      notes: string;
    }>
  ): Promise<CrewMember> {
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.accessLevel !== undefined) dbUpdates.access_level = updates.accessLevel;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { data, error } = await supabase
      .from('crew_members')
      .update(dbUpdates)
      .eq('id', crewMemberId)
      .select()
      .single();

    if (error) {
      console.error('Error updating crew member:', error);
      throw error;
    }

    return this.mapCrewMember(data);
  }

  /**
   * Remove crew member
   */
  async removeCrewMember(crewMemberId: string): Promise<void> {
    const { error } = await supabase
      .from('crew_members')
      .delete()
      .eq('id', crewMemberId);

    if (error) {
      console.error('Error removing crew member:', error);
      throw error;
    }
  }

  /**
   * Accept crew invitation (called by invited user)
   */
  async acceptInvite(inviteToken: string, userId: string): Promise<CrewMember> {
    // Find the invite
    const { data: inviteData, error: findError } = await supabase
      .from('crew_members')
      .select('*')
      .eq('invite_token', inviteToken)
      .eq('status', 'pending')
      .single();

    if (findError || !inviteData) {
      throw new Error('Invalid or expired invite');
    }

    // Update with user ID and activate
    const { data, error } = await supabase
      .from('crew_members')
      .update({
        user_id: userId,
        status: 'active',
        invite_accepted_at: new Date().toISOString(),
      })
      .eq('id', inviteData.id)
      .select()
      .single();

    if (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }

    return this.mapCrewMember(data);
  }

  /**
   * Resend crew invitation
   */
  async resendInvite(crewMemberId: string): Promise<void> {
    const { data, error } = await supabase
      .from('crew_members')
      .update({
        invite_sent_at: new Date().toISOString(),
      })
      .eq('id', crewMemberId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      console.error('Error resending invite:', error);
      throw error;
    }

    // TODO: Send email invite
    // await this.sendInviteEmail(data);
  }

  /**
   * Add performance note for crew member
   */
  async addPerformanceNote(
    crewMemberId: string,
    note: { date: string; race: string; note: string }
  ): Promise<void> {
    // Get current notes
    const { data: current, error: fetchError } = await supabase
      .from('crew_members')
      .select('performance_notes')
      .eq('id', crewMemberId)
      .single();

    if (fetchError) {
      console.error('Error fetching current notes:', fetchError);
      throw fetchError;
    }

    const currentNotes = current?.performance_notes || [];
    const updatedNotes = [...currentNotes, note];

    // Update with new note
    const { error: updateError } = await supabase
      .from('crew_members')
      .update({ performance_notes: updatedNotes })
      .eq('id', crewMemberId);

    if (updateError) {
      console.error('Error adding performance note:', updateError);
      throw updateError;
    }
  }

  /**
   * Get crew statistics for a sailor
   */
  async getCrewStats(sailorId: string): Promise<{
    totalCrew: number;
    activeCrew: number;
    pendingInvites: number;
    crewByRole: Record<CrewRole, number>;
  }> {
    const crew = await this.getAllCrew(sailorId);

    const stats = {
      totalCrew: crew.length,
      activeCrew: crew.filter(c => c.status === 'active').length,
      pendingInvites: crew.filter(c => c.status === 'pending').length,
      crewByRole: {} as Record<CrewRole, number>,
    };

    // Count by role
    crew.forEach(member => {
      stats.crewByRole[member.role] = (stats.crewByRole[member.role] || 0) + 1;
    });

    return stats;
  }

  /**
   * Check if crew is assigned for a race
   */
  async checkCrewAssignment(sailorId: string, classId: string): Promise<boolean> {
    const crew = await this.getCrewForClass(sailorId, classId);
    const activeCrew = crew.filter(c => c.status === 'active');
    
    // Consider crew assigned if there's at least one active crew member
    return activeCrew.length > 0;
  }

  // Helper methods
  private mapCrewMember(data: any): CrewMember {
    return {
      id: data.id,
      sailorId: data.sailor_id,
      classId: data.class_id,
      userId: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
      accessLevel: data.access_level,
      status: data.status,
      inviteToken: data.invite_token,
      inviteSentAt: data.invite_sent_at,
      inviteAcceptedAt: data.invite_accepted_at,
      notes: data.notes,
      performanceNotes: data.performance_notes || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapCrewMembers(data: any[]): CrewMember[] {
    return data.map(item => this.mapCrewMember(item));
  }

  /**
   * Send invite email (placeholder for future implementation)
   */
  private async sendInviteEmail(crewMember: any): Promise<void> {
    // TODO: Implement email sending via Supabase Edge Function or third-party service
    console.log(`Would send invite email to ${crewMember.email} with token ${crewMember.invite_token}`);
  }
}

export const crewManagementService = new CrewManagementService();
