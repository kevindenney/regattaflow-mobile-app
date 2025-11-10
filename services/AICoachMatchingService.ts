import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';
import { CoachSearchResult, SailorProfile } from '../types/coach';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const COACH_MATCH_FUNCTION_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/coach-matching`
  : null;
const COACH_MATCH_SKILL_ID = process.env.EXPO_PUBLIC_CLAUDE_SKILL_COACH_MATCH || null;
const COACH_PLAN_SKILL_ID =
  process.env.EXPO_PUBLIC_CLAUDE_SKILL_COACH_PLAN || COACH_MATCH_SKILL_ID;
const COACH_LEARNING_SKILL_ID =
  process.env.EXPO_PUBLIC_CLAUDE_SKILL_COACH_LEARNING || COACH_MATCH_SKILL_ID;

interface MatchingCriteria {
  sailorProfile: SailorProfile;
  targetSkills: string[];
  learningStyle: 'visual' | 'hands-on' | 'analytical' | 'collaborative';
  upcomingEvents: string[];
  preferredLocation: string;
  budgetRange: { min: number; max: number };
  availabilityPreference: 'weekday' | 'weekend' | 'flexible';
}

interface CoachCompatibilityScore {
  coachId: string;
  overallScore: number;
  breakdown: {
    experienceMatch: number;
    teachingStyleMatch: number;
    specialtyAlignment: number;
    successRateRelevance: number;
    availabilityMatch: number;
    locationConvenience: number;
    valueScore: number;
  };
  reasoning: string;
  recommendations: string[];
}

interface LearningStyleAnalysis {
  primaryStyle: 'visual' | 'hands-on' | 'analytical' | 'collaborative';
  secondaryStyle?: 'visual' | 'hands-on' | 'analytical' | 'collaborative';
  confidence: number;
  indicators: string[];
}

export class AICoachMatchingService {
  private static genAI = new Anthropic({ apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '', dangerouslyAllowBrowser: true });

  private static resolveSkillId(kind: 'match' | 'plan' | 'learning'): string | null {
    switch (kind) {
      case 'plan':
        return COACH_PLAN_SKILL_ID;
      case 'learning':
        return COACH_LEARNING_SKILL_ID;
      default:
        return COACH_MATCH_SKILL_ID;
    }
  }

  private static extractTextFromResponse(message: any): string {
    const blocks = Array.isArray(message?.content) ? message.content : [];
    return blocks
      .filter((block: any) => block?.type === 'text' && typeof block?.text === 'string')
      .map((block: any) => (block.text as string).trim())
      .filter((text: string) => text.length > 0)
      .join('\n')
      .trim();
  }

  private static async invokeSkill(prompt: string, kind: 'match' | 'plan' | 'learning', options?: {
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    const skillId = this.resolveSkillId(kind);
    const maxTokens = options?.maxTokens ?? 2048;
    const temperature = options?.temperature ?? 0.3;

    if (COACH_MATCH_FUNCTION_URL) {
      try {
        const res = await fetch(COACH_MATCH_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            skillId,
            max_tokens: maxTokens,
            temperature,
          }),
        });

        if (res.ok) {
          const payload = await res.json();
          if (payload?.text) {
            return payload.text as string;
          }
        } else {
          const errorText = await res.text();
          console.warn('[coach-matching edge] non-200 response:', errorText);
        }
      } catch (error) {
        console.warn('[coach-matching edge] request failed, falling back to direct Anthropic call', error);
      }
    }

    const message = await this.genAI.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: maxTokens,
      temperature,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    return this.extractTextFromResponse(message);
  }

  /**
   * Analyze sailor's learning style from their profile and performance data
   */
  static async analyzeLearningStyle(sailorProfile: SailorProfile): Promise<LearningStyleAnalysis> {
    try {

      // Get sailor's race history and performance patterns
      const { data: raceHistory } = await supabase
        .from('regatta_results')
        .select('*')
        .eq('sailor_id', sailorProfile.user_id)
        .order('date', { ascending: false })
        .limit(10);

      // Get coaching session history if any
      const { data: sessionHistory } = await supabase
        .from('coaching_sessions')
        .select('*, session_reviews(*)')
        .eq('student_id', sailorProfile.user_id)
        .order('created_at', { ascending: false });

      const prompt = `
Analyze this sailor's profile and determine their optimal learning style:

