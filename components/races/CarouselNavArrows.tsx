/**
 * Carousel Navigation Arrows
 *
 * Left and right arrow buttons for horizontal carousel navigation.
 * Hidden on mobile (swipe-based navigation instead).
 */

import React from 'react';
import { TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface CarouselNavArrowsProps {
  /** Whether running on mobile native platform */
  isMobileNative: boolean;
  /** Current horizontal scroll position */
  scrollX: number;
  /** Total content width of the scrollable area */
  scrollContentWidth: number;
  /** Reference to the ScrollView to control scrolling */
  scrollViewRef: React.RefObject<ScrollView>;
  /** Arrow icon color (default: #2563EB) */
  arrowColor?: string;
}

/**
 * Carousel Navigation Arrows Component
 */
export function CarouselNavArrows({
  isMobileNative,
  scrollX,
  scrollContentWidth,
  scrollViewRef,
  arrowColor = '#2563EB',
}: CarouselNavArrowsProps) {
  // Don't render on mobile - use swipe instead
  if (isMobileNative) {
    return null;
  }

  const showLeftArrow = scrollX > 10;
  const showRightArrow = scrollContentWidth > SCREEN_WIDTH && scrollX < scrollContentWidth - SCREEN_WIDTH - 10;

  const handleScrollLeft = () => {
    scrollViewRef.current?.scrollTo({
      x: Math.max(0, scrollX - SCREEN_WIDTH * 0.8),
      animated: true,
    });
  };

  const handleScrollRight = () => {
    scrollViewRef.current?.scrollTo({
      x: Math.min(scrollContentWidth - SCREEN_WIDTH, scrollX + SCREEN_WIDTH * 0.8),
      animated: true,
    });
  };

  return (
    <>
      {/* Left Arrow Button */}
      {showLeftArrow && (
        <TouchableOpacity
          onPress={handleScrollLeft}
          style={[styles.arrowButton, styles.leftArrow]}
        >
          <ChevronLeft size={32} color={arrowColor} />
        </TouchableOpacity>
      )}
      {/* Right Arrow Button */}
      {showRightArrow && (
        <TouchableOpacity
          onPress={handleScrollRight}
          style={[styles.arrowButton, styles.rightArrow]}
        >
          <ChevronRight size={32} color={arrowColor} />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  arrowButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftArrow: {
    left: 0,
    shadowOffset: { width: 2, height: 0 },
  },
  rightArrow: {
    right: 0,
    shadowOffset: { width: -2, height: 0 },
  },
});

export default CarouselNavArrows;
