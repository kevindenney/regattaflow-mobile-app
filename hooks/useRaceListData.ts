/**
 * useRaceListData Hook
 *
 * Computes derived race list data including:
 * - Past race IDs for result fetching
 * - Normalized live races with metadata merged
 * - Safe recent races (enriched > live > fallback)
 * - Next race calculation from timeline
 * - Preview text for header display
 */

import { useMemo } from 'react';
import { getDemoRaceStartDateISO, getDemoRaceStartTimeLabel } from '@/lib/demo/demoDate';
import type { VocabularyMap } from '@/lib/vocabulary';

// =============================================================================
// TYPES
// =============================================================================

export interface LiveRace {
  id?: string;
  start_date?: string;
  date?: string;
  startTime?: string;
  warning_signal_time?: string;
  venue?: string;
  wind?: unknown;
  tide?: unknown;
  weatherStatus?: string;
  weatherError?: string;
  strategy?: unknown;
  critical_details?: unknown;
  isDemo?: boolean;
  metadata?: {
    venue_name?: string;
    wind?: unknown;
    tide?: unknown;
    weatherStatus?: string;
    weatherError?: string;
    strategy?: unknown;
    critical_details?: unknown;
  };
}

// =============================================================================
// DEMO RACE (shown when user has no races)
// =============================================================================

/**
 * Demo race shown in CardGrid when user has no real races.
 * Allows users to explore the UI before adding their first race.
 *
 * Note: No `created_by` field, so delete/edit menu won't appear.
 */
export const DEMO_RACE: LiveRace = {
  id: 'demo-race',
  start_date: getDemoRaceStartDateISO(7, 11, 0),
  date: getDemoRaceStartDateISO(7, 11, 0),
  startTime: getDemoRaceStartTimeLabel(11, 0),
  venue: 'Your Local Yacht Club',
  isDemo: true,
  metadata: {
    venue_name: 'Your Local Yacht Club',
  },
};

/** Interest-aware demo data venue and name overrides */
const DEMO_VENUE_BY_INTEREST: Record<string, string> = {
  'sail-racing': 'Your Local Yacht Club',
  nursing: 'Johns Hopkins Hospital',
  drawing: 'Your Studio',
  design: 'Your Design Studio',
  fitness: 'Your Local Gym',
  'health-and-fitness': 'Your Local Gym',
  knitting: 'Your Craft Space',
  'self-mastery': 'Home Office',
  'global-health': 'Community Health Center',
  golf: 'Your Local Golf Club',
  'dragon-class': 'Your Local Yacht Club',
};

/** Returns a demo event with interest-appropriate venue and name */
export function getDemoEvent(interestSlug: string, eventNoun: string): LiveRace {
  const venue = DEMO_VENUE_BY_INTEREST[interestSlug] ?? 'Your Local Venue';
  return {
    ...DEMO_RACE,
    name: `Sample ${eventNoun}`,
    venue,
    metadata: { venue_name: venue },
  };
}

/** Interest-aware demo timeline steps (shown when user has no steps) */
interface DemoStepData {
  title: string;
  what: string;
  how: { text: string; completed: boolean }[];
  why: string;
  where: string;
  venue: string;
  goals: string[];
  /** Notes shown on the Clinical (on_water) tab */
  clinicalNotes?: string;
  /** Reflection shown on the Debrief (after_race) tab */
  debriefReflection?: string;
  /** Act phase: session notes */
  actNotes?: string;
  /** Review phase data */
  review?: {
    overall_rating?: number;
    what_learned?: string;
    next_step_notes?: string;
    capability_progress?: Record<string, number>;
  };
}

