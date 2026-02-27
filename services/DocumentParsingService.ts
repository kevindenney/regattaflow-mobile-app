import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { nominatimService } from './location/NominatimService';
import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('DocumentParsingService');

interface CourseExtraction {
  course_name: string;
  racing_area: string;
  marks: CourseMark[];
  start_line: {
    coordinates: [number, number][];
    bearing: number;
    length_meters: number;
  };
  start_location_name?: string | null;
  finish_line: {
    coordinates: [number, number][];
    bearing: number;
    length_meters: number;
  };
  finish_location_name?: string | null;
  course_configurations: CourseConfiguration[];
  restrictions: CourseRestriction[];
  wind_conditions: {
    expected_direction: number;
    expected_speed_range: [number, number];
    shift_probability: number;
  };
  tide_information: {
    high_tide: string;
    low_tide: string;
    current_direction: number;
    max_speed_knots: number;
  };
  safety_information: string[];
  protest_procedures: string[];
}

interface CourseMark {
  id: string;
  name: string;
  type: 'start' | 'windward' | 'leeward' | 'reach' | 'finish' | 'gate';
  coordinates: [number, number];
  rounding_direction: 'port' | 'starboard' | 'either';
  description: string;
}

interface CourseConfiguration {
  name: string;
  sequence: string[];
  distance_nm: number;
  estimated_duration: number;
  wind_range: [number, number];
  description: string;
}

interface CourseRestriction {
  type: 'boundary' | 'obstruction' | 'prohibited' | 'shallow';
  coordinates: [number, number][];
  description: string;
  penalty: string;
}

interface VenueIntelligence {
  venue_id: string;
  local_conditions: {
    typical_wind_patterns: WindPattern[];
    tidal_effects: TidalEffect[];
    current_patterns: CurrentPattern[];
    seasonal_variations: SeasonalVariation[];
  };
  tactical_intelligence: {
    favored_sides: FavoredSide[];
    layline_considerations: string[];
    start_line_bias_history: StartLineBias[];
    mark_rounding_tips: MarkRoundingTip[];
  };
  equipment_recommendations: {
    sail_configuration: SailConfiguration[];
    boat_setup: BoatSetup[];
    crew_positioning: CrewPositioning[];
  };
  cultural_protocols: {
    racing_etiquette: string[];
    protest_procedures: string[];
    social_customs: string[];
    language_considerations: string[];
  };
}

interface WindPattern {
  time_of_day: string;
  direction_range: [number, number];
  speed_range: [number, number];
  shift_frequency: number;
  reliability_score: number;
}

interface TidalEffect {
  tide_state: 'flooding' | 'ebbing' | 'high' | 'low';
  effect_on_wind: string;
  current_strength: number;
  strategic_implications: string[];
}

interface CurrentPattern {
  direction: number;
  speed_range: [number, number];
  affected_areas: string[];
  tactical_advice: string[];
}

interface SeasonalVariation {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  wind_changes: string;
  weather_patterns: string;
  racing_considerations: string[];
}

interface FavoredSide {
  side: 'left' | 'right' | 'middle';
  conditions: string;
  percentage_advantage: number;
  reasoning: string;
}

interface StartLineBias {
  date: string;
  wind_direction: number;
  wind_speed: number;
  favored_end: 'pin' | 'boat' | 'neutral';
  bias_degrees: number;
}

interface MarkRoundingTip {
  mark_name: string;
  current_considerations: string;
  traffic_patterns: string;
  optimal_approach: string;
}

interface SailConfiguration {
  wind_range: [number, number];
  recommended_sails: string[];
  trim_settings: string[];
  venue_specific_notes: string[];
}

interface BoatSetup {
  conditions: string;
  mast_setup: string[];
  sail_controls: string[];
  weight_distribution: string[];
}

interface CrewPositioning {
  conditions: string;
  helmsman_position: string;
  crew_distribution: string[];
  communication_tips: string[];
}

