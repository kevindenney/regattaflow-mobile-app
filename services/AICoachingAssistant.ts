import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

interface LiveConditions {
  windSpeed: number; // knots
  windDirection: number; // degrees
  gustFactor: number; // ratio
  waveHeight: number; // meters
  current: {
    speed: number; // knots
    direction: number; // degrees
  };
  visibility: number; // nautical miles
  temperature: number; // celsius
}

interface BoatState {
  position: {
    latitude: number;
    longitude: number;
  };
  heading: number; // degrees
  speed: number; // knots
  heel: number; // degrees
  trim: {
    fore_aft: number; // -10 to 10
    athwartships: number; // -10 to 10
  };
  sailTrim: {
    mainsheet: number; // 0-100%
    jib_sheet: number; // 0-100%
    cunningham: number; // 0-100%
    outhaul: number; // 0-100%
    vang: number; // 0-100%
  };
}

interface TacticalSituation {
  racePhase: 'pre-start' | 'upwind' | 'mark-rounding' | 'downwind' | 'finish';
  timeToStart?: number; // seconds
  distanceToMark?: number; // meters
  boatsAhead: number;
  boatsBehind: number;
  nearbyCompetitors: {
    position: 'port' | 'starboard' | 'ahead' | 'behind';
    distance: number; // meters
    relative_speed: number; // knots
  }[];
  nextMark: {
    bearing: number; // degrees
    distance: number; // meters
    type: 'windward' | 'leeward' | 'reaching';
  };
}

interface CoachingContext {
  sessionGoals: string[];
  sailorExperience: string;
  boatClass: string;
  venue: string;
  coachingFocus: 'technique' | 'tactics' | 'speed' | 'mental' | 'rules';
}

interface RealTimeAdvice {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'speed' | 'tactics' | 'safety' | 'technique' | 'rules';
  title: string;
  message: string;
  actionItems: string[];
  reasoning: string;
  timeRelevant: number; // seconds this advice remains relevant
  followUp?: string;
}

interface PerformanceInsight {
  metric: string;
  currentValue: number;
  optimalRange: { min: number; max: number };
  improvement: string;
  impact: 'high' | 'medium' | 'low';
}

interface SessionAnalysis {
  overallPerformance: number; // 0-100 score
  strengthsIdentified: string[];
  areasForImprovement: string[];
  specificRecommendations: string[];
  progressAgainstGoals: {
    goal: string;
    progress: number; // 0-100%
    evidence: string[];
  }[];
}

export class AICoachingAssistant {
  private static genAI = new Anthropic({ apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '', dangerouslyAllowBrowser: true });
  private static activeSession: string | null = null;
  private static realtimeAdviceHistory: RealTimeAdvice[] = [];

