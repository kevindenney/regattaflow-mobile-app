/**
 * Course Library Seeding Script
 * --------------------------------
 * Loads structured course data from data/race-courses.json and inserts it into
 * the Supabase `race_courses` table so the course selector has baseline content.
 *
 * To run from the terminal:
 *   node --loader ts-node/esm --loader tsconfig-paths/register scripts/seed-course-library.ts
 *
 * Ensure the following environment variables are present:
 *   - SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (preferred) or EXPO_PUBLIC_SUPABASE_ANON_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';

const courseLibrary = require('@/data/race-courses.json');

// Generate a deterministic UUID v5 from a text ID
// Use DNS namespace as the namespace UUID for consistency
const COURSE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function textToUuid(text: string): string {
  return uuidv5(text, COURSE_NAMESPACE);
}

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_* equivalents).'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

interface CourseMarkRecord {
  id?: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  sequence_order: number;
}

interface SeedCourseRecord {
  id: string;
  name: string;
  description?: string;
  course_type: string;
  marks: CourseMarkRecord[];
  typical_length_nm?: number | null;
  estimated_duration_minutes?: number | null;
  min_wind_direction?: number | null;
  max_wind_direction?: number | null;
  min_wind_speed?: number | null;
  max_wind_speed?: number | null;
  usage_count?: number;
  // origin and metadata will be added in future migration
  // origin?: string;
  // metadata?: Record<string, any>;
  club_id?: string | null;
  venue_id?: string | null;
}

const normalizeCourseType = (type: string): string => {
  // Convert hyphens to underscores and ensure lowercase
  // Valid types: windward_leeward, olympic, trapezoid, coastal, custom
  const normalized = type.toLowerCase().replace(/-/g, '_');
  const validTypes = ['windward_leeward', 'olympic', 'trapezoid', 'coastal', 'custom'];
  return validTypes.includes(normalized) ? normalized : 'custom';
};

const normalizeMarkType = (key: string): string => {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey.includes('committee')) return 'committee_boat';
  if (normalizedKey.includes('start') && normalizedKey.includes('pin')) return 'pin';
  if (normalizedKey.includes('windward')) return 'windward';
  if (normalizedKey.includes('leeward') && normalizedKey.includes('port')) return 'gate_left';
  if (normalizedKey.includes('leeward') && normalizedKey.includes('star')) return 'gate_right';
  if (normalizedKey.includes('gate') && normalizedKey.includes('left')) return 'gate_left';
  if (normalizedKey.includes('gate') && normalizedKey.includes('right')) return 'gate_right';
  if (normalizedKey.includes('finish')) return 'finish';
  if (normalizedKey.includes('offset')) return 'offset';
  return 'custom';
};

const parseDistance = (value: any): number | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const matches = value.match(/[0-9.]+/g);
  if (!matches || matches.length === 0) {
    return null;
  }

  const numbers = matches.map((entry) => parseFloat(entry)).filter((num) => !Number.isNaN(num));
  if (numbers.length === 0) {
    return null;
  }

  const sum = numbers.reduce((total, current) => total + current, 0);
  return parseFloat((sum / numbers.length).toFixed(2));
};

const extractCourseRecords = (): SeedCourseRecord[] => {
  const results: SeedCourseRecord[] = [];
  const regions = courseLibrary?.specificCourses || {};

  Object.entries(regions).forEach(([regionId, region]: [string, any]) => {
    const courses = region?.courses || {};

    Object.values(courses).forEach((course: any) => {
      let marks: CourseMarkRecord[] = [];

      // Handle format 1: coordinates.marks object
      if (course?.coordinates?.marks) {
        marks = Object.entries(course.coordinates.marks).map(
          ([key, value], index) => {
            if (!Array.isArray(value) || value.length < 2) {
              throw new Error(`Invalid coordinates for mark "${key}" in course ${course.id}`);
            }

            const [lng, lat] = value as number[];
            return {
              id: textToUuid(`${course.id}-mark-${index}`),
              name: key.replace(/_/g, ' '),
              type: normalizeMarkType(key),
              latitude: lat,
              longitude: lng,
              sequence_order: index,
            };
          }
        );
      }
      // Handle format 2: course.start, course.checkpoints, course.finish
      else if (course?.course) {
        let markIndex = 0;

        // Add start mark
        if (course.course.start && Array.isArray(course.course.start) && course.course.start.length >= 2) {
          const [lng, lat] = course.course.start;
          marks.push({
            id: textToUuid(`${course.id}-mark-${markIndex++}`),
            name: 'Start',
            type: 'committee_boat',
            latitude: lat,
            longitude: lng,
            sequence_order: marks.length,
          });
        }

        // Add checkpoint marks
        if (Array.isArray(course.course.checkpoints)) {
          course.course.checkpoints.forEach((checkpoint: any) => {
            if (checkpoint.coordinates && Array.isArray(checkpoint.coordinates) && checkpoint.coordinates.length >= 2) {
              const [lng, lat] = checkpoint.coordinates;
              marks.push({
                id: textToUuid(`${course.id}-mark-${markIndex++}`),
                name: checkpoint.name || `Checkpoint ${markIndex}`,
                type: 'custom',
                latitude: lat,
                longitude: lng,
                sequence_order: marks.length,
              });
            }
          });
        }

        // Add finish mark
        if (course.course.finish && Array.isArray(course.course.finish) && course.course.finish.length >= 2) {
          const [lng, lat] = course.course.finish;
          marks.push({
            id: textToUuid(`${course.id}-mark-${markIndex++}`),
            name: 'Finish',
            type: 'finish',
            latitude: lat,
            longitude: lng,
            sequence_order: marks.length,
          });
        }
      }

      // Skip courses with no valid marks
      if (marks.length === 0) {
        console.warn(`[seed] Skipping course ${course?.id || 'unknown'} - no valid marks found`);
        return;
      }

      const distance = course.distance || course?.details?.distance;

      const record = {
        id: textToUuid(course.id), // Convert text ID to deterministic UUID
        name: course.name,
        description: course.description || course.location || region?.venue || regionId,
        course_type: normalizeCourseType(course.type || 'custom'),
        marks,
        typical_length_nm: parseDistance(distance),
        estimated_duration_minutes: course.estimated_duration_minutes || null,
        min_wind_direction: course.min_wind_direction ?? null,
        max_wind_direction: course.max_wind_direction ?? null,
        min_wind_speed: course.min_wind_speed ?? null,
        max_wind_speed: course.max_wind_speed ?? null,
        usage_count: 0,
        // origin and metadata columns will be added in a future migration
        // origin: 'seeded-json',
        // metadata: {
        //   region: regionId,
        //   source: 'data/race-courses.json',
        //   clubs: course.clubs || [],
        // },
        club_id: Array.isArray(course.clubs) && course.clubs.length > 0 ? course.clubs[0] : null,
        venue_id: course.venue_id || null,
      };

      console.log(`[seed] Adding course: ${course.id} -> ${record.name} (${record.course_type})`);
      results.push(record);
    });
  });

  return results;
};

export async function seedCourseLibrary(): Promise<{ inserted: number }> {
  console.log('[seed-course-library] Starting course seeding...');

  const courseRecords = extractCourseRecords();
  if (courseRecords.length === 0) {
    console.warn('[seed-course-library] No course records found in JSON payload.');
    return { inserted: 0 };
  }

  // Table should already exist from migrations
  // Note: exec_sql RPC is not available, table must be created via migrations

  // Upsert records so running the script multiple times is safe.
  const { data, error } = await supabase
    .from('race_courses')
    .upsert(courseRecords, { onConflict: 'id' })
    .select('id');

  if (error) {
    console.error('[seed-course-library] Failed to insert courses:', error);
    throw error;
  }

  console.log(`[seed-course-library] Completed. Upserted ${data?.length ?? 0} courses.`);
  return { inserted: data?.length ?? 0 };
}

if (require.main === module) {
  seedCourseLibrary()
    .then(({ inserted }) => {
      console.log(`[seed-course-library] Done. ${inserted} courses inserted/updated.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[seed-course-library] Error seeding courses:', err);
      process.exit(1);
    });
}
