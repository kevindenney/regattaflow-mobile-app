/**
 * SailRecommendationService
 *
 * AI-powered sail selection recommendations based on:
 * - Forecast wind conditions
 * - Boat's sail inventory with condition ratings
 * - Boat class characteristics
 * - Past performance data (when available)
 */

import { createLogger } from '@/lib/utils/logger';
import type { SailInventoryItem, GroupedSailInventory } from '@/types/raceIntentions';
import type {
  SailRecommendation,
  SailSelectionRecommendations,
} from '@/types/morningChecklist';

const logger = createLogger('SailRecommendationService');

export interface SailRecommendationRequest {
  /** Available sails grouped by category */
  sails: GroupedSailInventory;
  /** Wind conditions */
  wind: {
    speedMin?: number;
    speedMax?: number;
    average?: number;
    direction?: string;
    gusts?: number;
  };
  /** Wave/sea state */
  waveState?: string;
  /** Boat class name */
  boatClass?: string;
  /** Race type for context */
  raceType?: 'fleet' | 'distance' | 'match' | 'team';
  /** Expected race duration in hours */
  raceDuration?: number;
}

/**
 * Wind range definitions for sail selection
 */
export const WIND_RANGES = {
  light: { min: 0, max: 8, label: 'Light (0-8 kts)' },
  medium: { min: 8, max: 14, label: 'Medium (8-14 kts)' },
  fresh: { min: 14, max: 20, label: 'Fresh (14-20 kts)' },
  heavy: { min: 20, max: 35, label: 'Heavy (20+ kts)' },
} as const;

/**
 * Sail selection hints by category and wind range
 */
export const SAIL_HINTS: Record<string, Record<string, string>> = {
  mainsail: {
    light: 'Full main with maximum draft for power',
    medium: 'Standard main, moderate depth',
    fresh: 'Flatter main, reef if gusty',
    heavy: 'Reef early, flatter shape, more twist',
  },
  jib: {
    light: 'Largest headsail for light air power',
    medium: 'Standard working jib or #1',
    fresh: '#2 or smaller if available',
    heavy: '#3 or storm jib',
  },
  genoa: {
    light: 'Full genoa for maximum power',
    medium: 'Standard genoa, watch overlap',
    fresh: 'Consider changing to smaller headsail',
    heavy: 'Avoid - too much power',
  },
  spinnaker: {
    light: 'A0/Code 0 or reaching asymmetric',
    medium: 'Standard A1/A2 symmetric or asymmetric',
    fresh: 'A2/A3, consider smaller size',
    heavy: 'Heavy air runner or fractional spinnaker',
  },
  code_zero: {
    light: 'Perfect for light reaching',
    medium: 'Good for close reaching',
    fresh: 'May be overpowering',
    heavy: 'Too much load - avoid',
  },
};

/**
 * Get wind range category from speed
 */
export function getWindRange(speed: number): keyof typeof WIND_RANGES {
  if (speed <= 8) return 'light';
  if (speed <= 14) return 'medium';
  if (speed <= 20) return 'fresh';
  return 'heavy';
}

/**
 * Format sail for display
 */
function formatSailName(sail: SailInventoryItem): string {
  const parts: string[] = [];
  if (sail.customName) {
    parts.push(sail.customName);
  } else {
    if (sail.manufacturer) parts.push(sail.manufacturer);
    if (sail.model) parts.push(sail.model);
  }
  if (parts.length === 0) {
    const labels: Record<string, string> = {
      mainsail: 'Mainsail',
      jib: 'Jib',
      genoa: 'Genoa',
      spinnaker: 'Spinnaker',
      code_zero: 'Code Zero',
    };
    parts.push(labels[sail.category] || sail.category);
  }
  return parts.join(' ');
}

/**
 * Score a sail for given conditions (0-100)
 */
