/**
 * Favored End Interactive Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Demonstrates methods for determining the favored end of the starting line
 * Includes Quiz and Deep Dive functionality
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Marker, Polygon, Pattern, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import type { FavoredEndCourseStep, FavoredEndQuizQuestion } from './data/favoredEndData';
import { FAVORED_END_STEPS, FAVORED_END_QUIZ, FAVORED_END_DEEP_DIVE } from './data/favoredEndData';
import { PowerboatSVG, TopDownSailboatSVG } from './shared';

const AnimatedG = Animated.createAnimatedComponent(G);

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

type ScreenSize = 'mobile' | 'tablet' | 'desktop';

function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  
  const screenSize: ScreenSize = useMemo(() => {
    if (width < BREAKPOINTS.tablet) return 'mobile';
    if (width < BREAKPOINTS.desktop) return 'tablet';
    return 'desktop';
  }, [width]);
  
  const isDesktop = screenSize === 'desktop';
  const isTablet = screenSize === 'tablet';
  const isMobile = screenSize === 'mobile';
  
  return { width, screenSize, isDesktop, isTablet, isMobile };
}

// Quiz Component
interface QuizProps {
  questions: FavoredEndQuizQuestion[];
  onComplete: () => void;
}

function Quiz({ questions, onComplete }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const selectedOption = currentQuestion.options.find(o => o.id === selectedAnswer);

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setShowResult(true);
    if (selectedOption?.isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    }
  };

  return (
    <View style={quizStyles.container}>
      <View style={quizStyles.header}>
        <Ionicons name="help-circle" size={24} color="#3B82F6" />
        <Text style={quizStyles.title}>Knowledge Check</Text>
      </View>
      
      <View style={quizStyles.progress}>
        <Text style={quizStyles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <View style={quizStyles.progressBar}>
          <View 
            style={[
              quizStyles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <Text style={quizStyles.question}>{currentQuestion.question}</Text>

      {!showHint && currentQuestion.hint && !showResult && (
        <TouchableOpacity style={quizStyles.hintButton} onPress={() => setShowHint(true)}>
          <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
          <Text style={quizStyles.hintButtonText}>Need a hint?</Text>
        </TouchableOpacity>
      )}

      {showHint && !showResult && (
        <View style={quizStyles.hintBox}>
          <Ionicons name="bulb" size={16} color="#F59E0B" />
          <Text style={quizStyles.hintText}>{currentQuestion.hint}</Text>
        </View>
      )}

      <View style={quizStyles.options}>
        {currentQuestion.options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isCorrect = option.isCorrect;
          
          let optionStyle = quizStyles.option;
          if (showResult) {
            if (isCorrect) {
              optionStyle = { ...quizStyles.option, ...quizStyles.optionCorrect };
            } else if (isSelected && !isCorrect) {
              optionStyle = { ...quizStyles.option, ...quizStyles.optionIncorrect };
            }
          } else if (isSelected) {
            optionStyle = { ...quizStyles.option, ...quizStyles.optionSelected };
          }

          return (
            <TouchableOpacity
              key={option.id}
              style={optionStyle}
              onPress={() => !showResult && setSelectedAnswer(option.id)}
              disabled={showResult}
            >
              <Text style={quizStyles.optionText}>{option.text}</Text>
              {showResult && isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {showResult && (
        <View style={quizStyles.explanation}>
          <Ionicons 
            name={selectedOption?.isCorrect ? "checkmark-circle" : "information-circle"} 
            size={20} 
            color={selectedOption?.isCorrect ? "#22C55E" : "#3B82F6"} 
          />
          <Text style={quizStyles.explanationText}>{currentQuestion.explanation}</Text>
        </View>
      )}

      <View style={quizStyles.actions}>
        {!showResult ? (
          <TouchableOpacity
            style={[quizStyles.submitButton, !selectedAnswer && quizStyles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedAnswer}
          >
            <Text style={quizStyles.submitButtonText}>Check Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={quizStyles.nextButton} onPress={handleNext}>
            <Text style={quizStyles.nextButtonText}>
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Deep Dive Panel Component
interface DeepDivePanelProps {
  visible: boolean;
  onClose: () => void;
  stepTitle: string;
  stepDetails: string[];
  proTip?: string;
}

function DeepDivePanel({ visible, onClose, stepTitle, stepDetails, proTip }: DeepDivePanelProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={deepDiveStyles.overlay}>
        <View style={deepDiveStyles.container}>
          <View style={deepDiveStyles.header}>
            <Text style={deepDiveStyles.title}>Deep Dive: {stepTitle}</Text>
            <TouchableOpacity onPress={onClose} style={deepDiveStyles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={deepDiveStyles.content}>
            {FAVORED_END_DEEP_DIVE.sections.map((section, idx) => (
              <View key={idx} style={deepDiveStyles.section}>
                <Text style={deepDiveStyles.sectionHeading}>{section.heading}</Text>
                <Text style={deepDiveStyles.sectionContent}>{section.content}</Text>
              </View>
            ))}
            
            <View style={deepDiveStyles.proTipsSection}>
              <Text style={deepDiveStyles.proTipsTitle}>💡 Pro Tips</Text>
              {FAVORED_END_DEEP_DIVE.proTips.map((tip, idx) => (
                <View key={idx} style={deepDiveStyles.proTipItem}>
                  <Text style={deepDiveStyles.proTipText}>• {tip}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
  const { screenSize, isDesktop, isTablet, isMobile } = useResponsiveLayout();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
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
  const windRotate = useSharedValue(0);
  const compassOpacity = useSharedValue(0);
  const secondaryLineOpacity = useSharedValue(0);
  
  // Track current wind angle for display (0 = wind from north/top)
  const [currentWindAngle, setCurrentWindAngle] = useState(0);
  
  // Track if boat should be animating (sailing parallel to line)
  const [isBoatSailing, setIsBoatSailing] = useState(false);
  // Track if boat is transitioning from sailing to stopped
  const [isBoatTransitioning, setIsBoatTransitioning] = useState(false);
  
  // Animation values for sailing
  const animatedBoatX = useSharedValue(0);
  const animatedBoatY = useSharedValue(0);
  const animatedBoatRotation = useSharedValue(90);
  
  // Track animated boat rotation for sail calculation
  const [animatedBoatRotationState, setAnimatedBoatRotationState] = useState(90);

  // Sailing animation - boat sails from port layline to starboard layline and back
  // CRITICAL: All three animations (X, Y, rotation) must have exactly the same total cycle time
  useEffect(() => {
    if (isBoatSailing) {
      const sailDuration = 5000; // Time to sail one direction
      const tackDuration = 1500; // Time for tacking turn (must be same for all animations)
      
      // Total cycle = 2 * (sailDuration + tackDuration) = 2 * 6500 = 13000ms
      
      // Layline positions at boat's Y level (y=450)
      const portLaylineX = 280;   // Near pin
      const starboardLaylineX = 680; // Near RC boat
      
      // Start at port layline facing east (starboard tack)
      animatedBoatRotation.value = 90;
      animatedBoatX.value = portLaylineX;
      animatedBoatY.value = 0;
      
      // Animate X: synchronized with rotation
      // Each segment must match the rotation timing exactly
      animatedBoatX.value = withRepeat(
        withSequence(
          // Sail east (while rotation holds at 90°)
          withTiming(starboardLaylineX, { duration: sailDuration, easing: Easing.linear }),
          // Hold at starboard layline during tack (while rotation goes 90° → -90°)
          withTiming(starboardLaylineX, { duration: tackDuration }),
          // Sail west (while rotation holds at -90°)
          withTiming(portLaylineX, { duration: sailDuration, easing: Easing.linear }),
          // Hold at port layline during tack (while rotation goes -90° → 90°)
          withTiming(portLaylineX, { duration: tackDuration })
        ),
        -1,
        false
      );
      
      // Animate Y: synchronized - boat moves north during tack
      animatedBoatY.value = withRepeat(
        withSequence(
          // Sailing straight east
          withTiming(0, { duration: sailDuration }),
          // Tacking at starboard layline - round up toward wind
          withTiming(-40, { duration: tackDuration * 0.5, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: tackDuration * 0.5, easing: Easing.in(Easing.ease) }),
          // Sailing straight west
          withTiming(0, { duration: sailDuration }),
          // Tacking at port layline - round up toward wind
          withTiming(-40, { duration: tackDuration * 0.5, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: tackDuration * 0.5, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      
      // Animate rotation: smooth tacking through head-to-wind
      // Tack duration split: 0.2 + 0.15 + 0.15 + 0.5 = 1.0 (must equal tackDuration)
      animatedBoatRotation.value = withRepeat(
        withSequence(
          // Sailing east on starboard tack (90°)
          withTiming(90, { duration: sailDuration }),
          // Tack at starboard layline: 90° → 0° → -90°
          withTiming(45, { duration: tackDuration * 0.2, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: tackDuration * 0.15, easing: Easing.linear }), // Head to wind
          withTiming(-45, { duration: tackDuration * 0.15, easing: Easing.linear }),
          withTiming(-90, { duration: tackDuration * 0.5, easing: Easing.in(Easing.ease) }),
          // Sailing west on port tack (-90°)
          withTiming(-90, { duration: sailDuration }),
          // Tack at port layline: -90° → 0° → 90°
          withTiming(-45, { duration: tackDuration * 0.2, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: tackDuration * 0.15, easing: Easing.linear }), // Head to wind
          withTiming(45, { duration: tackDuration * 0.15, easing: Easing.linear }),
          withTiming(90, { duration: tackDuration * 0.5, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      
      // Update rotation state for sail rendering
      const rotationInterval = setInterval(() => {
        setAnimatedBoatRotationState(animatedBoatRotation.value);
      }, 100);
      
      return () => {
        clearInterval(rotationInterval);
        cancelAnimation(animatedBoatX);
        cancelAnimation(animatedBoatY);
        cancelAnimation(animatedBoatRotation);
      };
    } else {
      cancelAnimation(animatedBoatX);
      cancelAnimation(animatedBoatY);
      cancelAnimation(animatedBoatRotation);
      animatedBoatX.value = 0;
      animatedBoatY.value = 0;
      animatedBoatRotation.value = 90;
      setAnimatedBoatRotationState(90);
      return undefined;
    }
  }, [isBoatSailing]);

  useEffect(() => {
    const visualState = currentStep.visualState || {};
    const duration = 1200;

    if (visualState.boat) {
      boatOpacity.value = withTiming(visualState.boat.opacity || 0, { duration });
      boatX.value = withTiming(visualState.boat.x || 0, { duration });
      boatY.value = withTiming(visualState.boat.y || 0, { duration });
      boatRotate.value = withTiming(visualState.boat.rotate || 0, { duration });
      
      // Check if boat is sailing parallel to line (rotate = 90)
      const isSailingParallel = visualState.boat.rotate === 90;
      
      // If transitioning FROM sailing TO non-sailing, smoothly animate the boat to the target position
      if (isBoatSailing && !isSailingParallel) {
        // Cancel the sailing animation
        cancelAnimation(animatedBoatX);
        cancelAnimation(animatedBoatY);
        cancelAnimation(animatedBoatRotation);
        
        // Mark as transitioning (keep using animated boat during transition)
        setIsBoatTransitioning(true);
        
        // Capture current position
        const startX = animatedBoatX.value;
        const startY = animatedBoatY.value;
        const startRotation = animatedBoatRotation.value;
        
        // Target position: midpoint (x=400), middle of boat just over the line, pointing at wind (rotate=0)
        const SAILING_BASE_Y = 360;
        const targetX = visualState.boat.x || 400;
        // Final Y position = 270 (ORANGE boat position - middle of boat just over the line)
        // targetY is relative to SAILING_BASE_Y, so: 270 - 360 = -90
        const targetY = -90;
        const targetRotation = visualState.boat.rotate || 0;
        
        // Manual frame-by-frame animation for precise control
        const totalDuration = 4000; // 4 seconds total
        const frameInterval = 30; // ~33fps
        const totalFrames = totalDuration / frameInterval;
        let currentFrame = 0;
        
        // Determine which direction the boat is facing (bow direction)
        // Positive rotation (e.g., 90°) = facing east, negative (e.g., -90°) = facing west
        const isFacingEast = startRotation > 0;
        
        // The boat must always move in the direction of its bow
        // We need to reach X=targetX (midpoint) before/during the turn
        // Then coast straight north (only Y changes) when pointing into the wind
        
        const animationInterval = setInterval(() => {
          currentFrame++;
          const progress = currentFrame / totalFrames;
          
          if (progress >= 1) {
            // Animation complete
            clearInterval(animationInterval);
            animatedBoatX.value = targetX;
            animatedBoatY.value = targetY;
            animatedBoatRotation.value = targetRotation;
            setAnimatedBoatRotationState(targetRotation);
            // Keep isBoatTransitioning TRUE to continue using animated position
            return;
          }
          
          // Phase 1 (0-50%): Sail bow-forward toward the midpoint X position
          // Phase 2 (50-80%): Round up into the wind - movement curves with the turn
          // Phase 3 (80-100%): Coast straight north (bow-first into wind) onto the line
          
          let newX: number;
          let newY: number;
          let newRotation: number;
          
          if (progress < 0.6) {
            // Phase 1: Sail bow-forward parallel to line for a longer distance
            const phaseProgress = progress / 0.6; // 0 to 1 within this phase
            // Sail a good distance (200 pixels) in bow direction before turning
            const sailDistance = 200;
            if (isFacingEast) {
              // Facing east - sail east
              newX = startX + sailDistance * phaseProgress;
            } else {
              // Facing west - sail west
              newX = startX - sailDistance * phaseProgress;
            }
            newY = startY; // Stay level while sailing parallel
            newRotation = startRotation; // Keep current heading
          } else if (progress < 0.85) {
            // Phase 2: Round up into the wind - the boat curves as it turns
            // Movement follows the bow direction as rotation changes
            const phaseProgress = (progress - 0.6) / 0.25; // 0 to 1 within this phase
            
            // Where Phase 1 ended
            const sailDistance = 200;
            const phase1EndX = isFacingEast ? startX + sailDistance : startX - sailDistance;
            
            // Rotation smoothly goes from startRotation toward 0
            newRotation = startRotation * (1 - phaseProgress);
            
            // Convert rotation to radians for movement calculation
            // 90° = pointing east, 0° = pointing north, -90° = pointing west
            const rotationRad = (newRotation * Math.PI) / 180;
            
            // Speed decreases as we turn into the wind (boat slows down)
            const speed = 3 * (1 - phaseProgress * 0.6); // Slowing down
            
            // Move in the direction of the bow - creates curved path
            const xMovement = Math.sin(rotationRad) * speed * phaseProgress * 40;
            const yMovement = -Math.cos(rotationRad) * speed * phaseProgress * 40;
            
            newX = phase1EndX + xMovement;
            newY = startY + yMovement;
          } else {
            // Phase 3: Coast straight north (into the wind) onto the line
            const phaseProgress = (progress - 0.85) / 0.15; // 0 to 1 within this phase
            
            // X moves to midpoint
            const sailDistance = 200;
            const phase1EndX = isFacingEast ? startX + sailDistance : startX - sailDistance;
            // Phase 2 ended with some X movement, estimate it
            const phase2EndX = phase1EndX + (isFacingEast ? 30 : -30);
            newX = phase2EndX + (targetX - phase2EndX) * phaseProgress;
            
            // Y: Phase 2 ended around -40 from start, now coast to target (-90)
            const phase2EndY = startY - 40;
            newY = phase2EndY + (targetY - phase2EndY) * phaseProgress;
            
            // Rotation stays at 0 (pointing into wind)
            newRotation = targetRotation;
          }
          
          animatedBoatX.value = newX;
          animatedBoatY.value = newY;
          animatedBoatRotation.value = newRotation;
          setAnimatedBoatRotationState(newRotation);
        }, frameInterval);
        
        // Safety cleanup - ensure final position is set
        // Keep isBoatTransitioning TRUE so we continue using the animated position
        setTimeout(() => {
          clearInterval(animationInterval);
          // Force final position to be correct (Y=270 on screen, which is targetY=-90 relative to base 360)
          animatedBoatX.value = targetX;
          animatedBoatY.value = targetY; // -90, so screen Y = 360 + (-90) = 270
          animatedBoatRotation.value = targetRotation;
          setAnimatedBoatRotationState(targetRotation);
          // DON'T set isBoatTransitioning to false - keep using animated position!
        }, totalDuration + 100);
      }
      
      setIsBoatSailing(isSailingParallel);
    } else {
      setIsBoatSailing(false);
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
      windRotate.value = withTiming(visualState.windArrow.rotate ?? 0, { duration });
      setCurrentWindAngle(visualState.windArrow.rotate ?? 0);
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
  }));
  
  // Animated props for sailing boat - combines position and rotation
  // Boat pivots around its center (25, 40)
  // Base Y of 360 puts the boat about 60 pixels below the start line (y=300)
  const SAILING_BASE_Y = 360;
  const sailingBoatProps = useAnimatedProps(() => ({
    opacity: 1,
    transform: `translate(${animatedBoatX.value}, ${SAILING_BASE_Y + animatedBoatY.value}) rotate(${animatedBoatRotation.value}, 25, 40)`,
  }));

  const handleNext = () => {
    if (currentStepIndex < FAVORED_END_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      // Reset transitioning state for new step (unless it will trigger a new transition)
      setIsBoatTransitioning(false);
      setCurrentStepIndex(nextIndex);
      onStepChange?.(FAVORED_END_STEPS[nextIndex]);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      // Reset transitioning state for new step
      setIsBoatTransitioning(false);
      setCurrentStepIndex(prevIndex);
      onStepChange?.(FAVORED_END_STEPS[prevIndex]);
    }
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    onComplete?.();
  };

  const startLineState = currentStep.visualState.startLineGraphic || { x1: 200, y1: 200, x2: 600, y2: 200 };
  const secondaryLineState = currentStep.visualState.secondaryLineGraphic;
  const compassState = currentStep.visualState.compass;
  const boatState = currentStep.visualState.boat || { x: 0, y: 0, rotate: 0 };

  // Context panel content based on current step
  const getContextContent = () => {
    const isMethod1 = currentStepIndex >= 0 && currentStepIndex <= 6;
    const isMethod2 = currentStepIndex >= 7;
    
    return {
      icon: isMethod1 ? 'eye-outline' as const : 'compass-outline' as const,
      method: isMethod1 ? 'Sight Method' : 'Compass Method',
      highlight: currentStep.label,
      visual: isMethod1 ? '👀' : '🧭',
    };
  };

  const contextContent = getContextContent();

  // Responsive styles
  const responsiveStyles = {
    mainContentArea: {
      flexDirection: (isDesktop || isTablet) ? 'row' as const : 'column' as const,
      gap: isDesktop ? 16 : 12,
    },
    svgContainer: {
      flex: isDesktop ? 2 : undefined,
      minHeight: isDesktop ? 450 : isTablet ? 350 : 280,
      maxHeight: isDesktop ? 550 : isTablet ? 400 : 320,
      aspectRatio: isMobile ? 4/3 : undefined,
    },
    contextPanel: {
      flex: isDesktop ? 1 : undefined,
      minWidth: isDesktop ? 260 : undefined,
      maxWidth: isDesktop ? 300 : undefined,
      marginTop: (isDesktop || isTablet) ? 0 : 12,
      display: isMobile ? 'none' as const : 'flex' as const,
    },
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Main Content Area */}
        <View style={[styles.mainContentArea, responsiveStyles.mainContentArea]}>
          {/* SVG Visualization */}
          <View style={[styles.svgContainer, responsiveStyles.svgContainer]}>
            <Svg width="100%" height="100%" viewBox="0 0 800 500">
              <Defs>
                <Marker id="arrowhead-favored" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <Polygon points="0,0 10,3.5 0,7" fill="#000" />
                </Marker>
                <Pattern id="water-texture-fe" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <Path d="M0 50 Q25 45, 50 50 T100 50" stroke="#8BC4E8" strokeWidth="0.5" fill="none" opacity={0.3} />
                  <Path d="M0 60 Q25 55, 50 60 T100 60" stroke="#6BA3CC" strokeWidth="0.5" fill="none" opacity={0.2} />
                </Pattern>
              </Defs>

              {/* Water background */}
              <Rect width="800" height="500" fill="#aaccff" />
              <Rect width="800" height="500" fill="url(#water-texture-fe)" />

              {/* Step indicator */}
              <G transform="translate(40, 30)">
                <Rect x="0" y="0" width="120" height="36" rx="8" fill="white" opacity={0.9} />
                <SvgText x="60" y="24" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1E293B">
                  Step {currentStepIndex + 1} of {FAVORED_END_STEPS.length}
                </SvgText>
              </G>

              {/* Compass Rose */}
              <G transform="translate(400, 80)">
                <Circle cx="0" cy="0" r="50" fill="white" opacity={0.4} />
                <Circle cx="0" cy="0" r="40" fill="white" opacity={0.6} />
                <SvgText x="0" y="-30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">N</SvgText>
                <SvgText x="0" y="36" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">S</SvgText>
                <SvgText x="-34" y="4" textAnchor="end" fontSize="10" fontWeight="bold" fill="#475569">W</SvgText>
                <SvgText x="34" y="4" textAnchor="start" fontSize="10" fontWeight="bold" fill="#475569">E</SvgText>
                <Circle cx="0" cy="0" r="20" fill="white" opacity={0.9} />
                <SvgText x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1E293B">
                  {currentWindAngle}°
                </SvgText>
              </G>

              {/* Wind arrow - points down (south) when rotation is 0 */}
              <G transform={`translate(400, 80) rotate(${currentWindAngle})`}>
                <Line x1="0" y1="-20" x2="0" y2="20" stroke="#000" strokeWidth="3" markerEnd="url(#arrowhead-favored)" />
                <SvgText x="0" y="-32" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
                  WIND
                </SvgText>
              </G>

              {/* Laylines - both extend southeast (parallel close-hauled courses) */}
              <G opacity={0.35}>
                {/* Port layline from Pin extending southeast */}
                <Line x1="200" y1="300" x2="350" y2="480" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="8,4" />
                {/* Starboard layline from RC boat extending southeast */}
                <Line x1="600" y1="300" x2="750" y2="480" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="8,4" />
                <SvgText x="290" y="410" textAnchor="middle" fontSize="10" fill="#EF4444" opacity={0.8}>Port Layline</SvgText>
                <SvgText x="690" y="410" textAnchor="middle" fontSize="10" fill="#22C55E" opacity={0.8}>Stbd Layline</SvgText>
              </G>

              {/* Start line */}
              <Line
                x1={startLineState.x1}
                y1={(startLineState.y1 || 200) + 100}
                x2={startLineState.x2}
                y2={(startLineState.y2 || 200) + 100}
                stroke="black"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <SvgText x="400" y="320" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000">
                Start Line
              </SvgText>
              
              {/* Midpoint marker on start line */}
              <G opacity={0.7}>
                {/* Vertical tick mark at midpoint */}
                <Line x1="400" y1="295" x2="400" y2="305" stroke="#6366F1" strokeWidth="2" />
                {/* Small circle at midpoint */}
                <Circle cx="400" cy="300" r="4" fill="#6366F1" stroke="white" strokeWidth="1" />
                {/* Midpoint label */}
                <SvgText x="400" y="285" textAnchor="middle" fontSize="10" fontWeight="600" fill="#6366F1">
                  Midpoint
                </SvgText>
              </G>

              {/* Secondary line (shifted) */}
              {secondaryLineState && secondaryLineState.opacity && (
                <G transform={`translate(400, 300) rotate(${secondaryLineState.rotate || 0})`}>
                  <Line
                    x1="-200"
                    y1="0"
                    x2="200"
                    y2="0"
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity={0.7}
                  />
                  {secondaryLineState.label && (
                    <SvgText x="0" y="-15" textAnchor="middle" fontSize="11" fontWeight="600" fill="#EF4444">
                      {secondaryLineState.label}
                    </SvgText>
                  )}
                </G>
              )}

              {/* Pin end */}
              <Circle cx="200" cy="300" r="10" fill="orange" stroke="black" strokeWidth="2" />
              <SvgText x="200" y="335" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
                Pin
              </SvgText>

              {/* RC Boat */}
              <G transform="translate(590, 290)">
                <PowerboatSVG rotation={0} hideInfoBoard={true} scale={0.8} />
              </G>

              {/* Sailboat - animated when sailing parallel to line or transitioning */}
              {(isBoatSailing || isBoatTransitioning) ? (
                <AnimatedG animatedProps={sailingBoatProps}>
                  <TopDownSailboatSVG 
                    hullColor="#3B82F6" 
                    rotation={animatedBoatRotationState}
                    scale={0.8} 
                    showWake={true}
                    externalRotation={true}
                    windDirection={currentWindAngle}
                  />
                </AnimatedG>
              ) : (
                <G transform={`translate(${boatState.x}, ${(boatState.y || 0) + 50}) rotate(${boatState.rotate || 0}, 25, 40)`}>
                  <TopDownSailboatSVG 
                    hullColor="#3B82F6" 
                    rotation={boatState.rotate || 0}
                    scale={0.8} 
                    showWake={false}
                    externalRotation={true}
                    windDirection={currentWindAngle}
                  />
                </G>
              )}

              {/* Compass display when active */}
              {compassState && compassState.opacity && (
                <G transform="translate(100, 400)">
                  <Rect x="-60" y="-25" width="120" height="50" rx="8" fill="white" opacity={0.95} />
                  <SvgText x="0" y="-5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E293B">
                    Line: {compassState.lineHeading}°
                  </SvgText>
                  <SvgText x="0" y="15" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3B82F6">
                    Wind: {compassState.windHeading}°
                  </SvgText>
                </G>
              )}
            </Svg>
          </View>

          {/* Context Panel */}
          <View style={[styles.contextPanel, responsiveStyles.contextPanel]}>
            <View style={styles.contextHeader}>
              <View style={styles.contextIconContainer}>
                <Ionicons name={contextContent.icon} size={28} color="#3B82F6" />
              </View>
              <Text style={styles.contextVisual}>{contextContent.visual}</Text>
            </View>
            
            <View style={styles.contextHighlightBox}>
              <Text style={styles.contextMethodText}>{contextContent.method}</Text>
            </View>
            
            <Text style={styles.contextHighlightLabel}>{contextContent.highlight}</Text>

            {/* Legend */}
            <View style={styles.contextLegend}>
              <Text style={styles.contextLegendTitle}>Legend</Text>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Your Boat</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: 'orange' }]} />
                <Text style={styles.legendText}>Pin Buoy</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#64748B' }]} />
                <Text style={styles.legendText}>RC Boat</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDashed, { borderColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Shifted Line (bias)</Text>
              </View>
            </View>

            {/* Wind Info */}
            <View style={styles.windInfoBox}>
              <Ionicons name="arrow-down-outline" size={20} color="#1E293B" style={{ transform: [{ rotate: `${currentWindAngle}deg` }] }} />
              <View>
                <Text style={styles.windInfoLabel}>Wind Direction</Text>
                <Text style={styles.windInfoValue}>{currentWindAngle}°</Text>
              </View>
            </View>
          </View>
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

          {/* Pro Tip */}
          {currentStep.proTip && (
            <View style={styles.proTipContainer}>
              <View style={styles.proTipHeader}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.proTipLabel}>Pro Tip</Text>
              </View>
              <Text style={styles.proTipText}>{currentStep.proTip}</Text>
            </View>
          )}
        </View>

        {/* Deep Dive Button */}
        <TouchableOpacity style={styles.deepDiveButton} onPress={() => setShowDeepDive(true)}>
          <Ionicons name="book-outline" size={18} color="#3B82F6" />
          <Text style={styles.deepDiveButtonText}>Deep Dive</Text>
        </TouchableOpacity>

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

          <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary]} onPress={handleNext}>
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              {currentStepIndex === FAVORED_END_STEPS.length - 1 ? 'Complete' : 'Next'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Completion Badge */}
        {quizCompleted && (
          <View style={styles.completionBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={styles.completionText}>Lesson Completed!</Text>
          </View>
        )}
      </View>

      {/* Quiz Section */}
      <View style={styles.quizSection}>
        <View style={styles.quizSectionHeader}>
          <Ionicons name="school-outline" size={24} color="#3B82F6" />
          <Text style={styles.quizSectionTitle}>Test Your Knowledge</Text>
        </View>
        <Text style={styles.quizSectionSubtitle}>
          Answer these questions to reinforce what you've learned about finding the favored end.
        </Text>
        <Quiz questions={FAVORED_END_QUIZ} onComplete={handleQuizComplete} />
      </View>

      {/* Deep Dive Panel */}
      <DeepDivePanel
        visible={showDeepDive}
        onClose={() => setShowDeepDive(false)}
        stepTitle={currentStep.label}
        stepDetails={currentStep.details || []}
        proTip={currentStep.proTip}
      />
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
  mainContentArea: {
    marginBottom: 16,
  },
  svgContainer: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    overflow: 'hidden',
  },
  contextPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contextIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextVisual: {
    fontSize: 32,
  },
  contextHighlightBox: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  contextMethodText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  contextHighlightLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 12,
  },
  contextLegend: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginBottom: 12,
  },
  contextLegendTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendDashed: {
    width: 14,
    height: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 11,
    color: '#475569',
  },
  windInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  windInfoLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  windInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
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
  proTipContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  proTipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  proTipText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  deepDiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  deepDiveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
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
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  quizSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 8,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(59, 130, 246, 0.1)' }
      : {
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  quizSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  quizSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  quizSectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
});

const quizStyles = StyleSheet.create({
  container: {
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  progress: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 24,
    marginBottom: 16,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  hintButtonText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '500',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 12,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  options: {
    gap: 10,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
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
    lineHeight: 20,
  },
  explanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 16,
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  actions: {
    alignItems: 'stretch',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

const deepDiveStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.15)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
        }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  proTipsSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  proTipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  proTipItem: {
    marginBottom: 8,
  },
  proTipText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 20,
  },
});
