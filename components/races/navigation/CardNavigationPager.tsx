/**
 * CardNavigationPager
 *
 * Shared types and re-exports for the card navigation pager.
 * Platform-specific implementations in .native.tsx and .web.tsx
 */

import { ReactElement } from 'react';
import { ViewStyle } from 'react-native';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Base race data interface
 * All race objects must have an id
 */
export interface RaceData {
  id: string;
  [key: string]: unknown;
}

/**
 * Props for CardNavigationPager component
 */
export interface CardNavigationPagerProps<T extends RaceData> {
  /** Array of race data to display */
  races: T[];
  /** Currently selected race index */
  selectedIndex?: number;
  /** Render function for each race card */
  renderCard: (race: T, index: number, isActive: boolean) => ReactElement;
  /** Callback when active card changes */
  onCardChange?: (index: number, race: T) => void;
  /** Callback when a card is pressed */
  onCardPress?: (index: number, race: T) => void;
  /** Callback when a card is long pressed */
  onCardLongPress?: (index: number, race: T) => void;
  /** Whether to show navigation indicators (dots) */
  showIndicators?: boolean;
  /** Active indicator color */
  indicatorActiveColor?: string;
  /** Inactive indicator color */
  indicatorInactiveColor?: string;
  /** Container style */
  style?: ViewStyle;
  /** Card container style */
  cardStyle?: ViewStyle;
  /** Header content to render above the pager */
  headerContent?: ReactElement;
  /** Whether haptics are enabled */
  enableHaptics?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

// The actual component is platform-specific
// React Native will automatically select:
// - CardNavigationPager.native.tsx for iOS/Android
// - CardNavigationPager.web.tsx for web

export { CardNavigationPager } from './CardNavigationPager.native';
export type { CardNavigationPagerProps, RaceData };
