/**
 * Community Types
 *
 * TypeScript types for the Reddit-inspired community system.
 * Communities can represent venues, boat classes, races, sailmakers, gear, rules, tactics, etc.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type CommunityType =
  | 'venue'       // Physical sailing location
  | 'boat_class'  // Dragon, Laser, J/70, etc.
  | 'race'        // Specific regatta/event
  | 'sailmaker'   // North, Doyle, Quantum, etc.
  | 'gear'        // Foul weather gear, sunglasses, electronics
  | 'rules'       // Racing rules, protests, marks
  | 'tactics'     // General tactical discussion
  | 'tuning'      // Rig tuning, sail trim
  | 'general';    // Catch-all

export type CommunityMemberRole = 'member' | 'moderator' | 'admin';

export type LinkedEntityType = 'sailing_venue' | 'boat_class' | 'catalog_race' | 'club';

export const COMMUNITY_TYPE_CONFIG: Record<CommunityType, {
  label: string;
  pluralLabel: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  venue: {
    label: 'Venue',
    pluralLabel: 'Venues',
    icon: 'location-outline',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  boat_class: {
    label: 'Boat Class',
    pluralLabel: 'Boat Classes',
    icon: 'boat-outline',
    color: '#2563EB',
    bgColor: '#DBEAFE',
  },
  race: {
    label: 'Race',
    pluralLabel: 'Races',
    icon: 'trophy-outline',
    color: '#EA580C',
    bgColor: '#FFEDD5',
  },
  sailmaker: {
    label: 'Sailmaker',
    pluralLabel: 'Sailmakers',
    icon: 'flag-outline',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
  gear: {
    label: 'Gear',
    pluralLabel: 'Gear',
    icon: 'construct-outline',
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  rules: {
    label: 'Rules',
    pluralLabel: 'Rules',
    icon: 'book-outline',
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  tactics: {
    label: 'Tactics',
    pluralLabel: 'Tactics',
    icon: 'compass-outline',
    color: '#0891B2',
    bgColor: '#CFFAFE',
  },
  tuning: {
    label: 'Tuning',
    pluralLabel: 'Tuning',
    icon: 'settings-outline',
    color: '#4F46E5',
    bgColor: '#E0E7FF',
  },
  general: {
    label: 'General',
    pluralLabel: 'General',
    icon: 'chatbubbles-outline',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
};

// ============================================================================
// CORE TYPES
// ============================================================================

export interface CommunityCategory {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  community_type: CommunityType;
  category_id: string | null;
  icon_url: string | null;
  banner_url: string | null;
  member_count: number;
  post_count: number;
  created_by: string | null;
  is_official: boolean;
  is_verified: boolean;
  linked_entity_type: LinkedEntityType | null;
  linked_entity_id: string | null;
  metadata: CommunityMetadata;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  // Joined fields
  category?: CommunityCategory;
  // Computed fields (from view)
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  posts_last_24h?: number;
  new_members_7d?: number;
  // User-specific fields
  is_member?: boolean;
  user_role?: CommunityMemberRole | null;
}

export interface CommunityMetadata {
  // Venue metadata
  country?: string;
  region?: string;
  venue_type?: string;
  lat?: number;
  lng?: number;
  // Boat class metadata
  crew_size?: number;
  class_type?: string;
  boat_type?: string;
  // Sailmaker metadata
  website?: string;
  // Gear metadata
  subtopics?: string[];
  // Generic
  [key: string]: unknown;
}

export interface CommunityMembership {
  id: string;
  user_id: string;
  community_id: string;
  role: CommunityMemberRole;
  notifications_enabled: boolean;
  joined_at: string;
  // Joined fields
  community?: Community;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CommunityFlair {
  id: string;
  community_id: string;
  name: string;
  display_name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

// ============================================================================
// PARAMS
// ============================================================================

export interface CreateCommunityParams {
  name: string;
  description?: string;
  community_type: CommunityType;
  category_id?: string;
  icon_url?: string;
  banner_url?: string;
  linked_entity_type?: LinkedEntityType;
  linked_entity_id?: string;
  metadata?: CommunityMetadata;
}

export interface UpdateCommunityParams {
  name?: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  metadata?: CommunityMetadata;
}

export interface CommunitySearchParams {
  query?: string;
  category_id?: string;
  community_type?: CommunityType;
  is_official?: boolean;
  limit?: number;
  offset?: number;
}

export interface CommunitiesListParams {
  category_id?: string;
  community_type?: CommunityType;
  sort?: 'popular' | 'new' | 'active' | 'alphabetical';
  limit?: number;
  offset?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface CommunityListResponse {
  data: Community[];
  count: number;
  hasMore: boolean;
}

export interface UserCommunitiesResponse {
  joined: Community[];
  moderated: Community[];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface CommunityStats {
  member_count: number;
  post_count: number;
  posts_last_24h: number;
  new_members_7d: number;
  active_now: number;
}

export interface CommunityDiscoverSection {
  title: string;
  communities: Community[];
  showMoreLink?: string;
}
