/**
 * PracticeSuggestionService
 *
 * Generates AI-driven practice suggestions based on the sailor's learning profile.
 * Uses performance patterns from race analysis to identify weak areas and match
 * appropriate drills.
 *
 * Algorithm:
 * 1. Fetch LearningProfile from PostRaceLearningService
 * 2. Prioritize skill areas:
 *    - Priority 1: Focus areas with declining trends
 *    - Priority 2: Focus areas stable but low (≤2.5 avg)
 *    - Priority 3: Strengths with declining trends (prevent backsliding)
 * 3. Match drills to prioritized areas via drill_skill_mappings
 * 4. Filter by context (crew size, available time, equipment)
 * 5. Generate contextual notes via Claude (optional)
 * 6. Find linked learning lessons
 */

import { createLogger } from '@/lib/utils/logger';
import { drillLibraryService } from '@/services/DrillLibraryService';
import { postRaceLearningService } from '@/services/PostRaceLearningService';
import { supabase } from '@/services/supabase';
import type { PerformancePattern, PerformanceTrend } from '@/types/raceLearning';
import type {
  Drill,
  LinkedLesson,
  PracticeSuggestion,
  SkillArea,
  SuggestedDrill,
  SuggestionContext,
  SKILL_AREA_LABELS,
} from '@/types/practice';

const logger = createLogger('PracticeSuggestionService');

// Skill area labels for display
const SKILL_LABELS: Record<SkillArea, string> = {
  'equipment-prep': 'Equipment Prep',
  'pre-race-planning': 'Race Planning',
  'crew-coordination': 'Crew Coordination',
  'prestart-sequence': 'Pre-Start Sequence',
  'start-execution': 'Start Execution',
  'upwind-execution': 'Upwind Sailing',
  'shift-awareness': 'Shift Awareness',
  'windward-rounding': 'Windward Mark',
  'downwind-speed': 'Downwind Speed',
  'leeward-rounding': 'Leeward Mark',
  'finish-execution': 'Finish',
};

// Valid skill areas that can be practiced
const VALID_SKILL_AREAS: SkillArea[] = [
  'equipment-prep',
  'pre-race-planning',
  'crew-coordination',
  'prestart-sequence',
  'start-execution',
  'upwind-execution',
  'shift-awareness',
  'windward-rounding',
  'downwind-speed',
  'leeward-rounding',
  'finish-execution',
];

interface PrioritizedArea {
  skillArea: SkillArea;
  pattern: PerformancePattern;
  priority: number;
  reason: string;
}

/**
 * Service for generating AI-driven practice suggestions
 */
class PracticeSuggestionServiceClass {

  // =========================================================================
  // MAIN API
  // =========================================================================

  /**
   * Generate practice suggestions for a user
   * @param userId - The user's ID
   * @param context - Optional context for filtering suggestions
   * @returns Array of practice suggestions sorted by priority
   */
  async generateSuggestions(
    userId: string,
    context?: SuggestionContext
  ): Promise<PracticeSuggestion[]> {
    try {
      logger.info('Generating practice suggestions for user:', userId);

      // 1. Get learning profile
      const learningProfile = await postRaceLearningService.getLearningProfileForUser(userId);

      if (!learningProfile) {
        logger.info('No learning profile found, returning default suggestions');
        return this.getDefaultSuggestions(context);
      }

      // 2. Prioritize skill areas based on performance patterns
      const prioritizedAreas = this.prioritizeSkillAreas(learningProfile, context);

      if (prioritizedAreas.length === 0) {
        logger.info('No prioritized areas found, returning default suggestions');
        return this.getDefaultSuggestions(context);
      }

      // 3. Generate suggestions for each prioritized area
      const suggestions: PracticeSuggestion[] = [];

      for (const area of prioritizedAreas.slice(0, 5)) {
        // Limit to top 5 suggestions
        const suggestion = await this.buildSuggestion(area, context);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }

      logger.info(`Generated ${suggestions.length} practice suggestions`);
      return suggestions;
    } catch (error) {
      logger.error('Failed to generate practice suggestions:', error);
      return this.getDefaultSuggestions(context);
    }
  }

