/**
 * Plan Card AI Analysis Service
 *
 * Generates AI summaries for completed Plan Cards by analyzing:
 *  - What/Who/Why/How planning data
 *  - Captured evidence (media, activity log)
 *  - Review/reflection content
 *
 * Interest-aware: uses the current interest's vocabulary and context
 * to generate relevant, domain-specific summaries.
 */

import { createLogger } from '@/lib/utils/logger';
import type { PlanCard } from '@/types/planCard';
import type { InterestEventConfig } from '@/types/interestEventConfig';

const logger = createLogger('planCardAnalysis');

// =============================================================================
// TYPES
// =============================================================================

export interface PlanCardAnalysisResult {
  /** AI-generated summary of the activity */
  summary: string;
  /** Key insights extracted */
  insights: string[];
  /** Suggested next steps */
  nextSteps: string[];
  /** Competencies potentially demonstrated */
  suggestedCompetencies?: string[];
  /** Confidence score 0-100 */
  confidence: number;
}

export interface PlanCardAnalysisInput {
  planCard: PlanCard;
  interestConfig: InterestEventConfig;
}

// =============================================================================
// PROMPT BUILDING
// =============================================================================

/**
 * Build the AI prompt for analyzing a plan card.
 * Interest-aware: incorporates the interest's vocabulary and analysis context.
 */
export function buildPlanCardAnalysisPrompt(input: PlanCardAnalysisInput): string {
  const { planCard, interestConfig } = input;
  const { what, who, why, how, capture, review } = planCard;

  const interestContext = `Interest: ${interestConfig.interestSlug} (${interestConfig.eventNoun})`;
  const phaseLabels = interestConfig.phaseLabels;

  const sections: string[] = [
    `# Plan Card Analysis Request`,
    ``,
    `${interestContext}`,
    ``,
    `## What (Activity Definition)`,
    `- Title: ${what.title}`,
    what.description ? `- Description: ${what.description}` : '',
    what.date ? `- Date: ${what.date}` : '',
    what.location ? `- Location: ${what.location}` : '',
    what.notes ? `- Notes: ${what.notes}` : '',
    ``,
    `## Who (People Involved)`,
    who.people.length > 0
      ? who.people.map((p) => `- ${p.name}${p.role ? ` (${p.role})` : ''}`).join('\n')
      : '- Solo activity',
    ``,
    `## Why (Objectives & Motivation)`,
    why.objectives.length > 0
      ? why.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')
      : '- No objectives specified',
    why.motivation ? `- Motivation: ${why.motivation}` : '',
    ``,
    `## How (Execution Plan)`,
    how.steps.length > 0
      ? how.steps.map((s, i) => `${i + 1}. ${s.text}${s.completed ? ' ✓' : ''}`).join('\n')
      : '- No steps planned',
    how.materials.length > 0 ? `- Materials: ${how.materials.join(', ')}` : '',
    how.timeline ? `- Timeline: ${how.timeline}` : '',
    ``,
    `## Evidence Captured`,
    `- Media items: ${capture.media.length}`,
    `- Activity log entries: ${capture.activityLog.length}`,
    capture.activityLog.length > 0
      ? capture.activityLog.map((e) => `  - ${e.action}`).join('\n')
      : '',
    ``,
    `## Self-Reflection`,
    review.whatHappened ? `- What happened: ${review.whatHappened}` : '',
    review.whatLearned ? `- What learned: ${review.whatLearned}` : '',
    review.whatsNext ? `- What's next: ${review.whatsNext}` : '',
    review.rating ? `- Self-rating: ${review.rating}/5` : '',
    ``,
    `## Instructions`,
    `Provide a concise analysis with:`,
    `1. A 2-3 sentence summary of the activity and outcomes`,
    `2. 2-3 key insights from the experience`,
    `3. 2-3 actionable next steps`,
    `4. Any competencies or skills that appear to have been practiced`,
    ``,
    `Use vocabulary appropriate for the ${interestConfig.interestSlug} domain.`,
    `Phase context: ${phaseLabels.days_before.full} → ${phaseLabels.on_water.full} → ${phaseLabels.after_race.full}`,
  ];

  return sections.filter(Boolean).join('\n');
}

// =============================================================================
// SERVICE
// =============================================================================

/**
 * Generate an AI analysis for a completed plan card.
 *
 * NOTE: This is a service interface. The actual AI call uses the ClaudeClient
 * or equivalent service configured in the app. This function builds the prompt
 * and parses the response.
 */
export async function analyzePlanCard(
  input: PlanCardAnalysisInput,
): Promise<PlanCardAnalysisResult> {
  logger.debug('[analyzePlanCard] Building prompt for plan:', input.planCard.id);

  const prompt = buildPlanCardAnalysisPrompt(input);

  // TODO: Connect to actual AI service (ClaudeClient or EnhancedClaudeClient)
  // For now, return a structured placeholder based on the plan card data
  const { planCard } = input;
  const completedSteps = planCard.how.steps.filter((s) => s.completed).length;
  const totalSteps = planCard.how.steps.length;

  const summary = [
    planCard.what.title,
    planCard.review.whatHappened
      ? `The activity covered: ${planCard.review.whatHappened.substring(0, 100)}.`
      : 'Activity completed.',
    totalSteps > 0
      ? `${completedSteps} of ${totalSteps} planned steps were completed.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const insights = planCard.review.whatLearned
    ? [planCard.review.whatLearned]
    : ['Reflection data will improve with more detailed notes.'];

  const nextSteps = planCard.review.whatsNext
    ? [planCard.review.whatsNext]
    : ['Continue building on this experience.'];

  logger.debug('[analyzePlanCard] Analysis generated for plan:', input.planCard.id);

  return {
    summary,
    insights,
    nextSteps,
    confidence: 40, // Low confidence for placeholder response
  };
}

/**
 * Check if a plan card has enough content to generate a meaningful AI analysis.
 */
export function isPlanCardAnalyzable(planCard: PlanCard): boolean {
  const hasWhat = !!planCard.what.title;
  const hasCapture = planCard.capture.media.length > 0 || planCard.capture.activityLog.length > 0;
  const hasReview =
    !!planCard.review.whatHappened ||
    !!planCard.review.whatLearned ||
    !!planCard.review.whatsNext;

  // Need at least a title plus either capture data or review content
  return hasWhat && (hasCapture || hasReview);
}
