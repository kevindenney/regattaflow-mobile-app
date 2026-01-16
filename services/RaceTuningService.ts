/**
 * Race Tuning Service
 * Builds race-ready rig tuning recommendations by blending extracted tuning guide content
 * with forecast conditions for the active boat class.
 * 
 * Enhanced: Now supports boat-specific equipment context for personalized recommendations.
 */

import { createLogger } from '@/lib/utils/logger';
import { raceTuningEngine, type RaceTuningCandidate } from './ai/RaceTuningEngine';
import { equipmentService } from './EquipmentService';
import type { ExtractedSection } from './TuningGuideExtractionService';
import { tuningGuideService, type TuningGuide } from './tuningGuideService';

export interface RaceTuningRequest {
  classId?: string | null;
  className?: string | null;
  boatId?: string | null;  // NEW: Optional boat ID for equipment-aware recommendations
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

export interface EquipmentContext {
  boatId: string;
  boatName?: string;
  mast?: { manufacturer?: string; model?: string; type?: string };
  shrouds?: { manufacturer?: string; type?: string };
  forestay?: { manufacturer?: string; type?: string };
  backstay?: { manufacturer?: string; type?: string };
  sails: Array<{
    type: string;
    manufacturer?: string;
    model?: string;
    racesUsed?: number;
    conditionRating?: number;
  }>;
  hasMaintenanceAlerts: boolean;
  maintenanceAlerts?: string[];
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
  // NEW: Equipment-aware fields
  equipmentContext?: EquipmentContext;
  equipmentSpecificNotes?: string[]; // Notes specific to user's equipment
}

const logger = createLogger('RaceTuningService');

class RaceTuningService {
  private readonly aiEngine = raceTuningEngine;

  /**
   * Get equipment context for a boat to personalize tuning recommendations
   */
  async getEquipmentContext(boatId: string): Promise<EquipmentContext | null> {
    // Handle demo boat ID to prevent UUID error
    if (boatId.includes('demo')) {
      return {
        boatId,
        boatName: 'Demo J/70',
        mast: { manufacturer: 'Seldén', type: 'Standard' },
        shrouds: { manufacturer: 'Standard', type: 'Wire' },
        sails: [],
        hasMaintenanceAlerts: false
      };
    }

    try {
      const equipmentData = await equipmentService.getEquipmentContextForTuning(boatId);
      const health = await equipmentService.getBoatEquipmentHealth(boatId);
      const alerts = await equipmentService.getEquipmentRequiringAttention(boatId);

      // Get boat name
      const boat = equipmentData.allEquipment[0]?.boat;

      return {
        boatId,
        boatName: boat?.name,
        mast: equipmentData.mast ? {
          manufacturer: equipmentData.mast.manufacturer,
          model: equipmentData.mast.model,
          type: equipmentData.mast.subcategory,
        } : undefined,
        shrouds: equipmentData.shrouds ? {
          manufacturer: equipmentData.shrouds.manufacturer,
          type: equipmentData.shrouds.subcategory,
        } : undefined,
        forestay: equipmentData.forestay ? {
          manufacturer: equipmentData.forestay.manufacturer,
          type: equipmentData.forestay.subcategory,
        } : undefined,
        backstay: equipmentData.backstay ? {
          manufacturer: equipmentData.backstay.manufacturer,
          type: equipmentData.backstay.subcategory,
        } : undefined,
        sails: equipmentData.sails.map(s => ({
          type: s.category,
          manufacturer: s.manufacturer,
          model: s.model,
          racesUsed: s.total_races_used,
          conditionRating: s.condition_rating,
        })),
        hasMaintenanceAlerts: alerts.length > 0 || !health.race_ready,
        maintenanceAlerts: alerts.map(a =>
          `${a.custom_name}: ${a.next_maintenance_date ? `service due ${new Date(a.next_maintenance_date).toLocaleDateString()}` : 'needs attention'}`
        ),
      };
    } catch (error) {
      logger.error('Failed to get equipment context', { boatId, error });
      return null;
    }
  }

