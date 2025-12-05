/**
 * Set Course Interactive Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Shows step-by-step course setup process
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Marker, Polygon, Pattern } from 'react-native-svg';
import type { CourseStep } from './data/setCourseData';
import { SET_COURSE_SEQUENCE_STEPS } from './data/setCourseData';
import { PowerboatSVG } from './shared';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface SetCourseInteractiveProps {
  currentStep?: CourseStep;
  onStepChange?: (step: CourseStep) => void;
  onComplete?: () => void;
}

export function SetCourseInteractive({
  currentStep: externalStep,
  onStepChange,
  onComplete,
}: SetCourseInteractiveProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = externalStep || SET_COURSE_SEQUENCE_STEPS[currentStepIndex];

  // Course path animation (still using reanimated for strokeDashoffset)
  const coursePathLength = useSharedValue(0);

  // Use shared values for opacity animations
  const windOpacity = useSharedValue(0);
  const rcBoatOpacity = useSharedValue(0);
  const pinOpacity = useSharedValue(0);
  const startLineOpacity = useSharedValue(0);
  const windwardMarkOpacity = useSharedValue(0);
  const leewardGateOpacity = useSharedValue(0);
  const coursePathOpacity = useSharedValue(0);
  const finishBoatOpacity = useSharedValue(0);
  const finishPinOpacity = useSharedValue(0);
  const finishLineOpacity = useSharedValue(0);

  // On web, sync shared values to state for CSS transitions
  // On native, use AnimatedG with animatedProps
  const [opacities, setOpacities] = useState({
    wind: 0,
    rcBoat: 0,
    pin: 0,
    startLine: 0,
    windwardMark: 0,
    leewardGate: 0,
    coursePath: 0,
    finishBoat: 0,
    finishPin: 0,
    finishLine: 0,
  });

  // On web, sync shared values to state when step changes (for CSS transitions)
  // We update state directly from target values instead of continuously polling
  // This prevents memory leaks and excessive re-renders

  // Update shared values when step changes
  useEffect(() => {
    const visualState = currentStep.visualState || {};
    const duration = 800;
    
    // Get target opacity values
    const targetValues = {
      wind: visualState.wind?.opacity || 0,
      rcBoat: visualState.rcBoat?.opacity || 0,
      pin: visualState.pin?.opacity || 0,
      startLine: visualState.startLine?.opacity || 0,
      windwardMark: visualState.windwardMark?.opacity || 0,
      leewardGate: visualState.leewardGate?.opacity || 0,
      coursePath: visualState.coursePath?.opacity || 0,
      finishBoat: visualState.finishBoat?.opacity || 0,
      finishPin: visualState.finishPin?.opacity || 0,
      finishLine: visualState.finishLine?.opacity || 0,
    };
    
    // Animate shared values to target
    windOpacity.value = withTiming(targetValues.wind, { duration });
    rcBoatOpacity.value = withTiming(targetValues.rcBoat, { duration });
    pinOpacity.value = withTiming(targetValues.pin, { duration });
    startLineOpacity.value = withTiming(targetValues.startLine, { duration });
    windwardMarkOpacity.value = withTiming(targetValues.windwardMark, { duration });
    leewardGateOpacity.value = withTiming(targetValues.leewardGate, { duration });
    coursePathOpacity.value = withTiming(targetValues.coursePath, { duration });
    finishBoatOpacity.value = withTiming(targetValues.finishBoat, { duration });
    finishPinOpacity.value = withTiming(targetValues.finishPin, { duration });
    finishLineOpacity.value = withTiming(targetValues.finishLine, { duration });

    // On web, update state directly from target values (CSS transitions handle animation)
    // This is much more efficient than continuous polling
    if (Platform.OS === 'web') {
      setOpacities(targetValues);
    }

    // Animate course path drawing
    if (visualState.coursePath?.opacity) {
      coursePathLength.value = withTiming(1, { duration: 3000 });
    } else {
      coursePathLength.value = 0;
    }
  }, [currentStep, coursePathLength]);

  // Animated props for native (web uses state + CSS)
  const windProps = useAnimatedProps(() => ({ opacity: windOpacity.value }));
  const rcBoatProps = useAnimatedProps(() => ({ opacity: rcBoatOpacity.value }));
  const pinProps = useAnimatedProps(() => ({ opacity: pinOpacity.value }));
  const startLineProps = useAnimatedProps(() => ({ opacity: startLineOpacity.value }));
  const windwardMarkProps = useAnimatedProps(() => ({ opacity: windwardMarkOpacity.value }));
  const leewardGateProps = useAnimatedProps(() => ({ opacity: leewardGateOpacity.value }));
  const coursePathPropsAnimated = useAnimatedProps(() => ({ opacity: coursePathOpacity.value }));
  const finishBoatProps = useAnimatedProps(() => ({ opacity: finishBoatOpacity.value }));
  const finishPinProps = useAnimatedProps(() => ({ opacity: finishPinOpacity.value }));
  const finishLineProps = useAnimatedProps(() => ({ opacity: finishLineOpacity.value }));

  // Inject CSS for transitions on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'set-course-svg-transitions';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          svg g[data-animated-opacity] {
            transition: opacity 0.8s ease-out !important;
          }
        `;
        document.head.appendChild(style);
        console.log('[SetCourseInteractive] ✅ CSS transitions injected');
      }
    }
  }, []);

  // Animated props for Path (strokeDashoffset)
  const coursePathDashProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - coursePathLength.value) * 1000,
  }));


  const handleNext = () => {
    console.log('[SetCourseInteractive] 👆 Next button clicked');
    console.log('[SetCourseInteractive] 📍 Current index:', currentStepIndex);
    if (currentStepIndex < SET_COURSE_SEQUENCE_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      console.log('[SetCourseInteractive] ➡️ Moving to index:', nextIndex);
      setCurrentStepIndex(nextIndex);
      onStepChange?.(SET_COURSE_SEQUENCE_STEPS[nextIndex]);
    } else {
      console.log('[SetCourseInteractive] ✅ Complete!');
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(SET_COURSE_SEQUENCE_STEPS[prevIndex]);
    }
  };

  // Course path SVG path
  const coursePathD = "M 400 350 L 400 115 C 400 95 385 100 380 100 L 420 100 C 415 100 400 95 400 115 L 400 280 C 400 300 385 300 375 300 L 425 300 C 415 300 400 300 400 280 L 400 100 L 400 350";

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.svgContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 800 450">
          <Defs>
            <Marker id="arrowhead-course" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <Polygon points="0,0 10,3.5 0,7" fill="#000" />
            </Marker>
            {/* Water texture pattern */}
            <Pattern id="water-texture-sc" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <Path d="M0 50 Q25 45, 50 50 T100 50" stroke="#8BC4E8" strokeWidth="0.5" fill="none" opacity={0.3} />
              <Path d="M0 60 Q25 55, 50 60 T100 60" stroke="#6BA3CC" strokeWidth="0.5" fill="none" opacity={0.2} />
            </Pattern>
          </Defs>
          
          {/* Water background with texture */}
          <Rect width="800" height="450" fill="#aaccff" />
          <Rect width="800" height="450" fill="url(#water-texture-sc)" />
          
          {/* Wind indicator */}
          {Platform.OS === 'web' ? (
            <G opacity={opacities.wind} data-animated-opacity="true">
              <Line x1="400" y1="20" x2="400" y2="70" stroke="#000" strokeWidth="3" markerEnd="url(#arrowhead-course)" />
              <SvgText x="400" y="15" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#000">
                WIND
              </SvgText>
            </G>
          ) : (
            <AnimatedG animatedProps={windProps}>
              <Line x1="400" y1="20" x2="400" y2="70" stroke="#000" strokeWidth="3" markerEnd="url(#arrowhead-course)" />
              <SvgText x="400" y="15" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#000">
                WIND
              </SvgText>
            </AnimatedG>
          )}

          {/* Start Line */}
          {Platform.OS === 'web' ? (
            <G opacity={opacities.startLine} data-animated-opacity="true">
              <Line x1="300" y1="350" x2="500" y2="350" stroke="black" strokeWidth="2" strokeDasharray="5,5" />
              <SvgText x="400" y="370" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000">
                Start Line
              </SvgText>
            </G>
          ) : (
            <AnimatedG animatedProps={startLineProps}>
              <Line x1="300" y1="350" x2="500" y2="350" stroke="black" strokeWidth="2" strokeDasharray="5,5" />
              <SvgText x="400" y="370" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000">
                Start Line
              </SvgText>
            </AnimatedG>
          )}

          {/* RC Boat (Start) */}
          {Platform.OS === 'web' ? (
            <G opacity={opacities.rcBoat} data-animated-opacity="true" transform="translate(490, 330)">
              <PowerboatSVG rotation={0} hideInfoBoard={true} scale={0.8} />
            </G>
          ) : (
            <AnimatedG animatedProps={rcBoatProps} transform="translate(490, 330)">
              <PowerboatSVG rotation={0} hideInfoBoard={true} scale={0.8} />
            </AnimatedG>
          )}

          {/* Pin (Start) */}
          {Platform.OS === 'web' ? (
            <G opacity={opacities.pin} data-animated-opacity="true">
              <Circle cx="300" cy="350" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
            </G>
          ) : (
            <AnimatedG animatedProps={pinProps}>
              <Circle cx="300" cy="350" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
            </AnimatedG>
          )}

          {/* Windward Mark */}
          {Platform.OS === 'web' ? (
            <G opacity={opacities.windwardMark} data-animated-opacity="true">
              <Circle cx="400" cy="100" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
              <SvgText x="400" y="90" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
                Windward Mark
              </SvgText>
            </G>
          ) : (
            <AnimatedG animatedProps={windwardMarkProps}>
              <Circle cx="400" cy="100" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
              <SvgText x="400" y="90" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
                Windward Mark
              </SvgText>
            </AnimatedG>
          )}

          {/* Leeward Gate */}
          {Platform.OS === 'web' ? (
            <G opacity={opacities.leewardGate} data-animated-opacity="true">
              <Circle cx="350" cy="300" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
              <Circle cx="450" cy="300" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
              <SvgText x="400" y="330" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
                Leeward Gate
              </SvgText>
            </G>
          ) : (
            <AnimatedG animatedProps={leewardGateProps}>
              <Circle cx="350" cy="300" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
              <Circle cx="450" cy="300" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
              <SvgText x="400" y="330" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
                Leeward Gate
              </SvgText>
            </AnimatedG>
          )}

          {/* Course Path */}
          {Platform.OS === 'web' ? (
            <G opacity={opacities.coursePath} data-animated-opacity="true">
              <AnimatedPath
                d={coursePathD}
                stroke="yellow"
                strokeWidth="4"
                strokeDasharray="15, 10"
                fill="none"
                animatedProps={coursePathDashProps}
              />
            </G>
          ) : (
            <AnimatedG animatedProps={coursePathPropsAnimated}>
              <AnimatedPath
                d={coursePathD}
                stroke="yellow"
                strokeWidth="4"
                strokeDasharray="15, 10"
                fill="none"
                animatedProps={coursePathDashProps}
              />
            </AnimatedG>
          )}

          {/* Finish Line Components */}
          {Platform.OS === 'web' ? (
            <>
              <G opacity={opacities.finishBoat} data-animated-opacity="true" transform="translate(490, 330)">
                <PowerboatSVG rotation={0} hideInfoBoard={true} scale={0.8} />
              </G>
              <G opacity={opacities.finishPin} data-animated-opacity="true">
                <Circle cx="580" cy="350" r="6" fill="#ADD8E6" stroke="black" strokeWidth="1.5" />
              </G>
              <G opacity={opacities.finishLine} data-animated-opacity="true">
                <Line x1="500" y1="350" x2="580" y2="350" stroke="green" strokeWidth="2" strokeDasharray="5,5" />
                <SvgText x="540" y="335" textAnchor="middle" fontSize="14" fontWeight="600" fill="#22C55E">
                  Finish Line
                </SvgText>
              </G>
            </>
          ) : (
            <>
              <AnimatedG animatedProps={finishBoatProps} transform="translate(490, 330)">
                <PowerboatSVG rotation={0} hideInfoBoard={true} scale={0.8} />
              </AnimatedG>
              <AnimatedG animatedProps={finishPinProps}>
                <Circle cx="580" cy="350" r="6" fill="#ADD8E6" stroke="black" strokeWidth="1.5" />
              </AnimatedG>
              <AnimatedG animatedProps={finishLineProps}>
                <Line x1="500" y1="350" x2="580" y2="350" stroke="green" strokeWidth="2" strokeDasharray="5,5" />
                <SvgText x="540" y="335" textAnchor="middle" fontSize="14" fontWeight="600" fill="#22C55E">
                  Finish Line
                </SvgText>
              </AnimatedG>
            </>
          )}
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
            Step {currentStepIndex + 1} of {SET_COURSE_SEQUENCE_STEPS.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
            {currentStepIndex === SET_COURSE_SEQUENCE_STEPS.length - 1 ? 'Complete' : 'Next'}
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
    paddingBottom: 20, // Extra padding at bottom for scroll
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
    aspectRatio: 800 / 450, // Match SVG viewBox ratio
    minHeight: 280,
    maxHeight: 500, // Increased from 300
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

