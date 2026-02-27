/**
 * Suggestion Generator — Background job to trigger cross-interest AI suggestions.
 *
 * Call this after a user completes an event in any interest to check if
 * new cross-interest suggestions should be generated for their other interests.
 *
 * Designed to be called from:
 * - Event completion handlers (after race debrief, shift reflection, etc.)
 * - Interest switching (when user opens a different interest)
 * - Periodic background refresh (daily cron via Supabase Edge Function)
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import {
  generateAndSaveSuggestions,
} from './crossInterestSuggestions';
import type {
  UserInterestActivity,
  ActivitySummary,
} from './crossInterestSuggestions';
import type { InterestSlug } from '@/lib/skillTaxonomy';

const logger = createLogger('suggestionGenerator');

// =============================================================================
// TYPES
// =============================================================================

interface InterestRecord {
  id: string;
  slug: string;
}

interface UserInterestPreference {
  interest_id: string;
  interests: InterestRecord;
}

interface RecentEventRow {
  id: string;
  race_type: string | null;
  title: string | null;
  created_at: string;
}

// =============================================================================
// ACTIVITY COLLECTION
// =============================================================================

/**
 * Collect recent activity across all of a user's enrolled interests.
 */
async function collectUserActivity(
  userId: string,
): Promise<UserInterestActivity[]> {
  // Get user's enrolled interests
  const { data: interestPrefs, error: prefsError } = await supabase
    .from('betterat_interest_members')
    .select('interest_id, interests:interest_id(id, slug)')
    .eq('user_id', userId);

  if (prefsError || !interestPrefs) {
    logger.error('[collectUserActivity] Could not fetch interests:', prefsError);
    return [];
  }

  const activities: UserInterestActivity[] = [];

  for (const pref of interestPrefs as unknown as UserInterestPreference[]) {
    const interest = pref.interests;
    if (!interest?.slug) continue;

    // Get recent events for this interest (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: events } = await supabase
      .from('timer_sessions')
      .select('id, race_type, title, created_at')
      .eq('user_id', userId)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Also check plan cards
    const { data: planCards } = await supabase
      .from('betterat_plan_cards')
      .select('id, status, plan_data, created_at')
      .eq('user_id', userId)
      .eq('interest_id', interest.id)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    const recentEvents: ActivitySummary[] = [];

    // Map timer sessions to activity summaries
    if (events) {
      for (const event of events as unknown as RecentEventRow[]) {
        recentEvents.push({
          eventId: event.id,
          eventType: event.race_type ?? 'event',
          title: event.title ?? 'Untitled event',
          date: event.created_at,
          skillsUsed: extractSkillsFromEvent(event),
        });
      }
    }

    // Map plan cards to activity summaries
    if (planCards) {
      for (const card of planCards) {
        const planData = card.plan_data as Record<string, unknown> | null;
        const whatData = planData?.what as Record<string, string> | null;
        recentEvents.push({
          eventId: card.id,
          eventType: 'plan',
          title: whatData?.title ?? 'Plan card',
          date: card.created_at,
          skillsUsed: extractSkillsFromPlanCard(planData),
        });
      }
    }

    if (recentEvents.length > 0) {
      activities.push({
        interestId: interest.id,
        interestSlug: interest.slug as InterestSlug,
        recentEvents,
        activeSkills: extractActiveSkills(recentEvents),
      });
    }
  }

  return activities;
}

/**
 * Extract skills practiced from a timer session event.
 */