SAILOR PROFILE:
- Experience: ${sailorProfile.sailing_experience} years
- Boat Classes: ${sailorProfile.boat_classes?.join(', ')}
- Racing Level: ${sailorProfile.competitive_level}
- Goals: ${sailorProfile.goals}
- Recent Performance: ${raceHistory?.length || 0} recent races

RACE PERFORMANCE PATTERNS:
${raceHistory?.map(race => `- ${race.event_name}: Position ${race.finish_position}/${race.total_boats}, Fleet: ${race.fleet}`).join('\n') || 'No recent race data'}

COACHING HISTORY:
${sessionHistory?.map(session => {
  const review = session.session_reviews?.[0];
  return `- ${session.title}: Goals achieved, feedback focused on ${review?.session_highlights || 'tactical improvement'}`;
}).join('\n') || 'No previous coaching sessions'}

Based on this data, determine the sailor's primary learning style:

1. VISUAL: Learns best through diagrams, course maps, video analysis, visual demonstrations
2. HANDS-ON: Learns best through practice, physical demonstration, trial and error
3. ANALYTICAL: Learns best through data analysis, strategic discussion, theoretical understanding
4. COLLABORATIVE: Learns best through group sessions, peer learning, team exercises

Provide your analysis in this JSON format:
{
  "primaryStyle": "visual|hands-on|analytical|collaborative",
  "secondaryStyle": "visual|hands-on|analytical|collaborative" or null,
  "confidence": 0.0-1.0,
  "indicators": ["specific evidence from profile that supports this classification"]
}
`;

      const response = await this.invokeSkill(prompt, 'learning', {
        maxTokens: 4096,
        temperature: 0.3,
      });

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback analysis based on basic profile data
      return this.fallbackLearningStyleAnalysis(sailorProfile);
    } catch (error) {
      console.error('Error analyzing learning style:', error);
      return this.fallbackLearningStyleAnalysis(sailorProfile);
    }
  }

  /**
   * Generate AI-powered coach compatibility scores
   */
  static async generateCoachCompatibilityScores(
    criteria: MatchingCriteria,
    availableCoaches: CoachSearchResult[]
  ): Promise<CoachCompatibilityScore[]> {
    try {

      const scores: CoachCompatibilityScore[] = [];

      for (const coach of availableCoaches) {
        try {
          // Get coach's recent session outcomes and reviews
          const { data: recentSessions } = await supabase
            .from('coaching_sessions')
            .select(`
              *,
              session_reviews(overall_rating, review_text, would_recommend)
            `)
            .eq('coach_id', coach.id)
            .eq('status', 'completed')
            .order('scheduled_start', { ascending: false })
            .limit(20);

          const prompt = `
Analyze compatibility between this sailor and coach for personalized coaching:

SAILOR PROFILE:
- Experience: ${criteria.sailorProfile.sailing_experience} years
- Boat Classes: ${criteria.sailorProfile.boat_classes?.join(', ')}
- Competitive Level: ${criteria.sailorProfile.competitive_level}
- Target Skills: ${criteria.targetSkills.join(', ')}
- Learning Style: ${criteria.learningStyle}
- Goals: ${criteria.sailorProfile.goals}
- Upcoming Events: ${criteria.upcomingEvents.join(', ')}
- Budget Range: $${criteria.budgetRange.min}-${criteria.budgetRange.max}

COACH PROFILE:
- Name: ${coach.first_name} ${coach.last_name}
- Experience: ${coach.years_coaching} years coaching, ${coach.students_coached} students
- Boat Classes: ${coach.boat_classes.join(', ')}
- Specialties: ${coach.specialties.join(', ')}
- Average Rating: ${coach.average_rating}/5 (${coach.total_reviews} reviews)
- Location: ${coach.location}
- Base Price: $${coach.services[0]?.base_price / 100}/hour

RECENT COACHING OUTCOMES:
${recentSessions?.map(session => {
  const review = session.session_reviews?.[0];
  return `- ${session.title}: ${review?.overall_rating}/5 rating, ${review?.would_recommend ? 'Recommended' : 'Not recommended'}`;
}).join('\n') || 'No recent session data'}

COACH TEACHING APPROACH:
${coach.bio}

Analyze compatibility across these dimensions:
1. Experience Match (0-100): How well does coach experience align with sailor needs?
2. Teaching Style Match (0-100): How well does coach approach match sailor learning style?
3. Specialty Alignment (0-100): How relevant are coach specialties to sailor goals?
4. Success Rate Relevance (0-100): How applicable is coach's track record to this sailor?
5. Availability Match (0-100): How well does coach availability fit sailor preferences?
6. Location Convenience (0-100): How convenient is the coach's location?
7. Value Score (0-100): How good is the value proposition given price and quality?

