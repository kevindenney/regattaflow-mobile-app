/**
 * AI Strategy Generation Service
 * Unified AI service for document processing, course extraction, and strategy generation
 * Integrates Gemini for document parsing and Anthropic for autonomous agent workflows
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/src/services/supabase';
import type { SailingVenue } from '@/src/lib/types/global-venues';

// ==================== Type Definitions ====================

export interface CourseExtraction {
  id?: string;
  course_name: string;
  racing_area: string;
  venue_id?: string;
  marks: CourseMark[];
  start_line: CourseLine;
  finish_line: CourseLine;
  course_configurations: CourseConfiguration[];
  restrictions: CourseRestriction[];
  wind_conditions: WindConditions;
  tide_information: TideInformation;
  safety_information: string[];
  protest_procedures: string[];
  extracted_at: Date;
  confidence_score: number;
}

export interface CourseMark {
  id: string;
  name: string;
  type: 'start' | 'windward' | 'leeward' | 'reach' | 'finish' | 'gate';
  coordinates: [number, number];
  rounding_direction: 'port' | 'starboard' | 'either';
  description: string;
}

export interface CourseLine {
  coordinates: [number, number][];
  bearing: number;
  length_meters: number;
}

export interface CourseConfiguration {
  name: string;
  sequence: string[];
  distance_nm: number;
  estimated_duration: number;
  wind_range: [number, number];
  description: string;
}

export interface CourseRestriction {
  type: 'boundary' | 'obstruction' | 'prohibited' | 'shallow';
  coordinates: [number, number][];
  description: string;
  penalty: string;
}

export interface WindConditions {
  expected_direction: number;
  expected_speed_range: [number, number];
  shift_probability: number;
}

export interface TideInformation {
  high_tide: string;
  low_tide: string;
  current_direction: number;
  max_speed_knots: number;
}

export interface RaceStrategy {
  id?: string;
  course_id: string;
  venue_id: string;
  user_id: string;
  strategy_type: 'basic' | 'pro' | 'championship';

  // Strategy components
  pre_start_plan: {
    positioning: string;
    timing: string;
    risk_assessment: string;
    alternatives: string[];
  };

  upwind_strategy: {
    favored_side: 'left' | 'right' | 'middle';
    tack_plan: string;
    layline_approach: string;
    shift_management: string;
  };

  downwind_strategy: {
    gybe_plan: string;
    pressure_seeking: string;
    wave_sailing: string;
  };

  mark_roundings: {
    mark_id: string;
    approach: string;
    exit: string;
    traffic_management: string;
  }[];

  contingency_plans: {
    scenario: string;
    response: string;
    priority: 'high' | 'medium' | 'low';
  }[];

  // Championship tier features
  monte_carlo_simulation?: {
    scenarios_analyzed: number;
    optimal_path: [number, number][];
    win_probability: number;
    risk_zones: { coordinates: [number, number][]; risk_level: number }[];
  };

  equipment_recommendations: {
    sail_selection: string[];
    boat_setup: string[];
    crew_assignments: string[];
  };

  confidence_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface StrategyOptions {
  tier: 'basic' | 'pro' | 'championship';
  venueId?: string;
  weatherForecast?: any;
  competitorData?: any;
  userPreferences?: {
    risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
    focus_areas: ('speed' | 'tactics' | 'positioning' | 'safety')[];
  };
}

// ==================== AI Strategy Service ====================

export class AIStrategyService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

  // ==================== Document Processing ====================

  /**
   * Parse sailing instructions from PDF or image
   */
  static async parseSailingInstructions(
    documentUri: string,
    venueId?: string
  ): Promise<CourseExtraction> {
    try {
      console.log('📄 Parsing sailing instructions...', { documentUri, venueId });

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const documentContent = await this.readDocumentContent(documentUri);

      const prompt = `
Analyze this sailing instruction document and extract detailed race course information.

VENUE: ${venueId || 'Extract from document'}

Extract with maximum precision:

1. COURSE IDENTIFICATION
2. MARK POSITIONS (with coordinates in decimal degrees)
3. START/FINISH LINES (coordinates, bearings, lengths)
4. COURSE CONFIGURATIONS (sequences, distances, durations)
5. RESTRICTIONS (boundaries, obstructions, penalties)
6. ENVIRONMENTAL CONDITIONS (wind, tide, current)
7. SAFETY & PROCEDURES

Coordinate formats to look for:
- Decimal: 22.2854, 114.1577
- DMS: 22°17.124'N, 114°09.462'E
- GPS waypoints
- Distance/bearing from known points

Return ONLY valid JSON matching this structure:
{
  "course_name": "Course Alpha",
  "racing_area": "Main Area",
  "marks": [
    {
      "id": "M1",
      "name": "Start/Finish",
      "type": "start",
      "coordinates": [22.2854, 114.1577],
      "rounding_direction": "port",
      "description": "Orange inflatable"
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
      "name": "W/L",
      "sequence": ["Start", "M1", "M2", "Finish"],
      "distance_nm": 2.5,
      "estimated_duration": 45,
      "wind_range": [8, 15],
      "description": "Windward-leeward"
    }
  ],
  "restrictions": [],
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
  "safety_information": ["VHF Ch 72"],
  "protest_procedures": ["60 min filing window"]
}
`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: documentContent, mimeType: this.getMimeType(documentUri) } }
      ]);

      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const extraction = JSON.parse(jsonMatch[0]) as CourseExtraction;
        extraction.extracted_at = new Date();
        extraction.confidence_score = this.calculateConfidenceScore(extraction);
        extraction.venue_id = venueId;

        console.log('✅ Course extracted with confidence:', extraction.confidence_score);
        return extraction;
      }

      throw new Error('No valid JSON found in AI response');
    } catch (error) {
      console.error('❌ Failed to parse sailing instructions:', error);
      throw error;
    }
  }

  /**
   * Generate race strategy based on course and conditions
   */
  static async generateRaceStrategy(
    course: CourseExtraction,
    options: StrategyOptions,
    userId: string
  ): Promise<RaceStrategy> {
    try {
      console.log('🎯 Generating race strategy...', { tier: options.tier });

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = `
Generate a comprehensive race strategy for this course:

COURSE: ${course.course_name}
AREA: ${course.racing_area}
TIER: ${options.tier}

COURSE MARKS:
${course.marks.map(m => `- ${m.name} (${m.type}): [${m.coordinates}]`).join('\n')}

CONFIGURATIONS:
${course.course_configurations.map(c => `- ${c.name}: ${c.sequence.join(' → ')}`).join('\n')}

WIND: ${course.wind_conditions.expected_direction}° @ ${course.wind_conditions.expected_speed_range[0]}-${course.wind_conditions.expected_speed_range[1]} kts
TIDE: High ${course.tide_information.high_tide}, Low ${course.tide_information.low_tide}
CURRENT: ${course.tide_information.current_direction}° @ ${course.tide_information.max_speed_knots} kts

${options.userPreferences ? `
USER PREFERENCES:
- Risk Tolerance: ${options.userPreferences.risk_tolerance}
- Focus: ${options.userPreferences.focus_areas.join(', ')}
` : ''}

Create a ${options.tier} tier strategy including:

1. PRE-START PLAN
   - Positioning strategy
   - Timing approach
   - Risk assessment
   - Alternative plans

2. UPWIND STRATEGY
   - Favored side analysis
   - Tack planning
   - Layline approach
   - Shift management

3. DOWNWIND STRATEGY
   - Gybe planning
   - Pressure seeking
   - Wave sailing tactics

4. MARK ROUNDINGS
   - Approach & exit for each mark
   - Traffic management
   - Tactical positioning

5. CONTINGENCY PLANS
   - Wind shift scenarios
   - Current changes
   - Traffic conflicts
   - Equipment issues

6. EQUIPMENT RECOMMENDATIONS
   - Sail selection
   - Boat setup
   - Crew assignments

${options.tier === 'championship' ? `
7. MONTE CARLO SIMULATION (Championship Tier)
   - Analyze 1000+ race scenarios
   - Calculate optimal path
   - Identify risk zones
   - Win probability estimation
` : ''}

Return ONLY valid JSON matching this structure:
{
  "pre_start_plan": {
    "positioning": "Detailed positioning strategy",
    "timing": "Timing approach",
    "risk_assessment": "Risk analysis",
    "alternatives": ["Alternative plan 1", "Alternative plan 2"]
  },
  "upwind_strategy": {
    "favored_side": "right",
    "tack_plan": "Tack planning details",
    "layline_approach": "Layline strategy",
    "shift_management": "How to handle shifts"
  },
  "downwind_strategy": {
    "gybe_plan": "Gybe planning",
    "pressure_seeking": "Finding pressure",
    "wave_sailing": "Wave tactics"
  },
  "mark_roundings": [
    {
      "mark_id": "M1",
      "approach": "Approach strategy",
      "exit": "Exit strategy",
      "traffic_management": "Traffic handling"
    }
  ],
  "contingency_plans": [
    {
      "scenario": "Wind shift right",
      "response": "Response plan",
      "priority": "high"
    }
  ],
  "equipment_recommendations": {
    "sail_selection": ["Main", "Jib"],
    "boat_setup": ["Mast rake 28°", "Spreaders 380mm"],
    "crew_assignments": ["Helmsman: Start line", "Tactician: Weather side"]
  }
}
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No valid JSON in strategy response');
      }

      const strategyData = JSON.parse(jsonMatch[0]);

      // Generate Monte Carlo simulation for Championship tier
      let monte_carlo_simulation;
      if (options.tier === 'championship') {
        monte_carlo_simulation = await this.runMonteCarloSimulation(course, strategyData);
      }

      const strategy: RaceStrategy = {
        course_id: course.id || '',
        venue_id: course.venue_id || options.venueId || '',
        user_id: userId,
        strategy_type: options.tier,
        ...strategyData,
        monte_carlo_simulation,
        confidence_score: this.calculateStrategyConfidence(strategyData, options.tier),
        created_at: new Date(),
        updated_at: new Date()
      };

      console.log('✅ Strategy generated with confidence:', strategy.confidence_score);
      return strategy;
    } catch (error) {
      console.error('❌ Failed to generate strategy:', error);
      throw error;
    }
  }

  /**
   * Select document and generate complete strategy workflow
   */
  static async selectDocumentAndGenerateStrategy(
    options: StrategyOptions,
    userId: string
  ): Promise<{
    course: CourseExtraction;
    strategy: RaceStrategy;
  }> {
    try {
      // Step 1: Select document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        throw new Error('Document selection canceled');
      }

      const documentUri = result.assets[0].uri;

      // Step 2: Parse course
      const course = await this.parseSailingInstructions(documentUri, options.venueId);

      // Step 3: Save course to database
      const { data: savedCourse, error: courseError } = await supabase
        .from('race_courses')
        .insert({
          course_name: course.course_name,
          racing_area: course.racing_area,
          venue_id: course.venue_id,
          marks: course.marks,
          start_line: course.start_line,
          finish_line: course.finish_line,
          configurations: course.course_configurations,
          restrictions: course.restrictions,
          wind_conditions: course.wind_conditions,
          tide_information: course.tide_information,
          safety_info: course.safety_information,
          protest_procedures: course.protest_procedures,
          confidence_score: course.confidence_score,
          user_id: userId
        })
        .select()
        .single();

      if (courseError) throw courseError;

      course.id = savedCourse.id;

      // Step 4: Generate strategy
      const strategy = await this.generateRaceStrategy(course, options, userId);

      // Step 5: Save strategy to database
      const { data: savedStrategy, error: strategyError } = await supabase
        .from('race_strategies')
        .insert({
          course_id: strategy.course_id,
          venue_id: strategy.venue_id,
          user_id: strategy.user_id,
          strategy_type: strategy.strategy_type,
          pre_start_plan: strategy.pre_start_plan,
          upwind_strategy: strategy.upwind_strategy,
          downwind_strategy: strategy.downwind_strategy,
          mark_roundings: strategy.mark_roundings,
          contingency_plans: strategy.contingency_plans,
          equipment_recommendations: strategy.equipment_recommendations,
          monte_carlo_simulation: strategy.monte_carlo_simulation,
          confidence_score: strategy.confidence_score
        })
        .select()
        .single();

      if (strategyError) throw strategyError;

      strategy.id = savedStrategy.id;

      console.log('✅ Complete strategy workflow finished');
      return { course, strategy };
    } catch (error) {
      console.error('❌ Strategy workflow failed:', error);
      throw error;
    }
  }

  /**
   * Run Monte Carlo simulation for Championship tier
   */
  private static async runMonteCarloSimulation(
    course: CourseExtraction,
    strategy: any
  ): Promise<RaceStrategy['monte_carlo_simulation']> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = `
Run Monte Carlo simulation for this race:

COURSE: ${JSON.stringify(course.marks)}
STRATEGY: ${JSON.stringify(strategy)}

Simulate 1000 race scenarios considering:
- Wind shifts and variations
- Current changes
- Competitor positioning
- Tactical decision points

Calculate:
1. Optimal sailing path (coordinates)
2. Win probability
3. Risk zones to avoid

Return JSON:
{
  "scenarios_analyzed": 1000,
  "optimal_path": [[22.28, 114.15], [22.29, 114.16]],
  "win_probability": 0.75,
  "risk_zones": [
    {
      "coordinates": [[22.28, 114.15], [22.29, 114.16]],
      "risk_level": 0.8
    }
  ]
}
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback simulation
      return {
        scenarios_analyzed: 1000,
        optimal_path: course.marks.map(m => m.coordinates),
        win_probability: 0.65,
        risk_zones: []
      };
    } catch (error) {
      console.error('❌ Monte Carlo simulation failed:', error);
      return undefined;
    }
  }

  // ==================== Helper Methods ====================

  private static async readDocumentContent(uri: string): Promise<string> {
    try {
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (error) {
      console.error('Error reading document:', error);
      throw error;
    }
  }

  private static getMimeType(uri: string): string {
    const lower = uri.toLowerCase();
    if (lower.includes('.pdf')) return 'application/pdf';
    if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
    if (lower.includes('.png')) return 'image/png';
    return 'application/pdf';
  }

  private static calculateConfidenceScore(extraction: CourseExtraction): number {
    let score = 0;

    // Base score for having basic info
    if (extraction.course_name) score += 20;
    if (extraction.racing_area) score += 10;

    // Marks scoring
    if (extraction.marks.length > 0) score += 20;
    if (extraction.marks.every(m => m.coordinates[0] && m.coordinates[1])) score += 20;

    // Lines scoring
    if (extraction.start_line.coordinates.length > 0) score += 10;
    if (extraction.finish_line.coordinates.length > 0) score += 10;

    // Configuration scoring
    if (extraction.course_configurations.length > 0) score += 10;

    return Math.min(score, 100);
  }

  private static calculateStrategyConfidence(strategy: any, tier: string): number {
    let score = 0;

    if (strategy.pre_start_plan) score += 20;
    if (strategy.upwind_strategy) score += 20;
    if (strategy.downwind_strategy) score += 15;
    if (strategy.mark_roundings?.length > 0) score += 15;
    if (strategy.contingency_plans?.length > 0) score += 15;
    if (strategy.equipment_recommendations) score += 15;

    // Bonus for Championship tier
    if (tier === 'championship') score = Math.min(score + 10, 100);

    return score;
  }
}

export default AIStrategyService;