function scoreSail(
  sail: SailInventoryItem,
  windRange: keyof typeof WIND_RANGES,
  category: string
): number {
  let score = 50; // Base score

  // Condition rating impact (0-40 points)
  if (sail.conditionRating) {
    score += (sail.conditionRating / 100) * 40;
  } else {
    score += 20; // Assume average if unknown
  }

  // Usage freshness (0-10 points)
  if (sail.totalRacesUsed !== undefined) {
    if (sail.totalRacesUsed < 50) {
      score += 10; // Newer sail
    } else if (sail.totalRacesUsed < 100) {
      score += 5; // Moderate use
    }
    // >100 races: no bonus
  }

  // Wind range appropriateness
  // This is simplified - in reality would need more sail metadata
  const categoryHints = SAIL_HINTS[category];
  if (categoryHints) {
    const hint = categoryHints[windRange];
    // Check if sail name/model suggests heavy/light air variant
    const nameLC = `${sail.customName || ''} ${sail.model || ''}`.toLowerCase();

    if (windRange === 'heavy') {
      if (nameLC.includes('heavy') || nameLC.includes('#3') || nameLC.includes('storm')) {
        score += 10;
      }
    } else if (windRange === 'light') {
      if (nameLC.includes('light') || nameLC.includes('ap') || nameLC.includes('full')) {
        score += 10;
      }
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate reasoning for a sail recommendation
 */
function generateReasoning(
  sail: SailInventoryItem,
  windRange: keyof typeof WIND_RANGES,
  windAvg: number
): string {
  const parts: string[] = [];

  // Wind range context
  const rangeLabel = WIND_RANGES[windRange].label;
  parts.push(`For ${rangeLabel.toLowerCase()} conditions (${windAvg} kts)`);

  // Condition
  if (sail.conditionRating) {
    if (sail.conditionRating >= 80) {
      parts.push('sail in excellent condition');
    } else if (sail.conditionRating >= 60) {
      parts.push('sail in good condition');
    } else {
      parts.push('consider sail condition when trimming');
    }
  }

  // Usage
  if (sail.totalRacesUsed !== undefined) {
    if (sail.totalRacesUsed < 20) {
      parts.push('relatively new');
    } else if (sail.totalRacesUsed > 100) {
      parts.push('well-used - check for stretch');
    }
  }

  return parts.join(', ') + '.';
}

/**
 * Pick best sail from a category
 */
function pickBestSail(
  sails: SailInventoryItem[],
  windRange: keyof typeof WIND_RANGES,
  windAvg: number,
  category: string
): SailRecommendation | undefined {
  if (sails.length === 0) return undefined;

  // Score all sails
  const scored = sails.map((sail) => ({
    sail,
    score: scoreSail(sail, windRange, category),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const alternative = scored.length > 1 ? scored[1] : undefined;

  return {
    sailId: best.sail.id,
    sailName: formatSailName(best.sail),
    category: best.sail.category,
    confidence: best.score,
    reasoning: generateReasoning(best.sail, windRange, windAvg),
    windRange: WIND_RANGES[windRange].label,
    conditionRating: best.sail.conditionRating,
    alternative: alternative
      ? {
          sailId: alternative.sail.id,
          sailName: formatSailName(alternative.sail),
          reason: `Alternative option - ${alternative.score}% match`,
        }
      : undefined,
  };
}

class SailRecommendationService {
  /**
   * Generate sail selection recommendations based on conditions
   */
  async getRecommendations(
    request: SailRecommendationRequest
  ): Promise<SailSelectionRecommendations> {
    const { sails, wind, waveState, boatClass, raceType, raceDuration } = request;

    // Calculate average wind
    const windAvg =
      wind.average ||
      (wind.speedMin && wind.speedMax
        ? (wind.speedMin + wind.speedMax) / 2
        : wind.speedMin || wind.speedMax || 10);

    const windRange = getWindRange(windAvg);

    logger.debug('Generating sail recommendations', {
      windAvg,
      windRange,
      sailCounts: {
        mainsails: sails.mainsails.length,
        jibs: sails.jibs.length,
        genoas: sails.genoas.length,
        spinnakers: sails.spinnakers.length,
        codeZeros: sails.codeZeros.length,
      },
    });

    // Pick best sail for each category
    const mainsail = pickBestSail(sails.mainsails, windRange, windAvg, 'mainsail');

    // For headsail, consider both jibs and genoas
    const headsailCandidates = [...sails.jibs, ...sails.genoas];
    const headsail = pickBestSail(headsailCandidates, windRange, windAvg, 'jib');

    // For downwind, consider spinnakers and code zeros
    const downwindCandidates = [...sails.spinnakers, ...sails.codeZeros];
    const downwind = pickBestSail(downwindCandidates, windRange, windAvg, 'spinnaker');

    // Build combination reasoning
    const combinationParts: string[] = [];

    if (mainsail && headsail) {
      combinationParts.push(
        `${mainsail.sailName} paired with ${headsail.sailName}`
      );
    }

    const rangeHint = SAIL_HINTS.mainsail[windRange];
    if (rangeHint) {
      combinationParts.push(rangeHint.toLowerCase());
    }

    if (wind.gusts && wind.gusts > windAvg + 5) {
      combinationParts.push('watch for gusts - be ready to depower');
    }

    if (waveState) {
      combinationParts.push(`sea state: ${waveState.toLowerCase()}`);
    }

    // Build conditions summary
    const conditionParts: string[] = [];
    if (wind.direction) conditionParts.push(wind.direction);
    conditionParts.push(`${wind.speedMin || windAvg}-${wind.speedMax || windAvg} kts`);
    if (waveState) conditionParts.push(waveState);

    return {
      mainsail,
      headsail,
      downwind,
      combinationReasoning:
        combinationParts.length > 0
          ? combinationParts.join('. ') + '.'
          : 'Standard sail selection for expected conditions.',
      conditionsSummary: conditionParts.join(', '),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate AI-enhanced recommendations (optional)
   * Falls back to rule-based recommendations if AI unavailable
   */
  async getAIEnhancedRecommendations(
    request: SailRecommendationRequest
  ): Promise<SailSelectionRecommendations> {
    // First get rule-based recommendations
    const baseRecommendations = await this.getRecommendations(request);

    // TODO: Implement AI enhancement when skill is ready
    // For now, return rule-based recommendations
    return baseRecommendations;
  }
}

export const sailRecommendationService = new SailRecommendationService();
