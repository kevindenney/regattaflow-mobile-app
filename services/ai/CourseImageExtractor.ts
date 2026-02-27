/**
 * Course Image Extractor Service
 *
 * Uses Claude Vision to extract course marks, sequence, and wind direction
 * from sailing course diagram images.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { createLogger } from '@/lib/utils/logger';
import type { MarkType, CourseType } from '@/types/courses';
import { supabase } from '@/services/supabase';

const logger = createLogger('CourseImageExtractor');

export interface ExtractedMark {
  name: string;
  type: MarkType;
  position?: {
    relative: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    description?: string;
  };
  rounding?: 'port' | 'starboard';
  color?: string;
  shape?: string;
}

export interface ExtractedCourse {
  marks: ExtractedMark[];
  sequence: string[]; // Array of mark names in rounding order
  windDirection?: string; // "from top", "from bottom", "from left", "from right", or degrees
  courseType?: CourseType;
  laps?: number;
  notes?: string[];
  confidence: number; // 0-100
}

export interface CourseExtractionResult {
  success: boolean;
  data?: ExtractedCourse;
  error?: string;
}

class CourseImageExtractorService {
  /**
   * Extract course information from a course diagram image
   */
  async extractCourseFromImage(imageUri: string): Promise<CourseExtractionResult> {
    try {
      logger.debug('Extracting course from image', { imageUri });

      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);

      const { data, error } = await supabase.functions.invoke('extract-course-image', {
        body: {
          imageBase64: base64Image,
          mediaType: this.getMediaType(imageUri),
        },
      });

      if (error) {
        throw new Error(error.message || 'Course image extraction failed');
      }

      if (data?.success && data?.data) {
        return {
          success: true,
          data: this.validateExtractedCourse(data.data as ExtractedCourse),
        };
      }

      return {
        success: false,
        error: data?.error || 'Could not extract course data from image',
      };
    } catch (error: any) {
      logger.error('Course extraction error', { error });
      return {
        success: false,
        error: error.message || 'Failed to analyze course image',
      };
    }
  }

  /**
   * Extract course from base64 image data (for web/edge function use)
   */
  async extractCourseFromBase64(base64Data: string, mediaType: string = 'image/png'): Promise<CourseExtractionResult> {
    try {
      logger.debug('Extracting course from base64', { dataLength: base64Data.length });

      const { data, error } = await supabase.functions.invoke('extract-course-image', {
        body: {
          imageBase64: base64Data,
          mediaType,
        },
      });

      if (error) {
        throw new Error(error.message || 'Course image extraction failed');
      }

      if (data?.success && data?.data) {
        return {
          success: true,
          data: this.validateExtractedCourse(data.data as ExtractedCourse),
        };
      }

      return {
        success: false,
        error: data?.error || 'Could not extract course data from image',
      };
    } catch (error: any) {
      logger.error('Course extraction error (base64)', { error });
      return {
        success: false,
        error: error.message || 'Failed to analyze course image',
      };
    }
  }

  /**
   * Convert local image to base64
   */
  private async convertImageToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      logger.error('Error converting image to base64', { error, uri });
      throw error;
    }
  }

  /**
   * Determine media type from URI
   */
  private getMediaType(uri: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    const lower = uri.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg'; // Default
  }

  /**
   * Validate and clean up extracted course data
   */
  private validateExtractedCourse(data: ExtractedCourse): ExtractedCourse {
    // Ensure marks array exists
    const marks = Array.isArray(data.marks) ? data.marks : [];

    // Validate each mark
    const validatedMarks: ExtractedMark[] = marks.map(mark => ({
      name: mark.name || 'Unknown',
      type: this.validateMarkType(mark.type),
      position: mark.position,
      rounding: mark.rounding === 'port' || mark.rounding === 'starboard' ? mark.rounding : undefined,
      color: mark.color,
      shape: mark.shape,
    }));

    // Ensure sequence array exists
    const sequence = Array.isArray(data.sequence) ? data.sequence : [];

    // Validate course type
    const courseType = this.validateCourseType(data.courseType);

    return {
      marks: validatedMarks,
      sequence,
      windDirection: data.windDirection,
      courseType,
      laps: typeof data.laps === 'number' ? data.laps : undefined,
      notes: Array.isArray(data.notes) ? data.notes : undefined,
      confidence: typeof data.confidence === 'number' ? Math.min(100, Math.max(0, data.confidence)) : 50,
    };
  }

  /**
   * Validate mark type
   */
  private validateMarkType(type: any): MarkType {
    const validTypes: MarkType[] = ['start', 'windward', 'leeward', 'wing', 'offset', 'finish', 'gate'];
    if (validTypes.includes(type)) {
      return type;
    }
    // Map common variations
    const typeMap: Record<string, MarkType> = {
      'committee': 'start',
      'rc': 'start',
      'pin': 'start',
      'weather': 'windward',
      'upwind': 'windward',
      'downwind': 'leeward',
      'spreader': 'offset',
      'reaching': 'wing',
    };
    const normalized = String(type).toLowerCase();
    return typeMap[normalized] || 'windward';
  }

  /**
   * Validate course type
   */
  private validateCourseType(type: any): CourseType | undefined {
    const validTypes: CourseType[] = ['windward_leeward', 'triangle', 'olympic', 'trapezoid', 'custom'];
    if (validTypes.includes(type)) {
      return type;
    }
    return undefined;
  }
}

export const courseImageExtractor = new CourseImageExtractorService();
