/**
 * PracticeTemplateService
 *
 * Service for managing practice templates (catalog of pre-built practice plans).
 * Part of the 4 Questions Framework:
 * - WHAT: Templates define drill combinations for specific skill areas
 * - WHO: Templates include default crew task assignments
 * - WHY: Templates link to skill areas for AI suggestions
 * - HOW: Templates include drill instructions and success criteria
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import {
  PracticeTemplate,
  PracticeTemplateRow,
  PracticeTemplateDrill,
  PracticeTemplateDrillRow,
  DrillCategory,
  DrillDifficulty,
  rowToPracticeTemplate,
  rowToPracticeTemplateDrill,
  rowToDrill,
  DrillRow,
} from '@/types/practice';

const logger = createLogger('PracticeTemplateService');

/**
 * Filters for searching templates
 */
export interface TemplateFilters {
  category?: DrillCategory;
  difficulty?: DrillDifficulty;
  maxDuration?: number;
  minDuration?: number;
  requiresMarks?: boolean;
  requiresCoachBoat?: boolean;
  crewSize?: number;
  tags?: string[];
  featuredOnly?: boolean;
}

/**
 * Service for managing practice templates
 */
class PracticeTemplateServiceClass {
  // =========================================================================
  // READ OPERATIONS
  // =========================================================================

  /**
   * Get all active templates
   */
  async getAllTemplates(): Promise<PracticeTemplate[]> {
    const { data, error } = await supabase
      .from('practice_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name');

    if (error) {
      logger.error('Failed to fetch templates:', error);
      throw error;
    }

    return (data as PracticeTemplateRow[]).map(rowToPracticeTemplate);
  }

  /**
   * Get featured templates for homepage display
   */
  async getFeaturedTemplates(): Promise<PracticeTemplate[]> {
    const { data, error } = await supabase
      .from('practice_templates')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('name');

    if (error) {
      logger.error('Failed to fetch featured templates:', error);
      throw error;
    }

    return (data as PracticeTemplateRow[]).map(rowToPracticeTemplate);
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: DrillCategory): Promise<PracticeTemplate[]> {
    const { data, error } = await supabase
      .from('practice_templates')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .order('difficulty')
      .order('name');

    if (error) {
      logger.error('Failed to fetch templates by category:', error);
      throw error;
    }

    return (data as PracticeTemplateRow[]).map(rowToPracticeTemplate);
  }

  /**
   * Get templates by difficulty
   */
  async getTemplatesByDifficulty(difficulty: DrillDifficulty): Promise<PracticeTemplate[]> {
    const { data, error } = await supabase
      .from('practice_templates')
      .select('*')
      .eq('is_active', true)
      .eq('difficulty', difficulty)
      .order('category')
      .order('name');

    if (error) {
      logger.error('Failed to fetch templates by difficulty:', error);
      throw error;
    }

    return (data as PracticeTemplateRow[]).map(rowToPracticeTemplate);
  }

  /**
   * Search templates with filters
   */
  async searchTemplates(filters: TemplateFilters): Promise<PracticeTemplate[]> {
    let query = supabase
      .from('practice_templates')
      .select('*')
      .eq('is_active', true);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.maxDuration) {
      query = query.lte('estimated_duration_minutes', filters.maxDuration);
    }
    if (filters.minDuration) {
      query = query.gte('estimated_duration_minutes', filters.minDuration);
    }
    if (filters.requiresMarks !== undefined) {
      query = query.eq('requires_marks', filters.requiresMarks);
    }
    if (filters.requiresCoachBoat !== undefined) {
      query = query.eq('requires_coach_boat', filters.requiresCoachBoat);
    }
    if (filters.crewSize) {
      query = query.lte('recommended_crew_size', filters.crewSize);
    }
    if (filters.featuredOnly) {
      query = query.eq('is_featured', true);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    const { data, error } = await query
      .order('is_featured', { ascending: false })
      .order('name');

    if (error) {
      logger.error('Failed to search templates:', error);
      throw error;
    }

    return (data as PracticeTemplateRow[]).map(rowToPracticeTemplate);
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(templateId: string): Promise<PracticeTemplate | null> {
    const { data, error } = await supabase
      .from('practice_templates')
      .select('*')
      .eq('id', templateId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch template:', error);
      throw error;
    }

    return data ? rowToPracticeTemplate(data as PracticeTemplateRow) : null;
  }

  /**
   * Get a single template by slug
   */
  async getTemplateBySlug(slug: string): Promise<PracticeTemplate | null> {
    const { data, error } = await supabase
      .from('practice_templates')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch template by slug:', error);
      throw error;
    }

    return data ? rowToPracticeTemplate(data as PracticeTemplateRow) : null;
  }