  /**
   * Get a single suggestion for a specific skill area
   */
  async getSuggestionForSkillArea(
    skillArea: SkillArea,
    context?: SuggestionContext
  ): Promise<PracticeSuggestion | null> {
    try {
      const prioritizedArea: PrioritizedArea = {
        skillArea,
        pattern: {
          id: skillArea,
          label: SKILL_LABELS[skillArea],
          category: this.getCategoryForSkillArea(skillArea),
          average: 3,
          trend: 'stable',
          sampleCount: 0,
          confidence: 'low',
          supportingSamples: [],
        },
        priority: 1,
        reason: `Selected focus: ${SKILL_LABELS[skillArea]}`,
      };

      return await this.buildSuggestion(prioritizedArea, context);
    } catch (error) {
      logger.error('Failed to get suggestion for skill area:', error);
      return null;
    }
  }

  // =========================================================================
  // PRIORITIZATION
  // =========================================================================

  /**
   * Prioritize skill areas based on learning profile patterns
   */
  private prioritizeSkillAreas(
    learningProfile: {
      focusAreas: PerformancePattern[];
      strengths: PerformancePattern[];
    },
    context?: SuggestionContext
  ): PrioritizedArea[] {
    const areas: PrioritizedArea[] = [];
    const excludeAreas = context?.excludeSkillAreas || [];

    // Priority 1: Focus areas with declining trends (most urgent)
    for (const pattern of learningProfile.focusAreas) {
      const skillArea = pattern.id as SkillArea;
      if (!this.isValidSkillArea(skillArea) || excludeAreas.includes(skillArea)) continue;

      if (pattern.trend === 'declining') {
        areas.push({
          skillArea,
          pattern,
          priority: 1,
          reason: `${pattern.label} is declining and needs attention`,
        });
      }
    }

    // Priority 2: Focus areas stable but low (≤2.5 avg)
    for (const pattern of learningProfile.focusAreas) {
      const skillArea = pattern.id as SkillArea;
      if (!this.isValidSkillArea(skillArea) || excludeAreas.includes(skillArea)) continue;

      if (pattern.trend !== 'declining' && pattern.average <= 2.5) {
        // Skip if already added
        if (areas.some((a) => a.skillArea === skillArea)) continue;

        areas.push({
          skillArea,
          pattern,
          priority: 2,
          reason: `${pattern.label} is consistently low and needs practice`,
        });
      }
    }

    // Priority 3: Strengths with declining trends (prevent backsliding)
    for (const pattern of learningProfile.strengths) {
      const skillArea = pattern.id as SkillArea;
      if (!this.isValidSkillArea(skillArea) || excludeAreas.includes(skillArea)) continue;

      if (pattern.trend === 'declining') {
        // Skip if already added
        if (areas.some((a) => a.skillArea === skillArea)) continue;

        areas.push({
          skillArea,
          pattern,
          priority: 3,
          reason: `${pattern.label} was a strength but is declining`,
        });
      }
    }

    // Priority 4: Other focus areas (stable or improving)
    for (const pattern of learningProfile.focusAreas) {
      const skillArea = pattern.id as SkillArea;
      if (!this.isValidSkillArea(skillArea) || excludeAreas.includes(skillArea)) continue;

      // Skip if already added
      if (areas.some((a) => a.skillArea === skillArea)) continue;

      areas.push({
        skillArea,
        pattern,
        priority: 4,
        reason: `${pattern.label} is a focus area for improvement`,
      });
    }

    // Sort by priority
    return areas.sort((a, b) => a.priority - b.priority);
  }

  // =========================================================================
  // SUGGESTION BUILDING
  // =========================================================================

  /**
   * Build a complete suggestion for a prioritized area
   */
  private async buildSuggestion(
    area: PrioritizedArea,
    context?: SuggestionContext
  ): Promise<PracticeSuggestion | null> {
    try {
      // Get drills for this skill area
      const drills = await drillLibraryService.getDrillsForSkillArea(area.skillArea);

      if (drills.length === 0) {
        logger.debug(`No drills found for skill area: ${area.skillArea}`);
        return null;
      }

      // Filter drills by context
      const filteredDrills = this.filterDrillsByContext(drills, context);

      if (filteredDrills.length === 0) {
        logger.debug(`No drills match context for skill area: ${area.skillArea}`);
        return null;
      }

      // Get drill mappings for relevance scores
      const mappings = await this.getDrillMappings(
        filteredDrills.map((d) => d.id),
        area.skillArea
      );

      // Build suggested drills
      const suggestedDrills = this.buildSuggestedDrills(filteredDrills, mappings, context);

      // Calculate estimated duration
      const estimatedDuration = suggestedDrills.reduce(
        (total, sd) => total + sd.suggestedDuration,
        0
      );

      // Find linked lessons
      const linkedLessons = await this.findLinkedLessons(filteredDrills);

      // Generate contextual notes
      const contextualNotes = this.generateContextualNotes(area, context);

      const suggestion: PracticeSuggestion = {
        id: `suggestion-${area.skillArea}-${Date.now()}`,
        priority: area.priority,
        skillArea: area.skillArea,
        skillAreaLabel: SKILL_LABELS[area.skillArea],
        reason: area.reason,
        suggestedDrills: suggestedDrills.slice(0, 3), // Limit to top 3 drills
        linkedLessons,
        estimatedDuration,
        contextualNotes,
      };

      return suggestion;
    } catch (error) {
      logger.error(`Failed to build suggestion for ${area.skillArea}:`, error);
      return null;
    }
  }

