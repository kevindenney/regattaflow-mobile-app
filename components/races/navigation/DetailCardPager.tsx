/**
 * DetailCardPager
 *
 * Shared types and re-exports for the vertical detail card pager.
 * Platform-specific implementations in .native.tsx and .web.tsx
 */

import { ReactElement } from 'react';
import { ViewStyle } from 'react-native';

import { DetailCardType } from '@/constants/navigationAnimations';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Base detail card data interface
 */
export interface DetailCardData {
  type: DetailCardType;
  id: string;
  title: string;
  [key: string]: unknown;
}

/**
 * Props for DetailCardPager component
 */
export interface DetailCardPagerProps {
  /** Array of detail cards to display */
  cards?: DetailCardData[];
  /** Height of the detail zone */
  zoneHeight: number;
  /** Currently selected card index */
  selectedIndex?: number;
  /** Render function for each detail card */
  renderCard: (card: DetailCardData, index: number, isActive: boolean) => ReactElement;
  /** Callback when active card changes */
  onCardChange?: (index: number, cardType: DetailCardType) => void;
  /** Callback when a card is pressed */
  onCardPress?: (index: number, card: DetailCardData) => void;
  /** Whether to show navigation indicators */
  showIndicators?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Card container style */
  cardStyle?: ViewStyle;
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
// - DetailCardPager.native.tsx for iOS/Android
// - DetailCardPager.web.tsx for web

export { DetailCardPager } from './DetailCardPager.native';
export type { DetailCardPagerProps, DetailCardData };
