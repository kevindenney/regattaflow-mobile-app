/**
 * Subscription Team Types
 *
 * Types for subscription-level team management, allowing Team plan subscribers
 * to share their subscription benefits with up to 5 team members.
 */

export interface SubscriptionTeam {
  id: string;
  owner_id: string;
  name: string;
  max_seats: number;
  invite_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTeamMember {
  id: string;
  team_id: string;
  user_id: string | null;
  email: string;
  role: 'owner' | 'member';
  status: 'pending' | 'active';
  invited_at: string;
  joined_at: string | null;
}

export interface SubscriptionTeamMemberWithProfile extends SubscriptionTeamMember {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface SubscriptionTeamWithMembers extends SubscriptionTeam {
  members: SubscriptionTeamMemberWithProfile[];
}

export interface SubscriptionTeamInvite {
  team_id: string;
  team_name: string;
  owner_name: string;
  owner_email: string;
  invite_code: string;
  max_seats: number;
  current_seats: number;
}

export interface InviteResult {
  success: boolean;
  error?: string;
  team_id?: string;
  team_name?: string;
}

export interface TeamMemberInviteRequest {
  team_id: string;
  email: string;
}

export interface TeamSeatUsage {
  used: number;
  max: number;
  available: number;
}
