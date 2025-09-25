import { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

const defaultBreakpoints: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

export function useResponsive(breakpoints: ResponsiveBreakpoints = defaultBreakpoints) {
  const { width } = useWindowDimensions();

  const [screenType, setScreenType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  useEffect(() => {
    if (width >= breakpoints.desktop) {
      setScreenType('desktop');
    } else if (width >= breakpoints.tablet) {
      setScreenType('tablet');
    } else {
      setScreenType('mobile');
    }
  }, [width, breakpoints]);

  return {
    width,
    isMobile: screenType === 'mobile',
    isTablet: screenType === 'tablet',
    isDesktop: screenType === 'desktop',
    screenType,
    breakpoints: {
      isMobileUp: width >= 0,
      isTabletUp: width >= breakpoints.tablet,
      isDesktopUp: width >= breakpoints.desktop,
      isMobileOnly: width < breakpoints.tablet,
      isTabletOnly: width >= breakpoints.tablet && width < breakpoints.desktop,
    }
  };
}

// Utility function for responsive styles
export function responsiveStyle<T>(
  styles: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
  },
  screenType: 'mobile' | 'tablet' | 'desktop'
): T | undefined {
  return styles[screenType] || styles.mobile;
}