/**
 * Embedded Interactive Demo Component
 * Wraps interactive learning components for display in landing page phone mockups
 * 
 * Features:
 * - Scales component to fit phone mockup dimensions
 * - Auto-resets on completion
 * - Play-only mode (no save/navigation)
 * - Performance optimized (lazy loading, viewport detection)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { StartingSequenceInteractive } from '@/components/learn/interactives/StartingSequenceInteractive';

interface EmbeddedInteractiveDemoProps {
  /**
   * Width of the phone mockup screen (after frame padding)
   * Default: 296px (320px frame - 24px padding)
   */
  screenWidth?: number;
  /**
   * Height of the phone mockup screen (after frame padding)
   * Default: 616px (640px frame - 24px padding)
   */
  screenHeight?: number;
  /**
   * Whether to auto-reset when complete
   * Default: true
   */
  autoReset?: boolean;
  /**
   * Delay before reset (ms)
   * Default: 3000
   */
  resetDelay?: number;
  /**
   * Whether to auto-play on mount
   * Default: false (user must interact)
   */
  autoPlay?: boolean;
  /**
   * Component to render
   * Default: StartingSequenceInteractive
   */
  component?: 'StartingSequence' | 'LineBias' | 'TimedRun';
}

// Scale factor: component is designed for ~800px width, we need ~296px
const ORIGINAL_WIDTH = 800;
const ORIGINAL_HEIGHT = 600; // Approximate full component height

export function EmbeddedInteractiveDemo({
  screenWidth = 296,
  screenHeight = 616,
  autoReset = true,
  resetDelay = 3000,
  autoPlay = false,
  component = 'StartingSequence',
}: EmbeddedInteractiveDemoProps) {
  const [key, setKey] = useState(0); // Force re-render on reset
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<View>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate scale factor
  // Component is designed for ~800px width, we scale to fit phone screen
  const scaleX = screenWidth / ORIGINAL_WIDTH;
  const scaleY = screenHeight / ORIGINAL_HEIGHT;
  const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit both dimensions
  const scaledWidth = ORIGINAL_WIDTH * scale;
  const scaledHeight = ORIGINAL_HEIGHT * scale;

  // Viewport detection for performance (only render when visible)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        rootMargin: '50px', // Start loading slightly before visible
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      // @ts-ignore - web only
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle completion with auto-reset
  const handleComplete = useCallback(() => {
    if (!autoReset) return;

    // Clear any existing timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // Reset after delay
    resetTimeoutRef.current = setTimeout(() => {
      setKey((prev) => prev + 1); // Force component remount
    }, resetDelay);
  }, [autoReset, resetDelay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // Render the appropriate component
  const renderComponent = () => {
    if (!isVisible) {
      // Placeholder while not visible
      return (
        <View style={[styles.placeholder, { width: scaledWidth, height: scaledHeight }]}>
          {/* Empty - will load when visible */}
        </View>
      );
    }

    switch (component) {
      case 'StartingSequence':
        return (
          <StartingSequenceInteractive
            key={key}
            onComplete={handleComplete}
            // Disable onTimeUpdate to avoid unnecessary callbacks
          />
        );
      // Add other components as needed
      default:
        return (
          <StartingSequenceInteractive
            key={key}
            onComplete={handleComplete}
          />
        );
    }
  };

  return (
    <View
      ref={containerRef}
      style={[
        styles.container,
        {
          width: screenWidth,
          height: screenHeight,
        },
      ]}
    >
      <View
        style={[
          styles.scaleContainer,
          {
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            transform: [{ scale }],
            ...Platform.select({
              web: {
                transformOrigin: 'top left',
              },
            }),
          },
        ]}
      >
        {renderComponent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  scaleContainer: {
    ...Platform.select({
      web: {
        // Use CSS transform for better performance on web
        transformOrigin: 'top left',
      },
      default: {
        // React Native transform
      },
    }),
  },
  placeholder: {
    backgroundColor: '#F8FAFC',
  },
});

