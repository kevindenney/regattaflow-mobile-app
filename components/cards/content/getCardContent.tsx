/**
 * getCardContentComponent - Card Content Factory
 *
 * Simplified: Always returns RaceSummaryCard
 * All drill-down details are handled via DetailBottomSheet
 */

import React from 'react';

import { CardType, CardContentProps } from '../types';
import { RaceSummaryCard } from './RaceSummaryCard';

/**
 * Get the content component for a card type
 * Always returns RaceSummaryCard (single card type architecture)
 */
export function getCardContentComponent(
  _cardType: CardType
): React.ComponentType<CardContentProps> {
  return RaceSummaryCard;
}

/**
 * Render card content for a given type and props
 */
export function renderCardContent(
  _cardType: CardType,
  props: CardContentProps
): React.ReactElement {
  return <RaceSummaryCard {...props} />;
}

export default getCardContentComponent;
