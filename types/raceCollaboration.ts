/**
 * Race Collaboration Types
 *
 * Types for crew collaboration on race cards including:
 * - Collaborators (crew members with access)
 * - Messages (in-race chat)
 * - Access levels (view/full)
 */

// =========================================================================
// ACCESS LEVELS
// =========================================================================

export type AccessLevel = 'view' | 'full';
export type CollaboratorStatus = 'pending' | 'accepted' | 'declined';
export type MessageType = 'text' | 'system' | 'checklist';

// =========================================================================
// COLLABORATOR TYPES
// =========================================================================

/**
 * A collaborator on a race card
 */
export interface RaceCollaborator {
  id: string;
  regattaId: string;
  userId: string | null;
  invitedBy: string | null;
  inviteCode: string | null;
  accessLevel: AccessLevel;
  displayName: string | null;
  role: string | null;
  status: CollaboratorStatus;
  joinedAt: string | null;
  createdAt: string;
  /** User profile data loaded via join */
  profile?: {
    fullName?: string;
    avatarEmoji?: string;
    avatarColor?: string;
    email?: string;
  };
}

/**
 * Database row type for race_collaborators
 */
export interface RaceCollaboratorRow {
  id: string;
  regatta_id: string;
  user_id: string | null;
  invited_by: string | null;
  invite_code: string | null;
  access_level: string;
  display_name: string | null;
  role: string | null;
  status: string;
  joined_at: string | null;
  created_at: string;
}

// =========================================================================
// MESSAGE TYPES
// =========================================================================

/**
 * A message in race chat
 */
export interface RaceMessage {
  id: string;
  regattaId: string;
  userId: string;
  message: string;
  messageType: MessageType;
  createdAt: string;
  /** User profile data loaded via join */
  profile?: {
    fullName?: string;
    avatarEmoji?: string;
    avatarColor?: string;
  };
}

/**
 * Database row type for race_messages
 */
export interface RaceMessageRow {
  id: string;
  regatta_id: string;
  user_id: string;
  message: string;
  message_type: string;
  created_at: string;
}

// =========================================================================
// INPUT TYPES
// =========================================================================

/**
 * Input for creating an invite
 */
export interface CreateInviteInput {
  regattaId: string;
  accessLevel?: AccessLevel;
  displayName?: string;
  role?: string;
}

/**
 * Input for joining via invite code
 */
export interface JoinByInviteCodeInput {
  inviteCode: string;
  displayName?: string;
  role?: string;
}

/**
 * Result from join_race_by_invite_code RPC
 */
export interface JoinRaceResult {
  success: boolean;
  error?: string;
  regatta_id?: string;
  collaborator_id?: string;
}

/**
 * Result from create_race_collaborator_invite RPC
 */
export interface CreateInviteResult {
  success: boolean;
  error?: string;
  collaborator_id?: string;
  invite_code?: string;
}

// =========================================================================
// TRANSFORM FUNCTIONS
// =========================================================================

/**
 * Transform database row to RaceCollaborator
 */
export function rowToRaceCollaborator(row: RaceCollaboratorRow): RaceCollaborator {
  return {
    id: row.id,
    regattaId: row.regatta_id,
    userId: row.user_id,
    invitedBy: row.invited_by,
    inviteCode: row.invite_code,
    accessLevel: row.access_level as AccessLevel,
    displayName: row.display_name,
    role: row.role,
    status: row.status as CollaboratorStatus,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
  };
}

/**
 * Transform database row to RaceMessage
 */
export function rowToRaceMessage(row: RaceMessageRow): RaceMessage {
  return {
    id: row.id,
    regattaId: row.regatta_id,
    userId: row.user_id,
    message: row.message,
    messageType: row.message_type as MessageType,
    createdAt: row.created_at,
  };
}
