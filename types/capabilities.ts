// User Capabilities Type Definitions
// Enables additive capability model where sailors can add capabilities (like coaching)

import type { CoachProfile } from './coach';

/**
 * Available capability types that can be added to a user account.
 * Currently supports 'coaching', with room for expansion (e.g., 'race_volunteer').
 */
export type CapabilityType = 'coaching';

/**
 * Database record for a user capability.
 * Maps to the `user_capabilities` table.
 */
export interface UserCapability {
  id: string;
  user_id: string;
  capability_type: CapabilityType;
  is_active: boolean;
  activated_at: string;
  deactivated_at?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Aggregated capabilities for a user.
 * Used in AuthContext to provide quick access to capability state.
 */
export interface UserCapabilities {
  /** Whether the user has an active coaching capability */
  hasCoaching: boolean;
  /** The user's coach profile if they have coaching capability */
  coachingProfile?: CoachProfile | null;
  /** Raw capability records from the database */
  rawCapabilities?: UserCapability[];
}

/**
 * Default empty capabilities state.
 * Used when user has no capabilities or during loading.
 */
export const DEFAULT_CAPABILITIES: UserCapabilities = {
  hasCoaching: false,
  coachingProfile: null,
  rawCapabilities: [],
};

/**
 * Input for adding a new capability to a user.
 */
export interface AddCapabilityInput {
  userId: string;
  capabilityType: CapabilityType;
  metadata?: Record<string, unknown>;
}

/**
 * Result of capability operations.
 */
export interface CapabilityResult {
  success: boolean;
  capability?: UserCapability;
  error?: string;
}