  /**
   * Build suggested drills with relevance and focus info
   */
  private buildSuggestedDrills(
    drills: Drill[],
    mappings: Map<string, number>,
    context?: SuggestionContext
  ): SuggestedDrill[] {
    const availableTime = context?.availableTime || 60; // Default 60 mins

    return drills.map((drill) => {
      const relevanceScore = mappings.get(drill.id) || 50;

      // Calculate suggested duration based on drill and available time
      let suggestedDuration = drill.durationMinutes || 15;
      if (availableTime < suggestedDuration * 2) {
        suggestedDuration = Math.min(suggestedDuration, Math.floor(availableTime / 2));
      }

      // Generate focus based on drill and relevance
      const focus = this.generateDrillFocus(drill, relevanceScore);

      return {
        drill,
        relevanceScore,
        suggestedDuration,
        suggestedRepetitions: drill.minCrew && drill.minCrew <= 1 ? 5 : 3,
        focus,
      };
    });
  }

  /**
   * Generate specific focus for a drill
   */
  private generateDrillFocus(drill: Drill, relevanceScore: number): string {
    if (relevanceScore >= 80) {
      return `High-priority drill for your current skill gaps`;
    } else if (relevanceScore >= 60) {
      return `Core skill development: ${drill.category}`;
    } else {
      return `Supplementary practice for ${drill.category}`;
    }
  }

  // =========================================================================
  // CONTEXT FILTERING
  // =========================================================================

  /**
   * Filter drills based on user's context
   */
  private filterDrillsByContext(drills: Drill[], context?: SuggestionContext): Drill[] {
    if (!context) return drills;

    return drills.filter((drill) => {
      // Filter by crew size
      if (context.crewSize !== undefined) {
        if (drill.minCrew && context.crewSize < drill.minCrew) return false;
        if (drill.maxCrew && context.crewSize > drill.maxCrew) return false;
      }

      // Filter by marks requirement
      if (context.hasMarks === false && drill.requiresMarks) return false;

      // Filter by coach boat requirement
      if (context.hasCoachBoat === false && drill.requiresCoachBoat) return false;

      // Filter by difficulty
      if (context.preferredDifficulty && drill.difficulty !== context.preferredDifficulty) {
        // Allow one level up or down
        const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
        const preferredIndex = difficultyOrder.indexOf(context.preferredDifficulty);
        const drillIndex = difficultyOrder.indexOf(drill.difficulty);
        if (Math.abs(preferredIndex - drillIndex) > 1) return false;
      }

      return true;
    });
  }

  // =========================================================================
  // LINKED LESSONS
  // =========================================================================

  /**
   * Find linked learning lessons for drills
   */
  private async findLinkedLessons(drills: Drill[]): Promise<LinkedLesson[]> {
    const lessons: LinkedLesson[] = [];

    for (const drill of drills) {
      if (drill.linkedInteractiveId) {
        // Look up the interactive and its module
        const { data: interactive } = await supabase
          .from('interactives')
          .select('id, title, module_id')
          .eq('id', drill.linkedInteractiveId)
          .single();

        if (interactive) {
          const { data: module } = await supabase
            .from('modules')
            .select('id, title')
            .eq('id', interactive.module_id)
            .single();

          lessons.push({
            lessonId: interactive.id,
            lessonTitle: interactive.title,
            moduleTitle: module?.title || 'Learning Module',
            interactiveId: interactive.id,
            reason: `Linked lesson for ${drill.name}`,
          });
        }
      }

      if (drill.linkedLessonId) {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('id, title, module_id')
          .eq('id', drill.linkedLessonId)
          .single();

        if (lesson) {
          const { data: module } = await supabase
            .from('modules')
            .select('id, title')
            .eq('id', lesson.module_id)
            .single();

          // Avoid duplicates
          if (!lessons.some((l) => l.lessonId === lesson.id)) {
            lessons.push({
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              moduleTitle: module?.title || 'Learning Module',
              reason: `Theory lesson for ${drill.name}`,
            });
          }
        }
      }
    }

    return lessons.slice(0, 3); // Limit to 3 lessons
  }