  /**
   * Provide real-time tactical advice based on current conditions and situation
   */
  static async generateRealTimeAdvice(
    conditions: LiveConditions,
    boatState: BoatState,
    tacticalSituation: TacticalSituation,
    coachingContext: CoachingContext
  ): Promise<RealTimeAdvice> {
    try {

      const prompt = `
You are an expert sailing coach providing real-time advice during a coaching session. Analyze the current situation and provide immediate, actionable guidance.

CURRENT CONDITIONS:
- Wind: ${conditions.windSpeed} knots at ${conditions.windDirection}° with ${conditions.gustFactor}x gust factor
- Waves: ${conditions.waveHeight}m
- Current: ${conditions.current.speed} knots at ${conditions.current.direction}°
- Visibility: ${conditions.visibility} nm

BOAT STATE:
- Position: ${boatState.position.latitude.toFixed(6)}, ${boatState.position.longitude.toFixed(6)}
- Speed: ${boatState.speed} knots on heading ${boatState.heading}°
- Heel: ${boatState.heel}°
- Sail Trim: Main ${boatState.sailTrim.mainsheet}%, Jib ${boatState.sailTrim.jib_sheet}%

TACTICAL SITUATION:
- Race Phase: ${tacticalSituation.racePhase}
- Boats ahead: ${tacticalSituation.boatsAhead}, behind: ${tacticalSituation.boatsBehind}
- Next mark: ${tacticalSituation.nextMark.type} mark at ${tacticalSituation.nextMark.bearing}°, ${tacticalSituation.nextMark.distance}m away
${tacticalSituation.timeToStart ? `- Time to start: ${tacticalSituation.timeToStart} seconds` : ''}

COACHING CONTEXT:
- Session Goals: ${coachingContext.sessionGoals.join(', ')}
- Sailor Experience: ${coachingContext.sailorExperience}
- Focus Area: ${coachingContext.coachingFocus}
- Boat Class: ${coachingContext.boatClass}

RECENT ADVICE GIVEN:
${this.realtimeAdviceHistory.slice(-3).map(advice => `- ${advice.title}: ${advice.message}`).join('\n')}

Provide immediate, specific advice that:
1. Addresses the most critical current need
2. Aligns with session goals and focus area
3. Is appropriate for sailor's experience level
4. Considers current conditions and tactical situation
5. Avoids repeating recent advice unless critical

Be concise but specific. Focus on what the sailor should do RIGHT NOW.

Respond in this JSON format:
{
  "priority": "critical|high|medium|low",
  "category": "speed|tactics|safety|technique|rules",
  "title": "Brief advice title",
  "message": "Clear, actionable message (max 100 words)",
  "actionItems": ["Specific actions to take now"],
  "reasoning": "Why this advice is important right now",
  "timeRelevant": 30,
  "followUp": "Optional follow-up guidance"
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const advice = JSON.parse(jsonMatch[0]);
        this.realtimeAdviceHistory.push(advice);

        // Keep only last 10 pieces of advice
        if (this.realtimeAdviceHistory.length > 10) {
          this.realtimeAdviceHistory = this.realtimeAdviceHistory.slice(-10);
        }

        return advice;
      }

      // Fallback advice
      return this.generateFallbackAdvice(tacticalSituation, conditions);
    } catch (error) {
      console.error('Error generating real-time advice:', error);
      return this.generateFallbackAdvice(tacticalSituation, conditions);
    }
  }

  /**
   * Analyze current performance against optimal parameters
   */
  static async analyzePerformanceMetrics(
    conditions: LiveConditions,
    boatState: BoatState,
    boatClass: string,
    targetPerformance: any
  ): Promise<PerformanceInsight[]> {
    try {

      const prompt = `
Analyze current sailing performance metrics against optimal parameters:

CURRENT CONDITIONS:
- Wind: ${conditions.windSpeed} knots
- Wave state: ${conditions.waveHeight}m waves

BOAT PERFORMANCE:
- Class: ${boatClass}
- Speed: ${boatState.speed} knots
- Heel: ${boatState.heel}°
- Heading: ${boatState.heading}°

SAIL TRIM:
- Main: ${boatState.sailTrim.mainsheet}%
- Jib: ${boatState.sailTrim.jib_sheet}%
- Cunningham: ${boatState.sailTrim.cunningham}%
- Outhaul: ${boatState.sailTrim.outhaul}%

TARGET PERFORMANCE DATA:
${JSON.stringify(targetPerformance, null, 2)}

Analyze key performance metrics and identify specific areas for immediate improvement.

Respond with this JSON format:
{
  "insights": [
    {
      "metric": "Boat Speed",
      "currentValue": ${boatState.speed},
      "optimalRange": {"min": 0, "max": 10},
      "improvement": "Specific suggestion for improvement",
      "impact": "high|medium|low"
    }
  ]
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis.insights;
      }

      // Fallback insights
      return this.generateFallbackInsights(boatState, conditions);
    } catch (error) {
      console.error('Error analyzing performance:', error);
      return this.generateFallbackInsights(boatState, conditions);
    }
  }

