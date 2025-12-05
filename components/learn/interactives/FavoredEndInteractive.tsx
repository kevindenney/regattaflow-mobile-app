/**
 * Favored End Interactive Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Demonstrates methods for determining the favored end of the starting line
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Marker, Polygon, Pattern, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import type { FavoredEndCourseStep } from './data/favoredEndData';
import { FAVORED_END_STEPS } from './data/favoredEndData';
import { PowerboatSVG } from './shared';

const AnimatedG = Animated.createAnimatedComponent(G);

interface FavoredEndInteractiveProps {
  currentStep?: FavoredEndCourseStep;
  onStepChange?: (step: FavoredEndCourseStep) => void;
  onComplete?: () => void;
}

export function FavoredEndInteractive({
  currentStep: externalStep,
  onStepChange,
  onComplete,
}: FavoredEndInteractiveProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = externalStep || FAVORED_END_STEPS[currentStepIndex];

  // Animation values
  const boatOpacity = useSharedValue(0);
  const boatX = useSharedValue(0);
  const boatY = useSharedValue(0);
  const boatRotate = useSharedValue(0);
  const startLineOpacity = useSharedValue(0);
  const rcBoatOpacity = useSharedValue(0);
  const pinOpacity = useSharedValue(0);
  const windOpacity = useSharedValue(0);
  const windRotate = useSharedValue(90);
  const compassOpacity = useSharedValue(0);
  const secondaryLineOpacity = useSharedValue(0);

  useEffect(() => {
    const visualState = currentStep.visualState || {};
    const duration = 1200;

    if (visualState.boat) {
      boatOpacity.value = withTiming(visualState.boat.opacity || 0, { duration });
      boatX.value = withTiming(visualState.boat.x || 0, { duration });
      boatY.value = withTiming(visualState.boat.y || 0, { duration });
      boatRotate.value = withTiming(visualState.boat.rotate || 0, { duration });
    }

    if (visualState.startLineGraphic) {
      startLineOpacity.value = withTiming(visualState.startLineGraphic.opacity || 0, { duration });
    }

    if (visualState.rcBoatGraphic) {
      rcBoatOpacity.value = withTiming(visualState.rcBoatGraphic.opacity || 0, { duration });
    }

    if (visualState.pinGraphic) {
      pinOpacity.value = withTiming(visualState.pinGraphic.opacity || 0, { duration });
    }

    if (visualState.windArrow) {
      windOpacity.value = withTiming(visualState.windArrow.opacity || 0, { duration });
      windRotate.value = withTiming(visualState.windArrow.rotate || 90, { duration });
    }

    if (visualState.compass) {
      compassOpacity.value = withTiming(visualState.compass.opacity || 0, { duration });
    }

    if (visualState.secondaryLineGraphic) {
      secondaryLineOpacity.value = withTiming(visualState.secondaryLineGraphic.opacity || 0, { duration });
    }
  }, [currentStep]);

  const boatProps = useAnimatedProps(() => ({
    opacity: boatOpacity.value,
    transform: [
      { translateX: boatX.value },
      { translateY: boatY.value },
      { rotate: `${boatRotate.value}deg` },
    ],
  }));

  const windProps = useAnimatedProps(() => ({
    opacity: windOpacity.value,
    transform: [{ rotate: `${windRotate.value}deg` }],
  }));

  const handleNext = () => {
    if (currentStepIndex < FAVORED_END_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(FAVORED_END_STEPS[nextIndex]);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(FAVORED_END_STEPS[prevIndex]);
    }
  };

  const startLineState = currentStep.visualState.startLineGraphic || { x1: 200, y1: 200, x2: 600, y2: 200 };
  const secondaryLineState = currentStep.visualState.secondaryLineGraphic;

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.svgContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 800 450">
          <Defs>
            <Marker id="arrowhead-favored" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <Polygon points="0,0 10,3.5 0,7" fill="#000" />
            </Marker>
            {/* Water texture pattern */}
            <Pattern id="water-texture-fe" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <Path d="M0 50 Q25 45, 50 50 T100 50" stroke="#8BC4E8" strokeWidth="0.5" fill="none" opacity={0.3} />
              <Path d="M0 60 Q25 55, 50 60 T100 60" stroke="#6BA3CC" strokeWidth="0.5" fill="none" opacity={0.2} />
            </Pattern>
            <RadialGradient id="water-gradient-fe" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#5BA3D0" />
              <Stop offset="50%" stopColor="#3E92CC" />
              <Stop offset="100%" stopColor="#2A628F" />
            </RadialGradient>
          </Defs>

          {/* Water background with gradient and texture */}
          <Rect width="800" height="450" fill="url(#water-gradient-fe)" />
          <Rect width="800" height="450" fill="url(#water-texture-fe)" />

          {/* Wind arrow */}
          <AnimatedG animatedProps={windProps} transform="translate(400, 50)">
            <Line x1="0" y1="0" x2="0" y2="50" stroke="#000" strokeWidth="3" markerEnd="url(#arrowhead-favored)" />
            <SvgText x="0" y="-10" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#000">
              WIND
            </SvgText>
          </AnimatedG>

          {/* Start line */}
          <AnimatedG animatedProps={{ opacity: startLineOpacity }}>
            <Line
              x1={startLineState.x1}
              y1={startLineState.y1}
              x2={startLineState.x2}
              y2={startLineState.y2}
              stroke="black"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <SvgText x="400" y="220" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000">
              Start Line
            </SvgText>
          </AnimatedG>

          {/* Secondary line (shifted) */}
          {secondaryLineState && (
            <AnimatedG animatedProps={{ opacity: secondaryLineOpacity }}>
              <Line
                x1={secondaryLineState.x1}
                y1={secondaryLineState.y1}
                x2={secondaryLineState.x2}
                y2={secondaryLineState.y2}
                stroke="#EF4444"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              {secondaryLineState.label && (
                <SvgText x="400" y="210" textAnchor="middle" fontSize="12" fontWeight="600" fill="#EF4444">
                  {secondaryLineState.label}
                </SvgText>
              )}
            </AnimatedG>
          )}

          {/* RC Boat */}
          <AnimatedG animatedProps={{ opacity: rcBoatOpacity }} transform="translate(590, 180)">
            <PowerboatSVG rotation={0} hideInfoBoard={true} scale={0.8} />
          </AnimatedG>

          {/* Pin */}
          <AnimatedG animatedProps={{ opacity: pinOpacity }}>
            <Circle cx="200" cy="200" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
            <SvgText x="200" y="235" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
              Pin
            </SvgText>
          </AnimatedG>

          {/* Compass (simplified) */}
          {currentStep.visualState.compass && (
            <AnimatedG animatedProps={{ opacity: compassOpacity }} transform="translate(100, 20)">
              <Circle r="30" fill="white" opacity="0.8" />
              <SvgText x="0" y="5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#000">
                {currentStep.visualState.compass.lineHeading}°
              </SvgText>
              <SvgText x="0" y="20" textAnchor="middle" fontSize="10" fill="#3B82F6">
                Wind: {currentStep.visualState.compass.windHeading}°
              </SvgText>
            </AnimatedG>
          )}

          {/* Sailboat with detailed graphics */}
          <AnimatedG animatedProps={boatProps}>
            <G transform="scale(0.5)">
              {/* Hull */}
              <Path
                d="M -45,0 Q -48,10 -40,12 L 35,12 Q 42,10 40,0 Q 42,-8 35,-10 L -40,-10 Q -48,-8 -45,0 Z"
                fill="#3B82F6"
                stroke="#0F172A"
                strokeWidth="2"
              />
              {/* Hull shading */}
              <Path
                d="M -40,8 L 32,8 Q 38,6 36,0 Q 38,-6 32,-8 L -40,-8 Q -44,-6 -42,0 Q -44,6 -40,8 Z"
                fill="#000000"
                opacity={0.15}
              />
              {/* Deck */}
              <Ellipse cx="-5" cy="0" rx="32" ry="8" fill="#3B82F6" opacity={0.6} />
              {/* Mast */}
              <Line x1="-5" y1="0" x2="-5" y2="-55" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
              {/* Mainsail */}
              <Path d="M -5,-55 Q 20,-35 30,-8 L -5,-5 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
              {/* Jib */}
              <Path d="M -5,-48 Q -25,-28 -30,-5 L -5,-3 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" opacity={0.95} />
              {/* Bow wave */}
              <Path d="M -45,0 Q -50,5 -48,8" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity={0.6} strokeLinecap="round" />
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
            Step {currentStepIndex + 1} of {FAVORED_END_STEPS.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
            {currentStepIndex === FAVORED_END_STEPS.length - 1 ? 'Complete' : 'Next'}
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

