/**
 * Line Bias Interactive Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Demonstrates how wind shifts create line bias
 * Includes Quiz and Deep Dive functionality
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView, Modal, useWindowDimensions } from 'react-native';

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
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line, Circle, Text as SvgText, Path, Defs, Marker, Polygon, Rect, Pattern } from 'react-native-svg';
import type { LineBiasStep, LineBiasQuizQuestion } from './data/lineBiasData';
import { LINE_BIAS_SEQUENCE_STEPS, LINE_BIAS_QUIZ, LINE_BIAS_DEEP_DIVE } from './data/lineBiasData';
import { PowerboatSVG, TopDownSailboatSVG } from './shared';

// Note: AnimatedG removed to avoid crashes on Android New Architecture
// Using state-driven transforms instead

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

// Quiz Component
interface QuizProps {
  questions: LineBiasQuizQuestion[];
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

  const handleAnswer = (optionId: string) => {
    if (showResult) return;
    setSelectedAnswer(optionId);
  };

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

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setShowHint(false);
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
              onPress={() => handleAnswer(option.id)}
              disabled={showResult}
            >
              <Text style={quizStyles.optionText}>{option.text}</Text>
              {showResult && isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              )}
              {showResult && isSelected && !isCorrect && (
                <Ionicons name="close-circle" size={20} color="#EF4444" />
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={deepDiveStyles.overlay}>
        <View style={deepDiveStyles.container}>
          <View style={deepDiveStyles.header}>
            <View style={deepDiveStyles.headerLeft}>
              <Ionicons name="book" size={24} color="#3B82F6" />
              <Text style={deepDiveStyles.headerTitle}>Deeper Dive</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={deepDiveStyles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={deepDiveStyles.content}>
            <Text style={deepDiveStyles.stepTitle}>{stepTitle}</Text>
            <View style={deepDiveStyles.divider} />

            {stepDetails.map((detail, index) => (
              <View key={index} style={deepDiveStyles.detailItem}>
                <View style={deepDiveStyles.detailIcon}>
                  <Ionicons name="bulb" size={16} color="#F59E0B" />
                </View>
                <Text style={deepDiveStyles.detailText}>{detail}</Text>
              </View>
            ))}

            {proTip && (
              <View style={deepDiveStyles.proTipBox}>
                <View style={deepDiveStyles.proTipHeader}>
                  <Ionicons name="star" size={16} color="#3B82F6" />
                  <Text style={deepDiveStyles.proTipLabel}>Pro Tip</Text>
                </View>
                <Text style={deepDiveStyles.proTipText}>{proTip}</Text>
              </View>
            )}

            <View style={deepDiveStyles.masterySection}>
              <Text style={deepDiveStyles.masteryTitle}>Mastering Line Bias</Text>
              <Text style={deepDiveStyles.masteryText}>
                {LINE_BIAS_DEEP_DIVE.introduction}
              </Text>
              
              {LINE_BIAS_DEEP_DIVE.sections.slice(0, 2).map((section, index) => (
                <View key={index} style={deepDiveStyles.sectionItem}>
                  <Text style={deepDiveStyles.sectionTitle}>{section.title}</Text>
                  <Text style={deepDiveStyles.sectionContent}>{section.content}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={deepDiveStyles.gotItButton} onPress={onClose}>
            <Text style={deepDiveStyles.gotItText}>Got it, back to lesson</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
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
  const { screenSize, isDesktop, isTablet, isMobile } = useResponsiveLayout();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
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

  // State-driven transforms for boats and effects (avoids AnimatedG crash on Android New Architecture)
  const [blueBoatTransform, setBlueBoatTransform] = useState(`translate(${currentStep.blueStart?.x || 480}, ${currentStep.blueStart?.y || 250}) rotate(${currentStep.blueStart?.rotate || -45}, 25, 40)`);
  const [redBoatTransform, setRedBoatTransform] = useState(`translate(${currentStep.redStart?.x || 320}, ${currentStep.redStart?.y || 250}) rotate(${currentStep.redStart?.rotate || -45}, 25, 40)`);
  const [ghostWindOpacityState, setGhostWindOpacityState] = useState(0);
  const [shiftTextOpacityState, setShiftTextOpacityState] = useState(0);
  const [effectiveLineOpacityState, setEffectiveLineOpacityState] = useState(0);

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

    // Always show effective line - parallel to start line when square (0°), rotated when biased
    effectiveLineRotate.value = withTiming(newAngle, transition);
    effectiveLineOpacity.value = withTiming(0.5, transition);
    
    // Animate wind shift indicator (ghost wind, arc, shift text)
    if (newAngle !== previousAngle) {
      ghostWindRotate.value = previousAngle;
      ghostWindOpacity.value = withTiming(0.3, { duration: 500 });
      windRotate.value = withTiming(newAngle, transition);
      shiftTextOpacity.value = withTiming(1, { duration: 500, delay: 500 });
    } else {
      ghostWindOpacity.value = withTiming(0, { duration: 500 });
      shiftTextOpacity.value = withTiming(0, { duration: 100 });
      windRotate.value = newAngle;
    }
    setPreviousAngle(newAngle);
  }, [currentStep, previousAngle]);

  const windShift = currentWindAngle - previousAngle;
  const arcPath = useMemo(() => {
    if (windShift === 0) return '';
    return describeArc(400, 120, 60, previousAngle - 90, currentWindAngle - 90);
  }, [previousAngle, currentWindAngle, windShift]);

  const midAngle = (previousAngle + currentWindAngle) / 2 - 90;
  const textPos = {
    x: 400 + 80 * Math.cos((midAngle * Math.PI) / 180),
    y: 120 + 80 * Math.sin((midAngle * Math.PI) / 180),
  };

  // Format wind angle for compass display (0-360 degrees)
  const compassWindAngle = useMemo(() => {
    let angle = Math.round(currentWindAngle);
    // Convert to 0-360 range
    if (angle < 0) {
      angle = 360 + angle;
    }
    return angle === 360 ? 0 : angle;
  }, [currentWindAngle]);

  const formattedWindAngle = useMemo(() => {
    const angle = Math.abs(currentWindAngle);
    return `${angle}° ${currentWindAngle < 0 ? 'left' : currentWindAngle > 0 ? 'right' : ''}`;
  }, [currentWindAngle]);

  // Sync boat positions to state using useDerivedValue (avoids AnimatedG crash on Android New Architecture)
  useDerivedValue(() => {
    runOnJS(setBlueBoatTransform)(`translate(${blueBoatX.value}, ${blueBoatY.value}) rotate(${blueBoatRotate.value}, 25, 40)`);
    return null;
  }, []);

  useDerivedValue(() => {
    runOnJS(setRedBoatTransform)(`translate(${redBoatX.value}, ${redBoatY.value}) rotate(${redBoatRotate.value}, 25, 40)`);
    return null;
  }, []);

  useDerivedValue(() => {
    runOnJS(setGhostWindOpacityState)(ghostWindOpacity.value);
    return null;
  }, []);

  useDerivedValue(() => {
    runOnJS(setShiftTextOpacityState)(shiftTextOpacity.value);
    return null;
  }, []);

  useDerivedValue(() => {
    runOnJS(setEffectiveLineOpacityState)(effectiveLineOpacity.value);
    return null;
  }, []);

  // For SVG on web, we need to use transform string format
  const windTransform = `rotate(${currentWindAngle})`;
  const ghostWindTransform = `rotate(${previousAngle})`;
  const effectiveLineTransform = `rotate(${currentWindAngle})`;

  const handleNext = () => {
    if (currentStepIndex < LINE_BIAS_SEQUENCE_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(LINE_BIAS_SEQUENCE_STEPS[nextIndex]);
    } else {
      // Mark lesson complete - quiz is always visible at bottom
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

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    setShowQuiz(false);
    onComplete?.();
  };

  // Context panel content based on current step
  const getContextContent = () => {
    const stepContexts = [
      { // Step 1: Why Line Bias Matters
        icon: 'compass-outline' as const,
        highlight: 'Line Bias = Advantage',
        keyPoint: 'One end of the starting line is usually closer to the wind than the other.',
        visual: '🎯',
        animation: 'Watch the boats positioning below the line',
      },
      { // Step 2: A Perfectly Square Line
        icon: 'navigate-outline' as const,
        highlight: 'Perpendicular = Fair',
        keyPoint: 'A "square" line is exactly 90° to the wind direction.',
        visual: '📐',
        animation: 'Both boats cross at the same distance to mark',
      },
      { // Step 3: Square Line - Equal Progress
        icon: 'swap-horizontal-outline' as const,
        highlight: 'Equal Progress',
        keyPoint: 'With no bias, both boats make equal progress upwind. Their paths are parallel.',
        visual: '⚖️',
        animation: 'Both boats sailing upwind at same rate',
      },
      { // Step 4: 10-Degree Wind Shift LEFT
        icon: 'arrow-back-outline' as const,
        highlight: 'Wind Shifts Left 10°',
        keyPoint: 'When wind shifts LEFT, the port/pin end becomes favored. Watch the effective line tilt!',
        visual: '⬅️',
        animation: 'Wind arrow rotates, effective line tilts, red boat gains',
      },
      { // Step 5: Quantifying the Advantage
        icon: 'calculator-outline' as const,
        highlight: '~90 ft/degree/mile',
        keyPoint: 'A 10° shift = ~920 feet advantage over a 1-mile leg! Red boat is now ahead.',
        visual: '📊',
        animation: 'Red boat pulls ahead due to favorable position',
      },
      { // Step 6: The Effective Line
        icon: 'analytics-outline' as const,
        highlight: 'Effective Line',
        keyPoint: 'The "effective line" is perpendicular to the wind. The pin end is now AHEAD of this line.',
        visual: '📏',
        animation: 'See how the dashed red line shows the true advantage',
      },
      { // Step 7: Detection Methods
        icon: 'eye-outline' as const,
        highlight: 'Two Detection Methods',
        keyPoint: 'Head-to-wind sight method or compass bearing method to check bias.',
        visual: '👀',
        animation: 'Boats checking the line from middle of course',
      },
      { // Step 8: Practical Application
        icon: 'checkmark-done-outline' as const,
        highlight: 'Check Multiple Times',
        keyPoint: 'Wind shifts constantly—check bias at warning, prep, and 1 minute before start.',
        visual: '🔄',
        animation: 'Final approach positioning for the start',
      },
    ];
    return stepContexts[currentStepIndex] || stepContexts[0];
  };

  const contextContent = getContextContent();

  // Responsive styles based on screen size
  const responsiveStyles = {
    mainContentArea: {
      flexDirection: (isDesktop || isTablet) ? 'row' as const : 'column' as const,
      gap: isDesktop ? 16 : 12,
    },
    svgContainer: {
      flex: isDesktop ? 2 : undefined,
      minHeight: isDesktop ? 500 : isTablet ? 400 : 280,
      maxHeight: isDesktop ? 600 : isTablet ? 450 : 320,
      aspectRatio: isMobile ? 4/3 : undefined,
    },
    contextPanel: {
      flex: isDesktop ? 1 : undefined,
      minWidth: isDesktop ? 280 : undefined,
      maxWidth: isDesktop ? 320 : undefined,
      marginTop: (isDesktop || isTablet) ? 0 : 12,
      display: isMobile ? 'none' as const : 'flex' as const, // Hide on mobile, show summary instead
    },
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Main Content Area - Animation + Context Panel */}
        <View style={[styles.mainContentArea, responsiveStyles.mainContentArea]}>
          {/* SVG Visualization - Left/Main */}
          <View style={[styles.svgContainer, responsiveStyles.svgContainer]}>
            <Svg width="100%" height="100%" viewBox="0 0 900 550" preserveAspectRatio="xMidYMid meet">
          <Defs>
            <Marker id="arrowhead-bias" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <Polygon points="0,0 10,3.5 0,7" fill="#000" />
            </Marker>
            <Pattern id="water-texture-lb" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <Path d="M0 50 Q25 45, 50 50 T100 50" stroke="#8BC4E8" strokeWidth="0.5" fill="none" opacity={0.3} />
              <Path d="M0 60 Q25 55, 50 60 T100 60" stroke="#6BA3CC" strokeWidth="0.5" fill="none" opacity={0.2} />
            </Pattern>
          </Defs>

            {/* Water background */}
            <Rect width="900" height="550" fill="#aaccff" />
            <Rect width="900" height="550" fill="url(#water-texture-lb)" />
            
            {/* Laylines - both extend southeast (parallel close-hauled courses) */}
          <G opacity={0.35}>
              {/* Port layline from Pin extending southeast (parallel to starboard layline) */}
              <Line x1="200" y1="350" x2="350" y2="500" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="8,4" />
              {/* Starboard layline from Committee boat extending southeast */}
              <Line x1="600" y1="350" x2="750" y2="500" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="8,4" />
              <SvgText x="290" y="440" textAnchor="middle" fontSize="10" fill="#EF4444" opacity={0.8}>Port Layline</SvgText>
              <SvgText x="690" y="440" textAnchor="middle" fontSize="10" fill="#22C55E" opacity={0.8}>Starboard Layline</SvgText>
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

            {/* Committee boat */}
          <G transform="translate(590, 340)">
            <PowerboatSVG rotation={currentWindAngle} hideInfoBoard={true} scale={0.7} />
          </G>

            {/* Compass Rose with Wind Indicator */}
            <G transform="translate(400, 120)">
              {/* Outer compass circle */}
              <Circle cx="0" cy="0" r="70" fill="white" opacity={0.3} />
              {/* Inner compass circle */}
              <Circle cx="0" cy="0" r="55" fill="white" opacity={0.5} />
              
              {/* Cardinal direction labels */}
              <SvgText x="0" y="-45" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#475569">N</SvgText>
              <SvgText x="0" y="52" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#475569">S</SvgText>
              <SvgText x="-48" y="4" textAnchor="end" fontSize="11" fontWeight="bold" fill="#475569">W</SvgText>
              <SvgText x="48" y="4" textAnchor="start" fontSize="11" fontWeight="bold" fill="#475569">E</SvgText>
              
              {/* Wind angle display in center */}
              <Circle cx="0" cy="0" r="28" fill="white" opacity={0.9} />
              <SvgText x="0" y="7" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1E293B">
                {compassWindAngle}°
          </SvgText>
            </G>

            {/* Ghost wind (previous position) - shows where wind was before shift */}
            {windShift !== 0 && (
              <G transform={`translate(400, 120) ${ghostWindTransform}`} opacity={ghostWindOpacityState}>
                <Line x1="0" y1="-75" x2="0" y2="-55" stroke="#999" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrowhead-bias)" />
              </G>
            )}

            {/* Current wind arrow - rotates with wind shift */}
            <G transform={`translate(400, 120) ${windTransform}`}>
              <Line x1="0" y1="-75" x2="0" y2="-55" stroke="#000" strokeWidth="3" markerEnd="url(#arrowhead-bias)" />
              <SvgText x="0" y="-82" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
                WIND
              </SvgText>
            </G>

          {/* Wind shift arc */}
          {windShift !== 0 && (
              <Path d={arcPath} stroke="#3B82F6" strokeWidth="2" fill="none" strokeDasharray="5,5" />
          )}

          {/* Shift text */}
          {windShift !== 0 && (
            <G opacity={shiftTextOpacityState}>
              <SvgText x={textPos.x} y={textPos.y} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#3B82F6">
                {windShift > 0 ? `+${windShift}°` : `${windShift}°`}
              </SvgText>
            </G>
          )}

            {/* Effective line - rotates to stay perpendicular to wind */}
            <G transform={`translate(400, 350) ${effectiveLineTransform}`} opacity={effectiveLineOpacityState}>
              <Line x1="-200" y1="0" x2="200" y2="0" stroke="#EF4444" strokeWidth="2" strokeDasharray="10,5" />
              <SvgText x="0" y="-10" textAnchor="middle" fontSize="12" fontWeight="600" fill="#EF4444">
                Effective Line
              </SvgText>
            </G>

            {/* Blue boat - starboard side */}
          <G transform={blueBoatTransform}>
            <TopDownSailboatSVG
              hullColor="#3B82F6"
              rotation={blueBoatRotation}
              scale={0.9}
              showWake={true}
              externalRotation={true}
              windDirection={currentWindAngle}
            />
          </G>

            {/* Red boat - port side */}
          <G transform={redBoatTransform}>
            <TopDownSailboatSVG
              hullColor="#EF4444"
              rotation={redBoatRotation}
              scale={0.9}
              showWake={true}
              externalRotation={true}
              windDirection={currentWindAngle}
            />
          </G>

            {/* Step indicator in SVG */}
            <G transform="translate(40, 30)">
              <Rect x="0" y="0" width="120" height="36" rx="8" fill="white" opacity={0.9} />
              <SvgText x="60" y="24" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1E293B">
                Step {currentStepIndex + 1} of {LINE_BIAS_SEQUENCE_STEPS.length}
              </SvgText>
            </G>
        </Svg>
          </View>

          {/* Context Panel - Right side on web */}
          <View style={styles.contextPanel}>
            <View style={styles.contextHeader}>
              <View style={styles.contextIconContainer}>
                <Ionicons name={contextContent.icon} size={28} color="#3B82F6" />
              </View>
              <Text style={styles.contextVisual}>{contextContent.visual}</Text>
            </View>
            
            <View style={styles.contextHighlightBox}>
              <Text style={styles.contextHighlightText}>{contextContent.highlight}</Text>
            </View>
            
            <Text style={styles.contextKeyPoint}>{contextContent.keyPoint}</Text>
            
            <View style={styles.contextAnimationHint}>
              <Ionicons name="eye-outline" size={16} color="#64748B" />
              <Text style={styles.contextAnimationText}>{contextContent.animation}</Text>
            </View>

            {/* Visual Legend */}
            <View style={styles.contextLegend}>
              <Text style={styles.contextLegendTitle}>Legend</Text>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Blue Boat (Starboard End)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Red Boat (Port End)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#000' }]} />
                <Text style={styles.legendText}>Start Line</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDashed, { borderColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Effective Line (bias)</Text>
              </View>
            </View>

            {/* Wind Info */}
            <View style={styles.windInfoBox}>
              <Ionicons name="arrow-down-outline" size={20} color="#1E293B" style={{ transform: [{ rotate: `${currentWindAngle}deg` }] }} />
              <View>
                <Text style={styles.windInfoLabel}>Current Wind</Text>
                <Text style={styles.windInfoValue}>{compassWindAngle}°</Text>
              </View>
              {windShift !== 0 && (
                <View style={styles.windShiftBadge}>
                  <Text style={styles.windShiftText}>
                    {windShift > 0 ? `+${windShift}°` : `${windShift}°`}
                  </Text>
                </View>
              )}
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
            Step {currentStepIndex + 1} of {LINE_BIAS_SEQUENCE_STEPS.length}
          </Text>
        </View>

          <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary]} onPress={handleNext}>
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              {currentStepIndex === LINE_BIAS_SEQUENCE_STEPS.length - 1 ? 'Complete Lesson' : 'Next'}
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

      {/* Quiz Section - Always visible at bottom */}
      <View style={styles.quizSection}>
        <View style={styles.quizSectionHeader}>
          <Ionicons name="school-outline" size={24} color="#3B82F6" />
          <Text style={styles.quizSectionTitle}>Test Your Knowledge</Text>
        </View>
        <Text style={styles.quizSectionSubtitle}>
          Answer these questions to reinforce what you've learned about line bias.
        </Text>
        <Quiz questions={LINE_BIAS_QUIZ} onComplete={handleQuizComplete} />
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
    ...(Platform.OS === 'web'
      ? {
          flexDirection: 'row' as const,
          gap: 16,
        }
      : {
          flexDirection: 'column' as const,
        }),
    marginBottom: 16,
  },
  svgContainer: {
    ...(Platform.OS === 'web'
      ? {
          flex: 2,
          minHeight: 500,
          maxHeight: 600,
        }
      : {
    width: '100%',
          aspectRatio: 4 / 3,
          minHeight: 350,
          maxHeight: 450,
        }),
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Context Panel Styles
  contextPanel: {
    ...(Platform.OS === 'web'
      ? {
          flex: 1,
          minWidth: 280,
          maxWidth: 320,
        }
      : {
          marginTop: 12,
        }),
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  contextHighlightText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  contextKeyPoint: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },
  contextAnimationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    marginBottom: 16,
  },
  contextAnimationText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  contextLegend: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginBottom: 12,
  },
  contextLegendTitle: {
    fontSize: 12,
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
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendDashed: {
    width: 16,
    height: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 12,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  windShiftBadge: {
    marginLeft: 'auto',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  windShiftText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
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
  // Quiz Section Styles
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
    fontSize: 20,
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
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
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
    color: '#1E293B',
    lineHeight: 20,
  },
  explanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginBottom: 16,
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#22C55E',
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    maxHeight: 500,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  divider: {
    height: 3,
    width: 60,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 10,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  proTipBox: {
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  proTipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'uppercase',
  },
  proTipText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  masterySection: {
    marginTop: 10,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  masteryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  masteryText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionItem: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  gotItButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    padding: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  gotItText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
