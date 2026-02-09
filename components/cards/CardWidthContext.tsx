/**
 * CardWidthContext - Provides card width to nested tile components
 *
 * Used for responsive tile layouts that need to know the card's width
 * to calculate how many tiles fit per row (Apple Weather-style reflow).
 */

import React, { createContext, useContext } from 'react';

interface CardWidthContextValue {
  /** Current card width in pixels */
  cardWidth: number;
}

/**
 * Default card width (phone-sized fallback)
 * 335px = 86% of 390px iPhone screen
 */
const DEFAULT_CARD_WIDTH = 335;

export const CardWidthContext = createContext<CardWidthContextValue>({
  cardWidth: DEFAULT_CARD_WIDTH,
});

/**
 * Hook to access the current card width
 * Returns the card width from context, or default if not provided
 */
export function useCardWidth(): CardWidthContextValue {
  return useContext(CardWidthContext);
}

export default CardWidthContext;