  /**
   * Generate equipment-specific notes based on user's gear
   */
  private generateEquipmentSpecificNotes(
    equipmentContext: EquipmentContext,
    settings: RaceTuningSetting[]
  ): string[] {
    const notes: string[] = [];

    // Mast-specific notes
    if (equipmentContext.mast?.manufacturer) {
      const mastMfr = equipmentContext.mast.manufacturer.toLowerCase();
      if (mastMfr.includes('selden') || mastMfr.includes('seldén')) {
        notes.push(`Your Seldén mast may require slightly different base settings - refer to Seldén tuning guide for specifics`);
      } else if (mastMfr.includes('z-spar')) {
        notes.push(`Z-Spars typically require more pre-bend - adjust backstay accordingly`);
      }
    }

    // Sail-specific notes
    const mainSail = equipmentContext.sails.find(s => s.type === 'mainsail');
    if (mainSail) {
      if (mainSail.racesUsed && mainSail.racesUsed > 100) {
        notes.push(`Your mainsail has ${mainSail.racesUsed} races - consider slightly fuller entry settings to compensate for cloth stretch`);
      }
      if (mainSail.conditionRating && mainSail.conditionRating < 70) {
        notes.push(`Main at ${mainSail.conditionRating}% condition - may need more halyard tension to maintain shape`);
      }
      if (mainSail.manufacturer) {
        notes.push(`Settings optimized for ${mainSail.manufacturer} sails where possible`);
      }
    }

    // Maintenance alerts
    if (equipmentContext.hasMaintenanceAlerts && equipmentContext.maintenanceAlerts?.length) {
      notes.push(`⚠️ Equipment alert: ${equipmentContext.maintenanceAlerts[0]}`);
    }

    return notes;
  }

