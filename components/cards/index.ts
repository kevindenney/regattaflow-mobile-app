/**
 * Card Navigation System - Public Exports
 *
 * Horizontal race timeline with single RaceSummaryCard per race.
 * All drill-down details handled via DetailBottomSheet.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  CardType,
  CardPosition,
  CardDimensions,
  CardGridState,
  GestureAxis,
  CardRaceData,
  CardShellProps,
  CardGridProps,
  CardContentProps,
  CardNavigationPersistedState,
  UseAxisLockReturn,
  UseCardGridReturn,
  UseCardPersistenceReturn,
} from './types';

export { CARD_TYPES, CARD_COUNT, CARD_TYPE_LABELS } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

export {
  // Re-exported from navigationAnimations
  SNAP_SPRING_CONFIG,
  DETAIL_SNAP_SPRING_CONFIG,
  PRESS_SPRING_CONFIG,
  FOCUS_SPRING_CONFIG,
  VELOCITY_THRESHOLD,
  GESTURE_ACTIVE_OFFSET,
  GESTURE_LOCK_DISTANCE,
  GESTURE_UNLOCK_DELAY,
  DECELERATION_RATE,
  CARD_SCALE,
  CARD_OPACITY,
  CARD_WIDTH_RATIO,
  PEEK_WIDTH_RATIO,
  INITIAL_NUM_TO_RENDER,
  MAX_TO_RENDER_PER_BATCH,
  WINDOW_SIZE,
  // Tufte Design System
  TUFTE_BACKGROUND,
  TUFTE_BACKGROUND_SECONDARY,
  TUFTE_TEXT,
  CARD_SHADOW_DRAMATIC,
  CARD_SHADOW_DRAMATIC_WEB,
  CARD_SHADOW_DRAMATIC_EXPANDED,
  CARD_SHADOW_DRAMATIC_EXPANDED_WEB,
  // Card-specific
  CARD_HEIGHT_RATIO,
  VERTICAL_PEEK_RATIO,
  CARD_BORDER_RADIUS,
  HORIZONTAL_CARD_GAP,
  VERTICAL_CARD_GAP,
  CARD_SHADOW,
  CARD_SHADOW_PRESSED,
  SNAP_DISTANCE_THRESHOLD,
  AXIS_PRIORITY_RATIO,
  VERTICAL_CARD_SCALE,
  VERTICAL_CARD_OPACITY,
  CARD_ROTATE_Y,
  PERSISTENCE_KEY,
  PERSISTENCE_DEBOUNCE,
  // Helpers
  getScreenDimensions,
  calculateCardDimensions,
  // Flags
  DEBUG_CARD_NAVIGATION,
  ENABLE_HAPTICS,
  ENABLE_PERSISTENCE,
} from './constants';

// =============================================================================
// COMPONENTS
// =============================================================================

export { CardShell } from './CardShell';
export { CardGrid } from './CardGrid';
export { CardGridTimeline } from './CardGridTimeline';

// =============================================================================
// HOOKS
// =============================================================================

export { useAxisLock, useCardGrid } from './hooks';

// =============================================================================
// CONTENT COMPONENTS
// =============================================================================

export { RaceSummaryCard, getCardContentComponent } from './content';