const DEMO_STEPS_BY_INTEREST: Record<string, { done: DemoStepData; todo: DemoStepData }> = {
  'health-and-fitness': {
    done: {
      title: 'Upper Body Strength + Core',
      what: 'Completed upper body and core workout. Hit a new PR on bench press at 185 lbs. Core circuit felt solid — planks are getting easier so I should increase the hold times. Need to stretch shoulders more post-workout, they feel tight.',
      how: [
        { text: 'Bench press: 4x8 at working weight', completed: true },
        { text: 'Overhead press: 3x10', completed: true },
        { text: 'Pull-ups: 3 sets to failure', completed: true },
        { text: 'Core circuit: plank, Russian twists, leg raises', completed: false },
      ],
      why: 'Building toward a 200 lb bench press goal by end of month. Core strength supports better form on all compound lifts.',
      where: 'Your Local Gym',
      venue: 'Your Local Gym',
      goals: ['Upper body strength', 'Core stability', 'Progressive overload'],
      actNotes: 'Bench press felt strong — hit 185x8 on the last set without a spotter. Overhead press was tough on set 3, had to drop to 95 lbs. Pull-ups: 12, 10, 8 — grip gave out before lats did. Skipped the last set of leg raises, ran out of time. Shoulders felt tight during cooldown, spent extra 5 min on band pull-aparts.',
      review: {
        overall_rating: 4,
        what_learned: 'The new warm-up protocol (band pull-aparts + face pulls) made a real difference on bench press. Grip is the limiting factor on pull-ups — should add farmer carries on leg day.',
        next_step_notes: 'Try 190 lbs on bench next session. Add grip work to accessory days. Increase plank hold to 90 seconds.',
        capability_progress: { 'Upper body strength': 75, 'Core stability': 60, 'Progressive overload': 70 },
      },
    },
    todo: {
      title: 'Long Run + Mobility',
      what: 'Easy-paced 6-mile run followed by 20-minute mobility routine. Focus on keeping heart rate in Zone 2 for aerobic base building. Hip flexor stretches are priority after last week\'s tightness.',
      how: [
        { text: 'Dynamic warm-up: 10 minutes', completed: false },
        { text: '6-mile run at conversational pace (Zone 2)', completed: false },
        { text: 'Hip flexor and hamstring stretches', completed: false },
        { text: 'Foam roll quads and IT band', completed: false },
      ],
      why: 'Aerobic base is the foundation for the half marathon in 8 weeks. Mobility work prevents the hip issues that sidelined me last month.',
      where: 'Neighborhood Trail Loop',
      venue: 'Your Local Gym',
      goals: ['Aerobic endurance', 'Mobility', 'Injury prevention'],
    },
  },
  knitting: {
    done: {
      title: 'Cable Knit Scarf - Rows 40-60',
      what: 'Finished 20 rows of the cable pattern on the merino wool scarf. The C6F cables are looking much more even now. Tension was off at the start but improved after row 45. Need to pick up a cable needle — been using a DPN and it keeps slipping.',
      how: [
        { text: 'Complete rows 40-50 of cable pattern', completed: true },
        { text: 'Check gauge against pattern swatch', completed: true },
        { text: 'Complete rows 50-60', completed: true },
        { text: 'Block and photograph progress', completed: false },
      ],
      why: 'This scarf is a birthday gift — deadline is in 3 weeks. Getting cable tension consistent is the skill I\'m building this project.',
      where: 'Home',
      venue: 'Your Craft Space',
      goals: ['Cable technique', 'Tension consistency', 'Finishing projects'],
      actNotes: 'Rows 40-45 were rough — kept losing count on the C6F cross. Switched to counting out loud and that helped. By row 50 the rhythm was back. Gauge check at row 52 showed I\'m slightly tight compared to the swatch, so I loosened up half a needle size worth of tension. The cable crossings from row 50 onward look noticeably more even. Didn\'t get to blocking — will do that before the next session.',
      review: {
        overall_rating: 4,
        what_learned: 'Counting cable crosses out loud sounds silly but works. The slight tension difference between first and second half of the session is visible — need to warm up with a few practice rows on scrap yarn before jumping into the project piece.',
        next_step_notes: 'Buy a proper cable needle before the Fair Isle hat project. Block the scarf section and photograph for Ravelry. Start planning the decreases for the scarf ends.',
        capability_progress: { 'Cable technique': 70, 'Tension consistency': 55, 'Finishing projects': 40 },
      },
    },
    todo: {
      title: 'Start Fair Isle Hat',
      what: 'Cast on and begin the colorwork section of the Fair Isle beanie pattern. Using worsted weight in navy and cream. Need to practice holding two yarns — trying the one-in-each-hand method this time.',
      how: [
        { text: 'Wind yarn and organize colorwork bobbins', completed: false },
        { text: 'Cast on 96 stitches on circular needles', completed: false },
        { text: 'Knit 1.5 inches of ribbing (K2P2)', completed: false },
        { text: 'Begin Fair Isle chart — rows 1-10', completed: false },
      ],
      why: 'Fair Isle is the next skill level up from cables. Learning to manage tension across two colors will unlock more complex patterns.',
      where: 'Home',
      venue: 'Your Craft Space',
      goals: ['Colorwork technique', 'Two-handed knitting', 'Pattern reading'],
    },
  },
  drawing: {
    done: {
      title: 'Charcoal Portrait Study',
      what: 'Spent 90 minutes on a charcoal portrait from a reference photo. Proportions are getting better — the eye placement was accurate this time. Struggled with the nose shadow transition. Need to practice blending with a tortillon more.',
      how: [
        { text: 'Block in basic head proportions (15 min)', completed: true },
        { text: 'Map shadow shapes with vine charcoal', completed: true },
        { text: 'Build up values with compressed charcoal', completed: true },
        { text: 'Refine details: eyes, nose, mouth', completed: false },
      ],
      why: 'Portrait accuracy is my weakest area. Doing one study per week to build the skill before the figure drawing workshop next month.',
      where: 'Home Studio',
      venue: 'Your Studio',
      goals: ['Proportional accuracy', 'Value control', 'Charcoal technique'],
      actNotes: 'Started with the Loomis method for head construction — got the oval and center line down in 5 min. Eye line placement was spot on this time. Spent most of the session on the shadow mapping — the nose cast shadow was the hardest part. Used a kneaded eraser to pull out highlights on the forehead and that helped with the 3D effect. Ran out of time before finishing mouth details. The compressed charcoal is messy but gives much richer darks than vine.',
      review: {
        overall_rating: 3,
        what_learned: 'The Loomis method is finally becoming intuitive for basic proportions. Shadow shapes are more important than details — blocking them in early made everything else easier. The nose shadow issue is a value transition problem, not a drawing accuracy problem.',
        next_step_notes: 'Do 3 quick nose studies before the next full portrait. Practice tortillon blending on scrap paper. Try the Bargue plate method for the next portrait to work on precise value matching.',
        capability_progress: { 'Proportional accuracy': 65, 'Value control': 45, 'Charcoal technique': 55 },
      },
    },
    todo: {
      title: 'Perspective Street Scene',
      what: 'Two-point perspective drawing of a street scene from observation. Set up at the cafe on Main St and draw for 1 hour. Focus on converging lines and scale of figures in space.',
      how: [
        { text: 'Establish horizon line and vanishing points', completed: false },
        { text: 'Block in major architectural forms', completed: false },
        { text: 'Add figures at correct scale', completed: false },
        { text: 'Detail windows, signage, and texture', completed: false },
      ],
      why: 'Perspective from observation (not photos) builds spatial reasoning that transfers to all drawing. The cafe scene gives good depth variety.',
      where: 'Main Street Cafe',
      venue: 'Your Studio',
      goals: ['Perspective accuracy', 'Observational drawing', 'Spatial reasoning'],
    },
  },
  design: {
    done: {
      title: 'Mobile App Onboarding Flow - V2',
      what: 'Redesigned the 4-screen onboarding flow based on user testing feedback. Simplified the value prop screen, added progressive disclosure to permissions, and replaced the carousel with a step indicator. Figma prototype is ready for eng review.',
      how: [
        { text: 'Audit user testing recordings for drop-off points', completed: true },
        { text: 'Sketch 3 alternative layouts for value prop screen', completed: true },
        { text: 'Build high-fidelity screens in Figma', completed: true },
        { text: 'Create interactive prototype for eng handoff', completed: false },
      ],
      why: 'Onboarding completion rate dropped to 62% after the last release. Product wants it back above 80% before the next sprint.',
      where: 'Design Studio',
      venue: 'Your Design Studio',
      goals: ['User retention', 'Information hierarchy', 'Interaction design'],
      actNotes: 'User testing recordings showed 3 clear drop-off points: value prop screen (too much text), permissions screen (all-at-once felt invasive), and the final CTA (unclear what happens next). Sketched a simplified value prop with illustration + single sentence. Progressive disclosure for permissions tested well in the prototype — camera permission on photo upload, not upfront. Step indicator replaces the confusing dot carousel.',
      review: {
        overall_rating: 4,
        what_learned: 'Progressive disclosure is always the answer for permissions. Users don\'t mind granting access when the context is clear. The step indicator gave users a sense of progress that the carousel didn\'t — completion rates jumped in the prototype test.',
        next_step_notes: 'Finish the interactive prototype transitions. Schedule eng review for Thursday. Prepare the design spec with redlines and edge cases (error states, slow network).',
        capability_progress: { 'User retention': 70, 'Information hierarchy': 80, 'Interaction design': 65 },
      },
    },
    todo: {
      title: 'Design System Token Audit',
      what: 'Audit all color, spacing, and typography tokens in the design system. Compare Figma tokens against the codebase and flag inconsistencies. Create a reconciliation document for the platform team.',
      how: [
        { text: 'Export current Figma token list', completed: false },
        { text: 'Pull codebase token definitions', completed: false },
        { text: 'Map discrepancies in a comparison table', completed: false },
        { text: 'Propose unified token naming convention', completed: false },
      ],
      why: 'Design-eng drift is causing visual inconsistencies across platforms. Token audit is prerequisite for the dark mode initiative next quarter.',
      where: 'Design Studio',
      venue: 'Your Design Studio',
      goals: ['Design system governance', 'Cross-platform consistency', 'Token architecture'],
    },
  },
  'sail-racing': {
    done: {
      title: 'Wednesday Night Race',
      what: 'Good start at the pin end, but lost position on the second upwind leg. Wind shifted right and I was late to tack. Boat speed felt good in 12 knots. Need to work on reading persistent shifts vs oscillating shifts.',
      how: [
        { text: 'Pre-race: check wind direction and tide', completed: true },
        { text: 'Nail the start — pin end in current', completed: true },
        { text: 'Upwind: stay in phase with shifts', completed: false },
        { text: 'Post-race: debrief with crew', completed: true },
      ],
      why: 'Weekly racing is the best way to sharpen tactical skills. Wind shift recognition is the #1 area to improve based on last month\'s results.',
      where: 'Your Local Yacht Club',
      venue: 'Your Local Yacht Club',
      goals: ['Start execution', 'Wind shift tactics', 'Boat speed'],
      actNotes: 'Start was clean — crossed the line at the pin with good speed and clear air. First beat was solid, rounded the windward mark in 3rd. Second beat: wind shifted right about 10 degrees and I stayed on port too long. Lost 2 boats. Downwind legs were fine — gybed at the right time. Finished 5th of 18. Boat speed in the puffs felt fast but I need to be more aggressive with the traveler in lulls.',
      review: {
        overall_rating: 3,
        what_learned: 'Need to watch the compass more on the second beat. The shift was gradual and persistent — I was treating it like an oscillating shift and waiting for it to come back. Should have tacked immediately when the compass read 10° off the median.',
        next_step_notes: 'Practice shift recognition drills on the water before next race. Review wind data from the race to identify the shift pattern. Ask Tom how he reads persistent vs oscillating shifts.',
        capability_progress: { 'Start execution': 80, 'Wind shift tactics': 45, 'Boat speed': 70 },
      },
    },
    todo: {
      title: 'Practice Start Sequences',
      what: 'Run 10 practice starts with focus on timing, acceleration, and line sight. Use the club start line with a partner boat. Video from the bow for review afterwards.',
      how: [
        { text: 'Set up start line with club marks', completed: false },
        { text: 'Practice 5 pin-end approaches', completed: false },
        { text: 'Practice 5 boat-end approaches', completed: false },
        { text: 'Review bow camera footage', completed: false },
      ],
      why: 'Start execution is worth 2-3 positions in our fleet. Dedicated practice without race pressure lets me experiment with timing.',
      where: 'Your Local Yacht Club',
      venue: 'Your Local Yacht Club',
      goals: ['Start timing', 'Acceleration technique', 'Line sight'],
    },
  },
  'self-mastery': {
    done: {
      title: 'Morning Routine Review - Week 3',
      what: 'Reviewed how the morning routine has been going. Meditation streak is at 21 days. Journaling is inconsistent — only 4 of 7 days. The cold shower experiment is working well for energy but need to move it before meditation, not after.',
      how: [
        { text: 'Review habit tracker for the week', completed: true },
        { text: 'Identify which habits stuck and which didn\'t', completed: true },
        { text: 'Adjust routine order based on energy flow', completed: true },
        { text: 'Set specific trigger for journaling habit', completed: false },
      ],
      why: 'The morning routine sets the tone for deep work blocks. Week 3 is when habits either solidify or fade — this review is critical.',
      where: 'Home Office',
      venue: 'Home Office',
      goals: ['Habit formation', 'Self-awareness', 'Routine optimization'],
      actNotes: 'Reviewed the habit tracker spreadsheet. Meditation: 7/7 days. Journaling: 4/7 — missed Tues, Thurs, Sat. Cold shower: 6/7. Reading: 5/7. Pattern: journaling drops on days with early meetings because I rush the routine. Cold shower before meditation (new order) gave me noticeably better focus during sits. The "habit stacking" from Atomic Habits is working — shower → meditate → journal flows naturally.',
      review: {
        overall_rating: 4,
        what_learned: 'Habit stacking works better than time-based triggers. The journaling failure isn\'t about motivation — it\'s about the routine being fragile when compressed. Need a "short version" for busy mornings (3 bullet points instead of full page).',
        next_step_notes: 'Create a "5-minute journal" template for busy mornings. Move the deep work block earlier — the morning routine energy is peaking around 9am but my first block doesn\'t start until 10. Test the 2-minute rule for journaling on rushed days.',
        capability_progress: { 'Habit formation': 75, 'Self-awareness': 65, 'Routine optimization': 60 },
      },
    },
    todo: {
      title: 'Deep Work Block Planning',
      what: 'Design next week\'s deep work schedule. Block 3 x 90-minute sessions for the writing project. Identify and eliminate top 3 distraction sources. Set up environment cues (desk clear, phone in drawer, focus playlist).',
      how: [
        { text: 'Audit last week\'s time log for distraction patterns', completed: false },
        { text: 'Block 3 deep work sessions in calendar', completed: false },
        { text: 'Prepare environment: desk, phone, music', completed: false },
        { text: 'Define specific output goals for each session', completed: false },
      ],
      why: 'Deep work capacity is the highest-leverage skill for the writing project. Moving from reactive to proactive scheduling is the current growth edge.',
      where: 'Home Office',
      venue: 'Home Office',
      goals: ['Deep work capacity', 'Distraction management', 'Intentional scheduling'],
    },
  },
  'global-health': {
    done: {
      title: 'Community Health Assessment',
      what: 'Completed the door-to-door health assessment survey in the Eastside neighborhood. Collected 34 responses covering nutrition access, preventive care utilization, and environmental health concerns. Water quality was the top concern raised.',
      how: [
        { text: 'Prepare survey materials and consent forms', completed: true },
        { text: 'Conduct 30+ household interviews', completed: true },
        { text: 'Log GPS coordinates of surveyed households', completed: true },
        { text: 'Enter data into REDCap database', completed: false },
      ],
      why: 'This assessment feeds into the county health department\'s annual report and determines resource allocation for the next fiscal year.',
      where: 'Eastside Community Center',
      venue: 'Community Health Center',
      goals: ['Data collection', 'Community engagement', 'Health equity assessment'],
      actNotes: 'Covered 34 households in 4 hours with Maria from the community liaison team. The Spanish-language consent forms worked well — about 60% of respondents preferred Spanish. Water quality concerns were mentioned in 22 of 34 interviews. Three families reported children with recurring GI symptoms. One respondent offered to host a community meeting about water testing. GPS logging went smoothly with the new app — much faster than paper maps.',
      review: {
        overall_rating: 4,
        what_learned: 'Having a community member (Maria) with me dramatically increased response rates and trust. The structured interview format worked but I need to leave more space for open-ended follow-up — some of the best data came from unprompted comments. The GI symptom cluster around 3rd and Oak warrants follow-up.',
        next_step_notes: 'Enter remaining data into REDCap by Friday. Flag the GI symptom cluster for the epi team. Follow up with the resident who offered to host a community meeting. Draft preliminary findings memo for Dr. Patel.',
        capability_progress: { 'Data collection': 80, 'Community engagement': 70, 'Health equity assessment': 55 },
      },
    },
    todo: {
      title: 'Prepare Intervention Proposal',
      what: 'Draft a proposal for a community water testing program based on assessment findings. Include budget, timeline, partnership with local university lab, and community volunteer recruitment plan.',
      how: [
        { text: 'Analyze assessment data for water quality concerns', completed: false },
        { text: 'Research comparable water testing programs', completed: false },
        { text: 'Draft budget and partnership proposal', completed: false },
        { text: 'Create community outreach plan for volunteers', completed: false },
      ],
      why: 'Assessment data showed water quality is the #1 community health concern. A proactive testing program could identify risks before they become crises.',
      where: 'Community Health Center',
      venue: 'Community Health Center',
      goals: ['Program design', 'Evidence-based intervention', 'Community partnership'],
    },
  },
  golf: {
    done: {
      title: '9-Hole Practice Round',
      what: 'Played the back 9 at the local course. Shot 42 (+6). Driver was straight but short — averaging 220 off the tee. Iron play was solid, GIR on 5 of 9. Three-putted twice on fast greens. Need to spend more time on lag putting.',
      how: [
        { text: 'Warm up: range session focusing on tempo', completed: true },
        { text: 'Play 9 holes tracking fairways, GIR, putts', completed: true },
        { text: 'Note trouble spots for future practice', completed: true },
        { text: 'Post-round: 15 min putting green practice', completed: false },
      ],
      why: 'Playing rounds surfaces weaknesses that range sessions miss. Tracking stats over time shows where practice time should go.',
      where: 'Your Local Golf Club',
      venue: 'Your Local Golf Club',
      goals: ['Course management', 'Scoring improvement', 'Statistical tracking'],
      actNotes: 'Back 9 stats: 5/9 fairways, 5/9 GIR, 19 putts (3 three-putts). Hole 14 was the best — stuck the approach to 6 feet and made the birdie putt. Hole 16 was the worst — pushed the drive right into the trees, took a penalty drop, and double-bogeyed. The three-putts were all from 30+ feet — leaving the first putt 6-8 feet short consistently. Tempo felt good on the range but rushed on the course, especially on the tee.',
      review: {
        overall_rating: 3,
        what_learned: 'Lag putting is clearly the biggest scoring opportunity — 3 three-putts cost me 3 strokes. The short irons are reliable but my distance control with long irons is inconsistent. The course management on 16 was bad — should have hit 3-wood instead of driver on a tight hole.',
        next_step_notes: 'Schedule a dedicated lag putting session this week. Practice the 30-40 foot distance with the Pelz ladder drill. On the course: commit to 3-wood on holes under 380 yards with trouble.',
        capability_progress: { 'Course management': 50, 'Scoring improvement': 55, 'Statistical tracking': 75 },
      },
    },
    todo: {
      title: 'Short Game Drill Session',
      what: 'Dedicated short game practice: chipping, pitching, and lag putting. Use the Dave Pelz clock drill for distance control. Focus on 30-50 yard pitch shots — that\'s where the most strokes are being lost.',
      how: [
        { text: 'Chipping: 20 min landing zone drill', completed: false },
        { text: 'Pitching: 30-50 yard distance control (clock drill)', completed: false },
        { text: 'Lag putting: 30-40 foot distance control', completed: false },
        { text: 'Pressure test: up-and-down from 5 spots', completed: false },
      ],
      why: 'Short game accounts for 65% of strokes. Lag putting alone cost 4 strokes in the last round. Highest ROI practice area right now.',
      where: 'Your Local Golf Club',
      venue: 'Your Local Golf Club',
      goals: ['Short game proficiency', 'Distance control', 'Scoring zone'],
    },
  },
  'dragon-class': {
    done: {
      title: 'Wednesday Twilight Race',
      what: 'Raced in 15 knots with the full crew. Good communication on the foredeck during the spinnaker hoist. Lost time on the leeward mark rounding — need tighter coordination between helm and bow. Finished 4th of 12.',
      how: [
        { text: 'Pre-race crew briefing on mark rounding plan', completed: true },
        { text: 'Execute clean spinnaker hoist at weather mark', completed: true },
        { text: 'Practice tight leeward mark rounding', completed: false },
        { text: 'Post-race debrief with crew', completed: true },
      ],
      why: 'Dragon class racing demands precise crew coordination. Twilight races are low-pressure opportunities to practice maneuvers we\'d hesitate to try in regattas.',
      where: 'Your Local Yacht Club',
      venue: 'Your Local Yacht Club',
      goals: ['Crew coordination', 'Mark rounding', 'Spinnaker handling'],
      actNotes: 'Pre-race briefing covered the new leeward mark rounding sequence: bow calls "3 lengths", helm bears away, mid trims kite, bow drops pole and calls "2 lengths" for the douse. Spinnaker hoist at the weather mark was the best yet — up and filling in under 8 seconds. Leeward mark was messy though — communication broke down when the kite wrapped around the forestay. Lost 2 boat lengths to the boat behind. Finished 4th of 12, which is consistent but we need to break into top 3.',
      review: {
        overall_rating: 3,
        what_learned: 'The spinnaker hoist is dialed — the new sequence with the pre-feed works. The leeward mark issue isn\'t crew timing, it\'s the kite douse trigger point. We\'re starting too late. Need to start the douse at 4 lengths, not 3.',
        next_step_notes: 'Practice the leeward mark douse at 4-length trigger in the next practice session. Film from the stern to review the timing. Ask the crew on "Dragonfire" how they manage their douse — they\'re consistently clean.',
        capability_progress: { 'Crew coordination': 65, 'Mark rounding': 45, 'Spinnaker handling': 70 },
      },
    },
    todo: {
      title: 'Crew Coordination Practice',
      what: 'Non-racing practice session focused on mark roundings and sail changes. Run 8-10 practice roundings with the crew, varying wind angles. Video the foredeck work for review.',
      how: [
        { text: 'Set up a practice windward-leeward course', completed: false },
        { text: 'Run 5 windward mark roundings with spinnaker hoist', completed: false },
        { text: 'Run 5 leeward mark roundings with spinnaker drop', completed: false },
        { text: 'Review GoPro footage and debrief', completed: false },
      ],
      why: 'Mark roundings are where we lose the most positions. Dedicated practice without race pressure lets us slow down and get the choreography right.',
      where: 'Your Local Yacht Club',
      venue: 'Your Local Yacht Club',
      goals: ['Mark rounding speed', 'Crew choreography', 'Spinnaker technique'],
    },
  },
  nursing: {
    done: {
      title: 'Post-Clinical Reflection: Med-Surg Week 3',
      what: 'Assisted with wound dressing change on post-op patient. Need to review sterile technique steps — felt unsure about the order. Also practiced reading IV pump settings. Ask preceptor about heparin drip calculations next shift. Overall feeling more confident with patient communication but charting still takes too long.',
      how: [
        { text: 'Review sterile technique steps from textbook', completed: true },
        { text: 'Practice IV pump rate calculations', completed: true },
        { text: 'Ask preceptor about heparin drip protocols', completed: false },
        { text: 'Work on charting speed — aim for 15 min/patient', completed: false },
      ],
      why: 'Med-surg rotation ends in 2 weeks — need to solidify wound care skills before moving to gerontology. Charting efficiency directly affects patient safety during handoffs.',
      where: 'Johns Hopkins Hospital, 4th Floor Med-Surg Unit',
      venue: 'Johns Hopkins Hospital',
      goals: ['Sterile technique', 'IV management', 'Clinical documentation'],
      clinicalNotes: 'Patient was 68yo male, POD 2 after hip replacement. Wound site clean, no signs of infection. Practiced sterile field setup — dropped one gauze pad (non-sterile) and had to restart. Preceptor showed me the "open outward" technique for dressing kits. IV pump was set at 125 mL/hr NS, practiced calculating drip rate manually. Patient was anxious about PT starting tomorrow — spent 10 min talking through what to expect.',
      debriefReflection: 'Biggest win: patient said I made them feel less nervous about surgery recovery. Biggest gap: sterile technique still shaky — need to practice the open-outward method at home with practice kit. Time management: charting took 25 min for one patient, need to get this under 15. Will ask Sarah (3rd year) how she templates her notes.',
      actNotes: 'Patient was 68yo male, POD 2 after hip replacement. Wound site clean, no signs of infection. Practiced sterile field setup — dropped one gauze pad (non-sterile) and had to restart. Preceptor showed me the "open outward" technique for dressing kits. IV pump was set at 125 mL/hr NS, practiced calculating drip rate manually. Patient was anxious about PT starting tomorrow — spent 10 min talking through what to expect.',
      review: {
        overall_rating: 3,
        what_learned: 'Patient communication is becoming a strength — the 10 minutes I spent with the anxious patient made a real difference. Sterile technique needs dedicated practice outside clinical. The "open outward" method is much more reliable than my previous approach.',
        next_step_notes: 'Practice sterile field setup at home with the practice kit (aim for 5 clean setups in a row). Ask Sarah about her charting templates. Review heparin drip calculation formulas before next shift.',
        capability_progress: { 'Sterile technique': 40, 'IV management': 55, 'Clinical documentation': 35 },
      },
    },
    todo: {
      title: 'Prepare for Gerontology Clinical Rotation',
      what: 'Review age-related pharmacokinetics changes, fall risk assessment tools (Morse scale), and polypharmacy management. Print out care plan template. Check clinical site orientation requirements — need updated TB test results.',
      how: [
        { text: 'Read Ch. 12-14 in gerontology textbook', completed: false },
        { text: 'Practice Morse Fall Scale scoring on case studies', completed: false },
        { text: 'Print blank care plan template', completed: false },
        { text: 'Verify TB test is current — schedule if needed', completed: false },
        { text: 'Complete clinical site orientation checklist', completed: false },
      ],
      why: 'Gerontology rotation starts next Monday. Fall risk assessment is the #1 skill the preceptor evaluates in week 1. Polypharmacy review builds on pharmacology course material.',
      where: 'Johns Hopkins School of Nursing, Simulation Lab',
      venue: 'Johns Hopkins School of Nursing',
      goals: ['Fall risk assessment', 'Polypharmacy management', 'Care planning'],
      clinicalNotes: '',
      debriefReflection: '',
    },
  },
};

