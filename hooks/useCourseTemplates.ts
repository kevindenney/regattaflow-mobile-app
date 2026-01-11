/**
 * useCourseTemplates Hook
 *
 * Provides common course type options for selection.
 * Currently uses static data; can be extended to fetch from database.
 */

import { useMemo } from 'react';

export interface CourseTemplate {
  id: string;
  name: string;
  description?: string;
  /** Common for this type of racing */
  raceTypes?: ('fleet' | 'distance' | 'match' | 'team')[];
}

/**
 * Common course types used in sailing races
 */
const STANDARD_COURSE_TEMPLATES: CourseTemplate[] = [
  {
    id: 'windward-leeward',
    name: 'Windward-Leeward',
    description: 'Up and down course with a windward and leeward mark',
    raceTypes: ['fleet', 'match', 'team'],
  },
  {
    id: 'windward-leeward-gate',
    name: 'Windward-Leeward with Gate',
    description: 'Windward-leeward with a leeward gate instead of single mark',
    raceTypes: ['fleet'],
  },
  {
    id: 'triangle',
    name: 'Triangle',
    description: 'Three mark course with upwind, reach, and run legs',
    raceTypes: ['fleet'],
  },
  {
    id: 'trapezoid',
    name: 'Trapezoid',
    description: 'Four mark course combining windward-leeward and triangle elements',
    raceTypes: ['fleet'],
  },
  {
    id: 'olympic',
    name: 'Olympic Triangle',
    description: 'Traditional Olympic course with windward, reach, reach pattern',
    raceTypes: ['fleet'],
  },
  {
    id: 'gold-cup',
    name: 'Gold Cup',
    description: 'Modified trapezoid common in keelboat racing',
    raceTypes: ['fleet'],
  },
  {
    id: 'inner-loop',
    name: 'Inner Loop',
    description: 'Short windward-leeward with a single rounding',
    raceTypes: ['fleet', 'match'],
  },
  {
    id: 'outer-loop',
    name: 'Outer Loop',
    description: 'Extended windward-leeward with multiple roundings',
    raceTypes: ['fleet'],
  },
  {
    id: 'digital-n',
    name: 'Digital N',
    description: 'Complex course with multiple legs and options',
    raceTypes: ['fleet'],
  },
  {
    id: 'point-to-point',
    name: 'Point to Point',
    description: 'Fixed course between two locations',
    raceTypes: ['distance'],
  },
  {
    id: 'round-the-island',
    name: 'Round the Island',
    description: 'Circumnavigation of an island or landmark',
    raceTypes: ['distance'],
  },
  {
    id: 'passage',
    name: 'Passage Race',
    description: 'Offshore passage between ports or waypoints',
    raceTypes: ['distance'],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'User-defined course',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
  },
];

interface UseCourseTemplatesOptions {
  /** Filter to specific race type */
  raceType?: 'fleet' | 'distance' | 'match' | 'team';
}

interface UseCourseTemplatesReturn {
  /** List of course templates */
  templates: CourseTemplate[];
  /** Get template by ID */
  getTemplate: (id: string) => CourseTemplate | undefined;
  /** Check if a value is a known template */
  isKnownTemplate: (name: string) => boolean;
}

export function useCourseTemplates(options: UseCourseTemplatesOptions = {}): UseCourseTemplatesReturn {
  const { raceType } = options;

  const templates = useMemo(() => {
    if (!raceType) {
      return STANDARD_COURSE_TEMPLATES;
    }
    return STANDARD_COURSE_TEMPLATES.filter(
      t => !t.raceTypes || t.raceTypes.includes(raceType)
    );
  }, [raceType]);

  const getTemplate = (id: string) => {
    return STANDARD_COURSE_TEMPLATES.find(t => t.id === id);
  };

  const isKnownTemplate = (name: string) => {
    const normalizedName = name.toLowerCase().trim();
    return STANDARD_COURSE_TEMPLATES.some(
      t => t.name.toLowerCase() === normalizedName || t.id === normalizedName
    );
  };

  return {
    templates,
    getTemplate,
    isKnownTemplate,
  };
}

export { STANDARD_COURSE_TEMPLATES };
export type { UseCourseTemplatesOptions, UseCourseTemplatesReturn };
