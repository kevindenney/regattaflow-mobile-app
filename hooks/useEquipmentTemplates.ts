/**
 * useEquipmentTemplates - Hook for fetching equipment templates and categories
 *
 * Provides equipment templates filtered by boat class and category,
 * along with category definitions for the Add Equipment modal.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { equipmentService, type EquipmentTemplate, type EquipmentCategory } from '@/services/EquipmentService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useEquipmentTemplates');

// =============================================================================
// TYPES
// =============================================================================

export interface CategoryGroup {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  categories: EquipmentCategory[];
}

export interface UseEquipmentTemplatesReturn {
  // Data
  categories: EquipmentCategory[];
  categoryGroups: CategoryGroup[];
  templates: EquipmentTemplate[];
  filteredTemplates: EquipmentTemplate[];

  // State
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;

  // Loading
  isLoading: boolean;
  error: Error | null;

  // Helpers
  getTemplatesForCategory: (category: string) => EquipmentTemplate[];
  getCategoryName: (categoryId: string) => string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Category groups for organizing the 23+ categories into logical sections
 */
export const CATEGORY_GROUPS: { id: string; name: string; categories: string[] }[] = [
  {
    id: 'rig',
    name: 'Rig',
    categories: ['mast', 'boom', 'spinnaker_pole'],
  },
  {
    id: 'standing_rigging',
    name: 'Standing Rigging',
    categories: ['forestay', 'backstay', 'shrouds', 'spreaders'],
  },
  {
    id: 'running_rigging',
    name: 'Running Rigging',
    categories: ['halyards', 'sheets', 'control_lines'],
  },
  {
    id: 'deck_hardware',
    name: 'Deck Hardware',
    categories: ['winches', 'blocks', 'cleats', 'tracks'],
  },
  {
    id: 'steering',
    name: 'Steering',
    categories: ['tiller', 'wheel', 'rudder'],
  },
  {
    id: 'hull',
    name: 'Hull & Appendages',
    categories: ['keel', 'centerboard'],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    categories: ['instruments', 'gps', 'vhf', 'compass'],
  },
  {
    id: 'safety',
    name: 'Safety',
    categories: ['life_jackets', 'safety_gear', 'anchor'],
  },
  {
    id: 'other',
    name: 'Other',
    categories: ['covers', 'trailer', 'other'],
  },
];

/**
 * Common equipment manufacturers for quick selection
 */
export const COMMON_MANUFACTURERS = [
  'Harken',
  'Lewmar',
  'Spinlock',
  'Ronstan',
  'Schaefer',
  'Garmin',
  'B&G',
  'Raymarine',
  'Selden',
  'Sparcraft',
  'Hall Spars',
  'Southern Spars',
];

// =============================================================================
// HOOK
// =============================================================================

export function useEquipmentTemplates(
  boatClassId: string | null = null
): UseEquipmentTemplatesReturn {
  // State
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load categories and templates
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load categories and templates in parallel
        const [categoriesData, templatesData] = await Promise.all([
          equipmentService.getCategories(),
          equipmentService.getTemplates({ classId: boatClassId || undefined }),
        ]);

        setCategories(categoriesData);
        setTemplates(templatesData);
      } catch (err) {
        logger.error('Failed to load equipment data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load equipment data'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [boatClassId]);

  // Group categories into logical sections
  const categoryGroups = useMemo((): CategoryGroup[] => {
    return CATEGORY_GROUPS.map(group => ({
      id: group.id,
      name: group.name,
      categories: categories.filter(cat => group.categories.includes(cat.id)),
    })).filter(group => group.categories.length > 0);
  }, [categories]);

  // Filter templates by selected category
  const filteredTemplates = useMemo(() => {
    if (!selectedCategory) return templates;
    return templates.filter(t => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  // Get templates for a specific category
  const getTemplatesForCategory = useCallback(
    (category: string): EquipmentTemplate[] => {
      return templates.filter(t => t.category === category);
    },
    [templates]
  );

  // Get category name by ID
  const getCategoryName = useCallback(
    (categoryId: string): string => {
      const category = categories.find(c => c.id === categoryId);
      return category?.name || categoryId;
    },
    [categories]
  );

  return {
    categories,
    categoryGroups,
    templates,
    filteredTemplates,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    error,
    getTemplatesForCategory,
    getCategoryName,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format lifespan for display
 */
export function formatLifespan(years: number | null | undefined): string {
  if (!years) return '';
  if (years === 1) return '1 year';
  return `${years} years`;
}

/**
 * Format maintenance interval for display
 */
export function formatMaintenanceInterval(days: number | null | undefined): string {
  if (!days) return '';
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.round(days / 365);
  return years === 1 ? '1 year' : `${years} years`;
}

export default useEquipmentTemplates;
