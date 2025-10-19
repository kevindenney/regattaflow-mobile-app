/**
 * Sailing Document Parser Utilities
 *
 * Pre-tested utility functions for parsing and processing sailing race documents.
 * These functions are designed to work with the sailing-document-parser Claude skill.
 *
 * @module sailing-document-parser/utils
 */

// Coordinate conversion utilities
export {
  detectCoordinateFormat,
  convertDMSToDecimal,
  convertDDMToDecimal,
  convertToDecimal,
  parseCoordinatePair,
  validateCoordinates,
  formatCoordinates,
  type CoordinateFormat,
  type CoordinateParseResult,
} from './coordinates';

// Course generation utilities
export {
  generateCourseGeoJSON,
  generateCourseLegsGeoJSON,
  detectCourseType,
  calculateCourseCenter,
  calculateCourseBounds,
  calculateDistance,
  calculateBearing,
  generateCourseLegs,
  sortMarksByPosition,
  type CourseType,
  type MarkType,
  type Mark,
  type CourseLeg,
  type GeoJSONFeature,
  type GeoJSONFeatureCollection,
} from './course-generation';

// Validation utilities
export {
  validateMark,
  validateMarks,
  validateLegs,
  validateCourse,
  sanitizeMark,
  autoFixMarks,
  type ValidationResult,
  type MarkValidationResult,
  type CourseValidationResult,
} from './validation';