  // =========================================================================
  // DEFAULT SUGGESTIONS
  // =========================================================================

  /**
   * Get default suggestions when no learning profile is available
   */
  private async getDefaultSuggestions(context?: SuggestionContext): Promise<PracticeSuggestion[]> {
    // Suggest fundamentals for new users
    const defaultAreas: SkillArea[] = ['start-execution', 'upwind-execution', 'windward-rounding'];

    const suggestions: PracticeSuggestion[] = [];

    for (let i = 0; i < defaultAreas.length; i++) {
      const skillArea = defaultAreas[i];
      const suggestion = await this.getSuggestionForSkillArea(skillArea, context);

      if (suggestion) {
        suggestion.priority = i + 1;
        suggestion.reason = `Fundamental skill for race improvement`;
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Check if a string is a valid skill area
   */
  private isValidSkillArea(area: string): area is SkillArea {
    return VALID_SKILL_AREAS.includes(area as SkillArea);
  }

  /**
   * Get category for a skill area
   */
  private getCategoryForSkillArea(
    skillArea: SkillArea
  ): 'preparation' | 'start' | 'upwind' | 'downwind' | 'mark_rounding' | 'crew' | 'overall' {
    const categoryMap: Record<
      SkillArea,
      'preparation' | 'start' | 'upwind' | 'downwind' | 'mark_rounding' | 'crew' | 'overall'
    > = {
      'equipment-prep': 'preparation',
      'pre-race-planning': 'preparation',
      'crew-coordination': 'crew',
      'prestart-sequence': 'start',
      'start-execution': 'start',
      'upwind-execution': 'upwind',
      'shift-awareness': 'upwind',
      'windward-rounding': 'mark_rounding',
      'downwind-speed': 'downwind',
      'leeward-rounding': 'mark_rounding',
      'finish-execution': 'overall',
    };

    return categoryMap[skillArea] || 'overall';
  }

  /**
   * Get drill mappings for relevance scores
   */
  private async getDrillMappings(
    drillIds: string[],
    skillArea: SkillArea
  ): Promise<Map<string, number>> {
    const { data, error } = await supabase
      .from('drill_skill_mappings')
      .select('drill_id, relevance_score')
      .in('drill_id', drillIds)
      .eq('skill_area', skillArea);

    if (error) {
      logger.error('Failed to get drill mappings:', error);
      return new Map();
    }

    const map = new Map<string, number>();
    for (const row of data || []) {
      map.set(row.drill_id, row.relevance_score);
    }
    return map;
  }

  /**
   * Generate contextual notes for a suggestion
   */
  private generateContextualNotes(area: PrioritizedArea, context?: SuggestionContext): string {
    const notes: string[] = [];

    // Add trend-based note
    if (area.pattern.trend === 'declining') {
      notes.push(`Your ${area.pattern.label} has been declining over recent races.`);
    } else if (area.pattern.average <= 2.5) {
      notes.push(
        `Focus on fundamentals for ${area.pattern.label} - consistent practice will build confidence.`
      );
    }

    // Add context-based note
    if (context?.availableTime) {
      if (context.availableTime <= 30) {
        notes.push('Short session: focus on one drill with quality repetitions.');
      } else if (context.availableTime >= 90) {
        notes.push('Extended session: work through multiple drills for comprehensive practice.');
      }
    }

    if (context?.crewSize === 1) {
      notes.push('Solo practice: focus on boat handling and visualization.');
    } else if (context?.crewSize && context.crewSize >= 3) {
      notes.push('Full crew practice: work on communication and timing.');
    }

    return notes.join(' ');
  }
}

// Export singleton instance
export const PracticeSuggestionService = new PracticeSuggestionServiceClass();
export default PracticeSuggestionService;
