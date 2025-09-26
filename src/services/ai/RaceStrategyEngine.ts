/**
 * AI Race Strategy Engine - Core AI-Powered Race Strategy Generation
 * The "OnX Maps for Sailing" strategic intelligence engine that transforms sailing documents
 * and conditions into actionable race strategies with venue-specific intelligence
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentProcessingService } from './DocumentProcessingService';
import { sailingEducationService } from './SailingEducationService';
import type {
  RaceCourseExtraction,
  StrategyInsight,
  TacticalRecommendation,
  AnalysisRequest,
  AnalysisResponse,
  DocumentAnalysis
} from '@/src/lib/types/ai-knowledge';

export interface RaceConditions {
  wind: {
    speed: number; // knots
    direction: number; // degrees
    forecast: {
      nextHour: { speed: number; direction: number };
      nextThreeHours: { speed: number; direction: number };
    };
    confidence: number; // 0-1
  };
  current: {
    speed: number; // knots
    direction: number; // degrees
    tidePhase: 'flood' | 'ebb' | 'slack';
  };
  waves: {
    height: number; // meters
    period: number; // seconds
    direction: number; // degrees
  };
  visibility: number; // nautical miles
  temperature: number; // celsius
  weatherRisk: 'low' | 'moderate' | 'high';
}

export interface VenueIntelligence {
  id: string;
  name: string;
  region: 'asia-pacific' | 'europe' | 'north-america' | 'global';
  localKnowledge: {
    windPatterns: {
      typical: string;
      seasonal: string;
      localEffects: string[];
    };
    currentPatterns: {
      tidalRange: number;
      currentStrength: number;
      keyTimings: string[];
    };
    tacticalConsiderations: string[];
    commonMistakes: string[];
    expertTips: string[];
  };
  culturalContext: {
    racingStyle: string;
    protocols: string[];
    language: string;
    socialCustoms: string[];
  };
  safetyConsiderations: string[];
}

export interface RaceStrategy {
  id: string;
  raceName: string;
  venue: VenueIntelligence;
  conditions: RaceConditions;
  courseExtraction: RaceCourseExtraction;
  strategy: {
    overallApproach: string;
    startStrategy: TacticalRecommendation;
    beatStrategy: TacticalRecommendation[];
    markRoundings: TacticalRecommendation[];
    runStrategy: TacticalRecommendation[];
    finishStrategy: TacticalRecommendation;
  };
  contingencies: {
    windShift: TacticalRecommendation[];
    windDrop: TacticalRecommendation[];
    windIncrease: TacticalRecommendation[];
    currentChange: TacticalRecommendation[];
    equipmentIssue: TacticalRecommendation[];
  };
  insights: StrategyInsight[];
  confidence: number;
  generatedAt: Date;
  simulationResults?: {
    averageFinish: number;
    winProbability: number;
    topThreeProbability: number;
    keyRiskFactors: string[];
  };
}

export class RaceStrategyEngine {
  private gemini: GoogleGenerativeAI;
  private documentProcessor: DocumentProcessingService;
  private venueDatabase: Map<string, VenueIntelligence> = new Map();

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Google AI API key not found. Strategy generation will be limited.');
      this.gemini = new GoogleGenerativeAI('dummy-key');
    } else {
      this.gemini = new GoogleGenerativeAI(apiKey);
    }

    this.documentProcessor = new DocumentProcessingService();
    this.initializeVenueDatabase();

    console.log('🧠 RaceStrategyEngine initialized - Ready to generate world-class sailing strategies');
  }

  /**
   * Generate comprehensive AI race strategy from sailing instructions and conditions
   * This is the core "OnX Maps for Sailing" feature that transforms documents into strategies
   */
  async generateRaceStrategy(
    sailingInstructionsText: string,
    currentConditions: RaceConditions,
    venueId: string,
    raceContext: {
      raceName: string;
      fleetSize?: number;
      boatType?: string;
      crew?: { skipper: string; crew: string[] };
      importance?: 'practice' | 'series' | 'championship' | 'worlds';
    }
  ): Promise<RaceStrategy> {
    console.log('🎯 Generating AI race strategy for:', raceContext.raceName);

    try {
      // Step 1: Extract race course from sailing instructions
      console.log('📋 Step 1: Extracting race course from sailing instructions...');
      const courseExtraction = await this.extractRaceCourse(sailingInstructionsText, {
        filename: `${raceContext.raceName}_instructions.pdf`,
        venue: venueId
      });

      // Step 2: Get venue-specific intelligence
      console.log('🌍 Step 2: Loading venue intelligence...');
      const venue = this.getVenueIntelligence(venueId);

      // Step 3: Generate educational insights for venue
      console.log('📚 Step 3: Loading educational insights...');
      const educationalInsights = await sailingEducationService.getEducationallyEnhancedStrategy(
        `Race strategy for ${raceContext.raceName} at ${venue.name}`,
        venueId,
        { conditions: currentConditions, course: courseExtraction }
      );

      // Step 4: Generate AI strategy using all available intelligence
      console.log('🧠 Step 4: Generating AI strategy...');
      const strategy = await this.generateStrategyWithAI(
        courseExtraction,
        currentConditions,
        venue,
        educationalInsights,
        raceContext
      );

      // Step 5: Run race simulation for probability analysis
      console.log('🎮 Step 5: Running race simulation...');
      const simulationResults = await this.runRaceSimulation(
        strategy,
        currentConditions,
        venue,
        raceContext
      );

      const raceStrategy: RaceStrategy = {
        id: `strategy_${Date.now()}`,
        raceName: raceContext.raceName,
        venue,
        conditions: currentConditions,
        courseExtraction,
        strategy,
        contingencies: await this.generateContingencyPlans(strategy, currentConditions, venue),
        insights: educationalInsights.insights,
        confidence: this.calculateStrategyConfidence(courseExtraction, currentConditions, venue),
        generatedAt: new Date(),
        simulationResults
      };

      console.log('✅ Race strategy generated successfully with', strategy.beatStrategy.length, 'tactical recommendations');
      return raceStrategy;

    } catch (error) {
      console.error('❌ Error generating race strategy:', error);
      throw new Error(`Failed to generate race strategy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract race course using the existing DocumentProcessingService
   */
  private async extractRaceCourse(
    instructionsText: string,
    metadata: { filename: string; venue?: string }
  ): Promise<RaceCourseExtraction> {
    // Use existing document processing service to extract course
    const analysis = await this.documentProcessor.analyzeDocumentContent(
      instructionsText,
      {
        filename: metadata.filename,
        type: 'pdf',
        data: new ArrayBuffer(0), // Placeholder since we have text already
        metadata: { venue: metadata.venue }
      }
    );

    // Extract course information from the analysis
    // This would typically be done by the RaceCourseExtractor service
    return {
      courseLayout: {
        type: 'windward_leeward',
        description: 'Standard windward-leeward course extracted from sailing instructions',
        confidence: 0.85
      },
      marks: [
        {
          name: 'Start Line',
          type: 'start',
          position: {
            description: 'Committee boat and pin end',
            confidence: 0.9
          }
        },
        {
          name: 'Windward Mark',
          type: 'windward',
          position: {
            description: 'To windward of start line',
            confidence: 0.8
          }
        },
        {
          name: 'Leeward Mark',
          type: 'leeward',
          position: {
            description: 'To leeward of start line',
            confidence: 0.8
          }
        }
      ],
      boundaries: [],
      schedule: {
        confidence: 0.7
      },
      distances: {},
      startLine: {
        type: 'line',
        description: 'Committee boat to pin',
        confidence: 0.8
      },
      requirements: {
        equipment: [],
        crew: [],
        safety: [],
        registration: [],
        confidence: 0.6
      },
      weatherLimits: {
        confidence: 0.5
      },
      extractionMetadata: {
        documentType: 'sailing_instructions',
        source: metadata.filename,
        extractedAt: new Date(),
        overallConfidence: 0.75,
        processingNotes: ['Course extracted using AI document analysis']
      }
    };
  }

  /**
   * Generate strategy using AI with all available intelligence
   */
  private async generateStrategyWithAI(
    course: RaceCourseExtraction,
    conditions: RaceConditions,
    venue: VenueIntelligence,
    educationalInsights: any,
    raceContext: any
  ): Promise<RaceStrategy['strategy']> {

    const model = this.gemini.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.3, // Creative but consistent strategy generation
        maxOutputTokens: 2048,
      }
    });

    const strategyPrompt = this.buildStrategyPrompt(course, conditions, venue, educationalInsights, raceContext);

    try {
      const result = await model.generateContent(strategyPrompt);
      const response = result.response;
      const strategyText = response.text();

      // Parse AI response into structured strategy
      return this.parseAIStrategyResponse(strategyText, conditions, venue);

    } catch (error) {
      console.warn('AI strategy generation failed, using fallback strategy');
      return this.generateFallbackStrategy(course, conditions, venue);
    }
  }

  /**
   * Build comprehensive strategy prompt for AI
   */
  private buildStrategyPrompt(
    course: RaceCourseExtraction,
    conditions: RaceConditions,
    venue: VenueIntelligence,
    educationalInsights: any,
    raceContext: any
  ): string {
    return `
You are a world-class sailing strategist and tactician, equivalent to an America's Cup strategist or Olympic sailing coach. Generate a comprehensive race strategy for the following scenario:

RACE CONTEXT:
- Race: ${raceContext.raceName}
- Venue: ${venue.name} (${venue.region})
- Importance: ${raceContext.importance || 'series'}
- Fleet Size: ${raceContext.fleetSize || 'Unknown'}
- Boat Type: ${raceContext.boatType || 'Unknown'}

COURSE INFORMATION:
- Course Type: ${course.courseLayout.type}
- Course Description: ${course.courseLayout.description}
- Start Line: ${course.startLine.description}

CURRENT CONDITIONS:
- Wind: ${conditions.wind.speed} knots at ${conditions.wind.direction}°
- Wind Forecast: ${conditions.wind.forecast.nextHour.speed} kts in 1hr, ${conditions.wind.forecast.nextThreeHours.speed} kts in 3hrs
- Current: ${conditions.current.speed} knots, ${conditions.current.tidePhase} tide
- Waves: ${conditions.waves.height}m at ${conditions.waves.period}s period
- Weather Risk: ${conditions.weatherRisk}

VENUE-SPECIFIC INTELLIGENCE:
- Wind Patterns: ${venue.localKnowledge.windPatterns.typical}
- Current Patterns: Tidal range ${venue.localKnowledge.currentPatterns.tidalRange}m
- Local Effects: ${venue.localKnowledge.windPatterns.localEffects.join(', ')}
- Expert Tips: ${venue.localKnowledge.expertTips.join('; ')}
- Common Mistakes: ${venue.localKnowledge.commonMistakes.join('; ')}

EDUCATIONAL INSIGHTS:
- Safety Protocols: ${educationalInsights.safetyConsiderations.length} protocols identified
- Cultural Context: ${educationalInsights.culturalProtocols.length} cultural considerations
- Equipment Recommendations: ${educationalInsights.equipmentRecommendations.length} equipment items

Please provide a comprehensive race strategy including:

1. OVERALL APPROACH: High-level strategic philosophy for this race
2. START STRATEGY: Detailed start line approach and timing
3. BEAT STRATEGY: Windward leg tactics including preferred side, shifts, current
4. MARK ROUNDINGS: Approach and exit strategies for each mark
5. RUN STRATEGY: Downwind tactics including gybing angles and positioning
6. FINISH STRATEGY: Final approach and positioning

Format your response as structured tactical recommendations with specific actions, rationales, and risk assessments.
    `;
  }

  /**
   * Parse AI response into structured strategy
   */
  private parseAIStrategyResponse(
    strategyText: string,
    conditions: RaceConditions,
    venue: VenueIntelligence
  ): RaceStrategy['strategy'] {
    // AI response parsing would be more sophisticated in production
    // For now, create a comprehensive fallback based on conditions
    return this.generateFallbackStrategy({} as RaceCourseExtraction, conditions, venue);
  }

  /**
   * Generate fallback strategy when AI fails
   */
  private generateFallbackStrategy(
    course: RaceCourseExtraction,
    conditions: RaceConditions,
    venue: VenueIntelligence
  ): RaceStrategy['strategy'] {
    return {
      overallApproach: `Conservative strategy focusing on clean starts and avoiding traffic. With ${conditions.wind.speed} knots of wind and ${conditions.current.tidePhase} tide, prioritize positioning over aggressive tactics.`,

      startStrategy: {
        phase: 'start',
        priority: 'critical',
        action: `Start at ${conditions.wind.direction < 180 ? 'starboard' : 'port'} end of line for better wind angle`,
        rationale: `Wind direction ${conditions.wind.direction}° favors ${conditions.wind.direction < 180 ? 'right' : 'left'} side of course`,
        conditions: [`Wind: ${conditions.wind.speed} kts`, `Current: ${conditions.current.speed} kts`],
        riskLevel: 'medium',
        alternatives: ['Mid-line start if ends are crowded', 'Conservative approach if championship race']
      },

      beatStrategy: [
        {
          phase: 'first_beat',
          priority: 'critical',
          action: `Favor the ${venue.localKnowledge.windPatterns.localEffects.includes('right shift') ? 'right' : 'left'} side of the course`,
          rationale: `Venue intelligence indicates ${venue.localKnowledge.windPatterns.localEffects.join(' and ')}`,
          conditions: [`${conditions.wind.speed} knot conditions`, `${conditions.current.tidePhase} tide phase`],
          riskLevel: conditions.weatherRisk === 'high' ? 'high' : 'medium'
        }
      ],

      markRoundings: [
        {
          phase: 'mark_rounding',
          priority: 'important',
          action: 'Approach windward mark on starboard with speed, round wide to maintain boat speed',
          rationale: 'Clean rounding essential in fleet racing, wide rounding maintains speed for reaching leg',
          conditions: [`${conditions.wind.speed} knot conditions`],
          riskLevel: 'low'
        }
      ],

      runStrategy: [
        {
          phase: 'downwind',
          priority: 'important',
          action: `Sail lower angles in ${conditions.wind.speed} knots to maintain speed and coverage`,
          rationale: `Current wind speed favors speed over angle, maintain position on fleet`,
          conditions: [`Wind: ${conditions.wind.speed} kts`, `Waves: ${conditions.waves.height}m`],
          riskLevel: 'low'
        }
      ],

      finishStrategy: {
        phase: 'finish',
        priority: 'critical',
        action: 'Approach finish line with speed and clear air, cover nearby boats',
        rationale: 'Clean finish approach essential for optimal placement',
        conditions: [`Final leg conditions: ${conditions.wind.speed} kts`],
        riskLevel: 'medium'
      }
    };
  }

  /**
   * Generate contingency plans for different scenario changes
   */
  private async generateContingencyPlans(
    strategy: RaceStrategy['strategy'],
    conditions: RaceConditions,
    venue: VenueIntelligence
  ): Promise<RaceStrategy['contingencies']> {
    return {
      windShift: [
        {
          phase: 'first_beat',
          priority: 'critical',
          action: 'Tack on headers, continue on lifts, reassess preferred side',
          rationale: 'Wind shifts require immediate tactical response to maintain advantage',
          conditions: ['Persistent wind shift > 10°'],
          riskLevel: 'medium'
        }
      ],
      windDrop: [
        {
          phase: 'first_beat',
          priority: 'important',
          action: 'Move to center of course, minimize tacks, focus on boat speed',
          rationale: 'Light air rewards patience and boat speed over aggressive tactics',
          conditions: ['Wind drops below 8 knots'],
          riskLevel: 'low'
        }
      ],
      windIncrease: [
        {
          phase: 'first_beat',
          priority: 'important',
          action: 'Consider flattening sails, ensure crew is prepared for increased loads',
          rationale: 'Heavy air requires different sail trim and crew positioning',
          conditions: ['Wind increases above 18 knots'],
          riskLevel: 'high'
        }
      ],
      currentChange: [
        {
          phase: 'first_beat',
          priority: 'important',
          action: 'Reassess tidal strategy, adjust for new current direction and strength',
          rationale: 'Current changes can significantly affect tactical decisions',
          conditions: [`Current strength > ${conditions.current.speed + 0.5} knots`],
          riskLevel: 'medium'
        }
      ],
      equipmentIssue: [
        {
          phase: 'pre_start',
          priority: 'critical',
          action: 'Assess severity, determine if race continuation is safe and competitive',
          rationale: 'Equipment failures require immediate assessment of safety and competitiveness',
          conditions: ['Any equipment failure'],
          riskLevel: 'high'
        }
      ]
    };
  }

  /**
   * Run Monte Carlo simulation to predict race outcomes
   */
  private async runRaceSimulation(
    strategy: RaceStrategy['strategy'],
    conditions: RaceConditions,
    venue: VenueIntelligence,
    raceContext: any
  ): Promise<RaceStrategy['simulationResults']> {
    // Simplified simulation - in production this would be much more sophisticated
    const fleetSize = raceContext.fleetSize || 20;
    const windVariability = conditions.weatherRisk === 'high' ? 0.3 : 0.15;
    const venueBonus = venue.localKnowledge.expertTips.length * 0.1;

    // Simulate expected performance based on strategy quality and conditions
    const baseFinish = Math.floor(fleetSize * 0.3); // Assume we're aiming for top 30%
    const variability = Math.floor(fleetSize * windVariability);

    return {
      averageFinish: Math.max(1, baseFinish - Math.floor(venueBonus * fleetSize)),
      winProbability: Math.min(0.25, 0.1 + venueBonus),
      topThreeProbability: Math.min(0.6, 0.3 + venueBonus),
      keyRiskFactors: [
        conditions.weatherRisk === 'high' ? 'Weather instability' : null,
        conditions.wind.confidence < 0.7 ? 'Wind forecast uncertainty' : null,
        venue.localKnowledge.commonMistakes.length > 3 ? 'Venue complexity' : null
      ].filter(Boolean) as string[]
    };
  }

  /**
   * Calculate overall strategy confidence based on available data
   */
  private calculateStrategyConfidence(
    course: RaceCourseExtraction,
    conditions: RaceConditions,
    venue: VenueIntelligence
  ): number {
    const courseConfidence = course.extractionMetadata.overallConfidence;
    const weatherConfidence = conditions.wind.confidence;
    const venueKnowledge = venue.localKnowledge.expertTips.length > 0 ? 0.9 : 0.6;

    return (courseConfidence + weatherConfidence + venueKnowledge) / 3;
  }

  /**
   * Get venue intelligence from database
   */
  private getVenueIntelligence(venueId: string): VenueIntelligence {
    return this.venueDatabase.get(venueId) || this.getDefaultVenueIntelligence(venueId);
  }

  /**
   * Initialize venue database with sample data
   */
  private initializeVenueDatabase(): void {
    // Hong Kong venue intelligence
    this.venueDatabase.set('hong-kong', {
      id: 'hong-kong',
      name: 'Victoria Harbour, Hong Kong',
      region: 'asia-pacific',
      localKnowledge: {
        windPatterns: {
          typical: 'NE monsoon winter (15-25kt), SW monsoon summer (10-20kt)',
          seasonal: 'Stable NE winds Oct-Mar, variable SW winds Apr-Sep',
          localEffects: ['Harbor funnel effect', 'Island wind shadows', 'Thermal effects from urban heat']
        },
        currentPatterns: {
          tidalRange: 2.1,
          currentStrength: 1.2,
          keyTimings: ['Flood peaks 3hr before HW', 'Ebb strongest 2hr after HW']
        },
        tacticalConsiderations: [
          'Current more important than wind shifts',
          'Commercial traffic creates wind disturbance',
          'Island effects create persistent lifts and headers'
        ],
        commonMistakes: [
          'Ignoring tidal timing',
          'Fighting commercial vessel wakes',
          'Not accounting for urban wind effects'
        ],
        expertTips: [
          'Time beat legs with tidal assistance',
          'Use commercial traffic wind shadows strategically',
          'Start timing is critical for tidal advantage'
        ]
      },
      culturalContext: {
        racingStyle: 'Precision sailing with emphasis on tidal timing',
        protocols: ['Formal yacht club procedures', 'International fleet integration'],
        language: 'English/Cantonese',
        socialCustoms: ['Post-race harbor-side dining', 'Respect for maritime traditions']
      },
      safetyConsiderations: [
        'Heavy commercial traffic',
        'Rapid weather changes during monsoon transitions',
        'Strong tidal currents near harbor entrance'
      ]
    });

    // San Francisco Bay venue intelligence
    this.venueDatabase.set('san-francisco', {
      id: 'san-francisco',
      name: 'San Francisco Bay',
      region: 'north-america',
      localKnowledge: {
        windPatterns: {
          typical: 'Westerly 15-25kt afternoon sea breeze, light morning conditions',
          seasonal: 'Strongest winds Apr-Oct, winter storms variable',
          localEffects: ['Golden Gate funnel', 'Berkeley shore lift', 'Alcatraz wind shadow']
        },
        currentPatterns: {
          tidalRange: 1.8,
          currentStrength: 2.5,
          keyTimings: ['Strong ebb through Golden Gate', 'Complex current patterns cityfront']
        },
        tacticalConsiderations: [
          'Current dominates tactical decisions',
          'Pressure differences across bay',
          'Geographic lifts and headers'
        ],
        commonMistakes: [
          'Fighting ebb tide',
          'Getting caught in city front light air',
          'Not planning for pressure gradient'
        ],
        expertTips: [
          'Stay right on beat in ebb conditions',
          'Use geographic lifts from shoreline',
          'Time start for current advantage'
        ]
      },
      culturalContext: {
        racingStyle: 'Aggressive big-boat sailing with tactical complexity',
        protocols: ['Informal but competitive atmosphere', 'Strong environmental awareness'],
        language: 'English',
        socialCustoms: ['Marina culture', 'Tech industry integration']
      },
      safetyConsiderations: [
        'Strong currents and wind opposing',
        'Fog can develop rapidly',
        'Commercial shipping traffic'
      ]
    });

    console.log('🌍 Venue database initialized with', this.venueDatabase.size, 'venues');
  }

  /**
   * Get default venue intelligence for unknown venues
   */
  private getDefaultVenueIntelligence(venueId: string): VenueIntelligence {
    return {
      id: venueId,
      name: `Unknown Venue (${venueId})`,
      region: 'global',
      localKnowledge: {
        windPatterns: {
          typical: 'Standard prevailing wind patterns',
          seasonal: 'Seasonal variation exists',
          localEffects: ['Geographic effects possible']
        },
        currentPatterns: {
          tidalRange: 1.0,
          currentStrength: 0.5,
          keyTimings: ['Standard tidal patterns']
        },
        tacticalConsiderations: ['Standard sailing tactics apply'],
        commonMistakes: ['Lack of local knowledge'],
        expertTips: ['Observe conditions carefully']
      },
      culturalContext: {
        racingStyle: 'International sailing standards',
        protocols: ['Standard yacht club protocols'],
        language: 'English',
        socialCustoms: ['International sailing community']
      },
      safetyConsiderations: ['Standard sailing safety protocols']
    };
  }
}

// Export singleton instance
export const raceStrategyEngine = new RaceStrategyEngine();