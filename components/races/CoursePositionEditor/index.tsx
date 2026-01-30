/**
 * CoursePositionEditor - Platform-aware course positioning editor
 *
 * Routes to native (react-native-maps) or web (MapLibre GL) implementation.
 */

import { Platform } from 'react-native';

// Platform-specific imports using require to avoid bundling issues
export const CoursePositionEditor = Platform.select({
  native: () => require('./index.native').CoursePositionEditor,
  default: () => require('./index.web').CoursePositionEditor,
})();

// Re-export types for convenience
export type { PositionedCourse, PositionedMark, StartLinePosition, CourseType } from '@/types/courses';