/** Returns two demo timeline step cards for interests that support them */
export function getDemoTimelineSteps(interestSlug: string): CardRaceData[] | null {
  const steps = DEMO_STEPS_BY_INTEREST[interestSlug];
  if (!steps) return null;

  const now = new Date();
  const pastDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const futureDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();

  const buildMetadata = (s: DemoStepData) => ({
    brain_dump: { raw_text: s.what },
    plan: {
      what_will_you_do: s.what,
      how_sub_steps: s.how.map((h, i) => ({
        id: `demo-sub-${i}`,
        text: h.text,
        sort_order: i,
        completed: h.completed,
      })),
      why_reasoning: s.why,
      where_location: { name: s.where },
      capability_goals: s.goals,
    },
    clinical_notes: s.clinicalNotes || undefined,
    debrief_reflection: s.debriefReflection || undefined,
    ...(s.actNotes ? {
      act: {
        notes: s.actNotes,
        sub_step_progress: Object.fromEntries(
          s.how.map((h, i) => [`demo-sub-${i}`, h.completed]),
        ),
      },
    } : {}),
    ...(s.review ? {
      review: {
        overall_rating: s.review.overall_rating,
        what_learned: s.review.what_learned,
        next_step_notes: s.review.next_step_notes,
        capability_progress: s.review.capability_progress,
      },
    } : {}),
  });

  return [
    {
      id: 'demo-step-done',
      name: steps.done.title,
      venue: steps.done.venue,
      date: pastDate,
      isDemo: true,
      isTimelineStep: true,
      status: 'completed',
      stepStatus: 'completed',
      metadata: buildMetadata(steps.done),
    } as any,
    {
      id: 'demo-step-todo',
      name: steps.todo.title,
      venue: steps.todo.venue,
      date: futureDate,
      isDemo: true,
      isTimelineStep: true,
      status: 'scheduled',
      stepStatus: 'pending',
      metadata: buildMetadata(steps.todo),
    } as any,
  ];
}

