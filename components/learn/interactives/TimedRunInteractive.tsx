/**
 * Timed Run Interactive Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Demonstrates the timed run approach to the starting line
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Marker, Polygon, Pattern, Ellipse } from 'react-native-svg';
import type { TimedRunStep } from './data/timedRunData';
import { TIMED_RUN_SEQUENCE_STEPS } from './data/timedRunData';
import { PowerboatSVG } from './shared';

// Note: AnimatedG removed to avoid crashes on Android New Architecture
// Using state-driven transforms instead

interface TimedRunInteractiveProps {
  currentStep?: TimedRunStep;
  onStepChange?: (step: TimedRunStep) => void;
  onComplete?: () => void;
}

export function TimedRunInteractive({
  currentStep: externalStep,
  onStepChange,
  onComplete,
}: TimedRunInteractiveProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = externalStep || TIMED_RUN_SEQUENCE_STEPS[currentStepIndex];

  // Animation values
  const boatOpacity = useSharedValue(0);
  const boatX = useSharedValue(400);
  const boatY = useSharedValue(250);
  const boatRotate = useSharedValue(90);

  // State-driven transform (avoids AnimatedG crash on Android New Architecture)
  const [boatState, setBoatState] = useState({ opacity: 0, transform: 'translate(400, 250) rotate(90)' });

  useEffect(() => {
    const visualState = currentStep.visualState || {};
    const duration = 1500;

    if (visualState.boat) {
      boatOpacity.value = withTiming(visualState.boat.opacity || 0, { duration });
      boatX.value = withTiming(visualState.boat.x || 400, { duration });
      boatY.value = withTiming(visualState.boat.y || 250, { duration });
      boatRotate.value = withTiming(visualState.boat.rotate || 90, { duration });
    }
  }, [currentStep]);

  // Sync boat position to state using useDerivedValue (avoids AnimatedG crash on Android New Architecture)
  useDerivedValue(() => {
    runOnJS(setBoatState)({
      opacity: boatOpacity.value,
      transform: `translate(${boatX.value}, ${boatY.value}) rotate(${boatRotate.value})`,
    });
    return null;
  }, []);

  const handleNext = () => {
    if (currentStepIndex < TIMED_RUN_SEQUENCE_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(TIMED_RUN_SEQUENCE_STEPS[nextIndex]);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(TIMED_RUN_SEQUENCE_STEPS[prevIndex]);
    }
  };

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.svgContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 900 450" preserveAspectRatio="xMidYMid meet">
          <Defs>
            <Marker id="arrowhead-timedrun" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <Polygon points="0,0 10,3.5 0,7" fill="#000" />
            </Marker>
            {/* Water texture pattern */}
            <Pattern id="water-texture-tr" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <Path d="M0 50 Q25 45, 50 50 T100 50" stroke="#8BC4E8" strokeWidth="0.5" fill="none" opacity={0.3} />
              <Path d="M0 60 Q25 55, 50 60 T100 60" stroke="#6BA3CC" strokeWidth="0.5" fill="none" opacity={0.2} />
            </Pattern>
          </Defs>

          {/* Water background with texture */}
          <Rect width="900" height="450" fill="#aaccff" />
          <Rect width="900" height="450" fill="url(#water-texture-tr)" />

          {/* Compass and Wind */}
          <G transform="translate(400, 70)">
            <Circle r="45" fill="white" opacity="0.3" />
            <Circle r="38" fill="white" opacity="0.5" />
            <SvgText x="0" y="-35" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">
              N
            </SvgText>
            <SvgText x="0" y="4" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#000">
              360°
            </SvgText>
            <Line x1="0" y1="-25" x2="0" y2="25" stroke="#000" strokeWidth="3" markerEnd="url(#arrowhead-timedrun)" opacity="0.5" />
          </G>
          <SvgText x="400" y="20" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#000">
            WIND
          </SvgText>

          {/* Laylines and Starting Box */}
          <G opacity="0.4">
            <Line x1="200" y1="200" x2="341" y2="341" stroke="black" strokeWidth="1" strokeDasharray="3,5" />
            <Line x1="600" y1="200" x2="741" y2="341" stroke="black" strokeWidth="1" strokeDasharray="3,5" />
            <SvgText x="470" y="300" textAnchor="middle" fontSize="14" fontWeight="600" fill="#374151" transform="rotate(45 470 300)">
              The Starting Box
            </SvgText>
          </G>

          {/* Start Line and Marks */}
          <Line x1="200" y1="200" x2="600" y2="200" stroke="black" strokeWidth="2" strokeDasharray="5,5" />
          <SvgText x="400" y="220" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000">
            Start Line
          </SvgText>
          <G transform="translate(590, 180)">
            <PowerboatSVG rotation={0} hideInfoBoard={false} scale={0.8} />
          </G>
          <Circle cx="200" cy="200" r="10" fill="orange" stroke="black" strokeWidth="2" />

          {/* Sailboat with detailed graphics */}
          <G opacity={boatState.opacity} transform={boatState.transform}>
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
          </G>
        </Svg>
      </View>

      {/* Step Info */}
      <View style={styles.infoContainer}>
        <View style={styles.timeHeader}>
          <Text style={styles.timeLabel}>{currentStep.time !== undefined ? formatTime(currentStep.time) : ''}</Text>
          <Text style={styles.stepLabel}>{currentStep.label}</Text>
        </View>
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
            Step {currentStepIndex + 1} of {TIMED_RUN_SEQUENCE_STEPS.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
            {currentStepIndex === TIMED_RUN_SEQUENCE_STEPS.length - 1 ? 'Complete' : 'Next'}
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
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timeLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
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

