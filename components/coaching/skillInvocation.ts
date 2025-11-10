export const SKILL_IDS = {
  'starting-line-mastery': 'skill_builtin_starting_line_mastery',
  'upwind-strategic-positioning': 'skill_builtin_upwind_strategic_positioning',
  'upwind-tactical-combat': 'skill_builtin_upwind_tactical_combat',
  'downwind-speed-and-position': 'skill_builtin_downwind_speed_and_position',
  'mark-rounding-execution': 'skill_builtin_mark_rounding_execution',
  'finishing-line-tactics': 'skill_builtin_finishing_line_tactics',
  'tidal-opportunism-analyst': 'skill_builtin_tidal_opportunism_analyst',
} as const;

export type CoachingSkillKey = keyof typeof SKILL_IDS;

export interface SkillDisplayDefinition {
  id: CoachingSkillKey;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const SKILL_DISPLAY: Record<CoachingSkillKey, SkillDisplayDefinition> = {
  'starting-line-mastery': {
    id: 'starting-line-mastery',
    label: 'Start Strategy',
    icon: '🏁',
    color: '#10b981',
    description: 'Line bias, timing, positioning',
  },
  'upwind-strategic-positioning': {
    id: 'upwind-strategic-positioning',
    label: 'Upwind Strategy',
    icon: '🧭',
    color: '#3b82f6',
    description: 'Wind patterns, side selection',
  },
  'upwind-tactical-combat': {
    id: 'upwind-tactical-combat',
    label: 'Upwind Tactics',
    icon: '⛵',
    color: '#6366f1',
    description: 'Covering, splitting, tacking',
  },
  'downwind-speed-and-position': {
    id: 'downwind-speed-and-position',
    label: 'Downwind',
    icon: '🌊',
    color: '#8b5cf6',
    description: 'VMG, jibing, pressure',
  },
  'mark-rounding-execution': {
    id: 'mark-rounding-execution',
    label: 'Mark Rounding',
    icon: '🎯',
    color: '#f59e0b',
    description: 'Approach, execution, laylines',
  },
  'finishing-line-tactics': {
    id: 'finishing-line-tactics',
    label: 'Finish Tactics',
    icon: '🏆',
    color: '#ef4444',
    description: 'Favored end, laylines, ducking',
  },
  'tidal-opportunism-analyst': {
    id: 'tidal-opportunism-analyst',
    label: 'Tidal Intel',
    icon: '🌀',
    color: '#06b6d4',
    description: 'Current strategy, eddies',
  },
};

export const DEFAULT_SKILL_ORDER: CoachingSkillKey[] = [
  'starting-line-mastery',
  'upwind-strategic-positioning',
  'upwind-tactical-combat',
  'downwind-speed-and-position',
  'mark-rounding-execution',
  'finishing-line-tactics',
  'tidal-opportunism-analyst',
];

export interface SkillAdvice {
  primary: string;
  details?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Quick helper to build minimal context for skill invocation
 */
export function buildQuickContext(skillId: CoachingSkillKey, raceData: any): any {
  const baseContext = {
    quickQuery: true,
    timestamp: new Date().toISOString(),
  };

  if (!raceData) return baseContext;

  switch (skillId) {
    case 'starting-line-mastery':
      return {
        ...baseContext,
        startTime: raceData.date_time || raceData.startTime,
        fleetSize: raceData.fleet_size,
        course: raceData.course,
      };

    case 'upwind-strategic-positioning':
    case 'upwind-tactical-combat':
      return {
        ...baseContext,
        windData: raceData.weather,
        course: raceData.course,
      };

    case 'downwind-speed-and-position':
      return {
        ...baseContext,
        windData: raceData.weather,
        course: raceData.course,
      };

    case 'mark-rounding-execution':
      return {
        ...baseContext,
        marks: raceData.course?.marks,
        course: raceData.course,
      };

    case 'tidal-opportunism-analyst':
      return {
        ...baseContext,
        tidalData: raceData.tidal,
        location: raceData.location,
      };

    case 'finishing-line-tactics':
      return {
        ...baseContext,
        finishLine: raceData.course?.finishLine,
        windData: raceData.weather,
        competitors: raceData.competitors,
        currentPosition: raceData.position,
      };

    default:
      return baseContext;
  }
}

/**
 * Invoke a skill using the Skills proxy or built-in definitions.
 */
export async function invokeSkill(
  skillName: CoachingSkillKey,
  context: any
): Promise<SkillAdvice> {
  const skillId = SKILL_IDS[skillName];

  if (skillId.startsWith('skill_builtin_')) {
    return getBuiltInSkillAdvice(skillName);
  }

  const prompt = buildPrompt(skillName, context);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/anthropic-skills-proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'messages',
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      skills: [
        {
          type: 'custom',
          custom_skill_id: skillId,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Edge Function error:', errorText);
    throw new Error(`Edge Function failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || 'No advice available';

  return {
    primary: content,
    confidence: 'high',
  };
}

function getBuiltInSkillAdvice(skillName: CoachingSkillKey): SkillAdvice {
  switch (skillName) {
    case 'finishing-line-tactics':
      return {
        primary: 'Approach finish on four-laylines concept - analyze wind bias for favored end',
        details:
          'Check finish line bias using the long-tack method. The downwind end is typically favored (opposite of start). Consider tactical ducking if favored end advantage exceeds 5+ boat lengths.',
        confidence: 'high',
      };

    case 'starting-line-mastery':
      return {
        primary: 'Identify favored end and plan starting position to maximize advantage',
        details:
          'Check line bias early using transit or long tack method. Aim for front row at favored end with clear air. Time your final approach to hit the line at full speed.',
        confidence: 'high',
      };

    case 'upwind-strategic-positioning':
      return {
        primary: 'Sail toward the favored side of the course based on wind shifts and current',
        details:
          'Monitor wind direction for persistent shifts. Position on lifted tack toward favored side while maintaining tactical flexibility.',
        confidence: 'high',
      };

    case 'upwind-tactical-combat':
      return {
        primary: 'Cover competitors behind you while maintaining clear air and speed',
        details:
          'Use loose cover when ahead. When behind, create separation through splits or use speed to break through in clear air.',
        confidence: 'high',
      };

    case 'downwind-speed-and-position':
      return {
        primary: 'Optimize VMG by sailing proper angles and positioning for pressure',
        details:
          'Sail by-the-lee in light air, higher angles in breeze. Hunt for pressure patches and position for favored gybe.',
        confidence: 'high',
      };

    case 'mark-rounding-execution':
      return {
        primary: 'Execute wide entry, tight exit for optimal rounding speed and position',
        details:
          'Enter wide (2-3 boat lengths) to maintain speed. Exit tight to block inside. Trim for new leg and accelerate immediately.',
        confidence: 'high',
      };

    case 'tidal-opportunism-analyst':
      return {
        primary: 'Position to leverage current advantages throughout the race',
        details:
          'Identify current direction and strength. Sail routes that minimize adverse current and maximize favorable flow. Use eddies and back eddies near shore.',
        confidence: 'high',
      };

    default:
      return {
        primary: `${skillName.replace(/-/g, ' ')} tactical advice`,
        details: 'Championship-proven racing tactics.',
        confidence: 'medium',
      };
  }
}

function buildPrompt(skillName: CoachingSkillKey, context: any): string {
  const contextSnippet = JSON.stringify(context);
  return `Provide a concise tactical tip for ${skillName.replace(/-/g, ' ')} in 2-3 sentences. Context: ${contextSnippet}`;
}
