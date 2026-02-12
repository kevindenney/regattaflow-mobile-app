/**
 * TourBackdrop — Full-screen dark overlay with a spotlight cutout
 *
 * Reads `spotlightBounds` from the FeatureTourProvider context and renders
 * four semi-transparent rects around the target area to create a spotlight
 * hole effect. Skipped for the `welcome` step (WelcomeCard has its own backdrop).
 *
 * Uses four View panels (top, bottom, left, right) around the spotlight
 * for reliable cross-platform rendering.
 */

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useFeatureTourContext, FULLSCREEN_STEPS } from '@/providers/FeatureTourProvider';

const BACKDROP_COLOR = 'rgba(15, 23, 42, 0.5)';
const SPOTLIGHT_PADDING = 10;
const SPOTLIGHT_BORDER_RADIUS = 16;

export function TourBackdrop() {
  const { isTourActive, shouldShowTour, currentStep, spotlightBounds } = useFeatureTourContext();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Don't render for fullscreen steps (they have their own backdrop) or when inactive
  if (!isTourActive || !shouldShowTour || (currentStep && (FULLSCREEN_STEPS as readonly string[]).includes(currentStep))) {
    return null;
  }

  // If no spotlight bounds yet, render a plain semi-transparent overlay
  if (!spotlightBounds) {
    return (
      <Animated.View
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(150)}
        style={styles.container}
        pointerEvents="none"
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: BACKDROP_COLOR }]} />
      </Animated.View>
    );
  }

  // Calculate spotlight rect with padding
  const sx = Math.max(0, spotlightBounds.x - SPOTLIGHT_PADDING);
  const sy = Math.max(0, spotlightBounds.y - SPOTLIGHT_PADDING);
  const sw = spotlightBounds.width + SPOTLIGHT_PADDING * 2;
  const sh = spotlightBounds.height + SPOTLIGHT_PADDING * 2;

  // Four rects around the spotlight to create the cutout:
  // Top: full width, from top to spotlight top
  // Bottom: full width, from spotlight bottom to screen bottom
  // Left: from spotlight top to spotlight bottom, from left edge to spotlight left
  // Right: from spotlight top to spotlight bottom, from spotlight right to right edge

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(150)}
      style={styles.container}
      pointerEvents="none"
    >
      {/* Top panel */}
      {sy > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: sy,
            backgroundColor: BACKDROP_COLOR,
          }}
        />
      )}

      {/* Bottom panel */}
      {sy + sh < screenHeight && (
        <View
          style={{
            position: 'absolute',
            top: sy + sh,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: BACKDROP_COLOR,
          }}
        />
      )}

      {/* Left panel */}
      {sx > 0 && (
        <View
          style={{
            position: 'absolute',
            top: sy,
            left: 0,
            width: sx,
            height: sh,
            backgroundColor: BACKDROP_COLOR,
          }}
        />
      )}

      {/* Right panel */}
      {sx + sw < screenWidth && (
        <View
          style={{
            position: 'absolute',
            top: sy,
            left: sx + sw,
            right: 0,
            height: sh,
            backgroundColor: BACKDROP_COLOR,
          }}
        />
      )}

      {/* Spotlight border ring for emphasis */}
      <View
        style={{
          position: 'absolute',
          top: sy,
          left: sx,
          width: sw,
          height: sh,
          borderRadius: SPOTLIGHT_BORDER_RADIUS,
          borderWidth: 2,
          borderColor: 'rgba(59, 130, 246, 0.5)',
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
});
