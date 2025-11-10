/**
 * Race Tuning Service
 * Builds race-ready rig tuning recommendations by blending extracted tuning guide content
 * with forecast conditions for the active boat class.
 */

import { tuningGuideService, type TuningGuide } from './tuningGuideService';
import type { ExtractedSection } from './TuningGuideExtractionService';
import { raceTuningEngine, type RaceTuningCandidate } from './ai/RaceTuningEngine';
import { createLogger } from '@/lib/utils/logger';

export interface RaceTuningRequest {
  classId?: string | null;
  className?: string | null;
  averageWindSpeed?: number | null;
  windMin?: number | null;
  windMax?: number | null;
  windDirection?: number | null;
  gusts?: number | null;
  waveHeight?: string | null;
  currentSpeed?: number | null;
  currentDirection?: number | null;
  pointsOfSail?: 'upwind' | 'downwind' | 'reach' | 'all';
  limit?: number;
}

export interface RaceTuningSetting {
  key: string;
  label: string;
  value: string;
  rawKey?: string;
  reasoning?: string; // AI-generated reasoning
}

export interface RaceTuningRecommendation {
  guideId: string;
  guideTitle: string;
  guideSource: string;
  sectionTitle?: string;
  conditionSummary?: string;
  notes?: string;
  settings: RaceTuningSetting[];
  isAIGenerated?: boolean; // Flag for AI-generated recommendations
  confidence?: number; // AI confidence score (0-1)
  weatherSpecificNotes?: string[]; // AI contextual notes
  caveats?: string[]; // Warnings or limitations
}

const logger = createLogger('RaceTuningService');

class RaceTuningService {
  private readonly aiEngine = raceTuningEngine;

  async getRecommendations(request: RaceTuningRequest): Promise<RaceTuningRecommendation[]> {
    const {
      classId,
      className,
      averageWindSpeed,
      windMin,
      windMax,
      windDirection,
      gusts,
      waveHeight,
      currentSpeed,
      currentDirection,
      pointsOfSail = 'all',
      limit = 1,
    } = request;

    logger.debug('getRecommendations called', {
      classId,
      className,
      averageWindSpeed,
      windMin,
      windMax,
      windDirection,
      gusts,
      waveHeight,
      currentSpeed,
      currentDirection,
      pointsOfSail,
      limit,
    });

    if (!classId && !className) {
      logger.warn('No class reference provided, skipping tuning lookup');
      return [];
    }

    logger.debug('Class reference resolved', { classId, className });

    try {
      const guides = await tuningGuideService.getGuidesByReference({ classId, className });
      logger.debug('Retrieved tuning guides', {
        count: guides.length,
        guides: guides.map(g => ({ id: g.id, title: g.title, hasExtractedSections: !!g.extractedSections })),
      });

      const candidateSections = this.collectCandidateSections(
        guides,
        averageWindSpeed ?? undefined,
        pointsOfSail
      );
      logger.debug('Candidate sections scored', {
        count: candidateSections.length,
        topScores: candidateSections.slice(0, 3).map(c => ({ title: c.section.title, score: c.score })),
      });

      // NEW: If NO guides/sections exist, try AI-only generation
      if (candidateSections.length === 0) {
        logger.info('No extracted sections found; attempting AI-only tuning generation', {
          aiAvailable: this.aiEngine.isAvailable(),
          aiReady: this.aiEngine.isSkillReady(),
        });
        const aiOnlyRecommendations = await this.tryGenerateAIOnlyRecommendations(request);

        if (aiOnlyRecommendations && aiOnlyRecommendations.length > 0) {
          logger.info('Returning AI-only tuning recommendations', { count: aiOnlyRecommendations.length });
          return aiOnlyRecommendations;
        }

        logger.warn('AI-only generation returned no recommendations');
        return [];
      }

      const sortedCandidates = candidateSections.sort((a, b) => b.score - a.score);

      // Try AI enhancement with existing guides
      const aiRecommendations = await this.tryGenerateAIRecommendations({
        classId,
        className,
        averageWindSpeed: averageWindSpeed ?? undefined,
        pointsOfSail,
        limit,
        candidates: sortedCandidates
      });

      if (aiRecommendations && aiRecommendations.length > 0) {
        logger.info('Using AI-enhanced tuning recommendations', { count: aiRecommendations.length });
        return aiRecommendations;
      }

      const recommendations = sortedCandidates
        .slice(0, limit)
        .map(({ guide, section }) => this.buildRecommendation(guide, section));

      logger.debug('Built deterministic recommendations', {
        count: recommendations.length,
        withSettings: recommendations.filter(r => r.settings.length > 0).length,
      });

      return recommendations.filter(rec => rec.settings.length > 0);
    } catch (error) {
      logger.error('Failed to load tuning recommendations', error);
      return [];
    }
  }

