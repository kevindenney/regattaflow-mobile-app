/**
 * Race Tuning Service
 * Builds race-ready rig tuning recommendations by blending extracted tuning guide content
 * with forecast conditions for the active boat class.
 */

import { tuningGuideService, type TuningGuide } from './tuningGuideService';
import type { ExtractedSection } from './TuningGuideExtractionService';
import { createLogger } from '@/lib/utils/logger';

export interface RaceTuningRequest {
  classId?: string | null;
  className?: string | null;
  averageWindSpeed?: number | null;
  pointsOfSail?: 'upwind' | 'downwind' | 'reach' | 'all';
  limit?: number;
}

export interface RaceTuningSetting {
  key: string;
  label: string;
  value: string;
  rawKey?: string;
}

export interface RaceTuningRecommendation {
  guideId: string;
  guideTitle: string;
  guideSource: string;
  sectionTitle?: string;
  conditionSummary?: string;
  notes?: string;
  settings: RaceTuningSetting[];
}

const logger = createLogger('RaceTuningService');

class RaceTuningService {
  async getRecommendations({
    classId,
    className,
    averageWindSpeed,
    pointsOfSail = 'all',
    limit = 1,
  }: RaceTuningRequest): Promise<RaceTuningRecommendation[]> {
    if (!classId && !className) {
      logger.debug('[RaceTuningService] No class reference provided, skipping tuning lookup');
      return [];
    }

    try {
      const guides = await tuningGuideService.getGuidesByReference({ classId, className });
      const candidateSections = this.collectCandidateSections(
        guides,
        averageWindSpeed ?? undefined,
        pointsOfSail
      );

      if (candidateSections.length === 0) {
        logger.debug('[RaceTuningService] No extracted sections available for class', classId);
        return [];
      }

      const recommendations = candidateSections
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ guide, section }) => this.buildRecommendation(guide, section));

      return recommendations.filter(rec => rec.settings.length > 0);
    } catch (error) {
      console.error('[RaceTuningService] Failed to load tuning recommendations:', error);
      return [];
    }
  }

  private collectCandidateSections(
    guides: TuningGuide[],
    targetWind?: number,
    pointsOfSail?: RaceTuningRequest['pointsOfSail']
  ): Array<{ guide: TuningGuide; section: ExtractedSection; score: number }> {
    const candidates: Array<{ guide: TuningGuide; section: ExtractedSection; score: number }> = [];

    guides.forEach(guide => {
      const sections = this.normalizeSections(guide.extractedSections);
      sections.forEach(section => {
        if (!section?.settings || Object.keys(section.settings).length === 0) {
          return;
        }

        const score = this.scoreSection(section, targetWind, pointsOfSail);
        candidates.push({ guide, section, score });
      });
    });

    return candidates;
  }

  private normalizeSections(sections: unknown): ExtractedSection[] {
    if (!sections) return [];
    if (Array.isArray(sections)) {
      return sections as ExtractedSection[];
    }

    // Handle stringified JSON
    if (typeof sections === 'string') {
      try {
        const parsed = JSON.parse(sections);
        return Array.isArray(parsed) ? (parsed as ExtractedSection[]) : [];
      } catch (error) {
        console.warn('[RaceTuningService] Failed to parse sections JSON:', error);
        return [];
      }
    }

    return [];
  }

  private scoreSection(
    section: ExtractedSection,
    targetWind?: number,
    pointsOfSail?: RaceTuningRequest['pointsOfSail']
  ): number {
    let score = 0;

    if (section.conditions?.points) {
      if (pointsOfSail && pointsOfSail !== 'all') {
        const normalizedPoints = section.conditions.points.toLowerCase();
        if (normalizedPoints.includes(pointsOfSail)) {
          score += 15;
        } else {
          score -= 5;
        }
      } else {
        score += 5;
      }
    }

    if (targetWind && section.conditions?.windSpeed) {
      const range = this.parseWindRange(section.conditions.windSpeed);
      if (range) {
        const { min, max } = range;
        if (targetWind >= min && targetWind <= max) {
          score += 25;
        } else {
          const distance = targetWind < min ? min - targetWind : targetWind - max;
          score += Math.max(10 - distance, 0);
        }
      }
    } else if (targetWind) {
      score += 5; // Some credit even if range missing
    }

    // Slightly favor detailed sections
    if (section.settings) {
      score += Math.min(Object.keys(section.settings).length * 2, 10);
    }

    return score;
  }

  private parseWindRange(windText: string): { min: number; max: number } | null {
    const cleaned = windText.toLowerCase().replace(/knots?|kts?/g, '').trim();
    const numbers = cleaned.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];

    if (numbers.length === 0) {
      if (cleaned.includes('light')) return { min: 0, max: 8 };
      if (cleaned.includes('medium')) return { min: 8, max: 15 };
      if (cleaned.includes('heavy') || cleaned.includes('strong')) return { min: 15, max: 30 };
      return null;
    }

    if (numbers.length === 1) {
      if (cleaned.includes('+') || cleaned.includes('above') || cleaned.includes('over')) {
        return { min: numbers[0], max: numbers[0] + 20 };
      }
      return { min: Math.max(numbers[0] - 2, 0), max: numbers[0] + 2 };
    }

    return {
      min: Math.min(numbers[0], numbers[1]),
      max: Math.max(numbers[0], numbers[1]),
    };
  }

  private buildRecommendation(guide: TuningGuide, section: ExtractedSection): RaceTuningRecommendation {
    const settings: RaceTuningSetting[] = Object.entries(section.settings || {})
      .map(([rawKey, rawValue]) => this.normalizeSetting(rawKey, rawValue))
      .filter((setting): setting is RaceTuningSetting => !!setting);

    return {
      guideId: guide.id,
      guideTitle: guide.title,
      guideSource: guide.source,
      sectionTitle: section.title,
      conditionSummary: section.conditions?.windSpeed,
      notes: section.content,
      settings,
    };
  }

  private normalizeSetting(rawKey: string, rawValue: string | number): RaceTuningSetting | null {
    const normalizedKey = rawKey.toLowerCase().replace(/[_\-]/g, ' ');

    const mappingTable: Array<{ matches: string[]; key: string; label: string }> = [
      {
        matches: ['upper shroud', 'uppers', 'upper sidestays'],
        key: 'upper_shrouds',
        label: 'Upper Shrouds',
      },
      {
        matches: ['lower shroud', 'lowers', 'lower sidestays'],
        key: 'lower_shrouds',
        label: 'Lower Shrouds',
      },
      {
        matches: ['forestay', 'headstay', 'j forestay'],
        key: 'forestay_length',
        label: 'Forestay',
      },
      {
        matches: ['mast rake', 'rake'],
        key: 'mast_rake',
        label: 'Mast Rake',
      },
      {
        matches: ['mast butt'],
        key: 'mast_butt',
        label: 'Mast Butt',
      },
      {
        matches: ['spreader', 'spreaders'],
        key: 'spreader_sweep',
        label: 'Spreader',
      },
      {
        matches: ['backstay'],
        key: 'backstay_tension',
        label: 'Backstay',
      },
      {
        matches: ['vang', 'kicker'],
        key: 'vang',
        label: 'Vang',
      },
      {
        matches: ['outhaul'],
        key: 'outhaul',
        label: 'Outhaul',
      },
      {
        matches: ['cunningham'],
        key: 'cunningham',
        label: 'Cunningham',
      },
      {
        matches: ['jib halyard', 'jib stay'],
        key: 'jib_halyard',
        label: 'Jib Halyard',
      },
    ];

    const matched = mappingTable.find(entry =>
      entry.matches.some(match => normalizedKey.includes(match))
    );

    const valueString = typeof rawValue === 'number' ? `${rawValue}` : rawValue;

    if (matched) {
      return {
        key: matched.key,
        label: matched.label,
        value: valueString,
        rawKey,
      };
    }

    // Keep unknown keys but present them with a tidied label
    const fallbackLabel = rawKey
      .split(/[_\-]/g)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return {
      key: this.slugify(rawKey),
      label: fallbackLabel,
      value: valueString,
      rawKey,
    };
  }

  private slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
}

export const raceTuningService = new RaceTuningService();