function extractSkillsFromEvent(event: RecentEventRow): string[] {
  const skills: string[] = [];
  const eventType = event.race_type ?? 'event';

  // Map event types to general skill indicators
  if (eventType === 'race' || eventType === 'fleet') {
    skills.push('race_upwind', 'race_downwind', 'race_start', 'race_tactical_decisions');
  } else if (eventType === 'drill') {
    skills.push('drill_starting', 'boat_handling_drills');
  } else if (eventType === 'clinical_shift' || eventType === 'shift') {
    skills.push('shift_assessment', 'medication_admin', 'patient_education', 'shift_handoff');
  } else if (eventType === 'simulation') {
    skills.push('simulation_code_blue', 'shift_emergency');
  } else if (eventType === 'skills_lab') {
    skills.push('skills_lab', 'clinical_practice');
  } else if (eventType === 'drawing_session' || eventType === 'session') {
    skills.push('life_drawing', 'plein_air', 'composition_analysis');
  } else if (eventType === 'gesture' || eventType === 'study_sketch') {
    skills.push('gesture_drawing', 'study_sketch');
  } else if (eventType === 'technique_drill') {
    skills.push('technique_drill', 'rendering_practice');
  } else if (eventType === 'strength' || eventType === 'workout') {
    skills.push('form_practice', 'technique_work', 'load_management');
  } else if (eventType === 'hiit') {
    skills.push('hiit', 'interval_training', 'sport_conditioning');
  } else if (eventType === 'cardio') {
    skills.push('endurance_training', 'long_workout');
  } else if (eventType === 'competition') {
    skills.push('competition_day', 'multi_event_performance');
  }

  return skills;
}

/**
 * Extract skills from a plan card's data.
 */
function extractSkillsFromPlanCard(
  planData: Record<string, unknown> | null,
): string[] {
  if (!planData) return ['preparation'];

  const skills: string[] = ['preparation'];

  // Check why tab for competency links
  const whyData = planData.why as Record<string, unknown> | null;
  if (whyData?.objectives && Array.isArray(whyData.objectives) && whyData.objectives.length > 0) {
    skills.push('learning_goal_setting');
  }

  // Check capture tab for evidence collection
  const captureData = planData.capture as Record<string, unknown> | null;
  if (captureData?.media && Array.isArray(captureData.media) && captureData.media.length > 0) {
    skills.push('evidence_capture');
  }

  // Check review tab for reflection
  const reviewData = planData.review as Record<string, unknown> | null;
  if (reviewData?.whatLearned) {
    skills.push('post_shift_journal', 'self_assessment');
  }

  return skills;
}

/**
 * Deduplicate and merge skills from all recent events.
 */
function extractActiveSkills(events: ActivitySummary[]): string[] {
  const allSkills = new Set<string>();
  for (const event of events) {
    for (const skill of event.skillsUsed) {
      allSkills.add(skill);
    }
  }
  return Array.from(allSkills);
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Run the suggestion generation pipeline for a user after they complete an event.
 *
 * This collects activity across all interests and generates suggestions
 * for each interest the user is enrolled in (except the source).
 */
export async function onEventCompleted(
  userId: string,
  completedInterestId: string,
): Promise<void> {
  try {
    logger.info('[onEventCompleted] Generating suggestions for user ' + userId + ' after event in interest ' + completedInterestId);

    const activities = await collectUserActivity(userId);

    if (activities.length < 2) {
      logger.info('[onEventCompleted] User has activity in fewer than 2 interests, skipping.');
      return;
    }

    // Generate suggestions for each OTHER interest
    for (const activity of activities) {
      if (activity.interestId === completedInterestId) continue;

      await generateAndSaveSuggestions(
        userId,
        activity.interestId,
        activity.interestSlug,
        activities.filter((a) => a.interestId !== activity.interestId),
      );
    }

    logger.info('[onEventCompleted] Suggestion generation complete.');
  } catch (err) {
    logger.error('[onEventCompleted] Error:', err);
    // Non-critical — don't throw
  }
}

/**
 * Run suggestion generation when a user switches to a new interest.
 * Lighter-weight: only generates for the target interest.
 */
export async function onInterestSwitch(
  userId: string,
  targetInterestId: string,
  targetInterestSlug: InterestSlug,
): Promise<void> {
  try {
    const activities = await collectUserActivity(userId);

    if (activities.length < 2) return;

    const otherActivities = activities.filter(
      (a) => a.interestId !== targetInterestId,
    );

    if (otherActivities.length === 0) return;

    await generateAndSaveSuggestions(
      userId,
      targetInterestId,
      targetInterestSlug,
      otherActivities,
    );
  } catch (err) {
    logger.error('[onInterestSwitch] Error:', err);
  }
}
