/**
 * SFSymbolIcon
 *
 * A cross-platform icon component that renders native SF Symbols on iOS
 * and falls back to Ionicons on Android/web.
 *
 * Usage:
 * ```tsx
 * <SFSymbolIcon
 *   name="person.badge.plus"
 *   fallback="person-add-outline"
 *   size={20}
 *   color="#007AFF"
 * />
 * ```
 */

import React from 'react';
import { Platform } from 'react-native';
import { SymbolView, type SymbolWeight } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import type { SFSymbol } from 'sf-symbols-typescript';

export interface SFSymbolIconProps {
  /** SF Symbol name (e.g. 'person.badge.plus') */
  name: string;
  /** Ionicon name for Android/web fallback (e.g. 'person-add-outline') */
  fallback: string;
  /** Icon size in pixels (default: 20) */
  size?: number;
  /** Icon color */
  color?: string;
  /** SF Symbol weight (iOS only) */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

/**
 * Renders native SF Symbols on iOS with Ionicon fallbacks on other platforms.
 */
export function SFSymbolIcon({
  name,
  fallback,
  size = 20,
  color,
  weight = 'regular',
}: SFSymbolIconProps) {
  // Use SF Symbols on iOS only
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={name as SFSymbol}
        size={size}
        tintColor={color}
        weight={weight as SymbolWeight}
        resizeMode="scaleAspectFit"
        fallback={<Ionicons name={fallback as any} size={size} color={color} />}
      />
    );
  }

  // Fallback to Ionicons on Android/web
  return <Ionicons name={fallback as any} size={size} color={color} />;
}

export default SFSymbolIcon;
