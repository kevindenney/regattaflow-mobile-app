/**
 * ConditionMatchingService
 *
 * Matches current live conditions against post condition tags
 * to produce a 0-100 match score. Supports wind direction (circular),
 * wind speed (range with partial credit), tide phase (exact match),
 * wave height, current speed, and season.
 */

import type {
  ConditionTag,
  CurrentConditions,
  FeedPost,
} from '@/types/community-feed';
import { CommunityFeedService } from './CommunityFeedService';
import { supabase } from '@/services/supabase';

class ConditionMatchingServiceClass {
  /**
   * Calculate a 0-100 match score between current conditions and a condition tag
   */
  calculateMatchScore(current: CurrentConditions, tag: ConditionTag): number {
    const scores: { score: number; weight: number }[] = [];

    // Wind direction match (circular, with partial credit)
    if (
      tag.wind_direction_min != null &&
      tag.wind_direction_max != null &&
      current.windDirection != null
    ) {
      const dirScore = this.circularRangeMatch(
        current.windDirection,
        tag.wind_direction_min,
        tag.wind_direction_max
      );
      scores.push({ score: dirScore, weight: 3 });
    }

    // Wind speed match (range with partial credit)
    if (
      tag.wind_speed_min != null &&
      tag.wind_speed_max != null &&
      current.windSpeed != null
    ) {
      const speedScore = this.rangeMatch(
        current.windSpeed,
        tag.wind_speed_min,
        tag.wind_speed_max
      );
      scores.push({ score: speedScore, weight: 3 });
    }

    // Tide phase (exact match)
    if (tag.tide_phase && current.tidalState) {
      const tideScore = this.tidePhaseMatch(current.tidalState, tag.tide_phase);
      scores.push({ score: tideScore, weight: 2 });
    }

    // Wave height (range)
    if (
      tag.wave_height_min != null &&
      tag.wave_height_max != null &&
      current.waveHeight != null
    ) {
      const waveScore = this.rangeMatch(
        current.waveHeight,
        tag.wave_height_min,
        tag.wave_height_max
      );
      scores.push({ score: waveScore, weight: 1 });
    }

    // Current speed (range)
    if (
      tag.current_speed_min != null &&
      tag.current_speed_max != null &&
      current.currentSpeed != null
    ) {
      const currentScore = this.rangeMatch(
        current.currentSpeed,
        tag.current_speed_min,
        tag.current_speed_max
      );
      scores.push({ score: currentScore, weight: 1 });
    }

    // Season match
    if (tag.season && current.season) {
      const seasonScore = tag.season === current.season ? 100 : 0;
      scores.push({ score: seasonScore, weight: 1 });
    }

    if (scores.length === 0) return 0;

    // Weighted average
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedSum = scores.reduce((sum, s) => sum + s.score * s.weight, 0);

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Get a condition-matched feed: fetch posts, load their condition tags,
   * score each against live conditions, and sort by composite score
   */
  async getConditionMatchedFeed(
    venueId: string,
    currentConditions: CurrentConditions,
    page = 0,
    limit = 20
  ): Promise<{ data: FeedPost[]; count: number; nextPage: number | null }> {
    // Fetch the base feed (by new)
    const result = await CommunityFeedService.getFeed({
      venueId,
      sort: 'new',
      page,
      limit: limit * 2, // Fetch more to allow re-sorting
    });

    // Load condition tags for all posts
    const postIds = result.data.map(p => p.id);
    if (postIds.length === 0) return result;

    const { data: allCondTags } = await supabase
      .from('venue_post_condition_tags')
      .select('*')
      .in('discussion_id', postIds);

    const tagsByPost = new Map<string, ConditionTag[]>();
    for (const tag of allCondTags || []) {
      const existing = tagsByPost.get(tag.discussion_id) || [];
      existing.push(tag);
      tagsByPost.set(tag.discussion_id, existing);
    }

    // Score each post
    const scoredPosts = result.data.map(post => {
      const tags = tagsByPost.get(post.id) || [];
      post.condition_tags = tags;

      if (tags.length === 0) {
        post.condition_match_score = 0;
        return post;
      }

      // Use the best-matching tag's score
      const bestScore = Math.max(
        ...tags.map(t => this.calculateMatchScore(currentConditions, t))
      );
      post.condition_match_score = bestScore;
      return post;
    });

    // Composite sort: condition_score * 0.7 + recency_score * 0.3
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    scoredPosts.sort((a, b) => {
      const aCondScore = a.condition_match_score || 0;
      const bCondScore = b.condition_match_score || 0;

      const aAge = now - new Date(a.created_at).getTime();
      const bAge = now - new Date(b.created_at).getTime();

      const aRecency = Math.max(0, 100 * (1 - aAge / maxAge));
      const bRecency = Math.max(0, 100 * (1 - bAge / maxAge));

      const aComposite = aCondScore * 0.7 + aRecency * 0.3;
      const bComposite = bCondScore * 0.7 + bRecency * 0.3;

      return bComposite - aComposite;
    });

    // Trim to requested limit
    const trimmed = scoredPosts.slice(0, limit);

    return {
      data: trimmed,
      count: result.count,
      nextPage: result.nextPage,
    };
  }

  // ============================================================================
  // PRIVATE: Matching helpers
  // ============================================================================

  /**
   * Match a value within a numeric range with partial credit
   * Returns 100 if within range, decreasing score as you move away
   */
  private rangeMatch(value: number, min: number, max: number): number {
    if (value >= min && value <= max) return 100;

    const rangeWidth = max - min || 1;
    const tolerance = rangeWidth * 0.5; // 50% of range width as tolerance

    if (value < min) {
      const diff = min - value;
      return Math.max(0, 100 - (diff / tolerance) * 100);
    } else {
      const diff = value - max;
      return Math.max(0, 100 - (diff / tolerance) * 100);
    }
  }

  /**
   * Match wind direction within a circular range (0-359)
   * Handles wrap-around (e.g., 350-10 degrees)
   */
  private circularRangeMatch(value: number, min: number, max: number): number {
    // Normalize to 0-359
    value = ((value % 360) + 360) % 360;
    min = ((min % 360) + 360) % 360;
    max = ((max % 360) + 360) % 360;

    let inRange: boolean;
    if (min <= max) {
      inRange = value >= min && value <= max;
    } else {
      // Wraps around (e.g., 350 to 10)
      inRange = value >= min || value <= max;
    }

    if (inRange) return 100;

    // Calculate angular distance to nearest edge
    const distToMin = this.angularDistance(value, min);
    const distToMax = this.angularDistance(value, max);
    const nearestDist = Math.min(distToMin, distToMax);

    // Partial credit: within 45 degrees gets some score
    const tolerance = 45;
    return Math.max(0, 100 - (nearestDist / tolerance) * 100);
  }

  /**
   * Angular distance between two angles (0-180)
   */
  private angularDistance(a: number, b: number): number {
    const diff = Math.abs(a - b);
    return diff > 180 ? 360 - diff : diff;
  }

  /**
   * Match tide phases with partial credit for related phases
   */
  private tidePhaseMatch(current: string, tagged: string): number {
    if (current === tagged) return 100;

    // Related phases get partial credit
    const related: Record<string, string[]> = {
      rising: ['flood', 'low'],
      falling: ['ebb', 'high'],
      high: ['falling'],
      low: ['rising'],
      ebb: ['falling', 'high'],
      flood: ['rising', 'low'],
    };

    if (related[current]?.includes(tagged)) return 50;
    return 0;
  }
}

export const ConditionMatchingService = new ConditionMatchingServiceClass();