  async getRecommendations(request: RaceTuningRequest): Promise<RaceTuningRecommendation[]> {
    const {
      classId,
      className,
      boatId,
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


    // NEW: Get equipment context if boatId is provided
    let equipmentContext: EquipmentContext | null = null;
    if (boatId) {
      equipmentContext = await this.getEquipmentContext(boatId);
      if (equipmentContext) {
        logger.debug('Equipment context loaded', {
          boatName: equipmentContext.boatName,
          hasMast: !!equipmentContext.mast,
          sailCount: equipmentContext.sails.length,
          hasAlerts: equipmentContext.hasMaintenanceAlerts,
        });
      }
    }

    if (!classId && !className) {
      return [];
    }

    try {
      const guides = await tuningGuideService.getGuidesByReference({ classId, className });

      const candidateSections = this.collectCandidateSections(
        guides,
        averageWindSpeed ?? undefined,
        pointsOfSail
      );

      // NEW: If NO guides/sections exist, try AI-only generation
      if (candidateSections.length === 0) {
        logger.debug('No extracted sections found; attempting AI-only tuning generation');
        const aiOnlyRecommendations = await this.tryGenerateAIOnlyRecommendations(request);

        if (aiOnlyRecommendations && aiOnlyRecommendations.length > 0) {
          return aiOnlyRecommendations;
        }

        return [];
      }

      const sortedCandidates = candidateSections.sort((a, b) => b.score - a.score);

      // DISABLED: AI enhancement was replacing North Sails guide data entirely
      // TODO: Make AI enhancement actually enhance (add reasoning) rather than replace
      // const aiRecommendations = await this.tryGenerateAIRecommendations({
      //   classId,
      //   className,
      //   averageWindSpeed: averageWindSpeed ?? undefined,
      //   pointsOfSail,
      //   limit,
      //   candidates: sortedCandidates
      // });
      //
      // if (aiRecommendations && aiRecommendations.length > 0) {
      //   logger.info('Using AI-enhanced tuning recommendations', { count: aiRecommendations.length });
      //   return aiRecommendations;
      // }

      const recommendations = sortedCandidates
        .slice(0, limit)
        .map(({ guide, section }) => this.buildRecommendation(guide, section));

      // Enhance recommendations with equipment context if available
      const filteredRecommendations = recommendations.filter(rec => rec.settings.length > 0);

      if (equipmentContext && filteredRecommendations.length > 0) {
        return filteredRecommendations.map(rec => ({
          ...rec,
          equipmentContext,
          equipmentSpecificNotes: this.generateEquipmentSpecificNotes(equipmentContext, rec.settings),
        }));
      }

      return filteredRecommendations;
    } catch (error) {
      // Log as debug since this can happen when no guides exist - not a critical error
      logger.debug('Could not load tuning recommendations', {
        error: (error as Error)?.message,
        classId,
        className
      });
      return [];
    }
  }

  /**
   * NEW: Generate AI-only recommendations when NO tuning guides exist
   */
  private async tryGenerateAIOnlyRecommendations(request: RaceTuningRequest): Promise<RaceTuningRecommendation[] | null> {
    // Skip AI generation if no boat class info - AI can't generate useful recommendations
    if (!request.classId && !request.className) {
      logger.debug('No boat class info; skipping AI-only recommendations');
      return null;
    }

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
      // AI declining is expected when no tuning guides exist - not an error
      logger.debug('AI-only tuning generation did not produce results', { message: (error as Error)?.message?.substring(0, 100) });
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
      // Log as debug - AI failures are expected when no guides exist or API is unavailable
      logger.debug('AI tuning generation unavailable', {
        error: (error as Error)?.message
      });
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

  /**
   * Get all wind range sections for Tufte "small multiples" display
   * Returns Light, Medium, Heavy air settings for side-by-side comparison
   */
  async getAllWindRangeSections(request: {
    classId?: string | null;
    className?: string | null;
    boatId?: string | null;
  }): Promise<{
    light: RaceTuningRecommendation | null;
    medium: RaceTuningRecommendation | null;
    heavy: RaceTuningRecommendation | null;
    currentRange: 'light' | 'medium' | 'heavy' | null;
    equipmentContext: EquipmentContext | null;
  }> {
    const { classId, className, boatId } = request;

    // Get equipment context if available
    let equipmentContext: EquipmentContext | null = null;
    if (boatId) {
      equipmentContext = await this.getEquipmentContext(boatId);
    }

    if (!classId && !className) {
      return { light: null, medium: null, heavy: null, currentRange: null, equipmentContext };
    }

    try {
      const guides = await tuningGuideService.getGuidesByReference({ classId, className });

      if (guides.length === 0) {
        return { light: null, medium: null, heavy: null, currentRange: null, equipmentContext };
      }

      // Collect all sections from all guides
      const allSections: Array<{ guide: typeof guides[0]; section: ExtractedSection }> = [];
      guides.forEach(guide => {
        const sections = this.normalizeSections(guide.extractedSections);
        sections.forEach(section => {
          if (section?.settings && Object.keys(section.settings).length > 0) {
            allSections.push({ guide, section });
          }
        });
      });

      // Categorize sections by wind range
      const categorize = (section: ExtractedSection): 'light' | 'medium' | 'heavy' | null => {
        const title = (section.title || '').toLowerCase();
        const windSpeed = (section.conditions?.windSpeed || '').toLowerCase();

        if (title.includes('light') || windSpeed.includes('0-5') || windSpeed.includes('4-7')) {
          return 'light';
        }
        if (title.includes('heavy') || title.includes('strong') || windSpeed.includes('17+') || windSpeed.includes('15-18')) {
          return 'heavy';
        }
        if (title.includes('medium') || title.includes('base') || windSpeed.includes('6-16') || windSpeed.includes('8-12')) {
          return 'medium';
        }
        return null;
      };

      let light: RaceTuningRecommendation | null = null;
      let medium: RaceTuningRecommendation | null = null;
      let heavy: RaceTuningRecommendation | null = null;

      allSections.forEach(({ guide, section }) => {
        const category = categorize(section);
        const rec = this.buildRecommendation(guide, section);

        if (category === 'light' && !light) {
          light = rec;
        } else if (category === 'medium' && !medium) {
          medium = rec;
        } else if (category === 'heavy' && !heavy) {
          heavy = rec;
        }
      });

      // Add equipment context to all recommendations
      if (equipmentContext) {
        const addEquipment = (rec: RaceTuningRecommendation | null) => {
          if (!rec) return null;
          return {
            ...rec,
            equipmentContext,
            equipmentSpecificNotes: this.generateEquipmentSpecificNotes(equipmentContext, rec.settings),
          };
        };
        light = addEquipment(light);
        medium = addEquipment(medium);
        heavy = addEquipment(heavy);
      }

      return { light, medium, heavy, currentRange: null, equipmentContext };
    } catch (error) {
      // Log as debug - this can happen when no boat class is configured
      logger.debug('Could not load wind range sections', {
        error: (error as Error)?.message
      });
      return { light: null, medium: null, heavy: null, currentRange: null, equipmentContext };
    }
  }

  /**
   * Determine which wind range matches given conditions
   */
  determineWindRange(windSpeed: number | null | undefined): 'light' | 'medium' | 'heavy' | null {
    if (windSpeed === null || windSpeed === undefined) return null;
    if (windSpeed <= 5) return 'light';
    if (windSpeed <= 16) return 'medium';
    return 'heavy';
  }
}

export const raceTuningService = new RaceTuningService();
