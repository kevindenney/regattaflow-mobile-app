/**
 * Navigation Animation Constants
 *
 * Spring configurations and thresholds for the card navigation pager.
 * Follows Apple's iOS animation patterns with physics-based springs.
 */

import { Easing } from 'react-native-reanimated';

// =============================================================================
// SPRING CONFIGURATIONS
// =============================================================================

/**
 * Spring config for horizontal card snapping
 * Responsive but not bouncy - iOS-native feel
 */
export const SNAP_SPRING_CONFIG = {
  damping: 20,
  stiffness: 90,
  mass: 0.5,
} as const;

/**
 * Spring config for touch press feedback
 * Snappier return for responsive feel
 */
export const PRESS_SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
} as const;

/**
 * Spring config for card scale/opacity transitions
 * Smooth interpolation as cards move in/out of focus
 */
export const FOCUS_SPRING_CONFIG = {
  damping: 25,
  stiffness: 120,
  mass: 0.4,
} as const;

/**
 * Spring config for vertical detail card snapping
 * Slightly damped for vertical feel - less bouncy than horizontal
 */
export const DETAIL_SNAP_SPRING_CONFIG = {
  damping: 24,
  stiffness: 85,
  mass: 0.5,
} as const;

/**
 * Spring config for zone height animations
 * Smooth expansion/collapse without bounce
 */
export const ZONE_EXPAND_SPRING_CONFIG = {
  damping: 30,
  stiffness: 100,
  mass: 0.6,
} as const;

// =============================================================================
// TIMING CONFIGURATIONS
// =============================================================================

/**
 * Apple's default ease-out bezier curve
 * Used for detail card expansion/collapse
 */
export const APPLE_EASE_OUT = Easing.bezier(0.25, 0.1, 0.25, 1.0);

/**
 * Detail expansion timing
 */
export const DETAIL_EXPAND_DURATION = 350; // ms
export const DETAIL_COLLAPSE_DURATION = 300; // ms - slightly faster return feels responsive

/**
 * Touch feedback timing
 */
export const PRESS_FEEDBACK_DURATION = 100; // ms

// =============================================================================
// GESTURE THRESHOLDS
// =============================================================================

/**
 * Velocity threshold for triggering detail expansion
 * Higher = requires faster swipe
 */
export const VELOCITY_THRESHOLD = 500;

/**
 * Distance threshold for triggering detail expansion
 * Lower = more sensitive to small drags
 */
export const DISTANCE_THRESHOLD = 50;

/**
 * Ratio for horizontal vs vertical gesture priority
 * When abs(velocityX) > abs(velocityY) * this ratio, treat as horizontal
 */
export const GESTURE_PRIORITY_RATIO = 1.5;

/**
 * Active offset for gesture handlers
 * Prevents accidental gesture activation
 */
export const GESTURE_ACTIVE_OFFSET = 10;

/**
 * Minimum displacement before committing to gesture axis
 * Prevents accidental axis switching
 */
export const GESTURE_LOCK_DISTANCE = 15;

/**
 * Delay before allowing axis switch after gesture end
 * Prevents rapid axis switching on quick consecutive gestures
 */
export const GESTURE_UNLOCK_DELAY = 300;

// =============================================================================
// CARD DIMENSIONS
// =============================================================================

/**
 * Card width as ratio of screen width
 * 85% width with peek cards on sides
 */
export const CARD_WIDTH_RATIO = 0.85;

/**
 * Peek width as ratio of screen width
 * 7.5% visible on each side
 */
export const PEEK_WIDTH_RATIO = 0.075;

/**
 * Gap between cards in pixels
 */
export const CARD_GAP = 16;

/**
 * FlatList deceleration rate
 * "fast" (0.99) prevents drift past snap points
 */
export const DECELERATION_RATE = 0.99;

// =============================================================================
// ANIMATION VALUES
// =============================================================================

/**
 * Scale values for card states
 */
export const CARD_SCALE = {
  active: 1.0,
  inactive: 0.92,
  pressed: 0.98,
  expanded: 0.95, // Main card when detail stack is expanded
} as const;

/**
 * Opacity values for card states
 */
export const CARD_OPACITY = {
  active: 1.0,
  inactive: 0.7,
} as const;

/**
 * Scale values for detail card states
 * Less dramatic than hero cards for cleaner vertical scrolling
 */
export const DETAIL_CARD_SCALE = {
  active: 1.0,
  inactive: 0.94,
  pressed: 0.97,
} as const;

/**
 * Opacity values for detail card states
 * Higher contrast to show depth in vertical stack
 */
export const DETAIL_CARD_OPACITY = {
  active: 1.0,
  inactive: 0.5,
} as const;

/**
 * Zone heights as ratio of available height (after header)
 */
export const ZONE_HEIGHTS = {
  hero: { collapsed: 0.50, normal: 0.58, expanded: 0.70 },
  detail: { collapsed: 0.30, normal: 0.42, expanded: 0.50 },
} as const;

/**
 * Rotation values for 3D depth effect (in degrees)
 */
export const CARD_ROTATE_Y = {
  left: -2,
  center: 0,
  right: 2,
} as const;

/**
 * Parallax factor for main card during detail expansion
 * Controls how much the main card moves relative to detail cards
 */
export const DETAIL_PARALLAX_FACTOR = 0.3;

// =============================================================================
// FLATLIST PERFORMANCE
// =============================================================================

/**
 * Initial number of items to render
 * Only 3 needed: previous, current, next
 */
export const INITIAL_NUM_TO_RENDER = 3;

/**
 * Max items to render per batch
 */
export const MAX_TO_RENDER_PER_BATCH = 2;

/**
 * Window size (number of screens worth of content)
 */
export const WINDOW_SIZE = 5;

// =============================================================================
// INDICATOR DIMENSIONS
// =============================================================================

/**
 * Timeline indicator dimensions
 */
export const INDICATOR = {
  dotSize: 8,
  activePillWidth: 24,
  gap: 6,
  verticalPadding: 8,
} as const;

// =============================================================================
// DETAIL CARDS
// =============================================================================

/**
 * Detail card types in order of appearance (for upcoming races)
 */
export const DETAIL_CARD_TYPES = [
  'conditions',
  'strategy',
  'rig',
  'course',
  'fleet',
  'regulatory',
] as const;

export type DetailCardType = (typeof DETAIL_CARD_TYPES)[number];

/**
 * Detail card height as ratio of detail zone height
 * Allows peek of next card
 */
export const DETAIL_CARD_HEIGHT_RATIO = 0.85;

/**
 * Gap between detail cards in pixels
 */
export const DETAIL_CARD_GAP = 12;

/**
 * Gesture lock visual feedback duration (ms)
 * Quick acknowledgment that axis is locked
 */
export const GESTURE_LOCK_FEEDBACK_DURATION = 80;

// =============================================================================
// RACE STATUS
// =============================================================================

/**
 * Race status thresholds (in hours)
 */
export const RACE_STATUS_THRESHOLDS = {
  urgent: 2,     // Within 2 hours - red
  soon: 24,      // Within 24 hours - amber
  upcoming: 168, // Within 1 week - green
} as const;

export type RaceStatus = 'urgent' | 'soon' | 'upcoming' | 'inProgress' | 'completed';
