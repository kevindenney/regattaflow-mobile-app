/**
 * Course Image Extractor Service
 *
 * Uses Claude Vision to extract course marks, sequence, and wind direction
 * from sailing course diagram images.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system/legacy';
import { createLogger } from '@/lib/utils/logger';
import type { MarkType, CourseType } from '@/types/courses';

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
  private genAI = new Anthropic({
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
    dangerouslyAllowBrowser: true,
  });

  /**
   * Extract course information from a course diagram image
   */
  async extractCourseFromImage(imageUri: string): Promise<CourseExtractionResult> {
    try {
      logger.debug('Extracting course from image', { imageUri });

      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);

      const prompt = `Analyze this sailing course diagram image. You are an expert sailing race officer and course analyst.

Extract all course marks, their types, rounding directions, and the course sequence. Look carefully for:

1. MARK IDENTIFICATION:
   - Start/Finish line marks (often called "Pin", "RC Boat", "Committee Boat")
   - Windward marks (usually at top of diagram, labeled "1", "W", "Windward", etc.)
   - Leeward marks (usually at bottom, labeled "2", "L", "Leeward", etc.)
   - Gate marks (paired marks like "3p" and "3s" for port and starboard gates)
   - Offset marks (smaller marks near main marks)
   - Wing marks (side marks in triangle or trapezoid courses)

2. ROUNDING DIRECTIONS:
   - Look for arrows showing direction of travel
   - Port roundings = mark on your left when rounding (counterclockwise)
   - Starboard roundings = mark on your right when rounding (clockwise)

3. COURSE SEQUENCE:
   - Follow the course from start to finish
   - Note the order of mark roundings
   - Identify if there are multiple laps

4. WIND DIRECTION:
   - Usually indicated by an arrow or "WIND" label
   - Windward marks are upwind, leeward marks are downwind

5. COURSE TYPE:
   - windward_leeward: Simple up-down course
   - triangle: Three-sided course
   - trapezoid: Four-sided course
   - olympic: Triangle + windward-leeward
   - custom: Any other configuration

Respond with ONLY valid JSON in this exact format:
{
  "marks": [
    {
      "name": "Pin",
      "type": "start",
      "position": {
        "relative": "bottom-left",
        "description": "Port end of start line"
      },
      "rounding": "port",
      "color": "orange"
    },
    {
      "name": "1",
      "type": "windward",
      "position": {
        "relative": "top",
        "description": "Windward mark"
      },
      "rounding": "port"
    },
    {
      "name": "2",
      "type": "leeward",
      "position": {
        "relative": "bottom",
        "description": "Leeward mark"
      },
      "rounding": "port"
    }
  ],
  "sequence": ["Start", "1", "2", "1", "Finish"],
  "windDirection": "from bottom",
  "courseType": "windward_leeward",
  "laps": 2,
  "notes": ["Gate at leeward mark", "Offset after windward"],
  "confidence": 85
}

If you cannot identify marks clearly, still provide your best interpretation with a lower confidence score.`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: this.getMediaType(imageUri),
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      logger.debug('Claude response received', { responseLength: response.length });

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ExtractedCourse;

        // Validate and clean up the result
        const validatedResult = this.validateExtractedCourse(parsed);

        return {
          success: true,
          data: validatedResult,
        };
      }

      logger.warn('No JSON found in Claude response', { response: response.substring(0, 500) });
      return {
        success: false,
        error: 'Could not extract course data from image',
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

      const prompt = `Analyze this sailing course diagram image. You are an expert sailing race officer and course analyst.

Extract all course marks, their types, rounding directions, and the course sequence.

Respond with ONLY valid JSON in this format:
{
  "marks": [
    {"name": "Pin", "type": "start", "rounding": "port"},
    {"name": "1", "type": "windward", "rounding": "port"},
    {"name": "2", "type": "leeward", "rounding": "port"}
  ],
  "sequence": ["Start", "1", "2", "1", "Finish"],
  "windDirection": "from bottom",
  "courseType": "windward_leeward",
  "laps": 2,
  "confidence": 85
}

Mark types: start, windward, leeward, gate, offset, finish, wing
Course types: windward_leeward, triangle, olympic, trapezoid, custom`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ExtractedCourse;
        return {
          success: true,
          data: this.validateExtractedCourse(parsed),
        };
      }

      return {
        success: false,
        error: 'Could not extract course data from image',
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