  /**
   * Provide strategic race planning advice
   */
  static async generateStrategicAdvice(
    conditions: LiveConditions,
    courseLayout: any,
    competitorAnalysis: any,
    sailorGoals: string[]
  ): Promise<{
    strategy: string;
    keyDecisionPoints: string[];
    riskAssessment: string;
    alternatives: string[];
  }> {
    try {

      const prompt = `
Develop a strategic race plan based on current analysis:

CONDITIONS FORECAST:
- Current Wind: ${conditions.windSpeed} knots at ${conditions.windDirection}°
- Gusts: Up to ${conditions.windSpeed * conditions.gustFactor} knots
- Current: ${conditions.current.speed} knots at ${conditions.current.direction}°

COURSE LAYOUT:
${JSON.stringify(courseLayout, null, 2)}

COMPETITOR ANALYSIS:
${JSON.stringify(competitorAnalysis, null, 2)}

SAILOR GOALS:
${sailorGoals.join(', ')}

Create a comprehensive strategic plan that:
1. Maximizes advantages in current conditions
2. Minimizes risks and exposure
3. Accounts for competitor patterns
4. Aligns with sailor's experience and goals
5. Includes decision points and alternatives

Respond in this JSON format:
{
  "strategy": "Overall strategic approach",
  "keyDecisionPoints": ["Critical decision moments"],
  "riskAssessment": "Primary risks and mitigation",
  "alternatives": ["Alternative strategies if conditions change"]
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback strategy
      return this.generateFallbackStrategy(conditions);
    } catch (error) {
      console.error('Error generating strategy:', error);
      return this.generateFallbackStrategy(conditions);
    }
  }

  /**
   * Analyze session performance and provide comprehensive feedback
   */
  static async analyzeSessionPerformance(
    sessionData: {
      duration: number;
      conditions: LiveConditions[];
      boatStates: BoatState[];
      decisions: any[];
      goals: string[];
    }
  ): Promise<SessionAnalysis> {
    try {

      const averageSpeed = sessionData.boatStates.reduce((sum, state) => sum + state.speed, 0) / sessionData.boatStates.length;
      const averageHeel = sessionData.boatStates.reduce((sum, state) => sum + state.heel, 0) / sessionData.boatStates.length;

      const prompt = `
Analyze this coaching session performance and provide comprehensive feedback:

SESSION OVERVIEW:
- Duration: ${sessionData.duration} minutes
- Goals: ${sessionData.goals.join(', ')}
- Data Points: ${sessionData.boatStates.length} measurements

PERFORMANCE SUMMARY:
- Average Speed: ${averageSpeed.toFixed(2)} knots
- Average Heel: ${averageHeel.toFixed(1)}°
- Decisions Made: ${sessionData.decisions.length}

CONDITIONS EXPERIENCED:
- Wind Range: ${Math.min(...sessionData.conditions.map(c => c.windSpeed))} - ${Math.max(...sessionData.conditions.map(c => c.windSpeed))} knots
- Wave Conditions: ${Math.min(...sessionData.conditions.map(c => c.waveHeight))} - ${Math.max(...sessionData.conditions.map(c => c.waveHeight))}m

KEY DECISIONS:
${sessionData.decisions.map((decision, idx) => `${idx + 1}. ${decision.type}: ${decision.outcome}`).join('\n')}

Provide detailed analysis including:
1. Overall performance assessment (0-100 score)
2. Specific strengths demonstrated
3. Areas needing improvement
4. Progress against stated goals
5. Specific recommendations for next session

Respond in this JSON format:
{
  "overallPerformance": 75,
  "strengthsIdentified": ["Specific strengths observed"],
  "areasForImprovement": ["Specific areas to work on"],
  "specificRecommendations": ["Actionable next steps"],
  "progressAgainstGoals": [
    {
      "goal": "Goal from session",
      "progress": 80,
      "evidence": ["Specific evidence of progress"]
    }
  ]
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback analysis
      return this.generateFallbackAnalysis(sessionData);
    } catch (error) {
      console.error('Error analyzing session:', error);
      return this.generateFallbackAnalysis(sessionData);
    }
  }

  /**
   * Start a new coaching session
   */
  static startSession(sessionId: string) {
    this.activeSession = sessionId;
    this.realtimeAdviceHistory = [];
  }

  /**
   * End the current coaching session
   */
  static endSession() {
    this.activeSession = null;
    this.realtimeAdviceHistory = [];
  }

  // Fallback methods

  private static generateFallbackAdvice(
    tacticalSituation: TacticalSituation,
    conditions: LiveConditions
  ): RealTimeAdvice {
    let advice: RealTimeAdvice;

    switch (tacticalSituation.racePhase) {
      case 'pre-start':
        advice = {
          priority: 'high',
          category: 'tactics',
          title: 'Pre-Start Positioning',
          message: 'Focus on finding clear air and good boat speed.',
          actionItems: ['Check wind direction', 'Monitor competitors', 'Practice starts'],
          reasoning: 'Good pre-start preparation is crucial for race success',
          timeRelevant: 60,
        };
        break;
      case 'upwind':
        advice = {
          priority: 'medium',
          category: 'speed',
          title: 'Upwind Optimization',
          message: 'Maintain good angle and speed balance.',
          actionItems: ['Check trim', 'Look for shifts', 'Stay in phase'],
          reasoning: 'Upwind performance determines race position',
          timeRelevant: 30,
        };
        break;
      default:
        advice = {
          priority: 'medium',
          category: 'technique',
          title: 'General Sailing',
          message: 'Focus on boat handling and awareness.',
          actionItems: ['Maintain speed', 'Watch conditions'],
          reasoning: 'Consistent technique improves overall performance',
          timeRelevant: 45,
        };
    }

    return advice;
  }

  private static generateFallbackInsights(
    boatState: BoatState,
    conditions: LiveConditions
  ): PerformanceInsight[] {
    return [
      {
        metric: 'Boat Speed',
        currentValue: boatState.speed,
        optimalRange: { min: conditions.windSpeed * 0.6, max: conditions.windSpeed * 0.8 },
        improvement: 'Optimize sail trim for current conditions',
        impact: 'high',
      },
      {
        metric: 'Heel Angle',
        currentValue: boatState.heel,
        optimalRange: { min: 15, max: 25 },
        improvement: 'Adjust heel for optimal performance',
        impact: 'medium',
      },
    ];
  }

  private static generateFallbackStrategy(conditions: LiveConditions) {
    return {
      strategy: 'Conservative approach focusing on consistent speed and positioning',
      keyDecisionPoints: ['Start line positioning', 'First shift decision', 'Mark approach'],
      riskAssessment: 'Low risk strategy suitable for variable conditions',
      alternatives: ['Aggressive start if line favors', 'Port approach if wind shifts right'],
    };
  }

  private static generateFallbackAnalysis(sessionData: any): SessionAnalysis {
    return {
      overallPerformance: 75,
      strengthsIdentified: ['Consistent boat handling', 'Good awareness'],
      areasForImprovement: ['Trim optimization', 'Tactical decision timing'],
      specificRecommendations: ['Practice mark roundings', 'Work on sail trim'],
      progressAgainstGoals: sessionData.goals.map((goal: string) => ({
        goal,
        progress: 70,
        evidence: ['Observed improvement in technique'],
      })),
    };
  }
}

export default AICoachingAssistant;