Provide detailed reasoning for why this coach would or wouldn't be optimal for this sailor.

Respond in this JSON format:
{
  "overallScore": 0-100,
  "breakdown": {
    "experienceMatch": 0-100,
    "teachingStyleMatch": 0-100,
    "specialtyAlignment": 0-100,
    "successRateRelevance": 0-100,
    "availabilityMatch": 0-100,
    "locationConvenience": 0-100,
    "valueScore": 0-100
  },
  "reasoning": "Detailed explanation of compatibility assessment",
  "recommendations": ["Specific suggestions for how this coaching relationship could be optimized"]
}
`;

          const response = await this.invokeSkill(prompt, 'match', {
            maxTokens: 4096,
            temperature: 0.3,
          });

          // Extract JSON from response
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiScore = JSON.parse(jsonMatch[0]);
            scores.push({
              coachId: coach.id,
              ...aiScore,
            });
          } else {
            // Fallback scoring
            scores.push(this.fallbackCompatibilityScore(coach, criteria));
          }
        } catch (error) {
          console.error(`Error analyzing coach ${coach.id}:`, error);
          scores.push(this.fallbackCompatibilityScore(coach, criteria));
        }
      }

      return scores.sort((a, b) => b.overallScore - a.overallScore);
    } catch (error) {
      console.error('Error generating compatibility scores:', error);
      return availableCoaches.map(coach => this.fallbackCompatibilityScore(coach, criteria));
    }
  }

  /**
   * Generate personalized coaching session recommendations
   */
  static async generateSessionRecommendations(
    sailorProfile: SailorProfile,
    matchedCoach: CoachSearchResult,
    targetSkills: string[]
  ): Promise<{
    sessionPlan: string;
    focusAreas: string[];
    expectedOutcomes: string[];
    preparationTips: string[];
  }> {
    try {

      // Get sailor's recent performance data
      const { data: recentRaces } = await supabase
        .from('regatta_results')
        .select('*')
        .eq('sailor_id', sailorProfile.user_id)
        .order('date', { ascending: false })
        .limit(5);

      const prompt = `
Create a personalized coaching session plan for this sailor-coach pairing:

SAILOR PROFILE:
- Experience: ${sailorProfile.sailing_experience} years
- Boat Classes: ${sailorProfile.boat_classes?.join(', ')}
- Competitive Level: ${sailorProfile.competitive_level}
- Goals: ${sailorProfile.goals}
- Target Skills: ${targetSkills.join(', ')}

RECENT PERFORMANCE:
${recentRaces?.map(race =>
  `- ${race.event_name}: ${race.finish_position}/${race.total_boats} in ${race.fleet}`
).join('\n') || 'No recent race data'}

COACH SPECIALTIES:
${matchedCoach.specialties.join(', ')}

COACH APPROACH:
${matchedCoach.bio}

Create a detailed session plan that maximizes learning for this specific sailor-coach combination.

Respond in this JSON format:
{
  "sessionPlan": "Detailed 90-minute session structure with timing",
  "focusAreas": ["Primary areas to concentrate on during session"],
  "expectedOutcomes": ["Specific skills/knowledge sailor should gain"],
  "preparationTips": ["What sailor should prepare before the session"]
}
`;

      const response = await this.invokeSkill(prompt, 'plan', {
        maxTokens: 4096,
        temperature: 0.3,
      });

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback recommendations
      return this.fallbackSessionRecommendations(targetSkills);
    } catch (error) {
      console.error('Error generating session recommendations:', error);
      return this.fallbackSessionRecommendations(targetSkills);
    }
  }

  /**
   * Analyze sailor's performance trends to suggest optimal coaching timing
   */
  static async analyzeOptimalCoachingTiming(sailorProfile: SailorProfile): Promise<{
    urgency: 'low' | 'medium' | 'high';
    reasoning: string;
    suggestedFrequency: string;
    focusAreas: string[];
  }> {
    try {

      // Get comprehensive performance data
      const { data: raceHistory } = await supabase
        .from('regatta_results')
        .select('*')
        .eq('sailor_id', sailorProfile.user_id)
        .order('date', { ascending: false })
        .limit(15);

      const { data: upcomingEvents } = await supabase
        .from('regattas')
        .select('*')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5);

      const prompt = `
