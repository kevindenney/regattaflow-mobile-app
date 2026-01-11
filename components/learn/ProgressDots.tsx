import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressDotsProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Number of dots to display */
  dotCount?: number;
  /** Size of each dot in pixels */
  dotSize?: number;
  /** Gap between dots in pixels */
  gap?: number;
  /** Color for filled dots */
  filledColor?: string;
  /** Color for empty dots */
  emptyColor?: string;
}

/**
 * Tufte-inspired sparkline progress indicator
 * Displays progress as a row of filled/empty dots
 *
 * Example: ▪▪▪▪▫ = 80% complete (4 of 5 dots filled)
 */
export const ProgressDots: React.FC<ProgressDotsProps> = ({
  progress,
  dotCount = 5,
  dotSize = 6,
  gap = 3,
  filledColor = '#007AFF',
  emptyColor = '#E5E7EB',
}) => {
  // Calculate how many dots should be filled
  const filledDots = Math.round((progress / 100) * dotCount);

  return (
    <View style={[styles.container, { gap }]}>
      {Array.from({ length: dotCount }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: index < filledDots ? filledColor : emptyColor,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    // Base dot styles - dimensions set inline
  },
});

export default ProgressDots;
