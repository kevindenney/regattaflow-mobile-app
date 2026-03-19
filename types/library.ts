/**
 * Library types — user-curated external learning resources
 */

export type ResourceType =
  | 'online_course'
  | 'youtube_channel'
  | 'youtube_video'
  | 'website'
  | 'book_digital'
  | 'book_physical'
  | 'social_media'
  | 'cloud_folder'
  | 'other';

export interface LibraryRecord {
  id: string;
  user_id: string;
  interest_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryResourceRecord {
  id: string;
  library_id: string;
  user_id: string;
  title: string;
  url: string | null;
  resource_type: ResourceType;
  source_platform: string | null;
  author_or_creator: string | null;
  description: string | null;
  thumbnail_url: string | null;
  capability_goals: string[];
  tags: string[];
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateLibraryResourceInput {
  library_id: string;
  title: string;
  url?: string | null;
  resource_type?: ResourceType;
  source_platform?: string | null;
  author_or_creator?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  capability_goals?: string[];
  tags?: string[];
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateLibraryResourceInput {
  title?: string;
  url?: string | null;
  resource_type?: ResourceType;
  source_platform?: string | null;
  author_or_creator?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  capability_goals?: string[];
  tags?: string[];
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Course structure types — stored in LibraryResourceRecord.metadata
// ---------------------------------------------------------------------------

export interface CourseLesson {
  id: string;
  title: string;
  sort_order: number;
  url?: string;
  duration_minutes?: number;
  description?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  sort_order: number;
  lessons: CourseLesson[];
}

export interface CourseStructure {
  modules: CourseModule[];
  total_lessons: number;
  estimated_hours?: number;
}

export interface CourseProgress {
  completed_lesson_ids: string[];
  last_completed_at?: string;
}

export interface CourseMetadata {
  course_structure?: CourseStructure;
  progress?: CourseProgress;
}

/**
 * Helper to extract course metadata from a library resource's generic metadata.
 */
export function getCourseMetadata(resource: LibraryResourceRecord): CourseMetadata {
  const meta = resource.metadata as CourseMetadata;
  return {
    course_structure: meta?.course_structure,
    progress: meta?.progress,
  };
}

/**
 * Get a flat list of all lessons across all modules.
 */
export function getAllLessons(structure: CourseStructure): CourseLesson[] {
  return structure.modules
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((m) =>
      m.lessons.sort((a, b) => a.sort_order - b.sort_order),
    );
}

/**
 * Calculate course completion percentage.
 */
export function getCourseCompletionPercent(resource: LibraryResourceRecord): number {
  const { course_structure, progress } = getCourseMetadata(resource);
  if (!course_structure || course_structure.total_lessons === 0) return 0;
  const completed = progress?.completed_lesson_ids?.length ?? 0;
  return Math.round((completed / course_structure.total_lessons) * 100);
}
