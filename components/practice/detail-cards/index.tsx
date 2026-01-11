/**
 * Practice Detail Cards
 *
 * Expandable cards for the practice session detail view.
 * Following Apple HIG and Tufte design principles.
 *
 * Organized around the 4Q Framework:
 * - WHAT: Focus areas + Drills (what to practice)
 * - WHO: Crew members + task assignments
 * - WHY: AI reasoning + user rationale
 * - HOW: Notes + instructions (reflection after)
 */

// Component exports
export { FocusAreaDetailCard } from './FocusAreaDetailCard';
export { DrillDetailCard } from './DrillDetailCard';
export { CrewDetailCard } from './CrewDetailCard';
export { NotesDetailCard } from './NotesDetailCard';
export { WhyDetailCard } from './WhyDetailCard';

// Import for render helper
import { FocusAreaDetailCard } from './FocusAreaDetailCard';
import { DrillDetailCard } from './DrillDetailCard';
import { CrewDetailCard } from './CrewDetailCard';
import { NotesDetailCard } from './NotesDetailCard';
import { WhyDetailCard } from './WhyDetailCard';

import type { ReactElement } from 'react';
import type {
  PracticeSession,
  PracticeFocusArea,
  PracticeSessionDrill,
  PracticeSessionMember,
  SkillArea,
} from '@/types/practice';

/**
 * Detail card types for practice sessions
 * Organized by 4Q framework: WHAT (focus, drills) | WHO (crew) | WHY (reasoning) | HOW (notes)
 */
export type PracticeDetailCardType = 'focus' | 'drills' | 'crew' | 'why' | 'notes';

/**
 * Detail card data structure
 */
export interface PracticeDetailCardData {
  type: PracticeDetailCardType;
  id: string;
  title: string;
  sessionId: string;
}

/**
 * Create detail cards for a practice session
 * Organized by 4Q Framework: WHAT → WHO → WHY → HOW
 */
export function createDetailCardsForPractice(
  session: PracticeSession
): PracticeDetailCardData[] {
  const cards: PracticeDetailCardData[] = [];

  // WHAT: Focus areas card (if any focus areas)
  if (session.focusAreas && session.focusAreas.length > 0) {
    cards.push({
      type: 'focus',
      id: `${session.id}-focus`,
      title: 'What to Practice',
      sessionId: session.id,
    });
  }

  // WHAT: Drills card (if any drills)
  if (session.drills && session.drills.length > 0) {
    cards.push({
      type: 'drills',
      id: `${session.id}-drills`,
      title: 'Drills',
      sessionId: session.id,
    });
  }

  // WHO: Crew card (always show for scheduled sessions)
  if (session.sessionType === 'scheduled') {
    cards.push({
      type: 'crew',
      id: `${session.id}-crew`,
      title: 'Who & Tasks',
      sessionId: session.id,
    });
  }

  // WHY: AI reasoning / user rationale card (if has AI suggestion or rationale)
  const hasWhyContent = session.aiReasoning || session.aiSuggested || session.aiSuggestionContext;
  if (hasWhyContent) {
    cards.push({
      type: 'why',
      id: `${session.id}-why`,
      title: 'Why This Practice',
      sessionId: session.id,
    });
  }

  // HOW: Notes card (always show - includes instructions pre-session, reflection post-session)
  cards.push({
    type: 'notes',
    id: `${session.id}-notes`,
    title: session.status === 'completed' ? 'Reflection' : 'How to Execute',
    sessionId: session.id,
  });

  return cards;
}

/**
 * Render options for practice detail cards
 */
export interface RenderPracticeDetailCardOptions {
  // Focus card options (WHAT)
  onSelectFocusArea?: (skillArea: SkillArea) => void;

  // Drill card options (WHAT)
  onStartDrill?: (drillId: string) => void;
  onCompleteDrill?: (sessionDrillId: string) => void;
  onOpenLearning?: (interactiveId: string) => void;

  // Crew card options (WHO)
  onGenerateInvite?: () => Promise<string>;
  onClearInvite?: () => void;
  onInviteMember?: () => void;
  onMarkAttendance?: (memberId: string, attended: boolean) => void;
  isOrganizer?: boolean;

  // Why card options (WHY)
  onViewRace?: (raceId: string) => void;
  linkedRaces?: Array<{ id: string; name: string; date: string }>;

  // Notes card options (HOW)
  onSaveReflection?: (notes: string, rating: number) => Promise<void>;
  onAcceptSuggestion?: () => void;

  // Card state
  isExpanded?: boolean;
  onToggle?: () => void;
}

/**
 * Render a practice detail card by type
 */
export function renderPracticeDetailCard(
  card: PracticeDetailCardData,
  session: PracticeSession,
  options?: RenderPracticeDetailCardOptions
): ReactElement | null {
  const { type, sessionId } = card;
  const { isExpanded, onToggle } = options || {};

  switch (type) {
    case 'focus':
      return (
        <FocusAreaDetailCard
          key={card.id}
          focusAreas={session.focusAreas || []}
          isExpanded={isExpanded}
          onToggle={onToggle}
          onSelectFocusArea={options?.onSelectFocusArea}
        />
      );

    case 'drills':
      return (
        <DrillDetailCard
          key={card.id}
          sessionDrills={session.drills || []}
          isExpanded={isExpanded}
          onToggle={onToggle}
          onStartDrill={options?.onStartDrill}
          onCompleteDrill={options?.onCompleteDrill}
          onOpenLearning={options?.onOpenLearning}
        />
      );

    case 'crew':
      return (
        <CrewDetailCard
          key={card.id}
          members={session.members || []}
          maxCrewSize={session.maxCrewSize || 4}
          inviteCode={session.inviteCode}
          isOrganizer={options?.isOrganizer}
          sessionStatus={session.status}
          isExpanded={isExpanded}
          onToggle={onToggle}
          onGenerateInvite={options?.onGenerateInvite}
          onClearInvite={options?.onClearInvite}
          onInviteMember={options?.onInviteMember}
          onMarkAttendance={options?.onMarkAttendance}
        />
      );

    case 'why':
      return (
        <WhyDetailCard
          key={card.id}
          aiReasoning={session.aiReasoning}
          linkedRaces={options?.linkedRaces}
          isExpanded={isExpanded}
          onToggle={onToggle}
          onViewRace={options?.onViewRace}
        />
      );

    case 'notes':
      return (
        <NotesDetailCard
          key={card.id}
          sessionStatus={session.status}
          reflectionNotes={session.reflectionNotes}
          overallRating={session.overallRating}
          isExpanded={isExpanded}
          onToggle={onToggle}
          onSaveReflection={options?.onSaveReflection}
          onAcceptSuggestion={options?.onAcceptSuggestion}
        />
      );

    default:
      return null;
  }
}
