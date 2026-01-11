/**
 * Timeline Indicators
 *
 * DEPRECATED: This component now returns null.
 *
 * The season header already shows "Winter 25-26 · Race 10 of 13"
 * which provides all the temporal context needed. Keeping this
 * timeline indicator would be redundant chartjunk (Tufte).
 *
 * The swipe affordance is provided by the card carousel peek.
 */

import React from 'react';

export interface TimelineRace {
  id: string;
}

export interface TimelineIndicatorsProps {
  /** Array of races with IDs */
  races: TimelineRace[];
  /** Currently selected race ID */
  selectedId: string | null;
  /** Index of the next upcoming race (defines temporal boundary) */
  nextRaceIndex?: number;
  // Legacy props kept for compatibility
  onSelect?: (id: string, index: number) => void;
  snapInterval?: number;
  scrollViewRef?: React.RefObject<any>;
  activeColor?: string;
  scrollIndexOffset?: number;
  nextRaceColor?: string;
}

/**
 * Timeline Indicators Component
 *
 * Returns null - the season header provides all temporal context.
 * Keeping the interface for backward compatibility.
 */
export function TimelineIndicators(_props: TimelineIndicatorsProps) {
  // Season header shows "Winter 25-26 · Race 10 of 13"
  // This would be redundant
  return null;
}

export default TimelineIndicators;