export class DocumentParsingService {
  /**
   * Parse sailing instructions document and extract race course information
   */
  static async parseSailingInstructions(
    documentUri: string,
    venueId?: string
  ): Promise<CourseExtraction> {
    try {

      // Read document content
      const documentContent = await this.readDocumentContent(documentUri);

      const mimeType = this.getMimeType(documentUri);
      const fileName = documentUri.split('/').pop() || 'race-document';
      const fileContent = `data:${mimeType};base64,${documentContent}`;

      const { data, error } = await supabase.functions.invoke('extract-course-from-document', {
        body: {
          fileContent,
          fileName,
          fileType: mimeType,
          raceType: 'fleet',
        },
      });

      if (error) {
        throw new Error(error.message || 'Document parsing edge function failed');
      }

      const waypoints = Array.isArray(data?.waypoints) ? data.waypoints : [];
      if (waypoints.length === 0) {
        return this.generateFallbackCourse();
      }

      const marks: CourseMark[] = waypoints.map((wp: any, index: number) => ({
        id: `M${index + 1}`,
        name: wp?.name || `Mark ${index + 1}`,
        type:
          wp?.type === 'start' || wp?.type === 'finish' || wp?.type === 'gate'
            ? wp.type
            : wp?.type === 'mark'
            ? 'windward'
            : 'reach',
        coordinates: [wp.latitude, wp.longitude],
        rounding_direction: wp?.passingSide === 'port' || wp?.passingSide === 'starboard' ? wp.passingSide : 'either',
        description: wp?.notes || '',
      }));

      const startMarks = marks.filter((m) => m.type === 'start');
      const finishMarks = marks.filter((m) => m.type === 'finish');
      const fallbackLine: [number, number] = marks[0]?.coordinates || [22.2854, 114.1577];

      const extraction: CourseExtraction = {
        course_name: data?.courseName || fileName.replace(/\.[^.]+$/, ''),
        racing_area: data?.courseDescription || 'Main Racing Area',
        marks,
        start_line: {
          coordinates:
            startMarks.length >= 2
              ? [startMarks[0].coordinates, startMarks[1].coordinates]
              : [fallbackLine, fallbackLine],
          bearing: 90,
          length_meters: 100,
        },
        start_location_name: data?.startLocationName || null,
        finish_line: {
          coordinates:
            finishMarks.length >= 2
              ? [finishMarks[0].coordinates, finishMarks[1].coordinates]
              : [fallbackLine, fallbackLine],
          bearing: 90,
          length_meters: 100,
        },
        finish_location_name: data?.finishLocationName || null,
        course_configurations: [
          {
            name: data?.courseName || 'Primary Course',
            sequence: marks.map((m) => m.id),
            distance_nm: typeof data?.totalDistanceNm === 'number' ? data.totalDistanceNm : 2.5,
            estimated_duration: 45,
            wind_range: [8, 15],
            description: data?.courseDescription || 'Extracted from uploaded race document',
          },
        ],
        restrictions: [],
        wind_conditions: {
          expected_direction: 90,
          expected_speed_range: [8, 15],
          shift_probability: 0.3,
        },
        tide_information: {
          high_tide: '14:30',
          low_tide: '08:15',
          current_direction: 180,
          max_speed_knots: 1.2,
        },
        safety_information: [],
        protest_procedures: [],
      };

      // Geocode start/finish location names if provided
      const geocodedExtraction = await this.geocodeStartFinishLocations(extraction, venueId);
      return geocodedExtraction;
    } catch (error) {
      logger.error('Error parsing sailing instructions', error);
      return this.generateFallbackCourse();
    }
  }

  /**
   * Load venue-specific intelligence for tactical planning
   */
  static async loadVenueIntelligence(venueId: string): Promise<VenueIntelligence> {
    try {
      const prompt = `
Generate comprehensive venue intelligence for sailing venue ID: ${venueId}

Provide detailed tactical and strategic intelligence including:

1. LOCAL CONDITIONS ANALYSIS:
   - Typical wind patterns by time of day and season
   - Tidal effects on wind and current
   - Current patterns and their tactical implications
   - Seasonal variations in conditions

2. TACTICAL INTELLIGENCE:
   - Historically favored sides of the course
   - Layline considerations and approach strategies
   - Start line bias patterns and statistics
   - Mark rounding techniques and traffic management

3. EQUIPMENT OPTIMIZATION:
   - Sail configurations for different conditions
   - Boat setup recommendations
   - Crew positioning strategies
   - Venue-specific equipment considerations

4. CULTURAL PROTOCOLS:
   - Local racing etiquette and customs
   - Protest procedures and arbitration
   - Social customs and networking opportunities
   - Language considerations and key phrases

Based on global sailing venue database and competitive sailing intelligence.

Respond in JSON format with detailed tactical guidance for competitive advantage.
`;
      const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
        body: {
          prompt,
          max_tokens: 1024,
        },
      });

      if (error) {
        throw new Error(error.message || 'Venue intelligence generation failed');
      }