Analyze this sailor's performance trends and upcoming schedule to determine optimal coaching timing:

SAILOR PROFILE:
- Experience: ${sailorProfile.sailing_experience} years
- Competitive Level: ${sailorProfile.competitive_level}
- Goals: ${sailorProfile.goals}

PERFORMANCE HISTORY (last 15 races):
${raceHistory?.map((race, index) => {
  const percentile = ((race.total_boats - race.finish_position) / race.total_boats * 100).toFixed(1);
  return `${index + 1}. ${race.event_name}: ${race.finish_position}/${race.total_boats} (${percentile}th percentile)`;
}).join('\n') || 'No recent race data'}

UPCOMING EVENTS:
${upcomingEvents?.map(event =>
  `- ${event.name} (${new Date(event.start_date).toLocaleDateString()})`
).join('\n') || 'No upcoming events'}

Analyze performance trends, identify coaching urgency, and recommend optimal timing.

Respond in this JSON format:
{
  "urgency": "low|medium|high",
  "reasoning": "Analysis of performance trends and why coaching is needed now/later",
  "suggestedFrequency": "Recommended coaching frequency (e.g., 'Weekly for 4 weeks', 'Bi-weekly maintenance')",
  "focusAreas": ["Specific areas that need immediate attention based on performance data"]
}
`;

      const response = await this.invokeSkill(prompt, 'plan', {
        maxTokens: 4096,
        temperature: 0.3,
      });

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback analysis
      return this.fallbackTimingAnalysis(raceHistory, upcomingEvents);
    } catch (error) {
      console.error('Error analyzing coaching timing:', error);
      return this.fallbackTimingAnalysis(null, null);
    }
  }

  // Fallback methods for when AI analysis fails

  private static fallbackLearningStyleAnalysis(sailorProfile: SailorProfile): LearningStyleAnalysis {
    // Simple heuristic based on experience and goals
    let primaryStyle: LearningStyleAnalysis['primaryStyle'] = 'hands-on';
    const indicators: string[] = [];

    if (sailorProfile.sailing_experience > 10) {
      primaryStyle = 'analytical';
      indicators.push('Experienced sailors often prefer data-driven approach');
    } else if (sailorProfile.competitive_level === 'recreational') {
      primaryStyle = 'visual';
      indicators.push('Recreational sailors benefit from visual learning');
    } else {
      primaryStyle = 'hands-on';
      indicators.push('Competitive sailors need practical experience');
    }

    return {
      primaryStyle,
      confidence: 0.6,
      indicators,
    };
  }

  private static fallbackCompatibilityScore(
    coach: CoachSearchResult,
    criteria: MatchingCriteria
  ): CoachCompatibilityScore {
    // Simple scoring based on basic criteria
    const experienceMatch = Math.min(100, (coach.years_coaching / 10) * 100);
    const specialtyAlignment = coach.specialties.some(spec =>
      criteria.targetSkills.some(skill => skill.toLowerCase().includes(spec.toLowerCase()))
    ) ? 80 : 40;
    const successRateRelevance = Math.min(100, coach.average_rating * 20);

    const overallScore = (experienceMatch + specialtyAlignment + successRateRelevance) / 3;

    return {
      coachId: coach.id,
      overallScore,
      breakdown: {
        experienceMatch,
        teachingStyleMatch: 70,
        specialtyAlignment,
        successRateRelevance,
        availabilityMatch: 75,
        locationConvenience: 60,
        valueScore: 65,
      },
      reasoning: 'Basic compatibility assessment based on experience and specialties.',
      recommendations: ['Schedule an initial consultation to assess teaching style compatibility'],
    };
  }

  private static fallbackSessionRecommendations(targetSkills: string[]) {
    return {
      sessionPlan: 'Standard 90-minute coaching session focusing on identified skill gaps',
      focusAreas: targetSkills.slice(0, 3),
      expectedOutcomes: ['Improved understanding of target skills', 'Action plan for continued improvement'],
      preparationTips: ['Review recent race videos', 'Prepare specific questions about challenges'],
    };
  }

  private static fallbackTimingAnalysis(raceHistory: any, upcomingEvents: any) {
    return {
      urgency: 'medium' as const,
      reasoning: 'Regular coaching recommended for continued improvement',
      suggestedFrequency: 'Monthly sessions with additional sessions before major events',
      focusAreas: ['Race tactics', 'Boat handling', 'Mental preparation'],
    };
  }
}

export default AICoachMatchingService;