export interface UseRaceListDataParams {
  /** Live races from real-time subscription */
  liveRaces: LiveRace[] | null | undefined;
  /** Enriched races with weather data */
  enrichedRaces: LiveRace[] | null | undefined;
  /** Recent races from dashboard data (fallback) */
  recentRaces: unknown;
}

export interface UseRaceListDataReturn {
  /** IDs of past races for result fetching */
  pastRaceIds: string[];
  /** Live races with metadata merged into top-level fields */
  normalizedLiveRaces: LiveRace[];
  /** Safe recent races (prioritizes enriched > live > fallback) */
  safeRecentRaces: LiveRace[];
  /** Next upcoming race from timeline */
  safeNextRace: LiveRace;
  /** Preview text for header (e.g., "Today", "Tomorrow", "in 3 days") */
  nextRacePreview: string | null;
  /** Whether there are real (non-demo) races */
  hasRealRaces: boolean;
  /** Most recent race (first in list) */
  recentRace: LiveRace | null;
}

/**
 * Hook for computing race list derived data
 */
export function useRaceListData({
  liveRaces,
  enrichedRaces,
  recentRaces,
}: UseRaceListDataParams): UseRaceListDataReturn {
  // Get past race IDs for fetching results
  const pastRaceIds = useMemo((): string[] => {
    const now = new Date();
    return (liveRaces || [])
      .filter((race) => {
        const raceDate = new Date(race.start_date || race.date || '');
        return raceDate < now;
      })
      .map((race) => race.id)
      .filter((id): id is string => Boolean(id));
  }, [liveRaces]);

  // Normalize live races with metadata merged
  const normalizedLiveRaces = useMemo((): LiveRace[] => {
    if (!liveRaces || liveRaces.length === 0) {
      return [];
    }

    return liveRaces.map((regatta) => {
      const metadata = regatta?.metadata ?? {};
      // Extract time from start_date using UTC to match how Edit Form stores/reads it
      const derivedStartTime =
        regatta?.startTime ??
        regatta?.warning_signal_time ??
        (regatta?.start_date
          ? (() => {
              const d = new Date(regatta.start_date);
              const hours = d.getUTCHours().toString().padStart(2, '0');
              const minutes = d.getUTCMinutes().toString().padStart(2, '0');
              return `${hours}:${minutes}`;
            })()
          : undefined);

      return {
        ...regatta,
        venue: regatta?.venue ?? metadata?.venue_name ?? 'Venue TBD',
        date: regatta?.date ?? regatta?.start_date,
        startTime: derivedStartTime,
        wind: regatta?.wind ?? metadata?.wind,
        tide: regatta?.tide ?? metadata?.tide,
        weatherStatus: regatta?.weatherStatus ?? metadata?.weatherStatus,
        weatherError: regatta?.weatherError ?? metadata?.weatherError,
        strategy: regatta?.strategy ?? metadata?.strategy,
        critical_details: regatta?.critical_details ?? metadata?.critical_details,
      };
    });
  }, [liveRaces]);

  // Safe recent races - prioritize enriched > live > fallback
  const safeRecentRaces = useMemo((): LiveRace[] => {
    if (enrichedRaces && enrichedRaces.length > 0) {
      return enrichedRaces;
    }
    if (normalizedLiveRaces.length > 0) {
      return normalizedLiveRaces;
    }
    return Array.isArray(recentRaces) ? (recentRaces as LiveRace[]) : [];
  }, [enrichedRaces, normalizedLiveRaces, recentRaces]);

  // Calculate next race from timeline
  const safeNextRace = useMemo((): LiveRace => {
    if (safeRecentRaces.length === 0) return {};

    const now = new Date();
    const nextRaceIndex = safeRecentRaces.findIndex((race) => {
      // Timeline steps use explicit status — a pending step is always "next" regardless of date
      if ((race as any).isTimelineStep) {
        return (race as any).stepStatus !== 'completed';
      }
      const raceDateTime = new Date(race.date || race.start_date || '');
      // Race is "upcoming" if estimated end time (start + 3 hours) is still in the future
      const raceEndEstimate = new Date(raceDateTime.getTime() + 3 * 60 * 60 * 1000);
      return raceEndEstimate > now;
    });

    return nextRaceIndex >= 0 ? safeRecentRaces[nextRaceIndex] : {};
  }, [safeRecentRaces]);

  // Calculate next race preview text for header
  const nextRacePreview = useMemo((): string | null => {
    if (!safeNextRace?.date) return null;
    const daysUntil = Math.ceil(
      (new Date(safeNextRace.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil > 0 && daysUntil <= 7) return `in ${daysUntil} days`;
    return null;
  }, [safeNextRace?.date]);

  // Derived values
  const recentRace = safeRecentRaces.length > 0 ? safeRecentRaces[0] : null;
  const hasRealRaces = safeRecentRaces.length > 0 || !!safeNextRace?.id;

  return {
    pastRaceIds,
    normalizedLiveRaces,
    safeRecentRaces,
    safeNextRace,
    nextRacePreview,
    hasRealRaces,
    recentRace,
  };
}

export default useRaceListData;
