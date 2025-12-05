/**
 * Positioning Interactive Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Demonstrates positioning and defending your spot on the starting line
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Marker, Polygon, Pattern, Ellipse } from 'react-native-svg';
import type { PositioningStep } from './data/positioningData';
import { POSITIONING_SEQUENCE_STEPS } from './data/positioningData';
import { PowerboatSVG } from './shared';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PositioningInteractiveProps {
  currentStep?: PositioningStep;
  onStepChange?: (step: PositioningStep) => void;
  onComplete?: () => void;
}

export function PositioningInteractive({
  currentStep: externalStep,
  onStepChange,
  onComplete,
}: PositioningInteractiveProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = externalStep || POSITIONING_SEQUENCE_STEPS[currentStepIndex];

  // Animation values for boats
  const blueOpacity = useSharedValue(0);
  const blueX = useSharedValue(400);
  const blueY = useSharedValue(240);
  const blueRotate = useSharedValue(-45);
  const redOpacity = useSharedValue(0);
  const redX = useSharedValue(460);
  const redY = useSharedValue(235);
  const redRotate = useSharedValue(-45);
  const yellowOpacity = useSharedValue(0);
  const yellowX = useSharedValue(250);
  const yellowY = useSharedValue(350);
  const yellowRotate = useSharedValue(45);
  const holeOpacity = useSharedValue(0);

  useEffect(() => {
    const visualState = currentStep.visualState || {};
    const duration = 1500;

    if (visualState.blue) {
      blueOpacity.value = withTiming(visualState.blue.opacity || 0, { duration });
      blueX.value = withTiming(visualState.blue.x || 400, { duration });
      blueY.value = withTiming(visualState.blue.y || 240, { duration });
      blueRotate.value = withTiming(visualState.blue.rotate || -45, { duration });
    }

    if (visualState.red) {
      redOpacity.value = withTiming(visualState.red.opacity || 0, { duration });
      redX.value = withTiming(visualState.red.x || 460, { duration });
      redY.value = withTiming(visualState.red.y || 235, { duration });
      redRotate.value = withTiming(visualState.red.rotate || -45, { duration });
    }

    if (visualState.yellow) {
      yellowOpacity.value = withTiming(visualState.yellow.opacity || 0, { duration });
      yellowX.value = withTiming(visualState.yellow.x || 250, { duration });
      yellowY.value = withTiming(visualState.yellow.y || 350, { duration });
      yellowRotate.value = withTiming(visualState.yellow.rotate || 45, { duration });
    }

    if (visualState.hole) {
      holeOpacity.value = withTiming(visualState.hole.opacity || 0, { duration });
    }
  }, [currentStep]);

  const blueBoatProps = useAnimatedProps(() => ({
    opacity: blueOpacity.value,
    transform: [
      { translateX: blueX.value },
      { translateY: blueY.value },
      { rotate: `${blueRotate.value}deg` },
    ],
  }));

  const redBoatProps = useAnimatedProps(() => ({
    opacity: redOpacity.value,
    transform: [
      { translateX: redX.value },
      { translateY: redY.value },
      { rotate: `${redRotate.value}deg` },
    ],
  }));

  const yellowBoatProps = useAnimatedProps(() => ({
    opacity: yellowOpacity.value,
    transform: [
      { translateX: yellowX.value },
      { translateY: yellowY.value },
      { rotate: `${yellowRotate.value}deg` },
    ],
  }));

  const holeProps = useAnimatedProps(() => ({
    opacity: holeOpacity.value,
  }));

  const handleNext = () => {
    if (currentStepIndex < POSITIONING_SEQUENCE_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(POSITIONING_SEQUENCE_STEPS[nextIndex]);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(POSITIONING_SEQUENCE_STEPS[prevIndex]);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.svgContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 800 450">
          <Defs>
            <Marker id="arrowhead-positioning" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <Polygon points="0,0 10,3.5 0,7" fill="#000" />
            </Marker>
            {/* Water texture pattern */}
            <Pattern id="water-texture-pos" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <Path d="M0 50 Q25 45, 50 50 T100 50" stroke="#8BC4E8" strokeWidth="0.5" fill="none" opacity={0.3} />
              <Path d="M0 60 Q25 55, 50 60 T100 60" stroke="#6BA3CC" strokeWidth="0.5" fill="none" opacity={0.2} />
            </Pattern>
          </Defs>

          {/* Water background with texture */}
          <Rect width="800" height="450" fill="#aaccff" />
          <Rect width="800" height="450" fill="url(#water-texture-pos)" />

          {/* Wind Arrow */}
          <G opacity="0.5">
            <Line x1="400" y1="20" x2="400" y2="70" stroke="#000" strokeWidth="3" markerEnd="url(#arrowhead-positioning)" />
            <SvgText x="400" y="15" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#000">
              WIND
            </SvgText>
          </G>

          {/* Start Line */}
          <Line x1="200" y1="200" x2="600" y2="200" stroke="black" strokeWidth="2" strokeDasharray="5,5" />
          <SvgText x="400" y="220" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000">
            Start Line
          </SvgText>

          {/* RC Boat */}
          <G transform="translate(590, 180)">
            <PowerboatSVG rotation={0} hideInfoBoard={true} scale={0.8} />
          </G>

          {/* Pin */}
          <Circle cx="200" cy="200" r="10" fill="orange" stroke="black" strokeWidth="2" />

          {/* Hole indicator */}
          <AnimatedCircle
            cx="350"
            cy="260"
            r="40"
            fill="yellow"
            animatedProps={holeProps}
          />

          {/* Boats - Blue */}
          <AnimatedG animatedProps={blueBoatProps}>
            <G transform="scale(0.4)">
              <Path d="M -45,0 Q -48,10 -40,12 L 35,12 Q 42,10 40,0 Q 42,-8 35,-10 L -40,-10 Q -48,-8 -45,0 Z" fill="#3B82F6" stroke="#0F172A" strokeWidth="2" />
              <Ellipse cx="-5" cy="0" rx="32" ry="8" fill="#3B82F6" opacity={0.6} />
              <Line x1="-5" y1="0" x2="-5" y2="-45" stroke="#475569" strokeWidth="2" />
              <Path d="M -5,-45 Q 15,-28 25,-5 L -5,-3 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
              <Path d="M -5,-40 Q -20,-22 -25,-3 L -5,-2 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" opacity={0.95} />
            </G>
          </AnimatedG>

          {/* Boats - Red */}
          <AnimatedG animatedProps={redBoatProps}>
            <G transform="scale(0.4)">
              <Path d="M -45,0 Q -48,10 -40,12 L 35,12 Q 42,10 40,0 Q 42,-8 35,-10 L -40,-10 Q -48,-8 -45,0 Z" fill="#EF4444" stroke="#0F172A" strokeWidth="2" />
              <Ellipse cx="-5" cy="0" rx="32" ry="8" fill="#EF4444" opacity={0.6} />
              <Line x1="-5" y1="0" x2="-5" y2="-45" stroke="#475569" strokeWidth="2" />
              <Path d="M -5,-45 Q 15,-28 25,-5 L -5,-3 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
              <Path d="M -5,-40 Q -20,-22 -25,-3 L -5,-2 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" opacity={0.95} />
            </G>
          </AnimatedG>

          {/* Boats - Yellow */}
          <AnimatedG animatedProps={yellowBoatProps}>
            <G transform="scale(0.4)">
              <Path d="M -45,0 Q -48,10 -40,12 L 35,12 Q 42,10 40,0 Q 42,-8 35,-10 L -40,-10 Q -48,-8 -45,0 Z" fill="#F4B400" stroke="#0F172A" strokeWidth="2" />
              <Ellipse cx="-5" cy="0" rx="32" ry="8" fill="#F4B400" opacity={0.6} />
              <Line x1="-5" y1="0" x2="-5" y2="-45" stroke="#475569" strokeWidth="2" />
              <Path d="M -5,-45 Q 15,-28 25,-5 L -5,-3 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
              <Path d="M -5,-40 Q -20,-22 -25,-3 L -5,-2 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" opacity={0.95} />
            </G>
          </AnimatedG>
        </Svg>
      </View>

      {/* Step Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.stepLabel}>{currentStep.label}</Text>
        <Text style={styles.stepDescription}>{currentStep.description}</Text>
        {currentStep.details && currentStep.details.length > 0 && (
          <View style={styles.detailsContainer}>
            {currentStep.details.map((detail, index) => (
              <View key={index} style={styles.detailItem}>
                <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                <Text style={styles.detailText}>{detail}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Navigation Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.navButton, currentStepIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentStepIndex === 0 ? '#94A3B8' : '#3B82F6'} />
          <Text style={[styles.navButtonText, currentStepIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepIndicatorText}>
            Step {currentStepIndex + 1} of {POSITIONING_SEQUENCE_STEPS.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
            {currentStepIndex === POSITIONING_SEQUENCE_STEPS.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  svgContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 300,
    maxHeight: 500,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  infoContainer: {
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  navButtonTextDisabled: {
    color: '#94A3B8',
  },
  navButtonTextPrimary: {
    color: '#FFFFFF',
  },
  stepIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicatorText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});

