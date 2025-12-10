/**
 * VenueCommunityTipsService
 * 
 * Manages community-contributed local venue knowledge that feeds into AI strategy generation.
 * Sailors can share wind patterns, tactical tips, hazards, and other local knowledge.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('VenueCommunityTipsService');

// ============================================================================
// TYPES
// ============================================================================

export type TipCategory = 
  | 'wind_patterns'
  | 'current_tides'
  | 'tactical_tips'
  | 'hazards'
  | 'start_line'
  | 'marks'
  | 'shore_effects'
  | 'seasonal';

export type VerificationStatus = 
  | 'pending'
  | 'community_verified'
  | 'expert_verified'
  | 'disputed';

export type TidePhase = 'flood' | 'ebb' | 'slack_high' | 'slack_low' | 'any';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'any';

export interface VenueCommunityTip {
  id: string;
  venue_id: string;
  user_id: string;
  category: TipCategory;
  title: string;
  description: string;
  wind_direction_min?: number;
  wind_direction_max?: number;
  wind_speed_min?: number;
  wind_speed_max?: number;
  tide_phase?: TidePhase;
  season?: Season;
  confidence: number;
  upvotes: number;
  downvotes: number;
  verification_status: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  races_applied: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  // Computed fields
  score?: number;
  user_vote?: 'up' | 'down' | null;
  author_name?: string;
}

export interface CreateTipInput {
  venue_id: string;
  category: TipCategory;
  title: string;
  description: string;
  wind_direction_min?: number;
  wind_direction_max?: number;
  wind_speed_min?: number;
  wind_speed_max?: number;
  tide_phase?: TidePhase;
  season?: Season;
  confidence?: number;
}

export interface TipConditions {
  wind_direction?: number;
  wind_speed?: number;
  tide_phase?: TidePhase;
  season?: Season;
}

// Category metadata for UI
export const TIP_CATEGORIES: Record<TipCategory, { label: string; icon: string; description: string }> = {
  wind_patterns: {
    label: 'Wind Patterns',
    icon: 'weather-windy',
    description: 'Local wind behavior, seabreeze timing, thermal effects'
  },
  current_tides: {
    label: 'Current & Tides',
    icon: 'waves',
    description: 'Tidal effects, current patterns, timing considerations'
  },
  tactical_tips: {
    label: 'Tactical Tips',
    icon: 'chess-knight',
    description: 'Racing tactics specific to this venue'
  },
  hazards: {
    label: 'Hazards',
    icon: 'alert',
    description: 'Navigational hazards, shallow areas, obstacles'
  },
  start_line: {
    label: 'Start Line',
    icon: 'flag-checkered',
    description: 'Start line specific knowledge and biases'
  },
  marks: {
    label: 'Mark Knowledge',
    icon: 'map-marker',
    description: 'Tips about specific marks and roundings'
  },
  shore_effects: {
    label: 'Shore Effects',
    icon: 'island',
    description: 'Land effects on wind, geographic features'
  },
  seasonal: {
    label: 'Seasonal',
    icon: 'calendar-month',
    description: 'Time-of-year variations and patterns'
  }
};

// ============================================================================
// SERVICE
// ============================================================================

class VenueCommunityTipsServiceClass {
  
  /**
   * Get all tips for a venue, optionally filtered by category
   */
  async getTipsForVenue(
    venueId: string,
    options?: {
      category?: TipCategory;
      minScore?: number;
      limit?: number;
      includeUserVotes?: boolean;
    }
  ): Promise<VenueCommunityTip[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('venue_community_tips')
        .select('*')
        .eq('venue_id', venueId)
        .neq('verification_status', 'disputed')
        .order('upvotes', { ascending: false })
        .limit(options?.limit ?? 50);

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      const { data: tips, error } = await query;

      if (error) throw error;
      if (!tips) return [];

      // Calculate scores and fetch user votes if needed
      let enhancedTips = tips.map(tip => ({
        ...tip,
        score: this.calculateScore(tip)
      }));

      // Filter by minimum score if specified
      if (options?.minScore) {
        enhancedTips = enhancedTips.filter(tip => (tip.score ?? 0) >= options.minScore!);
      }

      // Add user votes if authenticated and requested
      if (user && options?.includeUserVotes) {
        const tipIds = tips.map(t => t.id);
        const { data: votes } = await supabase
          .from('venue_tip_votes')
          .select('tip_id, vote_type')
          .in('tip_id', tipIds)
          .eq('user_id', user.id);

        if (votes) {
          const voteMap = new Map(votes.map(v => [v.tip_id, v.vote_type]));
          enhancedTips = enhancedTips.map(tip => ({
            ...tip,
            user_vote: voteMap.get(tip.id) as 'up' | 'down' | undefined ?? null
          }));
        }
      }

      // Sort by score
      enhancedTips.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      return enhancedTips;
    } catch (error) {
      logger.error('Error fetching venue tips:', error);
      throw error;
    }
  }

  /**
   * Get tips relevant to current conditions (for AI strategy generation)
   */
  async getRelevantTipsForConditions(
    venueId: string,
    conditions: TipConditions,
    limit: number = 10
  ): Promise<VenueCommunityTip[]> {
    try {
      // Get all verified/pending tips for venue
      const { data: tips, error } = await supabase
        .from('venue_community_tips')
        .select('*')
        .eq('venue_id', venueId)
        .in('verification_status', ['pending', 'community_verified', 'expert_verified'])
        .gte('upvotes', 0); // Exclude heavily downvoted

      if (error) throw error;
      if (!tips || tips.length === 0) return [];

      // Score and rank by relevance to current conditions
      const scoredTips = tips.map(tip => ({
        ...tip,
        score: this.calculateRelevanceScore(tip, conditions)
      }));

      // Sort by relevance score and take top N
      scoredTips.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      
      return scoredTips.slice(0, limit);
    } catch (error) {
      logger.error('Error fetching relevant tips:', error);
      return [];
    }
  }

  /**
   * Format tips for inclusion in AI strategy prompt
   */
  formatTipsForAIPrompt(tips: VenueCommunityTip[]): string {
    if (tips.length === 0) return '';

    const lines = ['COMMUNITY LOCAL KNOWLEDGE:'];
    
    // Group by category
    const byCategory = tips.reduce((acc, tip) => {
      if (!acc[tip.category]) acc[tip.category] = [];
      acc[tip.category].push(tip);
      return acc;
    }, {} as Record<string, VenueCommunityTip[]>);

    for (const [category, categoryTips] of Object.entries(byCategory)) {
      const categoryLabel = TIP_CATEGORIES[category as TipCategory]?.label ?? category;
      lines.push(`\n${categoryLabel}:`);
      
      for (const tip of categoryTips.slice(0, 3)) { // Max 3 per category
        const verifiedBadge = tip.verification_status === 'expert_verified' ? ' ✓ Expert' :
                              tip.verification_status === 'community_verified' ? ' ✓ Community' : '';
        lines.push(`- ${tip.title}${verifiedBadge}: ${tip.description}`);
        
        // Add condition context if specified
        const conditions: string[] = [];
        if (tip.wind_direction_min !== null && tip.wind_direction_max !== null) {
          conditions.push(`Wind ${tip.wind_direction_min}°-${tip.wind_direction_max}°`);
        }
        if (tip.wind_speed_min !== null && tip.wind_speed_max !== null) {
          conditions.push(`${tip.wind_speed_min}-${tip.wind_speed_max}kt`);
        }
        if (tip.tide_phase && tip.tide_phase !== 'any') {
          conditions.push(`${tip.tide_phase} tide`);
        }
        if (conditions.length > 0) {
          lines.push(`  (Applies: ${conditions.join(', ')})`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Create a new community tip
   */
  async createTip(input: CreateTipInput): Promise<VenueCommunityTip> {
    try {
      logger.debug('createTip called with input:', input);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        logger.error('Auth error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      if (!user) {
        logger.error('No authenticated user');
        throw new Error('Must be authenticated to create tips');
      }
      
      logger.debug('Authenticated user:', user.id);

      const insertData = {
        ...input,
        user_id: user.id,
        confidence: input.confidence ?? 70
      };
      logger.debug('Inserting data:', insertData);

      const { data, error } = await supabase
        .from('venue_community_tips')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error('Supabase insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      logger.info('Created community tip', { tipId: data.id, venue: input.venue_id });
      return data;
    } catch (error) {
      logger.error('Error creating tip:', error);
      throw error;
    }
  }

  /**
   * Update an existing tip (only owner can update)
   */
  async updateTip(
    tipId: string, 
    updates: Partial<Omit<CreateTipInput, 'venue_id'>>
  ): Promise<VenueCommunityTip> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be authenticated to update tips');

      const { data, error } = await supabase
        .from('venue_community_tips')
        .update(updates)
        .eq('id', tipId)
        .eq('user_id', user.id) // RLS ensures only owner can update
        .select()
        .single();

      if (error) throw error;
      
      logger.info('Updated community tip', { tipId });
      return data;
    } catch (error) {
      logger.error('Error updating tip:', error);
      throw error;
    }
  }

  /**
   * Delete a tip (only owner can delete)
   */
  async deleteTip(tipId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be authenticated to delete tips');

      const { error } = await supabase
        .from('venue_community_tips')
        .delete()
        .eq('id', tipId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      logger.info('Deleted community tip', { tipId });
    } catch (error) {
      logger.error('Error deleting tip:', error);
      throw error;
    }
  }

  /**
   * Vote on a tip
   */
  async voteTip(tipId: string, voteType: 'up' | 'down'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be authenticated to vote');

      // Check for existing vote
      const { data: existingVote } = await supabase
        .from('venue_tip_votes')
        .select('id, vote_type')
        .eq('tip_id', tipId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking same type
          await supabase
            .from('venue_tip_votes')
            .delete()
            .eq('id', existingVote.id);
          logger.info('Removed vote', { tipId });
        } else {
          // Change vote
          await supabase
            .from('venue_tip_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
          logger.info('Changed vote', { tipId, voteType });
        }
      } else {
        // Get user's venue familiarity for vote weighting
        const { data: profile } = await supabase
          .from('user_venue_profiles')
          .select('familiarity_level, visit_count')
          .eq('user_id', user.id)
          .maybeSingle();

        // Create new vote
        await supabase
          .from('venue_tip_votes')
          .insert({
            tip_id: tipId,
            user_id: user.id,
            vote_type: voteType,
            user_familiarity: profile?.familiarity_level,
            races_at_venue: profile?.visit_count
          });
        logger.info('Created vote', { tipId, voteType });
      }
    } catch (error) {
      logger.error('Error voting on tip:', error);
      throw error;
    }
  }

  /**
   * Get user's tips
   */
  async getMyTips(): Promise<VenueCommunityTip[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('venue_community_tips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      logger.error('Error fetching user tips:', error);
      return [];
    }
  }

  /**
   * Mark that a tip was used in a strategy generation
   */
  async markTipUsed(tipId: string): Promise<void> {
    try {
      await supabase.rpc('increment_tip_usage', { tip_id: tipId });
    } catch (error) {
      // Non-critical, just log
      logger.warn('Failed to mark tip as used:', error);
    }
  }

  /**
   * Mark that a strategy using this tip was helpful
   */
  async markTipHelpful(tipId: string): Promise<void> {
    try {
      await supabase
        .from('venue_community_tips')
        .update({ helpful_count: supabase.rpc('increment', { x: 1 }) as any })
        .eq('id', tipId);
    } catch (error) {
      logger.warn('Failed to mark tip as helpful:', error);
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private calculateScore(tip: VenueCommunityTip): number {
    const voteScore = tip.upvotes - tip.downvotes;
    const verificationBonus = 
      tip.verification_status === 'expert_verified' ? 10 :
      tip.verification_status === 'community_verified' ? 5 : 0;
    return voteScore + verificationBonus;
  }

  private calculateRelevanceScore(tip: VenueCommunityTip, conditions: TipConditions): number {
    let score = this.calculateScore(tip);

    // Wind direction match
    if (conditions.wind_direction !== undefined && 
        tip.wind_direction_min !== null && 
        tip.wind_direction_max !== null) {
      const inRange = this.isAngleInRange(
        conditions.wind_direction, 
        tip.wind_direction_min, 
        tip.wind_direction_max
      );
      score += inRange ? 15 : -5;
    }

    // Wind speed match
    if (conditions.wind_speed !== undefined &&
        tip.wind_speed_min !== null && 
        tip.wind_speed_max !== null) {
      const inRange = conditions.wind_speed >= tip.wind_speed_min && 
                      conditions.wind_speed <= tip.wind_speed_max;
      score += inRange ? 15 : -5;
    }

    // Tide phase match
    if (conditions.tide_phase && tip.tide_phase && tip.tide_phase !== 'any') {
      score += conditions.tide_phase === tip.tide_phase ? 10 : -3;
    }

    // Season match
    if (conditions.season && tip.season && tip.season !== 'any') {
      score += conditions.season === tip.season ? 5 : -2;
    }

    return score;
  }

  private isAngleInRange(angle: number, min: number, max: number): boolean {
    // Handle wrap-around (e.g., 350-10 for NNW to NNE)
    if (min <= max) {
      return angle >= min && angle <= max;
    } else {
      return angle >= min || angle <= max;
    }
  }
}

export const venueCommunityTipsService = new VenueCommunityTipsServiceClass();

