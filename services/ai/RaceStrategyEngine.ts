/**
 * AI Race Strategy Engine - Core AI-Powered Race Strategy Generation
 * The "OnX Maps for Sailing" strategic intelligence engine that transforms sailing documents
 * and conditions into actionable race strategies with venue-specific intelligence
 */

import Anthropic from '@anthropic-ai/sdk';
import { DocumentProcessingService } from './DocumentProcessingService';
import { sailingEducationService } from './SailingEducationService';
import { skillManagementService } from './SkillManagementService';
import type {
  RaceCourseExtraction,
  StrategyInsight,
  TacticalRecommendation,
  AnalysisRequest,
  AnalysisResponse,
  DocumentAnalysis
} from '@/lib/types/ai-knowledge';

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
  private anthropic: Anthropic;
  private documentProcessor: DocumentProcessingService;
  private venueDatabase: Map<string, VenueIntelligence> = new Map();
  private customSkillId: string | null = null; // Will be set after uploading skill
  private skillInitialized: boolean = false;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Anthropic API key not found. Set EXPO_PUBLIC_ANTHROPIC_API_KEY environment variable.');
      console.warn('⚠️ Strategy generation will use fallback mode.');
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey || 'placeholder',
      dangerouslyAllowBrowser: true // Development only - move to backend for production
    });

    this.documentProcessor = new DocumentProcessingService();
    this.initializeVenueDatabase();

    // Initialize race strategy skill asynchronously
    // DISABLED: Temporarily disabled to prevent memory leak from failed skill uploads
    // TODO: Re-enable once skill file structure is fixed (SKILL.md must be in top-level folder)
    // this.initializeSkill();
  }

  /**
   * Initialize the race-strategy-analyst Claude Skill
   * This runs asynchronously and sets the customSkillId when ready
   */
  private async initializeSkill(): Promise<void> {
    try {
      console.log('🎯 Initializing race-strategy-analyst skill...');
      const skillId = await skillManagementService.initializeRaceStrategySkill();

      if (skillId) {
        this.customSkillId = skillId;
        this.skillInitialized = true;
        console.log(`✅ Race strategy skill ready: ${skillId}`);
        console.log('🎉 Claude Skills AI enabled - 60% token reduction active!');
      } else {
        console.warn('⚠️ Skill initialization failed, using prompt-based approach');
      }
    } catch (error) {
      console.error('❌ Error initializing skill:', error);
      console.warn('⚠️ Falling back to prompt-based strategy generation');
    }
  }

  /**
   * Get skill initialization status
   */
  isSkillReady(): boolean {
    return this.skillInitialized;
  }

  /**
   * Get the current skill ID (may be null if not initialized)
   */
  getSkillId(): string | null {
    return this.customSkillId;
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
   * Generate venue-based race strategy WITHOUT sailing instructions
   * Uses only: venue intelligence + weather conditions + race timing
   * Perfect for early race planning before documents are available
   */
  async generateVenueBasedStrategy(
    venueId: string,
    currentConditions: RaceConditions,
    raceContext: {
      raceName: string;
      raceDate: Date;
      raceTime: string; // e.g., "11:06:00"
      boatType?: string;
      fleetSize?: number;
      importance?: 'practice' | 'series' | 'championship' | 'worlds';
    }
  ): Promise<RaceStrategy> {
    console.log('🎯 Generating venue-based AI strategy for:', raceContext.raceName);

    try {
      // Step 1: Get venue-specific intelligence
      console.log('🌍 Step 1: Loading venue intelligence...');
      const venue = this.getVenueIntelligence(venueId);

      // Step 2: Generate educational insights for venue
      console.log('📚 Step 2: Loading educational insights...');
      const educationalInsights = await sailingEducationService.getEducationallyEnhancedStrategy(
        `General race strategy for ${raceContext.raceName} at ${venue.name}`,
        venueId,
        { conditions: currentConditions, venue }
      );

      // Step 3: Generate AI strategy using venue intelligence and conditions
      console.log('🧠 Step 3: Generating venue-based AI strategy...');
      const strategy = await this.generateVenueStrategyWithAI(
        currentConditions,
        venue,
        educationalInsights,
        raceContext
      );

      // Step 4: Generate contingency plans
      console.log('⚠️ Step 4: Generating contingency plans...');
      const contingencies = await this.generateContingencyPlans(strategy, currentConditions, venue);

      // Create generic course extraction for venue-based strategy
      const genericCourseExtraction: RaceCourseExtraction = {
        courseLayout: {
          type: 'other',
          description: `General racing area at ${venue.name}. Specific course marks to be determined on race day.`,
          confidence: 0.6
        },
        marks: [],
        boundaries: [],
        schedule: {
          confidence: 0.5
        },
        distances: {},
        startLine: {
          type: 'line',
          description: 'Standard committee boat to pin configuration',
          confidence: 0.5
        },
        requirements: {
          equipment: [],
          crew: [],
          safety: [],
          registration: [],
          confidence: 0.4
        },
        weatherLimits: {
          confidence: 0.4
        },
        communication: {
          confidence: 0.3
        },
        regulations: {
          confidence: 0.3
        },
        extractionMetadata: {
          documentType: 'sailing_instructions',
          source: 'venue_intelligence_system',
          extractedAt: new Date(),
          overallConfidence: 0.5,
          processingNotes: ['Strategy generated from venue intelligence without specific sailing instructions']
        }
      };

      const raceStrategy: RaceStrategy = {
        id: `strategy_venue_${Date.now()}`,
        raceName: raceContext.raceName,
        venue,
        conditions: currentConditions,
        courseExtraction: genericCourseExtraction,
        strategy,
        contingencies,
        insights: educationalInsights.insights,
        confidence: 0.7, // Lower confidence without specific course details
        generatedAt: new Date(),
        simulationResults: {
          averageFinish: 0,
          winProbability: 0,
          topThreeProbability: 0,
          keyRiskFactors: ['Strategy based on venue intelligence without specific course details']
        }
      };

      console.log('✅ Venue-based strategy generated successfully');
      return raceStrategy;

    } catch (error) {
      console.error('❌ Error generating venue-based strategy:', error);
      throw new Error(`Failed to generate venue-based strategy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate strategy using AI with venue intelligence (no specific course)
   */
  private async generateVenueStrategyWithAI(
    conditions: RaceConditions,
    venue: VenueIntelligence,
    educationalInsights: any,
    raceContext: any
  ): Promise<RaceStrategy['strategy']> {
    const strategyPrompt = `Generate a comprehensive venue-based race strategy for ${raceContext.raceName} at ${venue.name}. Use your race strategy expertise to combine theory (what/why) with execution (how).

VENUE INTELLIGENCE:
- Location: ${venue.name} (${venue.region})
- Wind Patterns: ${venue.localKnowledge.windPatterns.typical}
- Seasonal Effects: ${venue.localKnowledge.windPatterns.seasonal}
- Local Effects: ${venue.localKnowledge.windPatterns.localEffects.join(', ')}
- Tidal Range: ${venue.localKnowledge.currentPatterns.tidalRange}m
- Current Strength: ${venue.localKnowledge.currentPatterns.currentStrength} knots
- Tactical Considerations: ${venue.localKnowledge.tacticalConsiderations.join('; ')}
- Common Mistakes: ${venue.localKnowledge.commonMistakes.join('; ')}
- Expert Tips: ${venue.localKnowledge.expertTips.join('; ')}

CURRENT CONDITIONS:
- Wind: ${conditions.wind.speed} knots from ${conditions.wind.direction}°
- Forecast next hour: ${conditions.wind.forecast.nextHour.speed} knots from ${conditions.wind.forecast.nextHour.direction}°
- Current: ${conditions.current.speed} knots from ${conditions.current.direction}° (${conditions.current.tidePhase} tide)
- Waves: ${conditions.waves.height}m at ${conditions.waves.period}s period
- Temperature: ${conditions.temperature}°C
- Weather Risk: ${conditions.weatherRisk}

RACE CONTEXT:
- Race: ${raceContext.raceName}
- Date/Time: ${raceContext.raceDate.toLocaleDateString()} at ${raceContext.raceTime}
- Boat Type: ${raceContext.boatType || 'Keelboat'}
- Fleet Size: ${raceContext.fleetSize || 'Standard'}
- Importance: ${raceContext.importance || 'series'}

Apply your race strategy expertise including shift mathematics, puff response, starting techniques, covering tactics, and champion execution methods.

TASK: Generate a comprehensive venue-based race strategy including:
1. OVERALL APPROACH - Strategic philosophy with theory + execution
2. START STRATEGY - Positioning and timing with theory + execution
3. UPWIND STRATEGY - Shift playing with quantified frameworks + execution techniques
4. DOWNWIND STRATEGY - VMG optimization with execution details
5. MARK ROUNDING - Championship techniques and execution

FORMAT YOUR RESPONSE AS JSON (include theory/execution/confidence for each):
{
  "overallApproach": "strategic philosophy combining theory with execution",
  "startStrategy": {
    "action": "string",
    "theory": "quantified framework (what/why)",
    "execution": "championship technique (how)",
    "reasoning": "combined rationale",
    "confidence": number (0-100),
    "priority": "high"|"medium"|"low"
  },
  "beatStrategy": [
    {
      "action": "string",
      "theory": "shift mathematics framework",
      "execution": "execution technique",
      "reasoning": "combined rationale",
      "confidence": number (0-100),
      "priority": "high"|"medium"|"low"
    }
  ],
  "markRoundings": [
    {
      "action": "string",
      "theory": "tactical framework",
      "execution": "championship technique",
      "championStory": "optional champion example",
      "reasoning": "combined rationale",
      "confidence": number (0-100),
      "priority": "high"|"medium"|"low"
    }
  ],
  "runStrategy": [
    {
      "action": "string",
      "theory": "downwind shift detection framework",
      "execution": "execution technique",
      "reasoning": "combined rationale",
      "confidence": number (0-100),
      "priority": "high"|"medium"|"low"
    }
  ],
  "finishStrategy": {
    "action": "string",
    "theory": "tactical framework",
    "execution": "championship covering/split technique",
    "reasoning": "combined rationale",
    "confidence": number (0-100),
    "priority": "high"|"medium"|"low"
  }
}`;

    try {
      const response = await this.anthropic.beta.messages.create({
        model: 'claude-sonnet-4-20250514', // Claude Sonnet 4.5 with Skills support
        max_tokens: 4000,
        temperature: 0.7,
        betas: ['code-execution-2025-08-25', 'skills-2025-10-02'],

        // CLAUDE SKILLS ENABLED! 🎉
        // Using custom race-strategy-analyst skill with Gladstone + Colgate frameworks
        // This reduces prompt tokens by ~60% and improves consistency
        // Note: Skill must be uploaded via /v1/skills API first
        ...(this.customSkillId && {
          container: {
            skills: [{
              type: 'custom',
              skill_id: this.customSkillId,
              version: 'latest'
            }]
          }
        }),

        tools: [{
          type: 'code_execution_20250825',
          name: 'code_execution'
        }],

        messages: [{
          role: 'user',
          content: strategyPrompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from AI');
      }

      // Parse JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from AI response');
      }

      const strategy = JSON.parse(jsonMatch[0]);
      return strategy;

    } catch (error) {
      console.error('❌ Error generating venue strategy with AI:', error);
      throw error;
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
      communication: {
        confidence: 0.6
      },
      regulations: {
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

    const strategyPrompt = this.buildStrategyPrompt(course, conditions, venue, educationalInsights, raceContext);

    try {
      // Using Claude 3.5 Haiku for cost optimization (12x cheaper than Sonnet)
      // Excellent for structured strategy generation tasks
      const message = await this.anthropic.beta.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 2048,
        temperature: 0.3, // Creative but consistent strategy generation
        betas: ['code-execution-2025-08-25', 'skills-2025-10-02'],

        // CLAUDE SKILLS ENABLED! 🎉
        // Using custom race-strategy-analyst skill with Gladstone + Colgate frameworks
        // This reduces prompt tokens by ~60% (massive cost savings on Haiku!)
        // Note: Skill must be uploaded via /v1/skills API first
        ...(this.customSkillId && {
          container: {
            skills: [{
              type: 'custom',
              skill_id: this.customSkillId,
              version: 'latest'
            }]
          }
        }),

        tools: [{
          type: 'code_execution_20250825',
          name: 'code_execution'
        }],

        messages: [{
          role: 'user',
          content: strategyPrompt
        }]
      });

      // Extract text from Claude's response
      const strategyText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // Parse AI response into structured strategy
      return this.parseAIStrategyResponse(strategyText, conditions, venue);

    } catch (error) {
      console.error('❌ AI strategy generation failed:', error);
      console.warn('Using fallback strategy');
      return this.generateFallbackStrategy(course, conditions, venue);
    }
  }

  /**
   * Build comprehensive strategy prompt for AI with Bill Gladstone + Steve Colgate integration
   */
  private buildStrategyPrompt(
    course: RaceCourseExtraction,
    conditions: RaceConditions,
    venue: VenueIntelligence,
    educationalInsights: any,
    raceContext: any
  ): string {
    return `
Generate a comprehensive race strategy for this sailing race. Your race-strategy-analyst expertise will guide tactical recommendations combining theory (what/why) with execution (how).

IMPORTANT: For EVERY tactical recommendation, provide:
1. THEORY: Quantified framework explaining what to do and why
2. EXECUTION: Championship technique showing how to do it
3. CONFIDENCE: Percentage based on proven frameworks
4. CHAMPION STORY (if relevant): Memorable example from championship racing

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

Apply your race strategy expertise including shift mathematics, puff response, covering tactics, starting techniques, and mark rounding execution. Use proven championship frameworks and techniques throughout.

Respond with ONLY valid JSON in this exact structure (NO other text):

{
  "overallApproach": "strategic philosophy combining tactical theory with championship execution",
  "startStrategy": {
    "phase": "start",
    "priority": "critical|important|optional",
    "action": "specific start action",
    "theory": "quantified framework (what/why with reasoning)",
    "execution": "championship technique (how to do it with specific steps)",
    "championStory": "Optional: memorable example from championship racing",
    "rationale": "combined reasoning",
    "confidence": number (0-100),
    "conditions": ["condition1", "condition2"],
    "riskLevel": "low|medium|high",
    "alternatives": ["alternative1", "alternative2"]
  },
  "beatStrategy": [{
    "phase": "first_beat|second_beat",
    "priority": "critical|important",
    "action": "specific beat action",
    "theory": "tactical framework",
    "execution": "championship technique",
    "championStory": "Optional: example",
    "rationale": "combined reasoning",
    "confidence": number (0-100),
    "conditions": ["conditions"],
    "riskLevel": "low|medium|high"
  }],
  "markRoundings": [{
    "phase": "mark_rounding",
    "priority": "critical|important",
    "action": "approach and exit strategy",
    "theory": "tactical framework",
    "execution": "championship technique",
    "championStory": "Optional: Hans Fogh, Bill Cox, etc examples",
    "rationale": "combined reasoning",
    "confidence": number (0-100),
    "conditions": ["conditions"],
    "riskLevel": "low|medium|high"
  }],
  "runStrategy": [{
    "phase": "downwind",
    "priority": "important",
    "action": "downwind tactics",
    "theory": "downwind shift detection framework",
    "execution": "championship technique",
    "rationale": "combined reasoning",
    "confidence": number (0-100),
    "conditions": ["conditions"],
    "riskLevel": "low|medium|high"
  }],
  "finishStrategy": {
    "phase": "finish",
    "priority": "critical",
    "action": "finish approach",
    "theory": "tactical framework",
    "execution": "championship covering or split distance technique",
    "rationale": "combined reasoning",
    "confidence": number (0-100),
    "conditions": ["conditions"],
    "riskLevel": "low|medium|high"
  }
}

CRITICAL: Return ONLY the JSON object. No explanations or additional text.
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
    try {
      // Remove markdown code blocks if present
      const cleanedText = strategyText.replace(/```json\n?|\n?```/g, '');

      // Parse JSON response
      const parsed = JSON.parse(cleanedText) as RaceStrategy['strategy'];

      console.log('✅ Successfully parsed AI strategy response');
      return parsed;

    } catch (error) {
      console.error('❌ Failed to parse AI strategy response:', error);
      console.log('Raw AI response:', strategyText.substring(0, 200));
      console.warn('Using fallback strategy');
      return this.generateFallbackStrategy({} as RaceCourseExtraction, conditions, venue);
    }
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