      const response = typeof data?.text === 'string' ? data.text : '';
      if (!response) {
        throw new Error('No venue intelligence response text');
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackIntelligence(venueId);
    } catch (error) {
      logger.error('Error loading venue intelligence', error);
      return this.generateFallbackIntelligence(venueId);
    }
  }

  /**
   * Select and parse document using native picker
   */
  static async selectAndParseDocument(): Promise<{
    documentUri: string;
    courseExtraction: CourseExtraction;
  }> {
    try {
      // Open document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        throw new Error('Document selection canceled');
      }

      const documentUri = result.assets[0].uri;

      // Parse the selected document
      const courseExtraction = await this.parseSailingInstructions(documentUri);

      return { documentUri, courseExtraction };
    } catch (error) {
      logger.error('Error selecting and parsing document', error);
      throw error;
    }
  }

  /**
   * Batch process multiple documents for regatta series
   */
  static async batchProcessRegattaDocuments(
    documentUris: string[],
    venueId: string
  ): Promise<{
    courses: CourseExtraction[];
    venue_intelligence: VenueIntelligence;
    series_analysis: {
      consistent_elements: string[];
      variations: string[];
      strategic_overview: string[];
      equipment_stability: string[];
    };
  }> {
    try {
      // Process all documents in parallel
      const courses = await Promise.all(
        documentUris.map(uri => this.parseSailingInstructions(uri, venueId))
      );

      // Load venue intelligence
      const venue_intelligence = await this.loadVenueIntelligence(venueId);

      // Analyze series for consistency and variations
      const series_analysis = this.analyzeRegattaSeries(courses);

      return {
        courses,
        venue_intelligence,
        series_analysis,
      };
    } catch (error) {
      logger.error('Error in batch processing', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Geocode start/finish location names and add them as waypoints
   */
  private static async geocodeStartFinishLocations(
    extraction: CourseExtraction,
    _venueId?: string
  ): Promise<CourseExtraction> {
    try {
      const enhancedExtraction = { ...extraction };
      const newMarks: CourseMark[] = [...extraction.marks];

      // Geocode start location if name is provided but no coordinates
      if (extraction.start_location_name && 
          (!extraction.start_line.coordinates || extraction.start_line.coordinates.length === 0 || 
           extraction.start_line.coordinates.every(coord => !coord || coord.length === 0))) {
        try {
          const startQuery = `${extraction.start_location_name}, Hong Kong`;
          const startResults = await nominatimService.search(startQuery, { limit: 1, countrycodes: 'hk' });
          
          if (startResults && startResults.length > 0) {
            const startCoord = [startResults[0].lat, startResults[0].lng] as [number, number];
            
            // Add start as first mark (point 0)
            const startMark: CourseMark = {
              id: 'START',
              name: `Start - ${extraction.start_location_name}`,
              type: 'start',
              coordinates: startCoord,
              rounding_direction: 'either',
              description: `Start location at ${extraction.start_location_name} (geocoded)`,
            };
            
            // Insert at the beginning
            newMarks.unshift(startMark);

            // Update start_line coordinates if empty
            if (!extraction.start_line.coordinates || extraction.start_line.coordinates.length === 0) {
              enhancedExtraction.start_line.coordinates = [startCoord, startCoord];
            }
          }
        } catch (error) {
          logger.warn(`[DocumentParsing] Failed to geocode start location: ${extraction.start_location_name}`, error);
        }
      }

      // Geocode finish location if name is provided but no coordinates
      if (extraction.finish_location_name && 
          (!extraction.finish_line.coordinates || extraction.finish_line.coordinates.length === 0 ||
           extraction.finish_line.coordinates.every(coord => !coord || coord.length === 0))) {
        try {
          const finishQuery = `${extraction.finish_location_name}, Hong Kong`;
          const finishResults = await nominatimService.search(finishQuery, { limit: 1, countrycodes: 'hk' });
          
          if (finishResults && finishResults.length > 0) {
            const finishCoord = [finishResults[0].lat, finishResults[0].lng] as [number, number];
            
            // Add finish as last mark
            const finishMark: CourseMark = {
              id: 'FINISH',
              name: `Finish - ${extraction.finish_location_name}`,
              type: 'finish',
              coordinates: finishCoord,
              rounding_direction: 'either',
              description: `Finish location at ${extraction.finish_location_name} (geocoded)`,
            };
            
            // Add at the end
            newMarks.push(finishMark);
            
            // Update finish_line coordinates if empty
            if (!extraction.finish_line.coordinates || extraction.finish_line.coordinates.length === 0) {
              enhancedExtraction.finish_line.coordinates = [finishCoord, finishCoord];
            }
          }
        } catch (error) {
          logger.warn(`[DocumentParsing] Failed to geocode finish location: ${extraction.finish_location_name}`, error);
        }
      }

      enhancedExtraction.marks = newMarks;
      return enhancedExtraction;
    } catch (error) {
      logger.error('[DocumentParsing] Error in geocodeStartFinishLocations', error);
      return extraction; // Return original if geocoding fails
    }
  }

  private static async readDocumentContent(uri: string): Promise<string> {
    try {
      // For PDF documents, convert to base64
      if (uri.toLowerCase().includes('.pdf')) {
        return await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // For image documents (photos of sailing instructions)
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (error) {
      logger.error('Error reading document', error);
      throw error;
    }
  }

  private static getMimeType(uri: string): string {
    const lower = uri.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    return 'application/pdf';
  }

  private static analyzeRegattaSeries(courses: CourseExtraction[]): {
    consistent_elements: string[];
    variations: string[];
    strategic_overview: string[];
    equipment_stability: string[];
  } {
    // Simplified series analysis
    const analysis = {
      consistent_elements: [],
      variations: [],
      strategic_overview: [],
      equipment_stability: [],
    };

    if (courses.length > 1) {
      // Check for consistent marks
      const firstCourse = courses[0];
      const allMarksConsistent = courses.every(course =>
        course.marks.length === firstCourse.marks.length
      );

      if (allMarksConsistent) {
        analysis.consistent_elements.push('Mark positions remain stable across series');
      } else {
        analysis.variations.push('Mark positions vary between races');
      }

      // Wind condition analysis
      const windRanges = courses.map(c => c.wind_conditions.expected_speed_range);
      const consistentWind = windRanges.every(range =>
        Math.abs(range[0] - windRanges[0][0]) < 2
      );

      if (consistentWind) {
        analysis.equipment_stability.push('Consistent wind range allows stable sail selection');
      } else {
        analysis.strategic_overview.push('Variable wind conditions require flexible sail inventory');
      }
    }

    return analysis;
  }

  private static generateFallbackCourse(): CourseExtraction {
    return {
      course_name: 'Course Alpha',
      racing_area: 'Main Racing Area',
      marks: [
        {
          id: 'START',
          name: 'Start/Finish',
          type: 'start',
          coordinates: [22.2854, 114.1577],
          rounding_direction: 'either',
          description: 'Orange inflatable mark',
        },
        {
          id: 'M1',
          name: 'Windward Mark',
          type: 'windward',
          coordinates: [22.2900, 114.1600],
          rounding_direction: 'port',
          description: 'Yellow inflatable mark',
        },
        {
          id: 'M2',
          name: 'Leeward Mark',
          type: 'leeward',
          coordinates: [22.2800, 114.1550],
          rounding_direction: 'port',
          description: 'Blue inflatable mark',
        },
      ],
      start_line: {
        coordinates: [[22.2854, 114.1577], [22.2860, 114.1580]],
        bearing: 90,
        length_meters: 100,
      },
      finish_line: {
        coordinates: [[22.2854, 114.1577], [22.2860, 114.1580]],
        bearing: 90,
        length_meters: 100,
      },
      course_configurations: [
        {
          name: 'Windward/Leeward',
          sequence: ['START', 'M1', 'M2', 'M1', 'START'],
          distance_nm: 2.5,
          estimated_duration: 45,
          wind_range: [8, 15],
          description: 'Standard windward-leeward configuration',
        },
      ],
      restrictions: [],
      wind_conditions: {
        expected_direction: 90,
        expected_speed_range: [8, 15],
        shift_probability: 0.3,
      },
      tide_information: {
        high_tide: '14:30',
        low_tide: '08:15',
        current_direction: 180,
        max_speed_knots: 1.2,
      },
      safety_information: ['Document parsing unavailable - manual review required'],
      protest_procedures: ['Standard RRS procedures apply'],
    };
  }

  private static generateFallbackIntelligence(venueId: string): VenueIntelligence {
    return {
      venue_id: venueId,
      local_conditions: {
        typical_wind_patterns: [
          {
            time_of_day: '10:00-14:00',
            direction_range: [80, 100],
            speed_range: [8, 15],
            shift_frequency: 0.3,
            reliability_score: 0.8,
          },
        ],
        tidal_effects: [],
        current_patterns: [],
        seasonal_variations: [],
      },
      tactical_intelligence: {
        favored_sides: [
          {
            side: 'right',
            conditions: 'Morning sea breeze',
            percentage_advantage: 15,
            reasoning: 'Earlier pressure arrival',
          },
        ],
        layline_considerations: ['Intelligence unavailable - requires manual analysis'],
        start_line_bias_history: [],
        mark_rounding_tips: [],
      },
      equipment_recommendations: {
        sail_configuration: [],
        boat_setup: [],
        crew_positioning: [],
      },
      cultural_protocols: {
        racing_etiquette: ['Standard international sailing protocols'],
        protest_procedures: ['RRS procedures apply'],
        social_customs: ['Intelligence unavailable'],
        language_considerations: ['English assumed'],
      },
    };
  }
}

export default DocumentParsingService;
