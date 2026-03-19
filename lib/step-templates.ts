/**
 * Step Templates — pre-built plans with sub-steps and capability goals
 * that users can select when creating a new timeline step.
 */

export interface StepTemplate {
  id: string;
  name: string;
  description: string;
  /** null = universal (shown for every interest) */
  interestSlug: string | null;
  what: string;
  subSteps: string[];
  capabilityGoals: string[];
}

export const STEP_TEMPLATES: StepTemplate[] = [];

/**
 * Return templates that match the given interest slug, plus all universal ones.
 * If slug is undefined/null, only universal templates are returned.
 */
export function getTemplatesForInterest(slug?: string | null): StepTemplate[] {
  return STEP_TEMPLATES.filter(
    (t) => t.interestSlug === null || (slug && t.interestSlug === slug),
  );
}
