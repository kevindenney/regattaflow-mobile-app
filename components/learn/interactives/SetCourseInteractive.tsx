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

// Note: AnimatedG (Animated.createAnimatedComponent(G)) causes crashes on Android with New Architecture
// Using state-driven opacity instead for cross-platform compatibility
import type { CourseStep } from './data/setCourseData';
import { SET_COURSE_SEQUENCE_STEPS, SET_COURSE_QUIZ } from './data/setCourseData';
import { PowerboatSVG } from './shared';

// Quiz state interface
interface QuizAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
}

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
  
  // Deep Dive state
  const [showDeepDive, setShowDeepDive] = useState(false);
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const isLastStep = currentStepIndex === SET_COURSE_SEQUENCE_STEPS.length - 1;

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

  // State-driven opacity for all platforms (AnimatedG causes crashes on Android)
  // On web, CSS transitions handle smooth animation
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

    // Update state directly from target values
    // On web, CSS transitions handle animation; on native, we use state-driven opacity
    // (AnimatedG with animatedProps causes crashes on Android with New Architecture)
    setOpacities(targetValues);

    // Animate course path drawing
    if (visualState.coursePath?.opacity) {
      // Slow draw animation - 6 seconds to trace the full course
      coursePathLength.value = withTiming(1, { duration: 6000 });
    } else {
      coursePathLength.value = 0;
    }
  }, [currentStep, coursePathLength]);

  // Note: Removed useAnimatedProps for G elements - they cause crashes on Android with New Architecture
  // Keeping shared values in case we want to add smooth animations via a different technique later

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
      }
    }
  }, []);

  // Animated props for Path (strokeDashoffset) - creates "drawing" effect
  const coursePathDashProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - coursePathLength.value) * 1500,
  }));


  const handleNext = () => {
    if (currentStepIndex < SET_COURSE_SEQUENCE_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(SET_COURSE_SEQUENCE_STEPS[nextIndex]);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(SET_COURSE_SEQUENCE_STEPS[prevIndex]);
    }
  };

  // Quiz handlers
  const handleQuizAnswer = (questionId: string, optionId: string) => {
    const question = SET_COURSE_QUIZ.find(q => q.id === questionId);
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
    return { correct, total: SET_COURSE_QUIZ.length };
  };

  const resetQuiz = () => {
    setQuizAnswers([]);
  };

  // Course path segments for animation with arrows
  // Port rounding = leave mark to port = go around RIGHT side of mark
  // Marks: Windward (400,100) r=8, Left Gate (350,300) r=8, Right Gate (450,300) r=8
  
  // Segment 1: Start to Windward Mark (upwind leg 1)
  const segment1 = "M 400 350 L 415 120";
  
  // Segment 2: Round windward mark (port rounding - go right side, curve left)
  const segment2 = "M 415 120 Q 420 100, 420 90 Q 420 80, 400 80 Q 380 80, 380 90 Q 380 100, 385 115";
  
  // Segment 3: Down to left gate mark (downwind leg)
  const segment3 = "M 385 115 L 340 280";
  
  // Segment 4: Round left gate mark (port rounding)
  const segment4 = "M 340 280 Q 335 290, 335 300 Q 335 315, 350 320 Q 365 320, 370 310";
  
  // Segment 5: Back up to windward mark (upwind leg 2)
  const segment5 = "M 370 310 L 420 120";
  
  // Segment 6: Round windward mark again (port rounding)
  const segment6 = "M 420 120 Q 425 100, 425 90 Q 425 75, 400 75 Q 375 75, 375 95 Q 375 110, 390 130";
  
  // Segment 7: Down to finish line
  const segment7 = "M 390 130 L 540 350";
  
  // Combined path for single drawing
  const coursePathD = `${segment1} ${segment2.replace('M', 'L').replace(/^L \d+ \d+/, '')} ${segment3.replace('M', 'L').replace(/^L \d+ \d+/, '')} ${segment4.replace('M', 'L').replace(/^L \d+ \d+/, '')} ${segment5.replace('M', 'L').replace(/^L \d+ \d+/, '')} ${segment6.replace('M', 'L').replace(/^L \d+ \d+/, '')} ${segment7.replace('M', 'L').replace(/^L \d+ \d+/, '')}`;

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.svgContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 900 450" preserveAspectRatio="xMidYMid meet">
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
          <Rect width="900" height="450" fill="#aaccff" />
          <Rect width="900" height="450" fill="url(#water-texture-sc)" />
          
          {/* Wind indicator */}
          <G opacity={opacities.wind} data-animated-opacity="true">
            <Line x1="400" y1="25" x2="400" y2="55" stroke="#000" strokeWidth="3" markerEnd="url(#arrowhead-course)" />
            <SvgText x="400" y="18" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#000">
              WIND
            </SvgText>
          </G>

          {/* Start Line */}
          <G opacity={opacities.startLine} data-animated-opacity="true">
            <Line x1="300" y1="350" x2="500" y2="350" stroke="black" strokeWidth="2" strokeDasharray="5,5" />
            <SvgText x="400" y="370" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000">
              Start Line
            </SvgText>
          </G>

          {/* RC Boat (Start) */}
          <G opacity={opacities.rcBoat} data-animated-opacity="true" transform="translate(490, 330)">
            <PowerboatSVG rotation={0} hideInfoBoard={true} scale={0.8} />
          </G>

          {/* Pin (Start) */}
          <G opacity={opacities.pin} data-animated-opacity="true">
            <Circle cx="300" cy="350" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
            <SvgText x="300" y="375" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
              Pin
            </SvgText>
          </G>

          {/* Windward Mark */}
          <G opacity={opacities.windwardMark} data-animated-opacity="true">
            <Circle cx="400" cy="100" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
            <SvgText x="400" y="90" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
              Windward Mark
            </SvgText>
          </G>

          {/* Leeward Gate */}
          <G opacity={opacities.leewardGate} data-animated-opacity="true">
            <Circle cx="350" cy="300" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
            <Circle cx="450" cy="300" r="8" fill="orange" stroke="black" strokeWidth="1.5" />
            <SvgText x="400" y="330" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
              Leeward Gate
            </SvgText>
          </G>

          {/* Course Path */}
          <G opacity={opacities.coursePath} data-animated-opacity="true">
            {/* Main path - animated drawing */}
            <AnimatedPath
              d={coursePathD}
              stroke="#FFD700"
              strokeWidth="4"
              strokeDasharray="1500"
              fill="none"
              animatedProps={coursePathDashProps}
            />
            {/* Start label */}
            <G transform="translate(400, 360)">
              <Circle r="12" fill="#22C55E" stroke="white" strokeWidth="2" />
              <SvgText y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">S</SvgText>
            </G>
            {/* Finish label */}
            <G transform="translate(540, 360)">
              <Circle r="12" fill="#EF4444" stroke="white" strokeWidth="2" />
              <SvgText y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">F</SvgText>
            </G>
          </G>

          {/* Finish Line Components */}
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
        </Svg>
      </View>

      {/* Step Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.stepLabel}>{currentStep.label}</Text>
        <Text style={styles.stepDescription}>{currentStep.description}</Text>
        
        {/* Deep Dive Toggle */}
        {currentStep.details && currentStep.details.length > 0 && (
          <View style={styles.deepDiveSection}>
            <TouchableOpacity 
              style={styles.deepDiveButton}
              onPress={() => setShowDeepDive(!showDeepDive)}
            >
              <Ionicons 
                name={showDeepDive ? 'chevron-up' : 'bulb'} 
                size={20} 
                color="#8B5CF6" 
              />
              <Text style={styles.deepDiveButtonText}>
                {showDeepDive ? 'Hide Deep Dive' : 'Deep Dive: Learn More'}
              </Text>
              <Ionicons 
                name={showDeepDive ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#8B5CF6" 
              />
            </TouchableOpacity>
            
            {showDeepDive && (
              <View style={styles.deepDiveContent}>
                <View style={styles.deepDiveHeader}>
                  <Ionicons name="book" size={20} color="#1E293B" />
                  <Text style={styles.deepDiveTitle}>
                    {currentStep.label || 'Additional Details'}
                  </Text>
                </View>
                
                <View style={styles.deepDiveDivider} />
                
                {/* Quick Reference - Basic Details */}
                {currentStep.details && currentStep.details.length > 0 && (
                  <View style={styles.deepDiveSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="information-circle" size={18} color="#3B82F6" />
                      <Text style={styles.sectionTitle}>Quick Reference</Text>
                    </View>
                    {currentStep.details.map((detail, index) => (
                      <View key={index} style={styles.deepDiveItem}>
                        <View style={styles.deepDiveIconContainer}>
                          <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                        </View>
                        <Text style={styles.deepDiveItemText}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Comprehensive Deep Dive Sections */}
                {currentStep.deepDive && (
                  <>
                    {/* Why It Matters */}
                    {currentStep.deepDive.whyItMatters && currentStep.deepDive.whyItMatters.length > 0 && (
                      <View style={styles.deepDiveSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="star" size={18} color="#8B5CF6" />
                          <Text style={styles.sectionTitle}>Why It Matters</Text>
                        </View>
                        {currentStep.deepDive.whyItMatters.map((item, index) => (
                          <View key={index} style={styles.deepDiveItem}>
                            <View style={[styles.deepDiveIconContainer, { backgroundColor: '#F3E8FF' }]}>
                              <Ionicons name="bulb" size={16} color="#8B5CF6" />
                            </View>
                            <Text style={styles.deepDiveItemText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Common Mistakes */}
                    {currentStep.deepDive.commonMistakes && currentStep.deepDive.commonMistakes.length > 0 && (
                      <View style={styles.deepDiveSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="warning" size={18} color="#EF4444" />
                          <Text style={styles.sectionTitle}>Common Mistakes</Text>
                        </View>
                        {currentStep.deepDive.commonMistakes.map((item, index) => (
                          <View key={index} style={[styles.deepDiveItem, styles.mistakeItem]}>
                            <View style={[styles.deepDiveIconContainer, { backgroundColor: '#FEE2E2' }]}>
                              <Ionicons name="close-circle" size={16} color="#EF4444" />
                            </View>
                            <Text style={styles.deepDiveItemText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Advanced Tactics */}
                    {currentStep.deepDive.advancedTactics && currentStep.deepDive.advancedTactics.length > 0 && (
                      <View style={styles.deepDiveSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="rocket" size={18} color="#F59E0B" />
                          <Text style={styles.sectionTitle}>Advanced Tactics</Text>
                        </View>
                        {currentStep.deepDive.advancedTactics.map((item, index) => (
                          <View key={index} style={[styles.deepDiveItem, styles.tacticsItem]}>
                            <View style={[styles.deepDiveIconContainer, { backgroundColor: '#FEF3C7' }]}>
                              <Ionicons name="flash" size={16} color="#F59E0B" />
                            </View>
                            <Text style={styles.deepDiveItemText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Rules and Regulations */}
                    {currentStep.deepDive.rulesAndRegulations && currentStep.deepDive.rulesAndRegulations.length > 0 && (
                      <View style={styles.deepDiveSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="document-text" size={18} color="#10B981" />
                          <Text style={styles.sectionTitle}>Rules & Regulations</Text>
                        </View>
                        {currentStep.deepDive.rulesAndRegulations.map((item, index) => (
                          <View key={index} style={[styles.deepDiveItem, styles.rulesItem]}>
                            <View style={[styles.deepDiveIconContainer, { backgroundColor: '#D1FAE5' }]}>
                              <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
                            </View>
                            <Text style={styles.deepDiveItemText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Pro Tips */}
                    {currentStep.deepDive.proTips && currentStep.deepDive.proTips.length > 0 && (
                      <View style={styles.proTipSection}>
                        <View style={styles.proTipHeader}>
                          <Ionicons name="star" size={20} color="#F59E0B" />
                          <Text style={styles.proTipTitle}>Pro Tips</Text>
                        </View>
                        {currentStep.deepDive.proTips.map((tip, index) => (
                          <View key={index} style={styles.proTipItem}>
                            <View style={styles.proTipBullet}>
                              <Ionicons name="flash" size={12} color="#F59E0B" />
                            </View>
                            <Text style={styles.proTipText}>{tip}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
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
            {isLastStep ? 'Next Lesson' : 'Next'}
          </Text>
          <Ionicons name={isLastStep ? 'arrow-forward' : 'chevron-forward'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Quiz Prompt - Show after completing all steps */}
      {isLastStep && !showQuiz && (
        <View style={styles.quizPrompt}>
          <View style={styles.quizPromptContent}>
            <Ionicons name="school" size={32} color="#3B82F6" />
            <Text style={styles.quizPromptTitle}>Test Your Knowledge?</Text>
            <Text style={styles.quizPromptText}>
              Take a quick quiz to check your understanding of course setup before moving on.
            </Text>
            <View style={styles.quizPromptButtons}>
              <TouchableOpacity 
                style={styles.quizPromptButtonSecondary}
                onPress={onComplete}
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

      {/* Quiz Section - Show when user chooses to take quiz */}
      {showQuiz && (
        <View style={styles.quizSection}>
          <Text style={styles.quizTitle}>Test Your Knowledge</Text>
          <Text style={styles.quizSubtitle}>Answer these questions to check your understanding of course setup.</Text>
          
          {SET_COURSE_QUIZ.map((question, qIndex) => {
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
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}>
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
                
                {/* Feedback after answering */}
                {answer && (
                  <View style={[
                    styles.feedbackBox,
                    answer.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
                  ]}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons 
                        name={answer.isCorrect ? 'checkmark-circle' : 'bulb'} 
                        size={20} 
                        color={answer.isCorrect ? '#166534' : '#92400E'} 
                      />
                      <Text style={[
                        styles.feedbackTitle,
                        answer.isCorrect ? styles.feedbackTitleCorrect : styles.feedbackTitleIncorrect
                      ]}>
                        {answer.isCorrect ? 'Correct! 🎉' : 'Not quite - try again!'}
                      </Text>
                    </View>
                    <Text style={[
                      styles.feedbackText,
                      answer.isCorrect ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect
                    ]}>
                      {answer.isCorrect 
                        ? question.explanation 
                        : question.hint || 'Think about what you learned in the steps above.'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
          
          {/* Quiz Results */}
          {quizAnswers.filter(a => a.isCorrect).length === SET_COURSE_QUIZ.length && (
            <View style={styles.quizResults}>
              <Text style={styles.quizResultsTitle}>Quiz Complete! 🎉</Text>
              <Text style={styles.quizResultsScore}>
                You got {getQuizScore().correct} out of {getQuizScore().total} correct
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={resetQuiz}>
                <Ionicons name="refresh" size={18} color="#3B82F6" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
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
    aspectRatio: 16 / 9, // Wide aspect ratio for course visualization
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
  // Deep Dive Styles
  deepDiveSection: {
    marginTop: 12,
  },
  deepDiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  deepDiveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  deepDiveContent: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
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
  deepDiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  deepDiveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  deepDiveDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  deepDiveSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  deepDiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  mistakeItem: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  tacticsItem: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  rulesItem: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  deepDiveIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  deepDiveItemText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  proTipSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  proTipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
  },
  proTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  proTipBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  proTipText: {
    flex: 1,
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    fontWeight: '500',
  },
  // Quiz Prompt Styles
  quizPrompt: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
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
  // Quiz Styles
  quizSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  quizTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  quizSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
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
    fontSize: 14,
    color: '#334155',
    flex: 1,
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
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  quizResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  quizResultsScore: {
    fontSize: 16,
    color: '#3B82F6',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

