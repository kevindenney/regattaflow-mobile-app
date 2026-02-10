/**
 * Contextual Hints — Hint ID constants and configuration
 *
 * Replaces the old 5-step modal product tour with lightweight,
 * non-blocking hints that appear contextually as users explore the app.
 */

export const HINT_IDS = {
  // Races tab
  RACES_ADD_BUTTON: 'races_add_button',
  RACES_SWIPE_CARDS: 'races_swipe_cards',
  RACES_PREP_SECTION: 'races_prep_section',

  // Community/Discuss tab
  COMMUNITY_FIRST_VISIT: 'community_first_visit',

  // Learn tab
  LEARN_FIRST_VISIT: 'learn_first_visit',

  // Reflect tab
  REFLECT_FIRST_VISIT: 'reflect_first_visit',

  // Deferred onboarding prompts
  BOAT_CLASS_PROMPT: 'boat_class_prompt',
  CLUB_SELECTION_PROMPT: 'club_selection_prompt',
} as const;

export type HintId = (typeof HINT_IDS)[keyof typeof HINT_IDS];

/**
 * Default priority for each hint (lower number = higher priority).
 * When multiple hints are requested simultaneously, the lowest priority
 * number wins.
 */
export const HINT_DEFAULT_PRIORITIES: Partial<Record<HintId, number>> = {
  [HINT_IDS.RACES_ADD_BUTTON]: 1,
  [HINT_IDS.COMMUNITY_FIRST_VISIT]: 2,
  [HINT_IDS.LEARN_FIRST_VISIT]: 2,
  [HINT_IDS.REFLECT_FIRST_VISIT]: 2,
  [HINT_IDS.BOAT_CLASS_PROMPT]: 4,
  [HINT_IDS.RACES_SWIPE_CARDS]: 5,
  [HINT_IDS.RACES_PREP_SECTION]: 6,
  [HINT_IDS.CLUB_SELECTION_PROMPT]: 7,
};
