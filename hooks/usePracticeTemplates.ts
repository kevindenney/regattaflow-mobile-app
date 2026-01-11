/**
 * usePracticeTemplates Hook
 *
 * React Query hooks for fetching and managing practice templates.
 */

import { useQuery } from '@tanstack/react-query';
import {
  PracticeTemplateService,
  TemplateFilters,
} from '@/services/PracticeTemplateService';
import { DrillCategory, DrillDifficulty, PracticeTemplate } from '@/types/practice';

const QUERY_KEYS = {
  templates: ['practice-templates'] as const,
  featuredTemplates: ['practice-templates', 'featured'] as const,
  templatesByCategory: (category: DrillCategory) =>
    ['practice-templates', 'category', category] as const,
  templatesByDifficulty: (difficulty: DrillDifficulty) =>
    ['practice-templates', 'difficulty', difficulty] as const,
  templateById: (id: string) => ['practice-templates', 'id', id] as const,
  templateBySlug: (slug: string) => ['practice-templates', 'slug', slug] as const,
  templateWithDrills: (id: string) => ['practice-templates', 'with-drills', id] as const,
  templatesCatalog: ['practice-templates', 'catalog'] as const,
  suggestedTemplates: (skillAreas: string[]) =>
    ['practice-templates', 'suggested', skillAreas] as const,
  quickTemplates: ['practice-templates', 'quick'] as const,
  soloTemplates: ['practice-templates', 'solo'] as const,
  searchTemplates: (filters: TemplateFilters) =>
    ['practice-templates', 'search', filters] as const,
};

/**
 * Fetch all active templates
 */
export function usePracticeTemplates() {
  return useQuery({
    queryKey: QUERY_KEYS.templates,
    queryFn: () => PracticeTemplateService.getAllTemplates(),
  });
}

/**
 * Fetch featured templates
 */
export function useFeaturedTemplates() {
  return useQuery({
    queryKey: QUERY_KEYS.featuredTemplates,
    queryFn: () => PracticeTemplateService.getFeaturedTemplates(),
  });
}

/**
 * Fetch templates by category
 */
export function useTemplatesByCategory(category: DrillCategory) {
  return useQuery({
    queryKey: QUERY_KEYS.templatesByCategory(category),
    queryFn: () => PracticeTemplateService.getTemplatesByCategory(category),
    enabled: !!category,
  });
}

/**
 * Fetch templates by difficulty
 */
export function useTemplatesByDifficulty(difficulty: DrillDifficulty) {
  return useQuery({
    queryKey: QUERY_KEYS.templatesByDifficulty(difficulty),
    queryFn: () => PracticeTemplateService.getTemplatesByDifficulty(difficulty),
    enabled: !!difficulty,
  });
}

/**
 * Fetch a single template by ID
 */
export function useTemplateById(templateId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.templateById(templateId || ''),
    queryFn: () => PracticeTemplateService.getTemplateById(templateId!),
    enabled: !!templateId,
  });
}

/**
 * Fetch a single template by slug
 */
export function useTemplateBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.templateBySlug(slug || ''),
    queryFn: () => PracticeTemplateService.getTemplateBySlug(slug!),
    enabled: !!slug,
  });
}

/**
 * Fetch a template with all its drills
 */
export function useTemplateWithDrills(templateId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.templateWithDrills(templateId || ''),
    queryFn: () => PracticeTemplateService.getTemplateWithDrills(templateId!),
    enabled: !!templateId,
  });
}

/**
 * Fetch templates grouped by category for catalog view
 */
export function useTemplatesCatalog() {
  return useQuery({
    queryKey: QUERY_KEYS.templatesCatalog,
    queryFn: () => PracticeTemplateService.getTemplatesCatalog(),
  });
}

/**
 * Fetch suggested templates based on skill areas
 */
export function useSuggestedTemplates(
  skillAreas: string[],
  options?: { maxTemplates?: number }
) {
  return useQuery({
    queryKey: QUERY_KEYS.suggestedTemplates(skillAreas),
    queryFn: () =>
      PracticeTemplateService.getSuggestedTemplates(
        skillAreas,
        options?.maxTemplates
      ),
    enabled: skillAreas.length > 0,
  });
}

/**
 * Fetch quick practice templates (under 30 minutes)
 */
export function useQuickPracticeTemplates() {
  return useQuery({
    queryKey: QUERY_KEYS.quickTemplates,
    queryFn: () => PracticeTemplateService.getQuickPracticeTemplates(),
  });
}

/**
 * Fetch solo practice templates
 */
export function useSoloPracticeTemplates() {
  return useQuery({
    queryKey: QUERY_KEYS.soloTemplates,
    queryFn: () => PracticeTemplateService.getSoloPracticeTemplates(),
  });
}

/**
 * Search templates with filters
 */
export function useSearchTemplates(filters: TemplateFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.searchTemplates(filters),
    queryFn: () => PracticeTemplateService.searchTemplates(filters),
    enabled: Object.keys(filters).length > 0,
  });
}

export default {
  usePracticeTemplates,
  useFeaturedTemplates,
  useTemplatesByCategory,
  useTemplatesByDifficulty,
  useTemplateById,
  useTemplateBySlug,
  useTemplateWithDrills,
  useTemplatesCatalog,
  useSuggestedTemplates,
  useQuickPracticeTemplates,
  useSoloPracticeTemplates,
  useSearchTemplates,
};
