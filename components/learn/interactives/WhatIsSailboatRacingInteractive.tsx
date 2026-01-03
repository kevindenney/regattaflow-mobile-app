/**
 * What is Sailboat Racing? Interactive Component
 * An animated overview of a sailboat race for beginners
 *
 * Features:
 * - Fleet of 8 boats racing through a complete course
 * - Step-by-step explanation of each race phase
 * - Timeline controls for scrubbing
 * - Quiz at the end
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  Pattern,
  Polygon,
  Rect,
  Text as SvgText,
  Marker,
} from 'react-native-svg';

import {
  RACE_OVERVIEW_STEPS,
  WHAT_IS_SAILBOAT_RACING_QUIZ,
  DEEP_DIVE_CONTENT,
  type RaceOverviewStep,
  type BoatPosition,
  type QuizQuestion,
} from './data/whatIsSailboatRacingData';
import { TopDownSailboatSVG, CustomTimelineSlider } from './shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SVG_WIDTH = Math.min(800, SCREEN_WIDTH - 32);
const SVG_HEIGHT = 500;

// Animation configuration
const TRANSITION_DURATION = 800; // ms for boat transitions
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 100,
  mass: 1,
};

// Quiz answer interface
interface QuizAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
}

interface WhatIsSailboatRacingInteractiveProps {
  onComplete?: () => void;
}

// Animated boat component that smoothly transitions between positions
interface AnimatedBoatProps {
  boat: BoatPosition;
  previousBoat?: BoatPosition;
  stepIndex: number;
  windDirection: number;
}

function AnimatedBoat({ boat, previousBoat, stepIndex, windDirection }: AnimatedBoatProps) {
  // Shared values for smooth animation
  const animatedX = useSharedValue(previousBoat?.x ?? boat.x);
  const animatedY = useSharedValue(previousBoat?.y ?? boat.y);
  const animatedRotation = useSharedValue(previousBoat?.rotation ?? boat.rotation);
  const animatedOpacity = useSharedValue(1);

  // Animate to new position when step changes
  useEffect(() => {
    // Animate position with spring for natural movement
    animatedX.value = withSpring(boat.x, SPRING_CONFIG);
    animatedY.value = withSpring(boat.y, SPRING_CONFIG);

    // Animate rotation with timing for smoother turn
    animatedRotation.value = withTiming(boat.rotation, {
      duration: TRANSITION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Fade effect for emphasis
    animatedOpacity.value = withTiming(0.7, { duration: 100 }, () => {
      animatedOpacity.value = withTiming(1, { duration: 300 });
    });
  }, [boat.x, boat.y, boat.rotation, stepIndex]);

  // Use derived values for the transform string
  const [position, setPosition] = useState({ x: boat.x, y: boat.y, rotation: boat.rotation });

  // Update position when animated values change
  useDerivedValue(() => {
    runOnJS(setPosition)({
      x: animatedX.value,
      y: animatedY.value,
      rotation: animatedRotation.value,
    });
  });

  return (
    <G transform={`translate(${position.x}, ${position.y})`}>
      <TopDownSailboatSVG
        hullColor={boat.color}
        rotation={position.rotation}
        scale={0.4}
        showWake={true}
        windDirection={windDirection}
      />
    </G>
  );
}

export function WhatIsSailboatRacingInteractive({
  onComplete,
}: WhatIsSailboatRacingInteractiveProps) {
  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [previousStepIndex, setPreviousStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Animation timer ref
  const animationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get current step
  const currentStep = useMemo(() => {
    return RACE_OVERVIEW_STEPS[currentStepIndex];
  }, [currentStepIndex]);

  // Timeline markers for the slider
  const timelineMarkers = useMemo(() => {
    return RACE_OVERVIEW_STEPS.filter(step => step.label).map(step => ({
      value: step.time,
      label: step.label.split(' ')[0], // First word only
    }));
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      animationTimerRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= RACE_OVERVIEW_STEPS.length - 1) {
            setIsPlaying(false);
            setIsCompleted(true);
            return prev;
          }
          setPreviousStepIndex(prev);
          return prev + 1;
        });
      }, 4000); // 4 seconds per step
    } else {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    }

    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, [isPlaying]);

  // Handlers
  const handlePlayPause = () => {
    if (currentStepIndex >= RACE_OVERVIEW_STEPS.length - 1) {
      // Reset to beginning if at end
      setCurrentStepIndex(0);
      setIsCompleted(false);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepChange = (stepIndex: number) => {
    setIsPlaying(false);
    setPreviousStepIndex(currentStepIndex);
    setCurrentStepIndex(Math.min(Math.max(0, stepIndex), RACE_OVERVIEW_STEPS.length - 1));
  };

  const handleSliderChange = (value: number) => {
    // Find the step closest to this time value
    const stepIndex = RACE_OVERVIEW_STEPS.findIndex(step => step.time === value);
    if (stepIndex >= 0) {
      handleStepChange(stepIndex);
    } else {
      // Find closest step
      let closest = 0;
      let minDiff = Math.abs(RACE_OVERVIEW_STEPS[0].time - value);
      RACE_OVERVIEW_STEPS.forEach((step, idx) => {
        const diff = Math.abs(step.time - value);
        if (diff < minDiff) {
          minDiff = diff;
          closest = idx;
        }
      });
      handleStepChange(closest);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < RACE_OVERVIEW_STEPS.length - 1) {
      handleStepChange(currentStepIndex + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      handleStepChange(currentStepIndex - 1);
    }
  };

  // Quiz handlers
  const handleQuizAnswer = (questionId: string, optionId: string) => {
    const question = WHAT_IS_SAILBOAT_RACING_QUIZ.find(q => q.id === questionId);
    const option = question?.options.find(o => o.id === optionId);
    const isCorrect = option?.isCorrect ?? false;

    setQuizAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === questionId);
      const newAnswer: QuizAnswer = { questionId, selectedOptionId: optionId, isCorrect };

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });
  };

  const getQuizScore = () => {
    const correct = quizAnswers.filter(a => a.isCorrect).length;
    return { correct, total: WHAT_IS_SAILBOAT_RACING_QUIZ.length };
  };

  const resetQuiz = () => {
    setQuizAnswers([]);
  };

  // Get previous step for animation interpolation
  const previousStep = useMemo(() => {
    return RACE_OVERVIEW_STEPS[previousStepIndex];
  }, [previousStepIndex]);

  // Wind direction constant (wind from south - boats sail up)
  const windDirection = 180;

  // Render a single boat with animation
  const renderBoat = (boat: BoatPosition, index: number) => {
    const previousBoat = previousStep?.boats.find(b => b.id === boat.id);

    return (
      <AnimatedBoat
        key={boat.id}
        boat={boat}
        previousBoat={previousBoat}
        stepIndex={currentStepIndex}
        windDirection={windDirection}
      />
    );
  };

  // Render course marks
  const renderMarks = () => {
    const marks = currentStep.marks || [];

    return (
      <G>
        {marks.map(mark => {
          switch (mark.type) {
            case 'windward':
              return (
                <G key={mark.id}>
                  <Circle
                    cx={mark.x}
                    cy={mark.y}
                    r={12}
                    fill="#F59E0B"
                    stroke="#000000"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={mark.x}
                    y={mark.y - 20}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#1E293B"
                  >
                    Windward Mark
                  </SvgText>
                </G>
              );
            case 'leeward':
              // Single leeward mark (used in course overview)
              return (
                <G key={mark.id}>
                  <Circle
                    cx={mark.x}
                    cy={mark.y}
                    r={12}
                    fill="#10B981"
                    stroke="#000000"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={mark.x}
                    y={mark.y + 28}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#1E293B"
                  >
                    Leeward Mark
                  </SvgText>
                </G>
              );
            case 'gate-left':
            case 'gate-right':
              return (
                <G key={mark.id}>
                  <Circle
                    cx={mark.x}
                    cy={mark.y}
                    r={10}
                    fill="#10B981"
                    stroke="#000000"
                    strokeWidth={2}
                  />
                </G>
              );
            case 'finish-buoy':
              // White finish buoy
              return (
                <G key={mark.id}>
                  <Circle
                    cx={mark.x}
                    cy={mark.y}
                    r={10}
                    fill="#FFFFFF"
                    stroke="#000000"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={mark.x}
                    y={mark.y + 25}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748B"
                  >
                    Finish
                  </SvgText>
                </G>
              );
            case 'start-pin':
              return (
                <G key={mark.id}>
                  <Circle
                    cx={mark.x}
                    cy={mark.y}
                    r={10}
                    fill="#F97316"
                    stroke="#000000"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={mark.x}
                    y={mark.y + 25}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748B"
                  >
                    Pin
                  </SvgText>
                </G>
              );
            case 'rc-boat':
              return (
                <G key={mark.id}>
                  <Rect
                    x={mark.x - 20}
                    y={mark.y - 8}
                    width={40}
                    height={16}
                    fill="#1E293B"
                    rx={3}
                  />
                  <Rect
                    x={mark.x - 18}
                    y={mark.y - 6}
                    width={36}
                    height={12}
                    fill="#475569"
                    rx={2}
                  />
                  {/* Flag */}
                  <Line
                    x1={mark.x}
                    y1={mark.y - 8}
                    x2={mark.x}
                    y2={mark.y - 30}
                    stroke="#000000"
                    strokeWidth={2}
                  />
                  <Rect
                    x={mark.x}
                    y={mark.y - 30}
                    width={15}
                    height={10}
                    fill="#F97316"
                  />
                  <SvgText
                    x={mark.x}
                    y={mark.y + 25}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748B"
                  >
                    RC Boat
                  </SvgText>
                </G>
              );
            default:
              return null;
          }
        })}

        {/* Start/Finish lines */}
        {currentStep.marks && currentStep.marks.some(m => m.type === 'start-pin' || m.type === 'rc-boat' || m.type === 'finish-buoy') && (
          <G>
            {(() => {
              const pin = currentStep.marks?.find(m => m.type === 'start-pin');
              const rc = currentStep.marks?.find(m => m.type === 'rc-boat');
              const finishBuoy = currentStep.marks?.find(m => m.type === 'finish-buoy');
              const lines = [];

              // Draw start line between pin and RC (if both exist)
              if (pin && rc) {
                lines.push(
                  <Line
                    key="start-line"
                    x1={pin.x}
                    y1={pin.y}
                    x2={rc.x}
                    y2={rc.y}
                    stroke="#000000"
                    strokeWidth={2}
                    strokeDasharray="8,4"
                    opacity={0.6}
                  />
                );
              }

              // Draw finish line between RC and finish buoy (if both exist)
              if (finishBuoy && rc) {
                lines.push(
                  <G key="finish-line-group">
                    <Line
                      x1={rc.x}
                      y1={rc.y}
                      x2={finishBuoy.x}
                      y2={finishBuoy.y}
                      stroke="#000000"
                      strokeWidth={3}
                      strokeDasharray="8,4"
                      opacity={0.8}
                    />
                    <SvgText
                      x={(rc.x + finishBuoy.x) / 2}
                      y={rc.y - 15}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#1E293B"
                    >
                      Finish Line
                    </SvgText>
                  </G>
                );
              }

              return lines.length > 0 ? <>{lines}</> : null;
            })()}
          </G>
        )}

        {/* Leeward gate label - position dynamically based on gate marks */}
        {currentStep.marks && currentStep.marks.some(m => m.type === 'gate-left') && (() => {
          const gateLeft = currentStep.marks?.find(m => m.type === 'gate-left');
          const gateRight = currentStep.marks?.find(m => m.type === 'gate-right');
          const gateY = gateLeft?.y || gateRight?.y || 320;
          return (
            <SvgText
              x={400}
              y={gateY + 25}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#1E293B"
            >
              Leeward Gate
            </SvgText>
          );
        })()}
      </G>
    );
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Main visualization area */}
        <View style={styles.visualizationArea}>
          {/* SVG Canvas */}
          <View style={styles.svgContainer}>
            <Svg width="100%" height="100%" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
              <Defs>
                <Pattern id="water-pattern" patternUnits="userSpaceOnUse" width="50" height="25">
                  <Path
                    d="M 0 12 Q 12 0, 25 12 T 50 12"
                    stroke="#93C5FD"
                    fill="none"
                    strokeWidth="1"
                    opacity={0.5}
                  />
                </Pattern>
                <Marker id="wind-arrow" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <Polygon points="0,0 10,3.5 0,7" fill="#3B82F6" />
                </Marker>
              </Defs>

              {/* Water background */}
              <Rect width="800" height="500" fill="#BFDBFE" />
              <Rect width="800" height="500" fill="url(#water-pattern)" />

              {/* Wind indicator */}
              <G transform="translate(750, 60)">
                <Circle cx={0} cy={0} r={25} fill="#FFFFFF" stroke="#3B82F6" strokeWidth={2} />
                <Line
                  x1={0}
                  y1={-15}
                  x2={0}
                  y2={10}
                  stroke="#3B82F6"
                  strokeWidth={3}
                  markerEnd="url(#wind-arrow)"
                />
                <SvgText x={0} y={-30} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1E293B">
                  WIND
                </SvgText>
              </G>

              {/* Course marks */}
              {renderMarks()}

              {/* Tacking lines - show individual zig-zag path for each boat */}
              {currentStep.highlights?.includes('tacking-lines') && (
                <G>
                  {currentStep.boats.map((boat) => {
                    // Generate a tacking path from start area to boat's current position
                    // Start positions spread along start line (y=420)
                    const startX = 250 + (boat.x - 300) * 0.4; // Spread start positions along start line
                    const startY = 420;

                    // Calculate intermediate tack points based on boat position
                    const deltaY = startY - boat.y; // Distance traveled upwind

                    // Determine tack pattern based on boat's current tack (rotation)
                    // -45 = starboard tack (heading NW), 45 = port tack (heading NE)
                    const isStarboardTack = boat.rotation < 0;

                    // Create realistic zig-zag based on boat position and tack
                    // More tacks for boats higher up the course
                    const numTacks = deltaY > 200 ? 3 : deltaY > 100 ? 2 : 1;

                    let pathPoints = [`M ${startX} ${startY}`];

                    if (numTacks === 1) {
                      // Single leg - just go to boat
                      // Add one intermediate point for a tack
                      const midY = startY - deltaY * 0.5;
                      const midX = isStarboardTack
                        ? boat.x + deltaY * 0.3  // Coming from right if on starboard
                        : boat.x - deltaY * 0.3; // Coming from left if on port
                      pathPoints.push(`L ${midX} ${midY}`);
                    } else if (numTacks === 2) {
                      // Two tacks
                      const tack1Y = startY - deltaY * 0.4;
                      const tack1X = isStarboardTack
                        ? startX - deltaY * 0.15  // Go left first on starboard
                        : startX + deltaY * 0.15; // Go right first on port

                      const tack2Y = startY - deltaY * 0.75;
                      const tack2X = isStarboardTack
                        ? tack1X + deltaY * 0.25  // Then go right
                        : tack1X - deltaY * 0.25; // Then go left

                      pathPoints.push(`L ${tack1X} ${tack1Y}`);
                      pathPoints.push(`L ${tack2X} ${tack2Y}`);
                    } else {
                      // Three tacks for boats near the mark
                      const tack1Y = startY - deltaY * 0.25;
                      const tack1X = isStarboardTack
                        ? startX - deltaY * 0.1
                        : startX + deltaY * 0.1;

                      const tack2Y = startY - deltaY * 0.5;
                      const tack2X = isStarboardTack
                        ? tack1X + deltaY * 0.2
                        : tack1X - deltaY * 0.2;

                      const tack3Y = startY - deltaY * 0.8;
                      const tack3X = isStarboardTack
                        ? tack2X - deltaY * 0.15
                        : tack2X + deltaY * 0.15;

                      pathPoints.push(`L ${tack1X} ${tack1Y}`);
                      pathPoints.push(`L ${tack2X} ${tack2Y}`);
                      pathPoints.push(`L ${tack3X} ${tack3Y}`);
                    }

                    // End the tacking line at the STERN of the boat
                    // The boat SVG is translated to (boat.x, boat.y) and scaled 0.4
                    //
                    // Boat geometry in local coords (before rotation):
                    // - Bow (front): (25, 0)
                    // - Stern (back): (25, 78)
                    // - Center of rotation: (25, 40)
                    //
                    // The boat rotates around its center (25, 40).
                    // We need to find where the stern ends up after rotation.

                    const scale = 0.4;

                    // Local coordinates (before scaling)
                    const localCenterX = 25;
                    const localCenterY = 40;
                    const localSternX = 25;
                    const localSternY = 78;

                    // Stern position relative to center (for rotation)
                    const sternRelX = localSternX - localCenterX; // 0
                    const sternRelY = localSternY - localCenterY; // 38

                    // TopDownSailboatSVG uses COMPASS coordinates:
                    // - 0° = North (up), 90° = East (right), 180° = South (down), 270° = West (left)
                    // The boat's bow points in the direction of rotation.
                    // In the unrotated state (rotation=0), bow points up (North).
                    //
                    // SVG rotation is clockwise, which matches compass convention.
                    // Convert compass heading to radians for rotation matrix:
                    const compassHeading = boat.rotation;
                    const rotationRad = (compassHeading * Math.PI) / 180;

                    // Rotate stern position around center
                    // Standard 2D rotation (clockwise for positive angles in SVG):
                    // x' = x*cos(θ) - y*sin(θ)  -- but SVG Y is inverted
                    // For SVG with Y-down and clockwise rotation:
                    // x' = x*cos(θ) + y*sin(θ)
                    // y' = -x*sin(θ) + y*cos(θ)
                    const rotatedSternRelX = sternRelX * Math.cos(rotationRad) + sternRelY * Math.sin(rotationRad);
                    const rotatedSternRelY = -sternRelX * Math.sin(rotationRad) + sternRelY * Math.cos(rotationRad);

                    // Final stern position in SVG coordinates (after translation and scale)
                    const sternX = boat.x + (localCenterX + rotatedSternRelX) * scale;
                    const sternY = boat.y + (localCenterY + rotatedSternRelY) * scale;

                    pathPoints.push(`L ${sternX} ${sternY}`);

                    const pathD = pathPoints.join(' ');

                    return (
                      <Path
                        key={`tack-${boat.id}`}
                        d={pathD}
                        stroke={boat.color}
                        strokeWidth={2.5}
                        fill="none"
                        opacity={0.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </G>
              )}

              {/* Boats */}
              {currentStep.boats.map((boat, index) => renderBoat(boat, index))}

              {/* Step label overlay */}
              <G transform="translate(400, 30)">
                <Rect
                  x={-120}
                  y={-20}
                  width={240}
                  height={40}
                  fill="#1E293B"
                  rx={20}
                  opacity={0.9}
                />
                <SvgText
                  x={0}
                  y={5}
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="bold"
                  fill="#FFFFFF"
                >
                  {currentStep.label}
                </SvgText>
              </G>
            </Svg>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.navButton, currentStepIndex === 0 && styles.navButtonDisabled]}
              onPress={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <Ionicons name="chevron-back" size={20} color={currentStepIndex === 0 ? '#CBD5E1' : '#3B82F6'} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, currentStepIndex === RACE_OVERVIEW_STEPS.length - 1 && styles.navButtonDisabled]}
              onPress={handleNext}
              disabled={currentStepIndex === RACE_OVERVIEW_STEPS.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentStepIndex === RACE_OVERVIEW_STEPS.length - 1 ? '#CBD5E1' : '#3B82F6'}
              />
            </TouchableOpacity>
          </View>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {RACE_OVERVIEW_STEPS.map((step, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.stepDot,
                  index === currentStepIndex && styles.stepDotActive,
                  index < currentStepIndex && styles.stepDotComplete,
                ]}
                onPress={() => handleStepChange(index)}
              />
            ))}
          </View>
        </View>

        {/* Content section */}
        <View style={styles.contentSection}>
          <Text style={styles.stepTitle}>{currentStep.label}</Text>
          <Text style={styles.stepDescription}>{currentStep.description}</Text>

          {currentStep.details && currentStep.details.length > 0 && (
            <View style={styles.detailsList}>
              {currentStep.details.map((detail, index) => (
                <View key={index} style={styles.detailItem}>
                  <View style={styles.detailBullet}>
                    <Ionicons name="checkmark" size={12} color="#10B981" />
                  </View>
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
          )}

          {currentStep.proTip && (
            <View style={styles.proTipBox}>
              <View style={styles.proTipHeader}>
                <Ionicons name="bulb" size={18} color="#F59E0B" />
                <Text style={styles.proTipLabel}>Pro Tip</Text>
              </View>
              <Text style={styles.proTipText}>{currentStep.proTip}</Text>
            </View>
          )}
        </View>

        {/* Deep Dive Section */}
        <View style={styles.deepDiveSection}>
          <TouchableOpacity
            style={styles.deepDiveToggle}
            onPress={() => setShowDeepDive(!showDeepDive)}
          >
            <Ionicons name={showDeepDive ? 'chevron-up' : 'book'} size={20} color="#8B5CF6" />
            <Text style={styles.deepDiveToggleText}>
              {showDeepDive ? 'Hide Deep Dive' : 'Deep Dive: Learn More'}
            </Text>
            <Ionicons name={showDeepDive ? 'chevron-up' : 'chevron-down'} size={16} color="#8B5CF6" />
          </TouchableOpacity>

          {showDeepDive && (
            <View style={styles.deepDiveContent}>
              <Text style={styles.deepDiveTitle}>{DEEP_DIVE_CONTENT.title}</Text>

              {DEEP_DIVE_CONTENT.sections.map((section, index) => (
                <View key={index} style={styles.deepDiveItem}>
                  <Text style={styles.deepDiveSectionTitle}>{section.title}</Text>
                  <Text style={styles.deepDiveSectionContent}>{section.content}</Text>
                </View>
              ))}

              <View style={styles.deepDiveProTips}>
                <Text style={styles.deepDiveProTipsTitle}>Quick Tips for New Racers</Text>
                {DEEP_DIVE_CONTENT.proTips.map((tip, index) => (
                  <View key={index} style={styles.deepDiveProTipItem}>
                    <Ionicons name="flash" size={14} color="#F59E0B" />
                    <Text style={styles.deepDiveProTipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Quiz Prompt - show on last step */}
        {(isCompleted || currentStepIndex === RACE_OVERVIEW_STEPS.length - 1) && !showQuiz && (
          <View style={styles.quizPrompt}>
            <View style={styles.quizPromptContent}>
              <Ionicons name="school" size={32} color="#3B82F6" />
              <Text style={styles.quizPromptTitle}>Test Your Knowledge?</Text>
              <Text style={styles.quizPromptText}>
                Take a quick quiz to check your understanding of sailboat racing basics.
              </Text>
              <View style={styles.quizPromptButtons}>
                <TouchableOpacity
                  style={styles.quizPromptButtonSecondary}
                  onPress={() => onComplete?.()}
                >
                  <Text style={styles.quizPromptButtonSecondaryText}>Skip Quiz</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quizPromptButtonPrimary}
                  onPress={() => setShowQuiz(true)}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.quizPromptButtonPrimaryText}>Take Quiz</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Quiz Section */}
        {showQuiz && (
          <View style={styles.quizSection}>
            <Text style={styles.quizTitle}>Test Your Knowledge</Text>
            <Text style={styles.quizSubtitle}>
              Answer these questions to check your understanding.
            </Text>

            {WHAT_IS_SAILBOAT_RACING_QUIZ.map((question, qIndex) => {
              const answer = quizAnswers.find(a => a.questionId === question.id);

              return (
                <View key={question.id} style={styles.questionCard}>
                  <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                  <Text style={styles.questionText}>{question.question}</Text>

                  <View style={styles.optionsContainer}>
                    {question.options.map(option => {
                      const isSelected = answer?.selectedOptionId === option.id;
                      const showResult = isSelected && answer?.isCorrect !== null;

                      return (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionButton,
                            isSelected && styles.optionSelected,
                            showResult && answer?.isCorrect && styles.optionCorrect,
                            showResult && !answer?.isCorrect && styles.optionIncorrect,
                          ]}
                          onPress={() => handleQuizAnswer(question.id, option.id)}
                          disabled={answer?.isCorrect === true}
                        >
                          <Text
                            style={[styles.optionText, isSelected && styles.optionTextSelected]}
                          >
                            {option.text}
                          </Text>
                          {showResult && answer?.isCorrect && (
                            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                          )}
                          {showResult && !answer?.isCorrect && (
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {answer && (
                    <View
                      style={[
                        styles.feedbackBox,
                        answer.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
                      ]}
                    >
                      <View style={styles.feedbackHeader}>
                        <Ionicons
                          name={answer.isCorrect ? 'checkmark-circle' : 'bulb'}
                          size={20}
                          color={answer.isCorrect ? '#166534' : '#92400E'}
                        />
                        <Text
                          style={[
                            styles.feedbackTitle,
                            answer.isCorrect ? styles.feedbackTitleCorrect : styles.feedbackTitleIncorrect,
                          ]}
                        >
                          {answer.isCorrect ? 'Correct!' : 'Not quite - try again!'}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.feedbackText,
                          answer.isCorrect ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect,
                        ]}
                      >
                        {answer.isCorrect ? question.explanation : question.hint || 'Review the lesson and try again.'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Quiz Results */}
            {quizAnswers.length === WHAT_IS_SAILBOAT_RACING_QUIZ.length && (
              <View style={styles.quizResults}>
                <Text style={styles.quizResultsTitle}>Quiz Complete!</Text>
                <Text style={styles.quizResultsScore}>
                  You got {getQuizScore().correct} out of {getQuizScore().total} correct
                </Text>
                <View style={styles.quizResultsButtons}>
                  <TouchableOpacity style={styles.retryButton} onPress={resetQuiz}>
                    <Ionicons name="refresh" size={18} color="#3B82F6" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => onComplete?.()}
                  >
                    <Text style={styles.completeButtonText}>Complete Lesson</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Navigation to next lesson - show on last step */}
        {(isCompleted || currentStepIndex === RACE_OVERVIEW_STEPS.length - 1) && !showQuiz && (
          <View style={styles.navControls}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setCurrentStepIndex(0);
                setIsCompleted(false);
              }}
            >
              <Ionicons name="refresh" size={18} color="#3B82F6" />
              <Text style={styles.resetButtonText}>Watch Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextLessonButton} onPress={() => onComplete?.()}>
              <Text style={styles.nextLessonButtonText}>Next Lesson</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
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
    paddingBottom: 40,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  visualizationArea: {
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  svgContainer: {
    width: '100%',
    aspectRatio: 16 / 10,
    minHeight: 300,
    maxHeight: 500,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(59, 130, 246, 0.4)',
      },
      default: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  stepDotComplete: {
    backgroundColor: '#10B981',
  },
  contentSection: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailsList: {
    marginTop: 8,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  proTipBox: {
    marginTop: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  proTipLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  proTipText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Deep Dive
  deepDiveSection: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  deepDiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  deepDiveToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  deepDiveContent: {
    marginTop: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deepDiveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  deepDiveItem: {
    marginBottom: 16,
  },
  deepDiveSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 6,
  },
  deepDiveSectionContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  deepDiveProTips: {
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  deepDiveProTipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 10,
  },
  deepDiveProTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  deepDiveProTipText: {
    flex: 1,
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  // Quiz Prompt
  quizPrompt: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  quizPromptContent: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quizPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 12,
    marginBottom: 8,
  },
  quizPromptText: {
    fontSize: 14,
    color: '#3B82F6',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  quizPromptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quizPromptButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  quizPromptButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  quizPromptButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  quizPromptButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Quiz Section
  quizSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  quizSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionCorrect: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  optionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  optionTextSelected: {
    color: '#1E40AF',
    fontWeight: '500',
  },
  feedbackBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  feedbackCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  feedbackIncorrect: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackTitleCorrect: {
    color: '#166534',
  },
  feedbackTitleIncorrect: {
    color: '#92400E',
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 19,
  },
  feedbackTextCorrect: {
    color: '#166534',
  },
  feedbackTextIncorrect: {
    color: '#92400E',
  },
  quizResults: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  quizResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  quizResultsScore: {
    fontSize: 16,
    color: '#15803D',
    marginBottom: 16,
  },
  quizResultsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  retryButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  // Navigation controls
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  nextLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  nextLessonButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default WhatIsSailboatRacingInteractive;
