/**
 * useIOSColors Hook
 *
 * Returns iOS system colors based on the current color scheme (light/dark).
 * Uses React Native's useColorScheme to detect system preference.
 */

import { useColorScheme } from 'react-native';
import { IOS_COLORS, IOS_COLORS_DARK } from '@/lib/design-tokens-ios';

/**
 * Hook to get iOS colors based on current color scheme
 * @returns The appropriate color palette for light or dark mode
 */
export function useIOSColors() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? IOS_COLORS_DARK : IOS_COLORS;
}

/**
 * Hook to get the current color scheme
 * @returns 'light' | 'dark'
 */
export function useColorMode(): 'light' | 'dark' {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

/**
 * Hook to check if dark mode is active
 * @returns boolean
 */
export function useIsDarkMode(): boolean {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark';
}

export default useIOSColors;
