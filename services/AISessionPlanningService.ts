import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';
import { CoachingSession, SailorProfile, CoachProfile } from '../types/coach';

interface SessionPlan {
  id: string;
  title: string;
  duration: number; // minutes
  objectives: string[];
  activities: SessionActivity[];
  preparationRequired: string[];
  expectedOutcomes: string[];
  followUpTasks: string[];
  progressMetrics: string[];
}

interface SessionActivity {
  name: string;
  duration: number; // minutes
  description: string;
  materials: string[];
  objectives: string[];
  type: 'theory' | 'practical' | 'analysis' | 'discussion';
}

interface LearningCurriculum {
  totalSessions: number;
  timeframe: string; // e.g., "8 weeks"
  overallGoal: string;
  sessions: SessionPlan[];
  progressMilestones: {
    session: number;
    milestone: string;
    assessmentCriteria: string[];
  }[];
}

interface SessionRecommendation {
  urgency: 'low' | 'medium' | 'high';
  suggestedTiming: string;
  focusAreas: string[];
  reasoning: string;
  prerequisites: string[];
}

export class AISessionPlanningService {
  private static genAI = new Anthropic({ apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '', dangerouslyAllowBrowser: true });

  /**
   * Generate a complete learning curriculum for a sailor
   */
  static async generateLearningCurriculum(
    sailorProfile: SailorProfile,
    coachProfile: CoachProfile,
    goals: string[],
    timeframe: string,
    sessionFrequency: 'weekly' | 'bi-weekly' | 'monthly'
  ): Promise<LearningCurriculum> {
    try {
      // Get sailor's performance history
      const { data: raceHistory } = await supabase
        .from('regatta_results')
        .select('*')
        .eq('sailor_id', sailorProfile.user_id)
        .order('date', { ascending: false })
        .limit(10);

      // Get previous coaching sessions
      const { data: previousSessions } = await supabase
        .from('coaching_sessions')
        .select('*, session_reviews(*)')
        .eq('student_id', sailorProfile.user_id)
        .order('scheduled_start', { ascending: false })
        .limit(5);

      const totalSessions = this.calculateSessionCount(timeframe, sessionFrequency);

      const prompt = `
Create a comprehensive learning curriculum for this sailor-coach pairing:

SAILOR PROFILE:
- Experience: ${sailorProfile.sailing_experience} years
- Boat Classes: ${sailorProfile.boat_classes?.join(', ')}
- Competitive Level: ${sailorProfile.competitive_level}
- Current Goals: ${goals.join(', ')}
- Location: ${sailorProfile.location}

RECENT RACE PERFORMANCE:
${raceHistory?.map(race =>
  `- ${race.event_name}: ${race.finish_position}/${race.total_boats} (${((race.total_boats - race.finish_position) / race.total_boats * 100).toFixed(1)}th percentile)`
).join('\n') || 'No recent race data'}

COACH PROFILE:
- Name: ${coachProfile.first_name} ${coachProfile.last_name}
- Experience: ${coachProfile.years_coaching} years coaching
- Specialties: ${coachProfile.specialties?.join(', ')}
- Approach: ${coachProfile.bio}

PREVIOUS COACHING HISTORY:
${previousSessions?.map(session => {
  const review = session.session_reviews?.[0];
  return `- ${session.title}: ${review?.overall_rating}/5 rating, focused on ${session.student_goals}`;
}).join('\n') || 'No previous coaching sessions'}

CURRICULUM PARAMETERS:
- Total Sessions: ${totalSessions}
- Timeframe: ${timeframe}
- Frequency: ${sessionFrequency}

Create a detailed curriculum that:
1. Builds progressively on skills
2. Aligns with sailor's goals and racing schedule
3. Matches coach's teaching strengths
4. Includes practical and theoretical elements
5. Has clear progress milestones

For each session, provide:
- Specific learning objectives
- Detailed activities with timing
- Required preparation and materials
- Expected outcomes and follow-up tasks
- Progress assessment criteria

Respond in this JSON format:
{
  "totalSessions": ${totalSessions},
  "timeframe": "${timeframe}",
  "overallGoal": "Primary goal for the entire curriculum",
  "sessions": [
    {
      "id": "session-1",
      "title": "Session title",
      "duration": 90,
      "objectives": ["Specific learning objectives"],
      "activities": [
        {
          "name": "Activity name",
          "duration": 30,
          "description": "Detailed activity description",
          "materials": ["Required materials"],
          "objectives": ["Activity-specific objectives"],
          "type": "theory|practical|analysis|discussion"
        }
      ],
      "preparationRequired": ["What sailor should prepare"],
      "expectedOutcomes": ["What sailor will achieve"],
      "followUpTasks": ["Homework or practice tasks"],
      "progressMetrics": ["How to measure progress"]
    }
  ],
  "progressMilestones": [
    {
      "session": 3,
      "milestone": "Milestone description",
      "assessmentCriteria": ["How to assess achievement"]
    }
  ]
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-haiku-20240307',
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

      // Fallback curriculum
      return this.generateFallbackCurriculum(totalSessions, timeframe, goals);
    } catch (error) {
      console.error('Error generating curriculum:', error);
      return this.generateFallbackCurriculum(
        this.calculateSessionCount(timeframe, sessionFrequency),
        timeframe,
        goals
      );
    }
  }

  /**
   * Generate a specific session plan based on sailor's current needs
   */
  static async generateAdaptiveSessionPlan(
    sailorProfile: SailorProfile,
    coachProfile: CoachProfile,
    recentPerformance: any[],
    upcomingEvents: string[],
    focusAreas: string[]
  ): Promise<SessionPlan> {
    try {

      const prompt = `
Generate an adaptive coaching session plan based on current sailor needs:

SAILOR CURRENT STATE:
- Experience: ${sailorProfile.sailing_experience} years
- Recent Performance: ${recentPerformance.length} data points available
- Upcoming Events: ${upcomingEvents.join(', ')}
- Priority Focus Areas: ${focusAreas.join(', ')}

COACH CAPABILITIES:
- Specialties: ${coachProfile.specialties?.join(', ')}
- Teaching Approach: ${coachProfile.bio}

RECENT PERFORMANCE ANALYSIS:
${recentPerformance.map((perf, idx) =>
  `${idx + 1}. ${perf.description || 'Performance data'}: ${perf.outcome || 'Outcome'}`
).join('\n')}

Create a 90-minute session plan that:
1. Addresses immediate performance gaps
2. Prepares for upcoming events
3. Builds on recent lessons learned
4. Matches coach's teaching style
5. Provides clear progress indicators

Include specific timing, activities, and measurable outcomes.

Respond in this JSON format:
{
  "id": "adaptive-session-${Date.now()}",
  "title": "Session title",
  "duration": 90,
  "objectives": ["Specific learning objectives"],
  "activities": [
    {
      "name": "Activity name",
      "duration": 30,
      "description": "Detailed activity description",
      "materials": ["Required materials"],
      "objectives": ["Activity objectives"],
      "type": "theory|practical|analysis|discussion"
    }
  ],
  "preparationRequired": ["Pre-session preparation"],
  "expectedOutcomes": ["Session outcomes"],
  "followUpTasks": ["Post-session tasks"],
  "progressMetrics": ["Measurement criteria"]
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-haiku-20240307',
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

      // Fallback session plan
      return this.generateFallbackSessionPlan(focusAreas);
    } catch (error) {
      console.error('Error generating session plan:', error);
      return this.generateFallbackSessionPlan(focusAreas);
    }
  }

  /**
   * Analyze sailor's progress and recommend next session focus
   */
  static async analyzeProgressAndRecommendNext(
    sailorProfile: SailorProfile,
    completedSessions: CoachingSession[],
    recentRaceResults: any[]
  ): Promise<SessionRecommendation> {
    try {

      const prompt = `
Analyze sailor progress and recommend next coaching session focus:

SAILOR PROFILE:
- Experience: ${sailorProfile.sailing_experience} years
- Goals: ${sailorProfile.goals}
- Competitive Level: ${sailorProfile.competitive_level}

COMPLETED COACHING SESSIONS:
${completedSessions.map((session, idx) =>
  `${idx + 1}. ${session.title} (${new Date(session.scheduled_start).toLocaleDateString()}): ${session.student_goals}`
).join('\n')}

RECENT RACE RESULTS:
${recentRaceResults.map((result, idx) =>
  `${idx + 1}. ${result.event_name}: ${result.finish_position}/${result.total_boats} finish`
).join('\n')}

Based on this progression data:
1. Assess learning progress and skill development
2. Identify areas needing reinforcement
3. Determine optimal timing for next session
4. Recommend specific focus areas
5. Suggest prerequisites or preparation needed

Respond in this JSON format:
{
  "urgency": "low|medium|high",
  "suggestedTiming": "Recommended timing description",
  "focusAreas": ["Specific areas to focus on"],
  "reasoning": "Detailed analysis of why these recommendations",
  "prerequisites": ["What sailor should prepare or review"]
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-haiku-20240307',
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

      // Fallback recommendation
      return this.generateFallbackRecommendation();
    } catch (error) {
      console.error('Error analyzing progress:', error);
      return this.generateFallbackRecommendation();
    }
  }

  /**
   * Generate pre-session briefing based on conditions and objectives
   */
  static async generateSessionBriefing(
    sessionPlan: SessionPlan,
    weatherConditions: any,
    venueInformation: any,
    sailorCurrentState: any
  ): Promise<{
    executiveSummary: string;
    keyFocusPoints: string[];
    adaptations: string[];
    successCriteria: string[];
    contingencyPlans: string[];
  }> {
    try {

      const prompt = `
Generate a pre-session briefing for this coaching session:

SESSION PLAN:
- Title: ${sessionPlan.title}
- Objectives: ${sessionPlan.objectives.join(', ')}
- Duration: ${sessionPlan.duration} minutes

CURRENT CONDITIONS:
- Weather: ${weatherConditions?.description || 'Standard conditions'}
- Venue: ${venueInformation?.name || 'Standard venue'}
- Sailor State: ${sailorCurrentState?.description || 'Ready to learn'}

PLANNED ACTIVITIES:
${sessionPlan.activities.map(activity =>
  `- ${activity.name} (${activity.duration}min): ${activity.description}`
).join('\n')}

Create a comprehensive briefing that:
1. Summarizes session goals and approach
2. Identifies key focus points for success
3. Suggests adaptations based on conditions
4. Defines clear success criteria
5. Provides contingency plans for challenges

Respond in this JSON format:
{
  "executiveSummary": "Brief overview of session goals and approach",
  "keyFocusPoints": ["3-5 critical focus areas"],
  "adaptations": ["Modifications based on current conditions"],
  "successCriteria": ["How to measure session success"],
  "contingencyPlans": ["Alternative approaches if needed"]
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-haiku-20240307',
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

      // Fallback briefing
      return this.generateFallbackBriefing(sessionPlan);
    } catch (error) {
      console.error('Error generating briefing:', error);
      return this.generateFallbackBriefing(sessionPlan);
    }
  }

  // Helper methods

  private static calculateSessionCount(timeframe: string, frequency: string): number {
    const weeks = this.parseTimeframeToWeeks(timeframe);
    switch (frequency) {
      case 'weekly': return weeks;
      case 'bi-weekly': return Math.ceil(weeks / 2);
      case 'monthly': return Math.ceil(weeks / 4);
      default: return 8;
    }
  }

  private static parseTimeframeToWeeks(timeframe: string): number {
    const match = timeframe.match(/(\d+)\s*(week|month)/i);
    if (match) {
      const number = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit === 'week' ? number : number * 4;
    }
    return 8; // Default 8 weeks
  }

  private static generateFallbackCurriculum(sessions: number, timeframe: string, goals: string[]): LearningCurriculum {
    return {
      totalSessions: sessions,
      timeframe,
      overallGoal: `Improve sailing performance in: ${goals.join(', ')}`,
      sessions: Array.from({ length: sessions }, (_, i) => ({
        id: `session-${i + 1}`,
        title: `Session ${i + 1}: ${goals[i % goals.length] || 'Skill Development'}`,
        duration: 90,
        objectives: [`Develop ${goals[i % goals.length] || 'sailing skills'}`],
        activities: [
          {
            name: 'Skill Assessment',
            duration: 20,
            description: 'Evaluate current ability level',
            materials: ['Notebook', 'Assessment criteria'],
            objectives: ['Understand current skill level'],
            type: 'analysis' as const,
          },
          {
            name: 'Practical Training',
            duration: 50,
            description: 'Hands-on skill development',
            materials: ['Boat', 'Safety equipment'],
            objectives: ['Practice new techniques'],
            type: 'practical' as const,
          },
          {
            name: 'Review and Planning',
            duration: 20,
            description: 'Discuss progress and next steps',
            materials: ['Notes'],
            objectives: ['Plan future development'],
            type: 'discussion' as const,
          },
        ],
        preparationRequired: ['Review previous session notes'],
        expectedOutcomes: ['Improved understanding and technique'],
        followUpTasks: ['Practice recommended drills'],
        progressMetrics: ['Technique improvement', 'Knowledge retention'],
      })),
      progressMilestones: [
        {
          session: Math.ceil(sessions / 3),
          milestone: 'Basic skill competency',
          assessmentCriteria: ['Consistent technique execution'],
        },
        {
          session: Math.ceil((sessions * 2) / 3),
          milestone: 'Advanced skill application',
          assessmentCriteria: ['Strategic skill usage'],
        },
        {
          session: sessions,
          milestone: 'Goal achievement',
          assessmentCriteria: ['Measurable performance improvement'],
        },
      ],
    };
  }

  private static generateFallbackSessionPlan(focusAreas: string[]): SessionPlan {
    return {
      id: `session-${Date.now()}`,
      title: `Focused Training: ${focusAreas.join(' & ')}`,
      duration: 90,
      objectives: focusAreas.map(area => `Improve ${area}`),
      activities: [
        {
          name: 'Warm-up and Assessment',
          duration: 15,
          description: 'Review current capabilities and session goals',
          materials: ['Assessment checklist'],
          objectives: ['Establish baseline'],
          type: 'analysis',
        },
        {
          name: 'Focused Practice',
          duration: 60,
          description: `Concentrated work on ${focusAreas.join(' and ')}`,
          materials: ['Practice equipment'],
          objectives: focusAreas.map(area => `Practice ${area}`),
          type: 'practical',
        },
        {
          name: 'Review and Next Steps',
          duration: 15,
          description: 'Summarize learning and plan follow-up',
          materials: ['Session notes'],
          objectives: ['Consolidate learning'],
          type: 'discussion',
        },
      ],
      preparationRequired: ['Review relevant theory'],
      expectedOutcomes: ['Improved performance in focus areas'],
      followUpTasks: ['Practice session techniques'],
      progressMetrics: ['Skill execution accuracy', 'Confidence level'],
    };
  }

  private static generateFallbackRecommendation(): SessionRecommendation {
    return {
      urgency: 'medium',
      suggestedTiming: 'Within 2-3 weeks',
      focusAreas: ['Technique refinement', 'Tactical awareness'],
      reasoning: 'Regular practice sessions help maintain skill development momentum',
      prerequisites: ['Review previous session materials'],
    };
  }

  private static generateFallbackBriefing(sessionPlan: SessionPlan) {
    return {
      executiveSummary: `Focus session on ${sessionPlan.title} with structured practice and review`,
      keyFocusPoints: sessionPlan.objectives.slice(0, 3),
      adaptations: ['Adjust activities based on conditions'],
      successCriteria: sessionPlan.expectedOutcomes,
      contingencyPlans: ['Have backup indoor activities available'],
    };
  }
}

export default AISessionPlanningService;