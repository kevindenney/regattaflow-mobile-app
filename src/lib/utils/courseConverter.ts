/**
 * Course Data Converter
 * Converts AI-extracted race course data to 3D map visualization format
 */

import type { RaceCourseExtraction } from '@/src/lib/types/ai-knowledge';
import type { RaceMark, GeoLocation } from '@/src/lib/types/map';

/**
 * Convert AI-extracted race course to 3D map format
 */
export function convertCourseToMarks(courseExtraction: RaceCourseExtraction): RaceMark[] {
  console.log('🔄 Converting race course extraction to map marks');

  const marks: RaceMark[] = [];
  let markIdCounter = 1;

  courseExtraction.marks.forEach((extractedMark, index) => {
    // Only create marks that have valid coordinates
    if (extractedMark.position?.latitude && extractedMark.position?.longitude) {
      const mark: RaceMark = {
        id: `extracted-mark-${markIdCounter++}`,
        name: extractedMark.name || `Mark ${index + 1}`,
        position: {
          latitude: extractedMark.position.latitude,
          longitude: extractedMark.position.longitude
        },
        type: convertMarkType(extractedMark.type),
        rounding: inferRounding(extractedMark.type, extractedMark.name),
        color: extractedMark.color || getDefaultMarkColor(extractedMark.type),
        size: getMarkSize(extractedMark.type)
      };

      marks.push(mark);
      console.log(`✅ Converted mark: ${mark.name} (${mark.type}) at ${mark.position.latitude}, ${mark.position.longitude}`);
    } else {
      console.log(`⚠️ Skipping mark with no coordinates: ${extractedMark.name}`);
    }
  });

  // Add course metadata to marks if available
  marks.forEach(mark => {
    mark.extractionMetadata = {
      confidence: courseExtraction.extractionMetadata.overallConfidence,
      source: courseExtraction.extractionMetadata.source,
      extractedAt: courseExtraction.extractionMetadata.extractedAt
    };
  });

  console.log(`🏁 Course conversion complete: ${marks.length} marks created from ${courseExtraction.marks.length} extracted marks`);

  return marks;
}

/**
 * Convert extracted mark type to map mark type
 */
function convertMarkType(extractedType: string): RaceMark['type'] {
  switch (extractedType.toLowerCase()) {
    case 'start':
      return 'start';
    case 'finish':
      return 'finish';
    case 'windward':
      return 'windward';
    case 'leeward':
      return 'leeward';
    case 'gate':
      return 'gate';
    case 'wing':
      return 'offset';
    default:
      return 'offset'; // Default for unknown types
  }
}

/**
 * Infer rounding direction from mark type and name
 */
function inferRounding(type: string, name: string): 'port' | 'starboard' {
  const lowerName = name.toLowerCase();
  const lowerType = type.toLowerCase();

  // Explicit rounding mentions
  if (lowerName.includes('port')) return 'port';
  if (lowerName.includes('starboard')) return 'starboard';

  // Default rounding based on typical course layouts
  switch (lowerType) {
    case 'windward':
      return 'port'; // Typical windward rounding
    case 'leeward':
      return 'port'; // Typical leeward rounding
    case 'gate':
      return 'port'; // Gates typically rounded to port
    default:
      return 'port'; // Default to port
  }
}

/**
 * Get default color for mark type
 */
function getDefaultMarkColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'start':
      return 'green';
    case 'finish':
      return 'blue';
    case 'windward':
      return 'yellow';
    case 'leeward':
      return 'red';
    case 'gate':
      return 'orange';
    default:
      return 'white';
  }
}

/**
 * Get mark size based on type
 */
function getMarkSize(type: string): number {
  switch (type.toLowerCase()) {
    case 'start':
    case 'finish':
      return 1.5; // Larger for start/finish
    case 'windward':
    case 'leeward':
      return 1.2; // Medium for course marks
    default:
      return 1.0; // Default size
  }
}

/**
 * Calculate course center from extracted marks
 */
export function calculateCourseCenter(courseExtraction: RaceCourseExtraction): GeoLocation | null {
  const validMarks = courseExtraction.marks.filter(
    mark => mark.position?.latitude && mark.position?.longitude
  );

  if (validMarks.length === 0) {
    console.log('⚠️ No valid coordinates found for course center calculation');
    return null;
  }

  const sumLat = validMarks.reduce((sum, mark) => sum + (mark.position!.latitude!), 0);
  const sumLng = validMarks.reduce((sum, mark) => sum + (mark.position!.longitude!), 0);

  const center = {
    latitude: sumLat / validMarks.length,
    longitude: sumLng / validMarks.length
  };

  console.log(`📍 Course center calculated: ${center.latitude.toFixed(6)}, ${center.longitude.toFixed(6)}`);

  return center;
}

/**
 * Determine optimal zoom level based on course dimensions
 */
export function calculateOptimalZoom(courseExtraction: RaceCourseExtraction): number {
  const validMarks = courseExtraction.marks.filter(
    mark => mark.position?.latitude && mark.position?.longitude
  );

  if (validMarks.length < 2) return 15; // Default zoom

  // Calculate course bounding box
  const lats = validMarks.map(mark => mark.position!.latitude!);
  const lngs = validMarks.map(mark => mark.position!.longitude!);

  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);

  const maxSpan = Math.max(latSpan, lngSpan);

  // Rough zoom calculation (could be refined)
  if (maxSpan > 0.1) return 11; // Large course
  if (maxSpan > 0.05) return 13; // Medium course
  if (maxSpan > 0.01) return 15; // Small course
  return 17; // Very small course

}

/**
 * Extract course summary for display
 */
export function extractCourseSummary(courseExtraction: RaceCourseExtraction): {
  courseType: string;
  markCount: number;
  hasCoordinates: boolean;
  confidence: number;
  venue: string | null;
} {
  const validMarks = courseExtraction.marks.filter(
    mark => mark.position?.latitude && mark.position?.longitude
  );

  return {
    courseType: courseExtraction.courseLayout.type,
    markCount: courseExtraction.marks.length,
    hasCoordinates: validMarks.length > 0,
    confidence: courseExtraction.extractionMetadata.overallConfidence,
    venue: courseExtraction.extractionMetadata.source
  };
}

/**
 * Extended RaceMark type with extraction metadata
 */
export interface ExtractedRaceMark extends RaceMark {
  extractionMetadata?: {
    confidence: number;
    source: string;
    extractedAt: Date;
  };
}