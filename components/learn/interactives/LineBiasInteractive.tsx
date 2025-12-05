/**
 * Line Bias Interactive Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Demonstrates how wind shifts create line bias
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line, Circle, Text as SvgText, Path, Defs, Marker, Polygon, Rect, Pattern, Ellipse } from 'react-native-svg';
import type { LineBiasStep } from './data/lineBiasData';
import { LINE_BIAS_SEQUENCE_STEPS } from './data/lineBiasData';
import { PowerboatSVG, TopDownSailboatSVG } from './shared';

const AnimatedG = Animated.createAnimatedComponent(G);

// Helper function to describe an SVG arc
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = {
    x: x + radius * Math.cos((startAngle * Math.PI) / 180),
    y: y + radius * Math.sin((startAngle * Math.PI) / 180),
  };
  const end = {
    x: x + radius * Math.cos((endAngle * Math.PI) / 180),
    y: y + radius * Math.sin((endAngle * Math.PI) / 180),
  };
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y].join(' ');
}

interface LineBiasInteractiveProps {
  currentStep?: LineBiasStep;
  onStepChange?: (step: LineBiasStep) => void;
  onComplete?: () => void;
}

export function LineBiasInteractive({
  currentStep: externalStep,
  onStepChange,
  onComplete,
}: LineBiasInteractiveProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = externalStep || LINE_BIAS_SEQUENCE_STEPS[currentStepIndex];
  const [previousAngle, setPreviousAngle] = useState(0);
  const [currentWindAngle, setCurrentWindAngle] = useState(0);
  
  // Track boat rotations in state for sail calculation
  const [blueBoatRotation, setBlueBoatRotation] = useState(currentStep.blueStart?.rotate || -45);
  const [redBoatRotation, setRedBoatRotation] = useState(currentStep.redStart?.rotate || -45);

  // Animation values
  const blueBoatX = useSharedValue(currentStep.blueStart?.x || 480);
  const blueBoatY = useSharedValue(currentStep.blueStart?.y || 250);
  const blueBoatRotate = useSharedValue(currentStep.blueStart?.rotate || -45);
  const redBoatX = useSharedValue(currentStep.redStart?.x || 320);
  const redBoatY = useSharedValue(currentStep.redStart?.y || 250);
  const redBoatRotate = useSharedValue(currentStep.redStart?.rotate || -45);
  const windRotate = useSharedValue(currentStep.visualState?.wind?.rotate || 0);
  const ghostWindOpacity = useSharedValue(0);
  const ghostWindRotate = useSharedValue(0);
  const shiftTextOpacity = useSharedValue(0);
  const effectiveLineOpacity = useSharedValue(0);
  const effectiveLineRotate = useSharedValue(0);

  useEffect(() => {
    const transition = { duration: 1500 };
    const newAngle = currentStep.visualState?.wind?.rotate ?? 0;
    setCurrentWindAngle(newAngle);

    // Animate boats
    if (currentStep.blueStart) {
      blueBoatX.value = withTiming(currentStep.blueStart.x, transition);
      blueBoatY.value = withTiming(currentStep.blueStart.y, transition);
      blueBoatRotate.value = withTiming(currentStep.blueStart.rotate, transition);
      setBlueBoatRotation(currentStep.blueStart.rotate);
    }
    if (currentStep.redStart) {
      redBoatX.value = withTiming(currentStep.redStart.x, transition);
      redBoatY.value = withTiming(currentStep.redStart.y, transition);
      redBoatRotate.value = withTiming(currentStep.redStart.rotate, transition);
      setRedBoatRotation(currentStep.redStart.rotate);
    }

    // Animate wind shift
    if (newAngle !== previousAngle) {
      ghostWindRotate.value = previousAngle;
      ghostWindOpacity.value = withTiming(0.3, { duration: 500 });
      windRotate.value = withTiming(newAngle, transition);
      shiftTextOpacity.value = withTiming(1, { duration: 500, delay: 500 });
      effectiveLineRotate.value = withTiming(newAngle, transition);
      effectiveLineOpacity.value = withTiming(0.6, transition);
    } else {
      ghostWindOpacity.value = withTiming(0, { duration: 500 });
      shiftTextOpacity.value = withTiming(0, { duration: 100 });
      windRotate.value = newAngle;
      if (newAngle === 0) {
        effectiveLineOpacity.value = withTiming(0, { duration: 500 });
      }
    }
    setPreviousAngle(newAngle);
  }, [currentStep, previousAngle]);

  const windShift = currentWindAngle - previousAngle;
  const arcPath = useMemo(() => {
    if (windShift === 0) return '';
    return describeArc(400, 100, 60, previousAngle - 90, currentWindAngle - 90);
  }, [previousAngle, currentWindAngle, windShift]);

  const midAngle = (previousAngle + currentWindAngle) / 2 - 90;
  const textPos = {
    x: 400 + 75 * Math.cos((midAngle * Math.PI) / 180),
    y: 100 + 75 * Math.sin((midAngle * Math.PI) / 180),
  };

  const formattedWindAngle = useMemo(() => {
    const angle = Math.abs(currentWindAngle);
    return `${angle}° ${currentWindAngle < 0 ? 'left' : currentWindAngle > 0 ? 'right' : ''}`;
  }, [currentWindAngle]);

  // Animated props - using SVG transform string format
  const blueBoatProps = useAnimatedProps(() => ({
    transform: `translate(${blueBoatX.value}, ${blueBoatY.value}) rotate(${blueBoatRotate.value}, 25, 40)`,
  }));

  const redBoatProps = useAnimatedProps(() => ({
    transform: `translate(${redBoatX.value}, ${redBoatY.value}) rotate(${redBoatRotate.value}, 25, 40)`,
  }));

  const windProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${windRotate.value}deg` }],
  }));

  const ghostWindProps = useAnimatedProps(() => ({
    opacity: ghostWindOpacity.value,
    transform: [{ rotate: `${ghostWindRotate.value}deg` }],
  }));

  const shiftTextProps = useAnimatedProps(() => ({
    opacity: shiftTextOpacity.value,
  }));

  const effectiveLineProps = useAnimatedProps(() => ({
    opacity: effectiveLineOpacity.value,
    transform: [{ rotate: `${effectiveLineRotate.value}deg` }],
  }));

  const handleNext = () => {
    if (currentStepIndex < LINE_BIAS_SEQUENCE_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(LINE_BIAS_SEQUENCE_STEPS[nextIndex]);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(LINE_BIAS_SEQUENCE_STEPS[prevIndex]);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.svgContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 800 450">
          <Defs>
            <Marker id="arrowhead-bias" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <Polygon points="0,0 10,3.5 0,7" fill="#000" />
            </Marker>
            {/* Water texture pattern */}
            <Pattern id="water-texture-lb" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <Path d="M0 50 Q25 45, 50 50 T100 50" stroke="#8BC4E8" strokeWidth="0.5" fill="none" opacity={0.3} />
              <Path d="M0 60 Q25 55, 50 60 T100 60" stroke="#6BA3CC" strokeWidth="0.5" fill="none" opacity={0.2} />
            </Pattern>
          </Defs>

          {/* Water background with texture */}
          <Rect width="800" height="450" fill="#aaccff" />
          <Rect width="800" height="450" fill="url(#water-texture-lb)" />
          
          {/* Laylines */}
          <G opacity={0.35}>
            {/* Port layline from windward mark */}
            <Line x1="400" y1="100" x2="200" y2="350" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="8,4" />
            {/* Starboard layline from windward mark */}
            <Line x1="400" y1="100" x2="600" y2="350" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="8,4" />
            <SvgText x="280" y="220" textAnchor="middle" fontSize="10" fill="#EF4444" opacity={0.8}>Port Layline</SvgText>
            <SvgText x="520" y="220" textAnchor="middle" fontSize="10" fill="#22C55E" opacity={0.8}>Starboard Layline</SvgText>
          </G>

          {/* Start line */}
          <Line x1="200" y1="350" x2="600" y2="350" stroke="black" strokeWidth="2" strokeDasharray="5,5" />
          <SvgText x="400" y="370" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000">
            Start Line
          </SvgText>

          {/* Pin end */}
          <Circle cx="200" cy="350" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
          <SvgText x="200" y="340" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
            Pin
          </SvgText>

          {/* Committee boat end */}
          <G transform="translate(590, 340)">
            <PowerboatSVG rotation={currentWindAngle} hideInfoBoard={true} scale={0.7} />
          </G>

          {/* Windward mark */}
          <Circle cx="400" cy="100" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
          <SvgText x="400" y="90" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
            Windward Mark
          </SvgText>

          {/* Ghost wind (previous position) */}
          <AnimatedG animatedProps={ghostWindProps} transform="translate(400, 100)">
            <Line x1="0" y1="0" x2="0" y2="50" stroke="#999" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrowhead-bias)" />
          </AnimatedG>

          {/* Current wind */}
          <AnimatedG animatedProps={windProps} transform="translate(400, 100)">
            <Line x1="0" y1="0" x2="0" y2="50" stroke="#000" strokeWidth="3" markerEnd="url(#arrowhead-bias)" />
            <SvgText x="0" y="-10" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#000">
              WIND
            </SvgText>
          </AnimatedG>

          {/* Wind shift arc */}
          {windShift !== 0 && (
            <Path
              d={arcPath}
              stroke="#3B82F6"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
            />
          )}

          {/* Shift text */}
          {windShift !== 0 && (
            <AnimatedG animatedProps={shiftTextProps}>
              <SvgText
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#3B82F6"
              >
                {windShift > 0 ? `+${windShift}°` : `${windShift}°`}
              </SvgText>
            </AnimatedG>
          )}

          {/* Effective line (perpendicular to wind) */}
          <AnimatedG animatedProps={effectiveLineProps} transform="translate(400, 350)">
            <Line
              x1="-200"
              y1="0"
              x2="200"
              y2="0"
              stroke="#EF4444"
              strokeWidth="2"
              strokeDasharray="10,5"
            />
            <SvgText x="0" y="-10" textAnchor="middle" fontSize="12" fontWeight="600" fill="#EF4444">
              Effective Line
            </SvgText>
          </AnimatedG>

          {/* Blue Racing Boat - Top-down view */}
          <AnimatedG animatedProps={blueBoatProps}>
            <TopDownSailboatSVG 
              hullColor="#3B82F6" 
              rotation={blueBoatRotation}
              scale={0.6} 
              showWake={true}
              externalRotation={true}
              windDirection={currentWindAngle}
            />
          </AnimatedG>

          {/* Red Racing Boat - Top-down view */}
          <AnimatedG animatedProps={redBoatProps}>
            <TopDownSailboatSVG 
              hullColor="#EF4444" 
              rotation={redBoatRotation}
              scale={0.6} 
              showWake={true}
              externalRotation={true}
              windDirection={currentWindAngle}
            />
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
            Step {currentStepIndex + 1} of {LINE_BIAS_SEQUENCE_STEPS.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
            {currentStepIndex === LINE_BIAS_SEQUENCE_STEPS.length - 1 ? 'Complete' : 'Next'}
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
    aspectRatio: 800 / 450,
    minHeight: 280,
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