  /**
   * NEW: Generate AI-only recommendations when NO tuning guides exist
   */
  private async tryGenerateAIOnlyRecommendations(request: RaceTuningRequest): Promise<RaceTuningRecommendation[] | null> {
    const isAvailable = this.aiEngine.isAvailable();

    if (!isAvailable) {
      logger.warn('AI engine not available; cannot generate AI-only recommendations');
      return null;
    }

    logger.debug('AI engine available; generating AI-only recommendations');

    try {
      const aiRecommendations = await this.aiEngine.generateAIOnlyRecommendations(request);

      logger.debug('AI engine response details', {
        isArray: Array.isArray(aiRecommendations),
        length: aiRecommendations?.length || 0,
        hasItems: aiRecommendations?.length ? aiRecommendations.length > 0 : false,
        firstItem: aiRecommendations?.[0],
      });

      if (aiRecommendations && aiRecommendations.length > 0) {
        logger.info('AI-only recommendations generated', { count: aiRecommendations.length });
        return aiRecommendations;
      }

      logger.warn('AI engine returned empty array or null');
      return null;
    } catch (error) {
      logger.error('AI-only tuning generation failed', error);
      return null;
    }
  }

  private async tryGenerateAIRecommendations({
    classId,
    className,
    averageWindSpeed,
    pointsOfSail,
    limit,
    candidates
  }: {
    classId?: string | null;
    className?: string | null;
    averageWindSpeed?: number;
    pointsOfSail?: RaceTuningRequest['pointsOfSail'];
    limit: number;
    candidates: Array<{ guide: TuningGuide; section: ExtractedSection; score: number }>;
  }): Promise<RaceTuningRecommendation[] | null> {
    if (!this.aiEngine.isAvailable()) {
      return null;
    }

    try {
      const aiCandidates: RaceTuningCandidate[] = candidates
        .slice(0, Math.max(limit, 3))
        .map(({ guide, section, score }) => this.buildAICandidatePayload(guide, section, score));

      const recommendations = await this.aiEngine.generateRecommendations({
        classId,
        className,
        averageWindSpeed,
        pointsOfSail,
        limit,
        candidates: aiCandidates
      });

      return recommendations.length > 0 ? recommendations : null;
    } catch (error) {
      logger.error('AI tuning generation failed, falling back to deterministic recommendations', error);
      return null;
    }
  }

  private buildAICandidatePayload(
    guide: TuningGuide,
    section: ExtractedSection,
    score: number
  ): RaceTuningCandidate {
    const sanitizedSettings: Record<string, string> = {};
    const rawSettings = section.settings || {};
    Object.entries(rawSettings).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      sanitizedSettings[key] = typeof value === 'string' ? value : String(value);
    });

    return {
      guide: {
        id: this.buildGuideIdentifier(guide),
        title: guide.title,
        source: guide.source,
        year: guide.year,
        tags: guide.tags,
        rig: guide.rig,
        mast: guide.mast,
        sailmaker: guide.sailmaker,
        hull: guide.hull
      },
      section: {
        title: section.title,
        content: section.content,
        conditions: section.conditions,
        settings: sanitizedSettings
      },
      score
    };
  }

  private buildGuideIdentifier(guide: TuningGuide): string {
    if (guide.id) {
      return guide.id;
    }

    const parts = [
      guide.classId,
      guide.title,
      guide.source
    ]
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return parts ? `guide-${parts}` : 'guide-unknown';
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
        logger.warn('Failed to parse sections JSON', error);
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
