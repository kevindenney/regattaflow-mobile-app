/**
 * Platform-specific CardGrid component type declaration.
 * Actual implementations are in CardGrid.web.tsx and CardGrid.native.tsx.
 */
import React from 'react';
import { CardGridProps } from './types';

export const CardGrid: React.MemoExoticComponent<React.FC<CardGridProps>>;
export default CardGrid;
