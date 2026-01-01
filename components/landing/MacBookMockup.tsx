/**
 * Enhanced MacBook Mockup Component
 * Realistic MacBook Pro frame with professional styling
 * 
 * Features:
 * - Realistic gradients and shadows
 * - Detailed keyboard with key rows
 * - Screen reflection effects
 * - Professional depth and 3D appearance
 * - Scrollable content area
 */

import React from 'react';
import { View, StyleSheet, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MacBookMockupProps {
  children: React.ReactNode;
  frameWidth?: number;
  screenHeight?: number;
  scrollable?: boolean;
}

export function MacBookMockup({
  children,
  frameWidth,
  screenHeight = 600,
  scrollable = true,
}: MacBookMockupProps) {
  const { width } = useWindowDimensions();
  
  // Calculate frame width (max 1200px, or 90% of screen width on smaller screens)
  const calculatedFrameWidth = frameWidth || Math.min(1200, width * 0.9);
  const screenWidth = calculatedFrameWidth - 80; // Account for bezel (40px each side)
  const bezelWidth = 40;
  const baseHeight = 80; // Increased for more realistic proportions
  const totalHeight = screenHeight + bezelWidth * 2 + baseHeight;

  const screenContent = scrollable ? (
    <ScrollView
      style={[styles.screenContent, { width: screenWidth, height: screenHeight }]}
      contentContainerStyle={styles.screenContentContainer}
      nestedScrollEnabled={true}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={true}
      bounces={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenContent, { width: screenWidth, height: screenHeight }]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { width: calculatedFrameWidth, height: totalHeight }]}>
      {/* Top Bezel with Gradient */}
      <LinearGradient
        colors={['#2D2D2F', '#1D1D1F', '#0D0D0F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.bezel, styles.bezelTop, { width: calculatedFrameWidth, height: bezelWidth }]}
      >
        {/* Camera notch */}
        <View style={styles.cameraNotch} />
        {/* Subtle highlight on top edge */}
        <View style={styles.bezelHighlight} />
      </LinearGradient>

      {/* Screen Area */}
      <View style={[styles.screen, { width: calculatedFrameWidth, height: screenHeight + bezelWidth * 2 }]}>
        {/* Left Bezel with Gradient */}
        <LinearGradient
          colors={['#2D2D2F', '#1D1D1F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.bezelSide, { width: bezelWidth, height: screenHeight }]}
        />
        
        {/* Screen Content with Reflection Effect */}
        <View style={[styles.screenArea, { width: screenWidth, height: screenHeight }]}>
          {/* Screen reflection overlay */}
          <View style={styles.screenReflection} />
          {screenContent}
        </View>
        
        {/* Right Bezel with Gradient */}
        <LinearGradient
          colors={['#1D1D1F', '#2D2D2F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.bezelSide, { width: bezelWidth, height: screenHeight }]}
        />
      </View>

      {/* Bottom Bezel with Gradient */}
      <LinearGradient
        colors={['#2D2D2F', '#1D1D1F', '#0D0D0F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.bezel, styles.bezelBottom, { width: calculatedFrameWidth, height: bezelWidth }]}
      />

      {/* Base with Detailed Keyboard */}
      <LinearGradient
        colors={['#3D3D3F', '#2D2D2F', '#1D1D1F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.base, { width: calculatedFrameWidth, height: baseHeight }]}
      >
        {/* Hinge detail */}
        <View style={styles.hinge} />
        
        {/* Keyboard area with detailed keys */}
        <View style={styles.keyboardContainer}>
          {/* Function keys row */}
          <View style={styles.keyRow}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={`f${i}`} style={styles.functionKey} />
            ))}
          </View>
          
          {/* Main keyboard rows */}
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={styles.keyRow}>
              {Array.from({ length: row === 0 ? 13 : row === 1 ? 12 : row === 2 ? 11 : 10 }).map((_, i) => (
                <View key={`${row}-${i}`} style={styles.key} />
              ))}
            </View>
          ))}
        </View>
        
        {/* Trackpad */}
        <View style={styles.trackpadContainer}>
          <View style={styles.trackpad} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
      },
    }),
  },
  bezel: {
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  bezelTop: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bezelBottom: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  bezelSide: {
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  bezelHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  cameraNotch: {
    width: 140,
    height: 8,
    backgroundColor: '#000000',
    borderRadius: 4,
    position: 'absolute',
    top: '50%',
    marginTop: -4,
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  screen: {
    flexDirection: 'row',
    backgroundColor: '#1D1D1F',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  screenArea: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderLeftColor: 'rgba(0, 0, 0, 0.2)',
        borderRightColor: 'rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  screenReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: {
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 0%, transparent 100%)',
        pointerEvents: 'none',
      },
    }),
    zIndex: 1,
  },
  screenContent: {
    backgroundColor: '#FFFFFF',
    zIndex: 0,
  },
  screenContentContainer: {
    flexGrow: 1,
  },
  base: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      default: {
        elevation: 10,
      },
    }),
  },
  hinge: {
    width: '60%',
    height: 3,
    backgroundColor: '#0D0D0F',
    alignSelf: 'center',
    marginTop: 4,
    borderRadius: 2,
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  keyboardContainer: {
    width: '85%',
    alignSelf: 'center',
    marginTop: 8,
    gap: 3,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
    alignItems: 'center',
  },
  functionKey: {
    width: 20,
    height: 8,
    backgroundColor: '#1A1A1C',
    borderRadius: 2,
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
    }),
  },
  key: {
    width: 18,
    height: 10,
    backgroundColor: '#1A1A1C',
    borderRadius: 2,
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
    }),
  },
  trackpadContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  trackpad: {
    width: 80,
    height: 50,
    backgroundColor: '#0F0F0F',
    borderRadius: 6,
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.7), 0 1px 0 rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.8)',
      },
    }),
  },
});