  // =========================================================================
  // TEMPLATE DRILLS
  // =========================================================================

  /**
   * Get all drills for a template (with full drill details)
   */
  async getTemplateDrills(templateId: string): Promise<PracticeTemplateDrill[]> {
    const { data, error } = await supabase
      .from('practice_template_drills')
      .select(`
        *,
        drill:drills(*)
      `)
      .eq('template_id', templateId)
      .order('order_index');

    if (error) {
      logger.error('Failed to fetch template drills:', error);
      throw error;
    }

    return (data || []).map((row: any) => {
      const templateDrill = rowToPracticeTemplateDrill(row as PracticeTemplateDrillRow);
      if (row.drill) {
        templateDrill.drill = rowToDrill(row.drill as DrillRow);
      }
      return templateDrill;
    });
  }

  /**
   * Get template with all drills loaded
   */
  async getTemplateWithDrills(templateId: string): Promise<PracticeTemplate | null> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      return null;
    }

    const drills = await this.getTemplateDrills(templateId);
    template.drills = drills;

    return template;
  }

  /**
   * Get template with drills by slug
   */
  async getTemplateWithDrillsBySlug(slug: string): Promise<PracticeTemplate | null> {
    const template = await this.getTemplateBySlug(slug);
    if (!template) {
      return null;
    }

    const drills = await this.getTemplateDrills(template.id);
    template.drills = drills;

    return template;
  }

  // =========================================================================
  // CATALOG HELPERS
  // =========================================================================

  /**
   * Get grouped templates by category for catalog view
   */
  async getTemplatesCatalog(): Promise<Map<DrillCategory, PracticeTemplate[]>> {
    const templates = await this.getAllTemplates();
    const catalog = new Map<DrillCategory, PracticeTemplate[]>();

    for (const template of templates) {
      const existing = catalog.get(template.category) || [];
      existing.push(template);
      catalog.set(template.category, existing);
    }

    return catalog;
  }

  /**
   * Get suggested templates based on skill areas to improve
   */
  async getSuggestedTemplates(
    skillAreas: string[],
    maxTemplates = 5
  ): Promise<PracticeTemplate[]> {
    // Map skill areas to drill categories
    const categoryMapping: Record<string, DrillCategory[]> = {
      'equipment-prep': ['boat_handling', 'crew_work'],
      'pre-race-planning': ['starting', 'rules'],
      'crew-coordination': ['crew_work', 'boat_handling'],
      'prestart-sequence': ['starting'],
      'start-execution': ['starting'],
      'upwind-execution': ['upwind', 'boat_handling'],
      'shift-awareness': ['upwind', 'downwind'],
      'windward-rounding': ['mark_rounding'],
      'downwind-speed': ['downwind', 'boat_handling'],
      'leeward-rounding': ['mark_rounding'],
      'finish-execution': ['upwind', 'starting'],
    };

    const targetCategories = new Set<DrillCategory>();
    for (const skillArea of skillAreas) {
      const categories = categoryMapping[skillArea] || [];
      categories.forEach((c) => targetCategories.add(c));
    }

    if (targetCategories.size === 0) {
      // Return featured templates as fallback
      return this.getFeaturedTemplates();
    }

    const { data, error } = await supabase
      .from('practice_templates')
      .select('*')
      .eq('is_active', true)
      .in('category', Array.from(targetCategories))
      .order('is_featured', { ascending: false })
      .order('difficulty')
      .limit(maxTemplates);

    if (error) {
      logger.error('Failed to fetch suggested templates:', error);
      return this.getFeaturedTemplates();
    }

    return (data as PracticeTemplateRow[]).map(rowToPracticeTemplate);
  }

  /**
   * Get quick practice templates (under 30 minutes)
   */
  async getQuickPracticeTemplates(): Promise<PracticeTemplate[]> {
    return this.searchTemplates({
      maxDuration: 30,
    });
  }

  /**
   * Get templates suitable for solo practice
   */
  async getSoloPracticeTemplates(): Promise<PracticeTemplate[]> {
    return this.searchTemplates({
      crewSize: 1,
      requiresCoachBoat: false,
    });
  }
}

// Export singleton instance
export const PracticeTemplateService = new PracticeTemplateServiceClass();

export default PracticeTemplateService;
