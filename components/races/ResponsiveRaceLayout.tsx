/**
 * Responsive Race Layout Component
 * Handles layout adaptation based on device orientation and type
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { View, Dimensions, Platform, StyleSheet, Text } from 'react-native';
import type { RaceMode } from './RaceModeSelector';

export type DeviceOrientation = 'portrait' | 'landscape';
export type DeviceType = 'phone' | 'tablet' | 'desktop';

interface ResponsiveRaceLayoutProps {
  mode: RaceMode;
  orientation?: DeviceOrientation;
  deviceType?: DeviceType;
  children: ReactNode;
}

interface LayoutContext {
  mode: RaceMode;
  orientation: DeviceOrientation;
  deviceType: DeviceType;
  screenWidth: number;
  screenHeight: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Detect device orientation from dimensions
 */
function detectOrientation(width: number, height: number): DeviceOrientation {
  return width < height ? 'portrait' : 'landscape';
}

/**
 * Detect device type from screen dimensions
 */
function detectDeviceType(width: number, height: number): DeviceType {
  const smallerDimension = Math.min(width, height);

  if (Platform.OS === 'web' && width > 1024) {
    return 'desktop';
  }

  if (smallerDimension >= 600) {
    return 'tablet';
  }

  return 'phone';
}

/**
 * Context provider for responsive layout information
 */
export const LayoutContext = React.createContext<LayoutContext>({
  mode: 'plan',
  orientation: 'portrait',
  deviceType: 'phone',
  screenWidth: 375,
  screenHeight: 667,
  isPortrait: true,
  isLandscape: false,
  isPhone: true,
  isTablet: false,
  isDesktop: false,
});

/**
 * Hook to access layout context
 */
export function useLayoutContext(): LayoutContext {
  return React.useContext(LayoutContext);
}

/**
 * Responsive layout wrapper component
 */
export function ResponsiveRaceLayout({
  mode,
  orientation: overrideOrientation,
  deviceType: overrideDeviceType,
  children,
}: ResponsiveRaceLayoutProps) {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Update dimensions on window resize
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Detect orientation and device type
  const orientation =
    overrideOrientation ||
    detectOrientation(dimensions.width, dimensions.height);

  const deviceType =
    overrideDeviceType ||
    detectDeviceType(dimensions.width, dimensions.height);

  // Build layout context
  const layoutContext: LayoutContext = {
    mode,
    orientation,
    deviceType,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isPhone: deviceType === 'phone',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  };

  // Select layout style based on context
  const containerStyle = getContainerStyle(layoutContext);

  return (
    <LayoutContext.Provider value={layoutContext}>
      <View style={[styles.container, containerStyle]}>
        {React.Children.map(children, (child, index) => {
          if (typeof child === 'string' || typeof child === 'number') {
            return (
              <Text key={`child-text-${index}`}>
                {child}
              </Text>
            );
          }
          return child;
        })}
      </View>
    </LayoutContext.Provider>
  );
}

/**
 * Get container style based on layout context
 */
function getContainerStyle(context: LayoutContext) {
  const { mode, isLandscape, isTablet, isDesktop } = context;

  // PLAN mode layouts
  if (mode === 'plan') {
    if (isDesktop) {
      return styles.desktopContainer;
    }
    if (isTablet && isLandscape) {
      return styles.tabletLandscapeContainer;
    }
    return styles.defaultContainer;
  }

  // RACE mode layouts (optimized for on-water use)
  if (mode === 'race') {
    if (isLandscape) {
      return styles.raceLandscapeContainer;
    }
    return styles.racePortraitContainer;
  }

  // DEBRIEF mode layouts
  if (mode === 'debrief') {
    if (isTablet && isLandscape) {
      return styles.tabletLandscapeContainer;
    }
    return styles.defaultContainer;
  }

  return styles.defaultContainer;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  defaultContainer: {
    // Single column, vertical scroll
    flexDirection: 'column',
  },
  tabletLandscapeContainer: {
    // Two-column layout for tablet landscape
    flexDirection: 'row',
  },
  desktopContainer: {
    // Three-column layout for desktop
    flexDirection: 'row',
    maxWidth: 1440,
    alignSelf: 'center',
    width: '100%',
  },
  racePortraitContainer: {
    // Minimalist vertical layout for racing
    flexDirection: 'column',
  },
  raceLandscapeContainer: {
    // Side-by-side: Map + AI/Info for racing
    flexDirection: 'row',
  },
});

/**
 * Helper component for responsive column layouts
 */
interface ResponsiveColumnProps {
  flex?: number;
  children: ReactNode;
}

export function ResponsiveColumn({ flex = 1, children }: ResponsiveColumnProps) {
  const { isTablet, isDesktop, isLandscape } = useLayoutContext();

  const showColumn = isTablet || isDesktop;
  const shouldWrap = !isLandscape && !isDesktop;

  if (!showColumn || shouldWrap) {
    return <>{children}</>;
  }

  return <View style={{ flex }}>{children}</View>;
}
