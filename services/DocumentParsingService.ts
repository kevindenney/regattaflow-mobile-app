import Anthropic from '@anthropic-ai/sdk';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

interface CourseExtraction {
  course_name: string;
  racing_area: string;
  marks: CourseMark[];
  start_line: {
    coordinates: [number, number][];
    bearing: number;
    length_meters: number;
  };
  finish_line: {
    coordinates: [number, number][];
    bearing: number;
    length_meters: number;
  };
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
  private static genAI = new Anthropic({ apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '', dangerouslyAllowBrowser: true });

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

      const prompt = `
Analyze this sailing instruction document and extract detailed race course information.

DOCUMENT TYPE: Sailing Instructions / Notice of Race
VENUE: ${venueId ? `Venue ID: ${venueId}` : 'Unknown venue - extract from document'}

Extract the following information in precise detail:

1. COURSE IDENTIFICATION:
   - Course name and racing area designation
   - Geographic location and coordinates if provided

2. MARK POSITIONS:
   - All course marks with coordinates (lat/lng)
   - Mark types (start, windward, leeward, reach, finish, gates)
   - Rounding directions (port/starboard)
   - Mark descriptions and identification

3. START/FINISH LINES:
   - Start line coordinates and bearing
   - Finish line coordinates and bearing
   - Line lengths in meters

4. COURSE CONFIGURATIONS:
   - All possible course configurations
   - Mark sequences for each configuration
   - Estimated distances and durations
   - Wind condition applicability

5. RESTRICTIONS AND BOUNDARIES:
   - Course boundaries and prohibited areas
   - Obstructions and hazards
   - Penalty specifications
   - Safety restrictions

6. ENVIRONMENTAL CONDITIONS:
   - Expected wind conditions (direction, speed ranges)
   - Tidal information (times, current direction/speed)
   - Weather considerations

7. RACE MANAGEMENT:
   - Protest procedures
   - Safety protocols
   - Communication procedures

8. TACTICAL INTELLIGENCE:
   - Historical wind patterns mentioned
   - Local knowledge references
   - Strategic considerations noted

Look for coordinate data in formats like:
- Decimal degrees: 22.2854, 114.1577
- Degrees/minutes: 22°17.124'N, 114°09.462'E
- GPS waypoints and references
- Distance/bearing from known points

Extract mark positions with maximum precision. If coordinates aren't explicit, look for distance/bearing references from known positions.

Respond in this JSON format:
{
  "course_name": "Course Alpha",
  "racing_area": "Central Hong Kong Waters",
  "marks": [
    {
      "id": "M1",
      "name": "Start/Finish",
      "type": "start",
      "coordinates": [22.2854, 114.1577],
      "rounding_direction": "either",
      "description": "Orange inflatable mark"
    }
  ],
  "start_line": {
    "coordinates": [[22.2854, 114.1577], [22.2860, 114.1580]],
    "bearing": 90,
    "length_meters": 100
  },
  "finish_line": {
    "coordinates": [[22.2854, 114.1577], [22.2860, 114.1580]],
    "bearing": 90,
    "length_meters": 100
  },
  "course_configurations": [
    {
      "name": "Windward/Leeward",
      "sequence": ["Start", "M1", "M2", "M1", "Finish"],
      "distance_nm": 2.5,
      "estimated_duration": 45,
      "wind_range": [8, 15],
      "description": "Standard windward-leeward configuration"
    }
  ],
  "restrictions": [
    {
      "type": "boundary",
      "coordinates": [[22.280, 114.150], [22.290, 114.160]],
      "description": "Eastern boundary line",
      "penalty": "DSQ"
    }
  ],
  "wind_conditions": {
    "expected_direction": 90,
    "expected_speed_range": [8, 15],
    "shift_probability": 0.3
  },
  "tide_information": {
    "high_tide": "14:30",
    "low_tide": "08:15",
    "current_direction": 180,
    "max_speed_knots": 1.2
  },
  "safety_information": [
    "All boats must monitor VHF Channel 72",
    "Safety boats positioned at windward mark"
  ],
  "protest_procedures": [
    "Protests must be filed within 60 minutes",
    "Protest room opens 30 minutes after last finish"
  ]
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-haiku-20240307', // Using cheapest model for document parsing (3x savings)
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: documentContent
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback course extraction
      return this.generateFallbackCourse();
    } catch (error) {
      console.error('Error parsing sailing instructions:', error);
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

      const message = await this.genAI.messages.create({
        model: 'claude-3-haiku-20240307', // Using cheapest model for document parsing (3x savings)
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackIntelligence(venueId);
    } catch (error) {
      console.error('Error loading venue intelligence:', error);
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
      console.error('Error selecting and parsing document:', error);
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
      console.error('Error in batch processing:', error);
      throw error;
    }
  }

  // Helper methods

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
      console.error('Error reading document:', error);
      throw error;
    }
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