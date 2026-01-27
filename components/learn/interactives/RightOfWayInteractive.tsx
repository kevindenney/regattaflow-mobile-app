/**
 * Right of Way Interactive Component
 * 
 * Teaches fundamental right-of-way rules in sailboat racing:
 * - Port/Starboard (Rule 10)
 * - Windward/Leeward (Rule 11)
 * - Overtaking (Rule 12)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  cancelAnimation,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Polygon, LinearGradient, Stop, RadialGradient, Marker, Pattern } from 'react-native-svg';
import type { RightOfWayStep, RightOfWayQuizQuestion, PracticeScenario, UserRole } from './data/rightOfWayData';
import { RIGHT_OF_WAY_STEPS, RIGHT_OF_WAY_QUIZ, RIGHT_OF_WAY_DEEP_DIVE, PRACTICE_SCENARIOS } from './data/rightOfWayData';
import { TopDownSailboatSVG } from './shared';

// Note: AnimatedPath is still used for WakeTrail component (path 'd' attribute)
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Wake Trail Component - shows subtle V-shaped wake behind moving boats
interface WakeTrailProps {
  boatRotation: number;
  boatColor: string;
  progress: Animated.SharedValue<number>;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  curvedPath?: boolean;
  enabled?: boolean; // Control visibility without unmounting (to preserve hook count)
}

function WakeTrail({ boatRotation, boatColor, progress, startX, startY, endX, endY, curvedPath, enabled = true }: WakeTrailProps) {
  // Generate wake path points based on boat movement
  const wakePathProps = useAnimatedProps(() => {
    // If not enabled, return invisible path
    if (!enabled) {
      return {
        d: 'M 0,0',
        opacity: 0,
      };
    }

    const t = progress.value;

    // Only show wake when boat is moving (t > 0.05)
    if (t < 0.05) {
      return {
        d: 'M 0,0',
        opacity: 0,
      };
    }

    // Calculate current boat position and heading
    let currentX: number;
    let currentY: number;
    let dynamicRotation = boatRotation;

    if (curvedPath) {
      // Use same cubic Bezier control points as boat animation
      const ctrl1X = startX + 100;
      const ctrl1Y = startY - 80;
      const ctrl2X = startX + 250;
      const ctrl2Y = startY + 50;

      const oneMinusT = 1 - t;
      const oneMinusT2 = oneMinusT * oneMinusT;
      const oneMinusT3 = oneMinusT2 * oneMinusT;
      const t2 = t * t;
      const t3 = t2 * t;

      currentX = oneMinusT3 * startX + 3 * oneMinusT2 * t * ctrl1X + 3 * oneMinusT * t2 * ctrl2X + t3 * endX;
      currentY = oneMinusT3 * startY + 3 * oneMinusT2 * t * ctrl1Y + 3 * oneMinusT * t2 * ctrl2Y + t3 * endY;

      // Calculate tangent for dynamic rotation
      const tangentX = 3 * oneMinusT2 * (ctrl1X - startX) +
                       6 * oneMinusT * t * (ctrl2X - ctrl1X) +
                       3 * t2 * (endX - ctrl2X);
      const tangentY = 3 * oneMinusT2 * (ctrl1Y - startY) +
                       6 * oneMinusT * t * (ctrl2Y - ctrl1Y) +
                       3 * t2 * (endY - ctrl2Y);
      const angleRad = Math.atan2(tangentX, -tangentY);
      dynamicRotation = angleRad * (180 / Math.PI);
    } else {
      // Linear interpolation
      currentX = startX + (endX - startX) * t;
      currentY = startY + (endY - startY) * t;
    }

    // Wake starts behind the boat (opposite of heading)
    const wakeAngle = dynamicRotation + 180;
    const wakeStartOffset = 25;
    const wakeLength = 25 + t * 20;

    const wakeStartX = currentX + Math.sin(wakeAngle * Math.PI / 180) * wakeStartOffset;
    const wakeStartY = currentY - Math.cos(wakeAngle * Math.PI / 180) * wakeStartOffset;

    // Wake V-shape points
    const spreadAngle = 18;
    const leftAngle = (wakeAngle - spreadAngle) * Math.PI / 180;
    const rightAngle = (wakeAngle + spreadAngle) * Math.PI / 180;

    const leftX = wakeStartX + Math.sin(leftAngle) * wakeLength;
    const leftY = wakeStartY - Math.cos(leftAngle) * wakeLength;
    const rightX = wakeStartX + Math.sin(rightAngle) * wakeLength;
    const rightY = wakeStartY - Math.cos(rightAngle) * wakeLength;

    const path = `M ${wakeStartX},${wakeStartY} L ${leftX},${leftY} M ${wakeStartX},${wakeStartY} L ${rightX},${rightY}`;

    return {
      d: path,
      opacity: 0.3 + t * 0.2,
    };
  });

  return (
    <G>
      {/* Main wake V-shape - subtle white lines */}
      <AnimatedPath
        stroke="#FFFFFF"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        animatedProps={wakePathProps}
      />
    </G>
  );
}

// Quiz Component
interface QuizProps {
  questions: RightOfWayQuizQuestion[];
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
  deepDive?: { sections: { heading: string; content: string }[]; proTips: string[] };
}

function DeepDivePanel({ visible, onClose, stepTitle, deepDive }: DeepDivePanelProps) {
  // Use step-specific deep dive if available, otherwise fall back to global
  const content = deepDive || RIGHT_OF_WAY_DEEP_DIVE;
  
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
            {content.sections.map((section, idx) => (
              <View key={idx} style={deepDiveStyles.section}>
                <Text style={deepDiveStyles.sectionHeading}>{section.heading}</Text>
                <Text style={deepDiveStyles.sectionContent}>{section.content}</Text>
              </View>
            ))}
            
            {content.proTips && content.proTips.length > 0 && (
              <View style={deepDiveStyles.proTipsSection}>
                <Text style={deepDiveStyles.proTipsTitle}>💡 Pro Tips</Text>
                {content.proTips.map((tip, idx) => (
                  <View key={idx} style={deepDiveStyles.proTipItem}>
                    <Text style={deepDiveStyles.proTipText}>• {tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Scenario Phase Types
type ScenarioPhase = 'approaching' | 'decision' | 'resolution' | 'complete';

// Interactive Scenario Trainer Component
interface InteractiveScenarioTrainerProps {
  scenarios: PracticeScenario[];
  approachDuration: number;
  resolutionDuration: number;
  loopDelay: number;
  windDirection: number;
}

function InteractiveScenarioTrainer({
  scenarios,
  approachDuration,
  resolutionDuration,
  loopDelay,
  windDirection,
}: InteractiveScenarioTrainerProps) {
  // Shuffle scenarios for variety
  const [shuffledScenarios] = useState(() => {
    const shuffled = [...scenarios];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [phase, setPhase] = useState<ScenarioPhase>('approaching');
  const [userAnswer, setUserAnswer] = useState<UserRole | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showChecklist, setShowChecklist] = useState(true);

  const currentScenario = shuffledScenarios[currentScenarioIndex];

  // Animation values
  const approachProgress = useSharedValue(0);
  const resolutionProgress = useSharedValue(0);
  const decisionOverlayOpacity = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);
  const yourBoatBob = useSharedValue(0);
  const otherBoatBob = useSharedValue(0);
  const collisionDanger = useSharedValue(0);
  const tackLabelOpacity = useSharedValue(0);
  const positionLabelOpacity = useSharedValue(0);
  const ruleAppliedOpacity = useSharedValue(0);

  // State-driven positions for boats and overlays (avoids AnimatedG crash on Android New Architecture)
  const [yourBoatTransform, setYourBoatTransform] = useState('translate(0, 0)');
  const [yourBoatLabelTransform, setYourBoatLabelTransform] = useState('translate(0, 0)');
  const [otherBoatTransform, setOtherBoatTransform] = useState('translate(0, 0)');
  const [otherBoatLabelTransform, setOtherBoatLabelTransform] = useState('translate(0, 0)');
  const [dangerGlowState, setDangerGlowState] = useState({ opacity: 0, scale: 1 });
  const [tackLabelOpacityState, setTackLabelOpacityState] = useState(0);
  const [positionLabelOpacityState, setPositionLabelOpacityState] = useState(0);
  const [ruleAppliedOpacityState, setRuleAppliedOpacityState] = useState(0);

  // Start bobbing animations
  useEffect(() => {
    yourBoatBob.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    otherBoatBob.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  // Start scenario animation
  const startScenario = useCallback(() => {
    setPhase('approaching');
    setUserAnswer(null);
    setIsCorrect(null);
    approachProgress.value = 0;
    resolutionProgress.value = 0;
    decisionOverlayOpacity.value = 0;
    feedbackOpacity.value = 0;
    collisionDanger.value = 0;
    ruleAppliedOpacity.value = 0;

    // Show relevant labels based on scenario type
    if (currentScenario.showTackLabels) {
      tackLabelOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    } else {
      tackLabelOpacity.value = 0;
    }
    if (currentScenario.showPositionLabels) {
      positionLabelOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    } else {
      positionLabelOpacity.value = 0;
    }

    // Animate approach
    approachProgress.value = withTiming(1, {
      duration: approachDuration,
      easing: Easing.inOut(Easing.ease),
    });

    // Intensify collision danger as boats approach
    collisionDanger.value = withTiming(1, {
      duration: approachDuration * 0.8,
      easing: Easing.in(Easing.cubic),
    });

    // Transition to decision phase when approach completes
    setTimeout(() => {
      setPhase('decision');
      decisionOverlayOpacity.value = withTiming(1, { duration: 300 });
    }, approachDuration);
  }, [currentScenario, approachDuration, approachProgress, decisionOverlayOpacity, collisionDanger, tackLabelOpacity, positionLabelOpacity]);

  // Start on mount and when scenario changes
  useEffect(() => {
    startScenario();
  }, [currentScenarioIndex, startScenario]);

  // Handle user decision
  const handleDecision = useCallback((answer: UserRole) => {
    setUserAnswer(answer);
    const correct = answer === currentScenario.userRole;
    setIsCorrect(correct);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    // Hide decision overlay, show feedback
    decisionOverlayOpacity.value = withTiming(0, { duration: 200 });
    feedbackOpacity.value = withTiming(1, { duration: 300 });

    // Start resolution animation
    setPhase('resolution');
    resolutionProgress.value = withTiming(1, {
      duration: resolutionDuration,
      easing: Easing.inOut(Easing.ease),
    });

    // Show rule applied
    ruleAppliedOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));

    // Complete after resolution
    setTimeout(() => {
      setPhase('complete');
    }, resolutionDuration + 500);
  }, [currentScenario, resolutionDuration, resolutionProgress, decisionOverlayOpacity, feedbackOpacity, ruleAppliedOpacity]);

  // Next scenario
  const nextScenario = useCallback(() => {
    feedbackOpacity.value = withTiming(0, { duration: 200 });
    tackLabelOpacity.value = withTiming(0, { duration: 200 });
    positionLabelOpacity.value = withTiming(0, { duration: 200 });
    ruleAppliedOpacity.value = withTiming(0, { duration: 200 });

    setTimeout(() => {
      if (currentScenarioIndex < shuffledScenarios.length - 1) {
        setCurrentScenarioIndex(prev => prev + 1);
      } else {
        // Reset and reshuffle for another round
        setCurrentScenarioIndex(0);
      }
    }, 300);
  }, [currentScenarioIndex, shuffledScenarios.length, feedbackOpacity, tackLabelOpacity, positionLabelOpacity, ruleAppliedOpacity]);

  // Replay current scenario
  const replayScenario = useCallback(() => {
    feedbackOpacity.value = withTiming(0, { duration: 200 });
    ruleAppliedOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      startScenario();
    }, 300);
  }, [startScenario, feedbackOpacity, ruleAppliedOpacity]);

  // Sync your boat position to state
  useDerivedValue(() => {
    const boat = currentScenario.yourBoat;
    let x: number, y: number, rotation = boat.rotate;

    if (phase === 'approaching' || phase === 'decision') {
      // Interpolate from start to decision point
      const t = approachProgress.value;
      x = boat.startX + (boat.decisionX - boat.startX) * t;
      y = boat.startY + (boat.decisionY - boat.startY) * t;
    } else if (phase === 'resolution' || phase === 'complete') {
      const t = resolutionProgress.value;
      if (currentScenario.userRole === 'give-way' && boat.giveWayCtrl1 && boat.giveWayCtrl2) {
        // This boat gives way - follow curved path
        const startX = boat.decisionX;
        const startY = boat.decisionY;
        const endX = boat.resolutionEndX;
        const endY = boat.resolutionEndY;
        const ctrl1X = startX + boat.giveWayCtrl1.x;
        const ctrl1Y = startY + boat.giveWayCtrl1.y;
        const ctrl2X = startX + boat.giveWayCtrl2.x;
        const ctrl2Y = startY + boat.giveWayCtrl2.y;

        // Cubic Bezier
        const oneMinusT = 1 - t;
        const oneMinusT2 = oneMinusT * oneMinusT;
        const oneMinusT3 = oneMinusT2 * oneMinusT;
        const t2 = t * t;
        const t3 = t2 * t;

        x = oneMinusT3 * startX + 3 * oneMinusT2 * t * ctrl1X + 3 * oneMinusT * t2 * ctrl2X + t3 * endX;
        y = oneMinusT3 * startY + 3 * oneMinusT2 * t * ctrl1Y + 3 * oneMinusT * t2 * ctrl2Y + t3 * endY;

        // Calculate heading from tangent
        const tangentX = 3 * oneMinusT2 * (ctrl1X - startX) +
                         6 * oneMinusT * t * (ctrl2X - ctrl1X) +
                         3 * t2 * (endX - ctrl2X);
        const tangentY = 3 * oneMinusT2 * (ctrl1Y - startY) +
                         6 * oneMinusT * t * (ctrl2Y - ctrl1Y) +
                         3 * t2 * (endY - ctrl2Y);
        rotation = Math.atan2(tangentX, -tangentY) * (180 / Math.PI);
      } else {
        // Stand on - continue straight or stay at decision point
        x = boat.decisionX + (boat.resolutionEndX - boat.decisionX) * t;
        y = boat.decisionY + (boat.resolutionEndY - boat.decisionY) * t;
      }
    } else {
      x = boat.startX;
      y = boat.startY;
    }

    runOnJS(setYourBoatTransform)(`translate(${x}, ${y}) rotate(${rotation + yourBoatBob.value}, 25, 40)`);
    return null;
  }, [phase, currentScenario]);

  // Sync other boat position to state
  useDerivedValue(() => {
    const boat = currentScenario.otherBoat;
    let x: number, y: number, rotation = boat.rotate;

    if (phase === 'approaching' || phase === 'decision') {
      const t = approachProgress.value;
      x = boat.startX + (boat.decisionX - boat.startX) * t;
      y = boat.startY + (boat.decisionY - boat.startY) * t;
    } else if (phase === 'resolution' || phase === 'complete') {
      const t = resolutionProgress.value;
      if (currentScenario.userRole === 'stand-on' && boat.giveWayCtrl1 && boat.giveWayCtrl2) {
        // Other boat gives way
        const startX = boat.decisionX;
        const startY = boat.decisionY;
        const endX = boat.resolutionEndX;
        const endY = boat.resolutionEndY;
        const ctrl1X = startX + boat.giveWayCtrl1.x;
        const ctrl1Y = startY + boat.giveWayCtrl1.y;
        const ctrl2X = startX + boat.giveWayCtrl2.x;
        const ctrl2Y = startY + boat.giveWayCtrl2.y;

        const oneMinusT = 1 - t;
        const oneMinusT2 = oneMinusT * oneMinusT;
        const oneMinusT3 = oneMinusT2 * oneMinusT;
        const t2 = t * t;
        const t3 = t2 * t;

        x = oneMinusT3 * startX + 3 * oneMinusT2 * t * ctrl1X + 3 * oneMinusT * t2 * ctrl2X + t3 * endX;
        y = oneMinusT3 * startY + 3 * oneMinusT2 * t * ctrl1Y + 3 * oneMinusT * t2 * ctrl2Y + t3 * endY;

        const tangentX = 3 * oneMinusT2 * (ctrl1X - startX) +
                         6 * oneMinusT * t * (ctrl2X - ctrl1X) +
                         3 * t2 * (endX - ctrl2X);
        const tangentY = 3 * oneMinusT2 * (ctrl1Y - startY) +
                         6 * oneMinusT * t * (ctrl2Y - ctrl1Y) +
                         3 * t2 * (endY - ctrl2Y);
        rotation = Math.atan2(tangentX, -tangentY) * (180 / Math.PI);
      } else {
        x = boat.decisionX + (boat.resolutionEndX - boat.decisionX) * t;
        y = boat.decisionY + (boat.resolutionEndY - boat.decisionY) * t;
      }
    } else {
      x = boat.startX;
      y = boat.startY;
    }

    runOnJS(setOtherBoatTransform)(`translate(${x}, ${y}) rotate(${rotation + otherBoatBob.value}, 25, 40)`);
    return null;
  }, [phase, currentScenario]);

  // Sync your boat label position to state
  useDerivedValue(() => {
    const boat = currentScenario.yourBoat;
    const offsetX = boat.labelOffsetX ?? 0;
    const offsetY = boat.labelOffsetY ?? -50; // Default above boat
    let x: number, y: number;

    if (phase === 'approaching' || phase === 'decision') {
      const t = approachProgress.value;
      x = boat.startX + (boat.decisionX - boat.startX) * t + offsetX;
      y = boat.startY + (boat.decisionY - boat.startY) * t + offsetY;
    } else {
      const t = resolutionProgress.value;
      if (currentScenario.userRole === 'give-way' && boat.giveWayCtrl1 && boat.giveWayCtrl2) {
        const startX = boat.decisionX;
        const startY = boat.decisionY;
        const endX = boat.resolutionEndX;
        const endY = boat.resolutionEndY;
        const ctrl1X = startX + boat.giveWayCtrl1.x;
        const ctrl1Y = startY + boat.giveWayCtrl1.y;
        const ctrl2X = startX + boat.giveWayCtrl2.x;
        const ctrl2Y = startY + boat.giveWayCtrl2.y;

        const oneMinusT = 1 - t;
        x = Math.pow(oneMinusT, 3) * startX + 3 * Math.pow(oneMinusT, 2) * t * ctrl1X + 3 * oneMinusT * t * t * ctrl2X + Math.pow(t, 3) * endX + offsetX;
        y = Math.pow(oneMinusT, 3) * startY + 3 * Math.pow(oneMinusT, 2) * t * ctrl1Y + 3 * oneMinusT * t * t * ctrl2Y + Math.pow(t, 3) * endY + offsetY;
      } else {
        x = boat.decisionX + (boat.resolutionEndX - boat.decisionX) * t + offsetX;
        y = boat.decisionY + (boat.resolutionEndY - boat.decisionY) * t + offsetY;
      }
    }

    runOnJS(setYourBoatLabelTransform)(`translate(${x}, ${y})`);
    return null;
  }, [phase, currentScenario]);

  // Sync other boat label position to state
  useDerivedValue(() => {
    const boat = currentScenario.otherBoat;
    const offsetX = boat.labelOffsetX ?? 0;
    const offsetY = boat.labelOffsetY ?? -50; // Default above boat
    let x: number, y: number;

    if (phase === 'approaching' || phase === 'decision') {
      const t = approachProgress.value;
      x = boat.startX + (boat.decisionX - boat.startX) * t + offsetX;
      y = boat.startY + (boat.decisionY - boat.startY) * t + offsetY;
    } else {
      const t = resolutionProgress.value;
      if (currentScenario.userRole === 'stand-on' && boat.giveWayCtrl1 && boat.giveWayCtrl2) {
        const startX = boat.decisionX;
        const startY = boat.decisionY;
        const endX = boat.resolutionEndX;
        const endY = boat.resolutionEndY;
        const ctrl1X = startX + boat.giveWayCtrl1.x;
        const ctrl1Y = startY + boat.giveWayCtrl1.y;
        const ctrl2X = startX + boat.giveWayCtrl2.x;
        const ctrl2Y = startY + boat.giveWayCtrl2.y;

        const oneMinusT = 1 - t;
        x = Math.pow(oneMinusT, 3) * startX + 3 * Math.pow(oneMinusT, 2) * t * ctrl1X + 3 * oneMinusT * t * t * ctrl2X + Math.pow(t, 3) * endX + offsetX;
        y = Math.pow(oneMinusT, 3) * startY + 3 * Math.pow(oneMinusT, 2) * t * ctrl1Y + 3 * oneMinusT * t * t * ctrl2Y + Math.pow(t, 3) * endY + offsetY;
      } else {
        x = boat.decisionX + (boat.resolutionEndX - boat.decisionX) * t + offsetX;
        y = boat.decisionY + (boat.resolutionEndY - boat.decisionY) * t + offsetY;
      }
    }

    runOnJS(setOtherBoatLabelTransform)(`translate(${x}, ${y})`);
    return null;
  }, [phase, currentScenario]);

  // Sync danger glow state
  useDerivedValue(() => {
    runOnJS(setDangerGlowState)({
      opacity: collisionDanger.value * 0.7,
      scale: 1 + collisionDanger.value * 0.3,
    });
    return null;
  }, []);

  // Sync opacity states
  useDerivedValue(() => {
    runOnJS(setTackLabelOpacityState)(tackLabelOpacity.value);
    return null;
  }, []);

  useDerivedValue(() => {
    runOnJS(setPositionLabelOpacityState)(positionLabelOpacity.value);
    return null;
  }, []);

  useDerivedValue(() => {
    runOnJS(setRuleAppliedOpacityState)(ruleAppliedOpacity.value);
    return null;
  }, []);

  // Calculate collision point (midpoint between decision positions)
  const collisionPoint = {
    x: (currentScenario.yourBoat.decisionX + currentScenario.otherBoat.decisionX) / 2,
    y: (currentScenario.yourBoat.decisionY + currentScenario.otherBoat.decisionY) / 2,
  };

  return (
    <View style={scenarioStyles.container}>
      {/* Progress indicator */}
      <View style={scenarioStyles.progressHeader}>
        <Text style={scenarioStyles.progressText}>
          Scenario {currentScenarioIndex + 1} of {shuffledScenarios.length}
        </Text>
        <Text style={scenarioStyles.scoreText}>
          Score: {score.correct}/{score.total}
        </Text>
      </View>

      {/* Scenario name */}
      <Text style={scenarioStyles.scenarioName}>{currentScenario.name}</Text>
      <Text style={scenarioStyles.scenarioDescription}>{currentScenario.description}</Text>

      {/* SVG Visualization */}
      <View style={scenarioStyles.svgContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid meet">
          <Defs>
            <Marker id="arrow-scenario" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <Polygon points="0,0 10,3.5 0,7" fill="#000" />
            </Marker>
            <LinearGradient id="water-scenario" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#BFDBFE" stopOpacity="1" />
              <Stop offset="100%" stopColor="#93C5FD" stopOpacity="1" />
            </LinearGradient>
            <RadialGradient id="danger-scenario" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
              <Stop offset="50%" stopColor="#EF4444" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Water background */}
          <Rect width="900" height="500" fill="url(#water-scenario)" />

          {/* Wind indicator */}
          <G transform={`translate(400, 60)`}>
            <G transform={`rotate(${windDirection})`}>
              <Line x1="0" y1="-20" x2="0" y2="20" stroke="#1E293B" strokeWidth="3" markerEnd="url(#arrow-scenario)" />
              <SvgText x="0" y="-35" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1E293B">
                wind
              </SvgText>
            </G>
          </G>

          {/* Collision course lines (during approach) */}
          {currentScenario.showCollisionCourse && phase === 'approaching' && (
            <G opacity={0.6}>
              <Line
                x1={currentScenario.yourBoat.startX}
                y1={currentScenario.yourBoat.startY}
                x2={collisionPoint.x}
                y2={collisionPoint.y}
                stroke={currentScenario.yourBoat.color}
                strokeWidth="2"
                strokeDasharray="8,4"
              />
              <Line
                x1={currentScenario.otherBoat.startX}
                y1={currentScenario.otherBoat.startY}
                x2={collisionPoint.x}
                y2={collisionPoint.y}
                stroke={currentScenario.otherBoat.color}
                strokeWidth="2"
                strokeDasharray="8,4"
              />
            </G>
          )}

          {/* Collision danger zone */}
          {(phase === 'approaching' || phase === 'decision') && (
            <G transform={`translate(${collisionPoint.x}, ${collisionPoint.y}) scale(${dangerGlowState.scale})`} opacity={dangerGlowState.opacity}>
              <Circle cx={0} cy={0} r={60} fill="url(#danger-scenario)" />
            </G>
          )}

          {/* Tack labels */}
          {currentScenario.showTackLabels && (
            <G opacity={tackLabelOpacityState}>
              {/* Your boat tack */}
              <G transform={`translate(${currentScenario.yourBoat.startX + 60}, ${currentScenario.yourBoat.startY - 20})`}>
                <Rect x="-40" y="-12" width="80" height="24" rx="4" fill={currentScenario.yourBoat.tack === 'port' ? '#EF4444' : '#22C55E'} />
                <SvgText x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
                  {currentScenario.yourBoat.tack.toUpperCase()}
                </SvgText>
              </G>
              {/* Other boat tack */}
              <G transform={`translate(${currentScenario.otherBoat.startX - 60}, ${currentScenario.otherBoat.startY - 20})`}>
                <Rect x="-40" y="-12" width="80" height="24" rx="4" fill={currentScenario.otherBoat.tack === 'port' ? '#EF4444' : '#22C55E'} />
                <SvgText x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
                  {currentScenario.otherBoat.tack.toUpperCase()}
                </SvgText>
              </G>
            </G>
          )}

          {/* Position labels (windward/leeward) */}
          {currentScenario.showPositionLabels && (
            <G opacity={positionLabelOpacityState}>
              <G transform="translate(100, 120)">
                <Rect x="-60" y="-12" width="120" height="24" rx="4" fill="#F59E0B" opacity={0.9} />
                <SvgText x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
                  WINDWARD
                </SvgText>
              </G>
              <G transform="translate(100, 380)">
                <Rect x="-60" y="-12" width="120" height="24" rx="4" fill="#8B5CF6" opacity={0.9} />
                <SvgText x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
                  LEEWARD
                </SvgText>
              </G>
              {/* Wind direction arrow between positions */}
              <Line x1="100" y1="145" x2="100" y2="355" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6,4" />
            </G>
          )}

          {/* Your boat */}
          <G transform={yourBoatTransform}>
            <TopDownSailboatSVG
              hullColor={currentScenario.yourBoat.color}
              rotation={currentScenario.yourBoat.rotate}
              scale={1.0}
              showWake={false}
              externalRotation={true}
              windDirection={windDirection}
              outlined={false}
            />
          </G>

          {/* Your boat label */}
          <G transform={yourBoatLabelTransform}>
            <Rect x="-55" y="-12" width="110" height="24" rx="4" fill="white" stroke={currentScenario.yourBoat.color} strokeWidth="2" />
            <SvgText x="0" y="4" textAnchor="middle" fontSize="12" fontWeight="700" fill={currentScenario.yourBoat.color}>
              Your Boat
            </SvgText>
          </G>

          {/* Other boat */}
          <G transform={otherBoatTransform}>
            <TopDownSailboatSVG
              hullColor={currentScenario.otherBoat.color}
              rotation={currentScenario.otherBoat.rotate}
              scale={1.0}
              showWake={false}
              externalRotation={true}
              windDirection={windDirection}
              outlined={false}
            />
          </G>

          {/* Other boat label */}
          <G transform={otherBoatLabelTransform}>
            <Rect x="-55" y="-12" width="110" height="24" rx="4" fill="white" stroke={currentScenario.otherBoat.color} strokeWidth="2" />
            <SvgText x="0" y="4" textAnchor="middle" fontSize="12" fontWeight="700" fill={currentScenario.otherBoat.color}>
              Other Boat
            </SvgText>
          </G>

          {/* GIVE WAY / STAND ON badges during resolution */}
          {(phase === 'resolution' || phase === 'complete') && (
            <G opacity={ruleAppliedOpacityState}>
              {/* Your boat badge - uses configurable offset */}
              <G transform={`translate(${currentScenario.yourBoat.decisionX + (currentScenario.yourBoatBadgeOffset?.x ?? 0)}, ${currentScenario.yourBoat.decisionY + (currentScenario.yourBoatBadgeOffset?.y ?? 50)})`}>
                <Rect
                  x="-50"
                  y="-14"
                  width="100"
                  height="28"
                  rx="6"
                  fill={currentScenario.userRole === 'give-way' ? '#EF4444' : '#22C55E'}
                />
                <SvgText x="0" y="4" textAnchor="middle" fontSize="12" fontWeight="700" fill="#FFFFFF">
                  {currentScenario.userRole === 'give-way' ? 'GIVE WAY' : 'STAND ON'}
                </SvgText>
              </G>
              {/* Other boat badge - uses configurable offset */}
              <G transform={`translate(${currentScenario.otherBoat.decisionX + (currentScenario.otherBoatBadgeOffset?.x ?? 0)}, ${currentScenario.otherBoat.decisionY + (currentScenario.otherBoatBadgeOffset?.y ?? 50)})`}>
                <Rect
                  x="-50"
                  y="-14"
                  width="100"
                  height="28"
                  rx="6"
                  fill={currentScenario.userRole === 'stand-on' ? '#EF4444' : '#22C55E'}
                />
                <SvgText x="0" y="4" textAnchor="middle" fontSize="12" fontWeight="700" fill="#FFFFFF">
                  {currentScenario.userRole === 'stand-on' ? 'GIVE WAY' : 'STAND ON'}
                </SvgText>
              </G>
              {/* Rule applied - uses configurable position */}
              <G transform={`translate(${currentScenario.ruleBadgePosition?.x ?? 400}, ${currentScenario.ruleBadgePosition?.y ?? 450})`}>
                <Rect x="-140" y="-16" width="280" height="32" rx="6" fill="#1E40AF" />
                <SvgText x="0" y="5" textAnchor="middle" fontSize="14" fontWeight="700" fill="#FFFFFF">
                  {currentScenario.ruleText}
                </SvgText>
              </G>
            </G>
          )}
        </Svg>
      </View>

      {/* Decision checklist (toggleable) */}
      {showChecklist && (
        <View style={scenarioStyles.checklist}>
          <Text style={scenarioStyles.checklistTitle}>Decision Checklist:</Text>
          <View style={[scenarioStyles.checklistItem, currentScenario.checklistQuestion === 1 && scenarioStyles.checklistItemHighlighted]}>
            <Text style={scenarioStyles.checklistNumber}>1.</Text>
            <Text style={scenarioStyles.checklistText}>Am I overtaking? If yes, I must keep clear</Text>
            {currentScenario.checklistQuestion === 1 && <Ionicons name="arrow-forward" size={16} color="#3B82F6" />}
          </View>
          <View style={[scenarioStyles.checklistItem, currentScenario.checklistQuestion === 2 && scenarioStyles.checklistItemHighlighted]}>
            <Text style={scenarioStyles.checklistNumber}>2.</Text>
            <Text style={scenarioStyles.checklistText}>Opposite tacks? Port gives way to starboard</Text>
            {currentScenario.checklistQuestion === 2 && <Ionicons name="arrow-forward" size={16} color="#3B82F6" />}
          </View>
          <View style={[scenarioStyles.checklistItem, currentScenario.checklistQuestion === 3 && scenarioStyles.checklistItemHighlighted]}>
            <Text style={scenarioStyles.checklistNumber}>3.</Text>
            <Text style={scenarioStyles.checklistText}>Same tack? Windward gives way to leeward</Text>
            {currentScenario.checklistQuestion === 3 && <Ionicons name="arrow-forward" size={16} color="#3B82F6" />}
          </View>
        </View>
      )}

      {/* Decision buttons */}
      {phase === 'decision' && (
        <View style={scenarioStyles.decisionContainer}>
          <Text style={scenarioStyles.decisionPrompt}>What do YOU do?</Text>
          <View style={scenarioStyles.decisionButtons}>
            <TouchableOpacity
              style={[scenarioStyles.decisionButton, scenarioStyles.giveWayButton]}
              onPress={() => handleDecision('give-way')}
            >
              <Ionicons name="arrow-undo" size={20} color="#FFFFFF" />
              <Text style={scenarioStyles.decisionButtonText}>I Give Way</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[scenarioStyles.decisionButton, scenarioStyles.standOnButton]}
              onPress={() => handleDecision('stand-on')}
            >
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              <Text style={scenarioStyles.decisionButtonText}>I Stand On</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Feedback */}
      {(phase === 'resolution' || phase === 'complete') && userAnswer !== null && (
        <View style={[scenarioStyles.feedbackContainer, isCorrect ? scenarioStyles.feedbackCorrect : scenarioStyles.feedbackIncorrect]}>
          <View style={scenarioStyles.feedbackHeader}>
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={isCorrect ? '#22C55E' : '#EF4444'}
            />
            <Text style={[scenarioStyles.feedbackTitle, isCorrect ? scenarioStyles.feedbackTitleCorrect : scenarioStyles.feedbackTitleIncorrect]}>
              {isCorrect ? 'Correct!' : 'Not Quite'}
            </Text>
          </View>
          <Text style={scenarioStyles.feedbackText}>
            {isCorrect ? currentScenario.correctExplanation : currentScenario.incorrectExplanation}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      {phase === 'complete' && (
        <View style={scenarioStyles.actionButtons}>
          <TouchableOpacity style={scenarioStyles.replayButton} onPress={replayScenario}>
            <Ionicons name="refresh" size={18} color="#3B82F6" />
            <Text style={scenarioStyles.replayButtonText}>Replay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={scenarioStyles.nextButton} onPress={nextScenario}>
            <Text style={scenarioStyles.nextButtonText}>Next Scenario</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

interface RightOfWayInteractiveProps {
  currentStep?: RightOfWayStep;
  onStepChange?: (step: RightOfWayStep) => void;
  onComplete?: () => void;
}

export function RightOfWayInteractive({
  currentStep: externalStep,
  onStepChange,
  onComplete,
}: RightOfWayInteractiveProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationLoopRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = externalStep || RIGHT_OF_WAY_STEPS[currentStepIndex];

  // Animation values for boats
  const boat1Opacity = useSharedValue(0);
  const boat1X = useSharedValue(0);
  const boat1Y = useSharedValue(0);
  const boat1Rotate = useSharedValue(0);
  const boat1Bob = useSharedValue(0); // Continuous bobbing animation

  const boat2Opacity = useSharedValue(0);
  const boat2X = useSharedValue(0);
  const boat2Y = useSharedValue(0);
  const boat2Rotate = useSharedValue(0);
  const boat2Bob = useSharedValue(0); // Continuous bobbing animation

  const windOpacity = useSharedValue(0);
  const windRotate = useSharedValue(0);

  // Animation values for visual elements
  const lineProgress = useSharedValue(0); // For progressive line drawing
  const pulseScale = useSharedValue(1); // For pulsing collision points
  const windFlowOffset = useSharedValue(0); // For flowing wind arrows
  const pathProgress = useSharedValue(0); // For path-following give-way maneuver
  const ruleBoxesProgress = useSharedValue(0); // For staggered rule summary boxes
  const textFadeOpacity = useSharedValue(0); // For text fade-in/fade-out
  const highlightPulse = useSharedValue(1); // For highlight circles pulsing
  const boatMovementProgress = useSharedValue(0); // For progressive boat movement toward collision

  // Enhanced animation values
  const collisionDangerGlow = useSharedValue(0); // For intensifying danger glow
  const wakeOpacity = useSharedValue(0); // For wake trail visibility
  const labelOpacity = useSharedValue(0); // For label fade-in

  // Track boat rotations for sail rendering
  const [boat1Rotation, setBoat1Rotation] = useState(0);
  const [boat2Rotation, setBoat2Rotation] = useState(0);

  // State-driven transforms for main component (avoids AnimatedG crash on Android New Architecture)
  const [mainBoat1State, setMainBoat1State] = useState({ opacity: 0, transform: 'translate(0, 0)' });
  const [mainBoat2State, setMainBoat2State] = useState({ opacity: 0, transform: 'translate(0, 0)' });
  const [mainBoat1LabelTransform, setMainBoat1LabelTransform] = useState('translate(0, 0)');
  const [mainBoat2LabelTransform, setMainBoat2LabelTransform] = useState('translate(0, 0)');
  const [mainWindOpacity, setMainWindOpacity] = useState(0);
  const [mainWakeOpacity, setMainWakeOpacity] = useState(0);
  const [mainCollisionDangerState, setMainCollisionDangerState] = useState({ opacity: 0, scale: 1 });
  const [mainLineDrawState, setMainLineDrawState] = useState({ strokeDashoffset: 400, strokeDasharray: '400' });
  const [mainPathFollowState, setMainPathFollowState] = useState({ strokeDashoffset: 500, strokeDasharray: '500' });
  const [mainTextFadeOpacity, setMainTextFadeOpacity] = useState(0);
  const [mainHighlightRadius, setMainHighlightRadius] = useState(25);

  // Continuous looping animations (bobbing, pulsing, flowing)
  useEffect(() => {
    // Boat 1 bobbing - gentle rotation
    boat1Bob.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Boat 2 bobbing - offset phase for natural look
    boat2Bob.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Pulsing for collision points
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Pulsing for highlight circles
    highlightPulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Wind flow animation - continuous downward flow
    windFlowOffset.value = withRepeat(
      withTiming(40, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Clean up animation loop on unmount
  useEffect(() => {
    return () => {
      if (animationLoopRef.current) {
        clearTimeout(animationLoopRef.current);
      }
    };
  }, []);

  // Function to run the looping boat movement animation
  const runBoatMovementAnimation = useCallback((visualState: typeof currentStep.visualState) => {
    const boatMovement = visualState.boatMovement;
    const sequence = visualState.animationSequence;
    const boat1State = visualState.boat1 || {};
    const boat2State = visualState.boat2 || {};

    if (!boatMovement?.enabled) return;

    setIsAnimating(true);

    // Reset to start positions
    boatMovementProgress.value = 0;
    collisionDangerGlow.value = 0;

    const duration = boatMovement.duration || 3000;
    const movementDelay = sequence?.movementDelay || 0;

    // Animate boats moving toward collision/give-way
    boatMovementProgress.value = withDelay(
      movementDelay,
      withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease),
      })
    );

    // If collision danger enabled, animate the glow intensity
    if (visualState.collisionDanger?.enabled) {
      collisionDangerGlow.value = withDelay(
        movementDelay,
        withTiming(1, {
          duration: duration * 0.8, // Glow intensifies faster than boat movement
          easing: Easing.in(Easing.cubic),
        })
      );
    }

    // Handle looping
    if (boatMovement.loop) {
      const totalCycleDuration = movementDelay + duration + (boatMovement.pauseAtEnd || 0) + (boatMovement.loopDelay || 1000);

      animationLoopRef.current = setTimeout(() => {
        // Reset and restart animation
        boatMovementProgress.value = 0;
        collisionDangerGlow.value = 0;
        runBoatMovementAnimation(visualState);
      }, totalCycleDuration);
    } else {
      // Mark animation complete after duration
      setTimeout(() => setIsAnimating(false), movementDelay + duration);
    }
  }, [boatMovementProgress, collisionDangerGlow]);

  // Function to replay animation manually
  const replayAnimation = useCallback(() => {
    if (animationLoopRef.current) {
      clearTimeout(animationLoopRef.current);
    }
    runBoatMovementAnimation(currentStep.visualState);
  }, [currentStep.visualState, runBoatMovementAnimation]);

  useEffect(() => {
    // Clear any existing animation loop when step changes
    if (animationLoopRef.current) {
      clearTimeout(animationLoopRef.current);
      animationLoopRef.current = null;
    }

    const visualState = currentStep.visualState || {};
    const sequence = visualState.animationSequence || {};
    const springConfig = {
      damping: 15,
      stiffness: 100,
      mass: 1,
    };

    // Reset animation progress values
    lineProgress.value = 0;
    pathProgress.value = 0;
    ruleBoxesProgress.value = 0;
    boatMovementProgress.value = 0;
    collisionDangerGlow.value = 0;
    labelOpacity.value = 0;
    wakeOpacity.value = 0;

    // Sequenced label fade-in
    labelOpacity.value = withDelay(
      sequence.labelDelay || 400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );

    // Fade out text first, then fade in new text
    textFadeOpacity.value = 0;
    textFadeOpacity.value = withDelay(
      sequence.labelDelay || 200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );

    // Wake trails fade in with boat movement
    if (visualState.boat1?.showWake || visualState.boat2?.showWake) {
      wakeOpacity.value = withDelay(
        sequence.movementDelay || 800,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
      );
    }

    // Start the looping boat movement animation if enabled
    if (visualState.boatMovement?.enabled) {
      runBoatMovementAnimation(visualState);
    }

    // Boat 1 entrance and movement animations
    if (visualState.boat1) {
      const targetOpacity = visualState.boat1.opacity || 0;
      const hasMovement = visualState.boatMovement && visualState.boatMovement.enabled;
      const startX = visualState.boat1.startX ?? (visualState.boat1.x || 0) - 200;
      const startY = visualState.boat1.startY ?? (visualState.boat1.y || 0);
      const midX = visualState.boat1.x || 0;
      const midY = visualState.boat1.y || 0;
      const targetRotate = visualState.boat1.rotate || 0;

      // If boat is appearing, sail in from starting position
      if (targetOpacity > 0 && boat1Opacity.value === 0) {
        boat1X.value = startX;
        boat1Y.value = startY;
        boat1Rotate.value = targetRotate;

        boat1Opacity.value = withTiming(targetOpacity, { duration: 400 });

        // If movement enabled, animate to mid position first, then continue to end
        if (hasMovement) {
          boat1X.value = withSpring(midX, springConfig);
          boat1Y.value = withSpring(midY, springConfig);
        } else {
          boat1X.value = withSpring(midX, springConfig);
          boat1Y.value = withSpring(midY, springConfig);
        }
      } else {
        boat1Opacity.value = withTiming(targetOpacity, { duration: 600 });

        if (hasMovement) {
          boat1X.value = withSpring(midX, springConfig);
          boat1Y.value = withSpring(midY, springConfig);
        } else {
          boat1X.value = withSpring(midX, springConfig);
          boat1Y.value = withSpring(midY, springConfig);
        }
        boat1Rotate.value = withSpring(targetRotate, springConfig);
      }
      setBoat1Rotation(targetRotate);
    }

    // Boat 2 entrance animations with spring physics (staggered)
    if (visualState.boat2) {
      const targetOpacity = visualState.boat2.opacity || 0;
      const targetX = visualState.boat2.x || 0;
      const targetY = visualState.boat2.y || 0;
      const targetRotate = visualState.boat2.rotate || 0;

      // If boat is appearing, sail in from off-screen
      if (targetOpacity > 0 && boat2Opacity.value === 0) {
        boat2X.value = targetX + 200; // Start off-screen right
        boat2Y.value = targetY;
        boat2Rotate.value = targetRotate;

        boat2Opacity.value = withDelay(100, withTiming(targetOpacity, { duration: 400 }));
        boat2X.value = withDelay(100, withSpring(targetX, springConfig));
      } else {
        boat2Opacity.value = withTiming(targetOpacity, { duration: 600 });
        boat2X.value = withSpring(targetX, springConfig);
        boat2Y.value = withSpring(targetY, springConfig);
        boat2Rotate.value = withSpring(targetRotate, springConfig);
      }
      setBoat2Rotation(targetRotate);
    }

    // Wind arrow animation
    if (visualState.windArrow) {
      windOpacity.value = withDelay(
        200,
        withTiming(visualState.windArrow.opacity || 0, { duration: 600 })
      );
      windRotate.value = withSpring(visualState.windArrow.rotate || 0, springConfig);
    }

    // Progressive line drawing for collision course
    if (visualState.collisionCourse && visualState.collisionCourse.opacity) {
      lineProgress.value = withDelay(
        400,
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      );
    }

    // Path-following animation for give-way maneuver
    if (visualState.giveWayManeuver && visualState.giveWayManeuver.opacity) {
      pathProgress.value = withDelay(
        600,
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      );
    }

    // Staggered slide-up for rule summary boxes
    if (visualState.ruleSummary && visualState.ruleSummary.opacity) {
      ruleBoxesProgress.value = withDelay(
        400,
        withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [currentStep]);

  // Sync boat 1 position to state for main component
  useDerivedValue(() => {
    const visualState = currentStep.visualState || {};
    const hasMovement = visualState.boatMovement && visualState.boatMovement.enabled;
    const useCurvedPath = visualState.boatMovement && visualState.boatMovement.curvedPath;
    const boat1State = visualState.boat1 || {};

    let finalX = boat1X.value;
    let finalY = boat1Y.value;
    let dynamicRotation = boat1Rotate.value;

    if (hasMovement && boat1State.startX !== undefined && boat1State.endX !== undefined) {
      const startX = boat1State.startX;
      const startY = boat1State.startY || boat1State.y || 0;
      const endX = boat1State.endX;
      const endY = boat1State.endY || boat1State.y || 0;
      const t = boatMovementProgress.value;

      if (useCurvedPath) {
        const customCtrl1 = visualState.boatMovement?.ctrl1;
        const customCtrl2 = visualState.boatMovement?.ctrl2;
        const ctrl1X = customCtrl1 ? startX + customCtrl1.x : startX + 100;
        const ctrl1Y = customCtrl1 ? startY + customCtrl1.y : startY - 80;
        const ctrl2X = customCtrl2 ? startX + customCtrl2.x : startX + 250;
        const ctrl2Y = customCtrl2 ? startY + customCtrl2.y : startY + 50;

        const oneMinusT = 1 - t;
        const oneMinusT2 = oneMinusT * oneMinusT;
        const oneMinusT3 = oneMinusT2 * oneMinusT;
        const t2 = t * t;
        const t3 = t2 * t;

        finalX = oneMinusT3 * startX + 3 * oneMinusT2 * t * ctrl1X + 3 * oneMinusT * t2 * ctrl2X + t3 * endX;
        finalY = oneMinusT3 * startY + 3 * oneMinusT2 * t * ctrl1Y + 3 * oneMinusT * t2 * ctrl2Y + t3 * endY;

        const tangentX = 3 * oneMinusT2 * (ctrl1X - startX) +
                         6 * oneMinusT * t * (ctrl2X - ctrl1X) +
                         3 * t2 * (endX - ctrl2X);
        const tangentY = 3 * oneMinusT2 * (ctrl1Y - startY) +
                         6 * oneMinusT * t * (ctrl2Y - ctrl1Y) +
                         3 * t2 * (endY - ctrl2Y);
        const angleRad = Math.atan2(tangentX, -tangentY);
        dynamicRotation = angleRad * (180 / Math.PI);
      } else {
        finalX = interpolate(t, [0, 1], [startX, endX], Extrapolate.CLAMP);
        finalY = interpolate(t, [0, 1], [startY, endY], Extrapolate.CLAMP);
      }
    }

    runOnJS(setMainBoat1State)({
      opacity: boat1Opacity.value,
      transform: `translate(${finalX}, ${finalY}) rotate(${dynamicRotation + boat1Bob.value}, 25, 40)`,
    });
    return null;
  }, [currentStep]);

  // Sync boat 2 position to state for main component
  useDerivedValue(() => {
    const visualState = currentStep.visualState || {};
    const hasMovement = visualState.boatMovement && visualState.boatMovement.enabled;
    const boat2State = visualState.boat2 || {};

    let finalX = boat2X.value;
    let finalY = boat2Y.value;

    if (hasMovement && boat2State.startX !== undefined && boat2State.endX !== undefined) {
      const startX = boat2State.startX;
      const startY = boat2State.startY || boat2State.y || 0;
      const endX = boat2State.endX;
      const endY = boat2State.endY || boat2State.y || 0;

      finalX = interpolate(boatMovementProgress.value, [0, 1], [startX, endX], Extrapolate.CLAMP);
      finalY = interpolate(boatMovementProgress.value, [0, 1], [startY, endY], Extrapolate.CLAMP);
    }

    runOnJS(setMainBoat2State)({
      opacity: boat2Opacity.value,
      transform: `translate(${finalX}, ${finalY}) rotate(${boat2Rotate.value + boat2Bob.value}, 25, 40)`,
    });
    return null;
  }, [currentStep]);

  // Sync boat 1 label position to state
  useDerivedValue(() => {
    const visualState = currentStep.visualState || {};
    const hasMovement = visualState.boatMovement && visualState.boatMovement.enabled;
    const useCurvedPath = visualState.boatMovement && visualState.boatMovement.curvedPath;
    const boat1State = visualState.boat1 || {};

    let finalX = boat1State.x || 0;
    let finalY = (boat1State.y || 0) - 50;

    if (hasMovement && boat1State.startX !== undefined && boat1State.endX !== undefined) {
      const startX = boat1State.startX;
      const startY = boat1State.startY || boat1State.y || 0;
      const endX = boat1State.endX;
      const endY = boat1State.endY || boat1State.y || 0;
      const t = boatMovementProgress.value;

      if (useCurvedPath) {
        const customCtrl1 = visualState.boatMovement?.ctrl1;
        const customCtrl2 = visualState.boatMovement?.ctrl2;
        const ctrl1X = customCtrl1 ? startX + customCtrl1.x : startX + 100;
        const ctrl1Y = customCtrl1 ? startY + customCtrl1.y : startY - 80;
        const ctrl2X = customCtrl2 ? startX + customCtrl2.x : startX + 250;
        const ctrl2Y = customCtrl2 ? startY + customCtrl2.y : startY + 50;

        const oneMinusT = 1 - t;
        const oneMinusT2 = oneMinusT * oneMinusT;
        const oneMinusT3 = oneMinusT2 * oneMinusT;
        const t2 = t * t;
        const t3 = t2 * t;

        finalX = oneMinusT3 * startX + 3 * oneMinusT2 * t * ctrl1X + 3 * oneMinusT * t2 * ctrl2X + t3 * endX;
        finalY = oneMinusT3 * startY + 3 * oneMinusT2 * t * ctrl1Y + 3 * oneMinusT * t2 * ctrl2Y + t3 * endY - 50;
      } else {
        finalX = interpolate(t, [0, 1], [startX, endX], Extrapolate.CLAMP);
        finalY = interpolate(t, [0, 1], [startY - 50, endY - 50], Extrapolate.CLAMP);
      }
    }

    runOnJS(setMainBoat1LabelTransform)(`translate(${finalX}, ${finalY})`);
    return null;
  }, [currentStep]);

  // Sync boat 2 label position to state
  useDerivedValue(() => {
    const visualState = currentStep.visualState || {};
    const hasMovement = visualState.boatMovement && visualState.boatMovement.enabled;
    const boat2State = visualState.boat2 || {};

    let finalX = boat2State.x || 0;
    let finalY = (boat2State.y || 0) - 50;

    if (hasMovement && boat2State.startX !== undefined && boat2State.endX !== undefined) {
      const startX = boat2State.startX;
      const startY = boat2State.startY || boat2State.y || 0;
      const endX = boat2State.endX;
      const endY = boat2State.endY || boat2State.y || 0;

      finalX = interpolate(boatMovementProgress.value, [0, 1], [startX, endX], Extrapolate.CLAMP);
      finalY = interpolate(boatMovementProgress.value, [0, 1], [startY - 50, endY - 50], Extrapolate.CLAMP);
    }

    runOnJS(setMainBoat2LabelTransform)(`translate(${finalX}, ${finalY})`);
    return null;
  }, [currentStep]);

  // Sync wind, wake, and other opacities to state
  useDerivedValue(() => {
    runOnJS(setMainWindOpacity)(windOpacity.value);
    return null;
  }, []);

  useDerivedValue(() => {
    runOnJS(setMainWakeOpacity)(wakeOpacity.value * 0.6);
    return null;
  }, []);

  // Sync collision danger glow to state
  useDerivedValue(() => {
    const intensity = collisionDangerGlow.value;
    const pulseAmount = (pulseScale.value - 1) * 0.3 * intensity;
    runOnJS(setMainCollisionDangerState)({
      opacity: intensity * 0.8 + pulseAmount,
      scale: 1 + intensity * 0.5 + pulseAmount,
    });
    return null;
  }, []);

  // Sync line draw and path follow states
  useDerivedValue(() => {
    const dashLength = 400;
    const offset = dashLength * (1 - lineProgress.value);
    runOnJS(setMainLineDrawState)({
      strokeDashoffset: offset,
      strokeDasharray: `${dashLength}`,
    });
    return null;
  }, []);

  useDerivedValue(() => {
    const dashLength = 500;
    const offset = dashLength * (1 - pathProgress.value);
    runOnJS(setMainPathFollowState)({
      strokeDashoffset: offset,
      strokeDasharray: `${dashLength}`,
    });
    return null;
  }, []);

  // Sync text fade opacity to state
  useDerivedValue(() => {
    runOnJS(setMainTextFadeOpacity)(textFadeOpacity.value);
    return null;
  }, []);

  // Sync highlight pulse to state (radius for pulsing circles)
  useDerivedValue(() => {
    const baseRadius = 25;
    runOnJS(setMainHighlightRadius)(baseRadius * highlightPulse.value);
    return null;
  }, []);

  const handleNext = () => {
    if (currentStepIndex < RIGHT_OF_WAY_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(RIGHT_OF_WAY_STEPS[nextIndex]);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(RIGHT_OF_WAY_STEPS[prevIndex]);
    }
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    onComplete?.();
  };

  const boat1State = currentStep.visualState.boat1 || {};
  const boat2State = currentStep.visualState.boat2 || {};
  const windState = currentStep.visualState.windArrow || {};
  const markState = currentStep.visualState.mark;

  // Check if this step has interactive scenarios enabled
  const hasInteractiveScenarios = currentStep.visualState.interactiveScenarios?.enabled;
  const interactiveConfig = currentStep.visualState.interactiveScenarios;

  // If interactive scenarios are enabled, render the scenario trainer instead of static visualization
  if (hasInteractiveScenarios && interactiveConfig) {
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Interactive Scenario Trainer */}
        <InteractiveScenarioTrainer
          scenarios={interactiveConfig.scenarios}
          approachDuration={interactiveConfig.approachDuration}
          resolutionDuration={interactiveConfig.resolutionDuration}
          loopDelay={interactiveConfig.loopDelay}
          windDirection={windState.rotate || 0}
        />

        {/* Step Info - abbreviated for interactive mode */}
        <View style={styles.container}>
          <Text style={styles.stepLabel}>{currentStep.label}</Text>
          <Text style={styles.stepDescription}>{currentStep.description}</Text>

          {currentStep.proTip && (
            <View style={styles.proTipContainer}>
              <View style={styles.proTipHeader}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.proTipLabel}>Pro Tip</Text>
              </View>
              <Text style={styles.proTipText}>{currentStep.proTip}</Text>
            </View>
          )}

          {/* Navigation Controls */}
          <View style={[styles.controls, { marginTop: 16 }]}>
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
                Step {currentStepIndex + 1} of {RIGHT_OF_WAY_STEPS.length}
              </Text>
            </View>

            <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary]} onPress={handleNext}>
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                {currentStepIndex === RIGHT_OF_WAY_STEPS.length - 1 ? 'Complete' : 'Next'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Deep Dive Panel */}
        <DeepDivePanel
          visible={showDeepDive}
          onClose={() => setShowDeepDive(false)}
          stepTitle={currentStep.label}
          deepDive={currentStep.deepDive}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* SVG Visualization */}
        <View style={styles.svgContainer}>
          <Svg width="100%" height="100%" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid meet">
            <Defs>
              <Marker id="arrowhead-row" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <Polygon points="0,0 10,3.5 0,7" fill="#000" />
              </Marker>
              <LinearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#BFDBFE" stopOpacity="1" />
                <Stop offset="100%" stopColor="#93C5FD" stopOpacity="1" />
              </LinearGradient>
              <Pattern id="water-texture-row" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <Path d="M0 50 Q25 45, 50 50 T100 50" stroke="#8BC4E8" strokeWidth="0.5" fill="none" opacity={0.3} />
              </Pattern>
              {/* Danger zone gradient - red glow */}
              <RadialGradient id="dangerGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
                <Stop offset="50%" stopColor="#EF4444" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </RadialGradient>
              {/* Wake trail gradient */}
              <LinearGradient id="wakeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
              </LinearGradient>
            </Defs>

            {/* Water background - improved gradient */}
            <Rect width="900" height="500" fill="url(#waterGradient)" />
            <Rect width="900" height="500" fill="url(#water-texture-row)" />

            {/* Step indicator */}
            <G transform="translate(40, 30)">
              <Rect x="0" y="0" width="120" height="36" rx="8" fill="white" opacity={0.9} />
              <SvgText x="60" y="24" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1E293B">
                Step {currentStepIndex + 1} of {RIGHT_OF_WAY_STEPS.length}
              </SvgText>
            </G>

            {/* Wind arrow - shows where wind is coming FROM */}
            <G opacity={mainWindOpacity}>
              <G transform={`translate(${windState.x || 400}, ${windState.y || 50})`}>
                {/* Wind direction indicator (arrow pointing down = wind from North) */}
                <G transform={`rotate(${windState.rotate || 0})`}>
                  <Line x1="0" y1="-20" x2="0" y2="20" stroke="#1E293B" strokeWidth="3" markerEnd="url(#arrowhead-row)" />
                  <SvgText x="0" y="-35" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1E293B">
                    wind
                  </SvgText>
                </G>
              </G>
            </G>

            {/* Mark (if present) */}
            {markState && markState.opacity && (
              <Circle 
                cx={markState.cx || 600} 
                cy={markState.cy || 200} 
                r="10" 
                fill={markState.type === 'windward' ? '#22C55E' : markState.type === 'leeward' ? '#EF4444' : '#3B82F6'} 
                stroke="black" 
                strokeWidth="2" 
                opacity={markState.opacity}
              />
            )}

            {/* Collision Danger Zone - intensifying glow as boats approach */}
            {currentStep.visualState.collisionDanger?.enabled && currentStep.visualState.collisionCourse?.collisionPoint && (
              <G transform={`translate(${currentStep.visualState.collisionCourse.collisionPoint.cx}, ${currentStep.visualState.collisionCourse.collisionPoint.cy})`}>
                <G opacity={mainCollisionDangerState.opacity} transform={`scale(${mainCollisionDangerState.scale})`}>
                  {/* Outer glow ring - only shows as danger increases, scales from center */}
                  <Circle
                    cx={0}
                    cy={0}
                    r={50}
                    fill="url(#dangerGradient)"
                  />
                </G>
              </G>
            )}

            {/* Collision Course Visualization - with progressive line drawing */}
            {currentStep.visualState.collisionCourse && currentStep.visualState.collisionCourse.opacity && (
              <G opacity={currentStep.visualState.collisionCourse.opacity}>
                {/* Boat 1's path (port tack - blue dotted line extending NE) - animated drawing */}
                {currentStep.visualState.collisionCourse.boat1Path && (
                  <Line
                    x1={currentStep.visualState.collisionCourse.boat1Path.x1}
                    y1={currentStep.visualState.collisionCourse.boat1Path.y1}
                    x2={currentStep.visualState.collisionCourse.boat1Path.x2}
                    y2={currentStep.visualState.collisionCourse.boat1Path.y2}
                    stroke="#3B82F6"
                    strokeWidth="3"
                    opacity={0.9}
                    strokeLinecap="round"
                    strokeDashoffset={mainLineDrawState.strokeDashoffset}
                    strokeDasharray={mainLineDrawState.strokeDasharray}
                  />
                )}
                {/* Boat 2's path (starboard tack - red dotted line extending NW) - animated drawing */}
                {currentStep.visualState.collisionCourse.boat2Path && (
                  <Line
                    x1={currentStep.visualState.collisionCourse.boat2Path.x1}
                    y1={currentStep.visualState.collisionCourse.boat2Path.y1}
                    x2={currentStep.visualState.collisionCourse.boat2Path.x2}
                    y2={currentStep.visualState.collisionCourse.boat2Path.y2}
                    stroke="#EF4444"
                    strokeWidth="3"
                    opacity={0.9}
                    strokeLinecap="round"
                    strokeDashoffset={mainLineDrawState.strokeDashoffset}
                    strokeDasharray={mainLineDrawState.strokeDasharray}
                  />
                )}
                {/* Collision point marker - shows where paths intersect */}
                {currentStep.visualState.collisionCourse.collisionPoint && !currentStep.visualState.collisionDanger?.enabled && (
                  <G
                    transform={`translate(${currentStep.visualState.collisionCourse.collisionPoint.cx}, ${currentStep.visualState.collisionCourse.collisionPoint.cy})`}
                  >
                    {/* Warning circle */}
                    <Circle cx="0" cy="0" r="12" fill="#EF4444" opacity={0.15} />
                    <Circle cx="0" cy="0" r="10" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="4,4" opacity={0.6} />
                    {/* X marker */}
                    <Line x1="-6" y1="-6" x2="6" y2="6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity={0.8} />
                    <Line x1="6" y1="-6" x2="-6" y2="6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity={0.8} />
                  </G>
                )}
              </G>
            )}

            {/* Give-Way Maneuver Path (curved path showing required course change) - animated path following */}
            {currentStep.visualState.giveWayManeuver && currentStep.visualState.giveWayManeuver.opacity && (
              <G opacity={currentStep.visualState.giveWayManeuver.opacity}>
                {currentStep.visualState.giveWayManeuver.path && (
                  <G>
                    {/* Main curved path - draws progressively */}
                    <Path
                      d={currentStep.visualState.giveWayManeuver.path.d}
                      stroke="#3B82F6"
                      strokeWidth="4"
                      fill="none"
                      opacity={0.9}
                      markerEnd="url(#arrowhead-row)"
                      strokeLinecap="round"
                      strokeDashoffset={mainPathFollowState.strokeDashoffset}
                      strokeDasharray={mainPathFollowState.strokeDasharray}
                    />
                    {/* Glow effect for visibility */}
                    <Path
                      d={currentStep.visualState.giveWayManeuver.path.d}
                      stroke="#60A5FA"
                      strokeWidth="6"
                      fill="none"
                      opacity={0.3}
                      strokeLinecap="round"
                      strokeDashoffset={mainPathFollowState.strokeDashoffset}
                      strokeDasharray={mainPathFollowState.strokeDasharray}
                    />
                  </G>
                )}
                {currentStep.visualState.giveWayManeuver.label && currentStep.visualState.giveWayManeuver.label.text && (
                  <G transform={`translate(${currentStep.visualState.giveWayManeuver.label.x}, ${currentStep.visualState.giveWayManeuver.label.y})`}>
                    <Rect
                      x="-75"
                      y="-14"
                      width="150"
                      height="28"
                      rx="6"
                      fill="#3B82F6"
                      opacity={0.95}
                      stroke="#1E40AF"
                      strokeWidth="2"
                    />
                    <SvgText
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="#FFFFFF"
                    >
                      {currentStep.visualState.giveWayManeuver.label.text}
                    </SvgText>
                  </G>
                )}
              </G>
            )}

            {/* Head Up Path - alternative option for windward boat */}
            {currentStep.visualState.headUpPath && currentStep.visualState.headUpPath.opacity && (
              <G opacity={currentStep.visualState.headUpPath.opacity}>
                {currentStep.visualState.headUpPath.path && (
                  <G>
                    {/* Dashed path showing head up option */}
                    <Path
                      d={currentStep.visualState.headUpPath.path.d}
                      stroke="#10B981"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray="8,6"
                      strokeLinecap="round"
                    />
                  </G>
                )}
                {currentStep.visualState.headUpPath.label && currentStep.visualState.headUpPath.label.text && (
                  <G transform={`translate(${currentStep.visualState.headUpPath.label.x}, ${currentStep.visualState.headUpPath.label.y})`}>
                    <Rect
                      x="-50"
                      y="-14"
                      width="100"
                      height="28"
                      rx="6"
                      fill="#10B981"
                      opacity={0.9}
                    />
                    <SvgText
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill="#FFFFFF"
                    >
                      {currentStep.visualState.headUpPath.label.text}
                    </SvgText>
                  </G>
                )}
              </G>
            )}

            {/* Path Labels along course lines */}
            {currentStep.visualState.pathLabels && (
              <G>
                {currentStep.visualState.pathLabels.portTack && (
                  <G transform={`translate(${currentStep.visualState.pathLabels.portTack.x}, ${currentStep.visualState.pathLabels.portTack.y})`}>
                    <SvgText
                      x="0"
                      y="0"
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#EF4444"
                      transform={`rotate(${currentStep.visualState.pathLabels.portTack.rotate || 45})`}
                    >
                      {currentStep.visualState.pathLabels.portTack.text}
                    </SvgText>
                  </G>
                )}
                {currentStep.visualState.pathLabels.starboardTack && (
                  <G transform={`translate(${currentStep.visualState.pathLabels.starboardTack.x}, ${currentStep.visualState.pathLabels.starboardTack.y})`}>
                    <SvgText
                      x="0"
                      y="0"
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#22C55E"
                      transform={`rotate(${currentStep.visualState.pathLabels.starboardTack.rotate || 315})`}
                    >
                      {currentStep.visualState.pathLabels.starboardTack.text}
                    </SvgText>
                  </G>
                )}
              </G>
            )}

            {/* Course Direction Arrows - showing sailing direction */}
            {currentStep.visualState.courseArrows && (
              <G>
                {currentStep.visualState.courseArrows.boat1 && currentStep.visualState.courseArrows.boat1.opacity && boat1State.x && boat1State.y && (
                  <G>
                    {/* Arrow from boat 1 showing its course direction */}
                    <Line
                      x1={boat1State.x}
                      y1={boat1State.y}
                      x2={boat1State.x + Math.sin(boat1Rotation * Math.PI / 180) * 80}
                      y2={boat1State.y - Math.cos(boat1Rotation * Math.PI / 180) * 80}
                      stroke="#3B82F6"
                      strokeWidth="3"
                      markerEnd="url(#arrowhead-row)"
                      opacity={0.9}
                      strokeLinecap="round"
                    />
                  </G>
                )}
                {currentStep.visualState.courseArrows.boat2 && currentStep.visualState.courseArrows.boat2.opacity && boat2State.x && boat2State.y && (
                  <G>
                    {/* Arrow from boat 2 showing its course direction */}
                    <Line
                      x1={boat2State.x}
                      y1={boat2State.y}
                      x2={boat2State.x + Math.sin(boat2Rotation * Math.PI / 180) * 80}
                      y2={boat2State.y - Math.cos(boat2Rotation * Math.PI / 180) * 80}
                      stroke="#EF4444"
                      strokeWidth="3"
                      markerEnd="url(#arrowhead-row)"
                      opacity={0.9}
                      strokeLinecap="round"
                    />
                  </G>
                )}
              </G>
            )}

            {/* Wind Flow Arrows - showing wind direction visually */}
            {currentStep.visualState.windFlow && currentStep.visualState.windFlow.opacity && (
              <G opacity={currentStep.visualState.windFlow.opacity}>
                {currentStep.visualState.windFlow.arrows.map((arrow, idx) => (
                  <G key={`wind-arrow-${idx}`}>
                    {/* Wind flow arrow - static positioning */}
                    <Line
                      x1={arrow.x}
                      y1={arrow.y}
                      x2={arrow.x}
                      y2={arrow.y + 40}
                      stroke="#60A5FA"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead-row)"
                      opacity={0.4}
                      strokeLinecap="round"
                      strokeDasharray="4,4"
                    />
                  </G>
                ))}
              </G>
            )}

            {/* Position Indicator - for Windward/Leeward visualization */}
            {currentStep.visualState.positionIndicator && currentStep.visualState.positionIndicator.opacity && (
              <G opacity={currentStep.visualState.positionIndicator.opacity}>
                {/* Vertical wind direction line */}
                {currentStep.visualState.positionIndicator.windLine && (
                  <Line
                    x1={currentStep.visualState.positionIndicator.windLine.x1}
                    y1={currentStep.visualState.positionIndicator.windLine.y1}
                    x2={currentStep.visualState.positionIndicator.windLine.x2}
                    y2={currentStep.visualState.positionIndicator.windLine.y2}
                    stroke="#94A3B8"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    opacity={0.6}
                  />
                )}

                {/* Windward position marker */}
                {currentStep.visualState.positionIndicator.windwardMarker && (
                  <G>
                    <Circle
                      cx={currentStep.visualState.positionIndicator.windwardMarker.cx}
                      cy={currentStep.visualState.positionIndicator.windwardMarker.cy}
                      r="8"
                      fill="#EF4444"
                      opacity={0.3}
                      stroke="#EF4444"
                      strokeWidth="2"
                    />
                    <SvgText
                      x={currentStep.visualState.positionIndicator.windwardMarker.cx - 120}
                      y={currentStep.visualState.positionIndicator.windwardMarker.cy + 5}
                      fontSize="11"
                      fontWeight="600"
                      fill="#64748B"
                    >
                      ← {currentStep.visualState.positionIndicator.windwardMarker.label}
                    </SvgText>
                  </G>
                )}

                {/* Leeward position marker */}
                {currentStep.visualState.positionIndicator.leewardMarker && (
                  <G>
                    <Circle
                      cx={currentStep.visualState.positionIndicator.leewardMarker.cx}
                      cy={currentStep.visualState.positionIndicator.leewardMarker.cy}
                      r="8"
                      fill="#10B981"
                      opacity={0.3}
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                    <SvgText
                      x={currentStep.visualState.positionIndicator.leewardMarker.cx - 120}
                      y={currentStep.visualState.positionIndicator.leewardMarker.cy + 5}
                      fontSize="11"
                      fontWeight="600"
                      fill="#64748B"
                    >
                      ← {currentStep.visualState.positionIndicator.leewardMarker.label}
                    </SvgText>
                  </G>
                )}

                {/* Distance label */}
                {currentStep.visualState.positionIndicator.distanceLabel && (
                  <SvgText
                    x={currentStep.visualState.positionIndicator.distanceLabel.x}
                    y={currentStep.visualState.positionIndicator.distanceLabel.y}
                    fontSize="10"
                    fontWeight="600"
                    fill="#94A3B8"
                    transform={`rotate(-90, ${currentStep.visualState.positionIndicator.distanceLabel.x}, ${currentStep.visualState.positionIndicator.distanceLabel.y})`}
                  >
                    {currentStep.visualState.positionIndicator.distanceLabel.text}
                  </SvgText>
                )}
              </G>
            )}

            {/* Wake Trail for Boat 1 - always render to preserve hook count */}
            <G opacity={mainWakeOpacity}>
              <WakeTrail
                boatRotation={boat1Rotation}
                boatColor={boat1State.color || '#3B82F6'}
                progress={boatMovementProgress}
                startX={boat1State.startX || boat1State.x || 0}
                startY={boat1State.startY || boat1State.y || 0}
                endX={boat1State.endX || boat1State.x || 0}
                endY={boat1State.endY || boat1State.y || 0}
                curvedPath={currentStep.visualState.boatMovement?.curvedPath}
                enabled={!!(boat1State.showWake && currentStep.visualState.boatMovement?.enabled)}
              />
            </G>

            {/* Boat 1 */}
            <G opacity={mainBoat1State.opacity} transform={mainBoat1State.transform}>
              <TopDownSailboatSVG
                hullColor={boat1State.color || '#3B82F6'}
                rotation={boat1Rotation}
                scale={1.0}
                showWake={false}
                externalRotation={true}
                windDirection={windState.rotate || 0}
                outlined={boat1State.isOutlined || false}
                sailColor="#FFFFFF"
                showTackIndicator={boat1State.showTackIndicator || false}
                highlightBoom={boat1State.highlightBoom || false}
              />
            </G>

            {/* Boat 1 Label */}
            {boat1State.label && (
              <G transform={`translate(${boat1State.x || 0}, ${(boat1State.y || 0) - 30})`}>
                <Rect x="-80" y="-12" width="160" height="24" rx="4" fill="white" opacity={0.95} stroke={boat1State.color || '#3B82F6'} strokeWidth="2" />
                <SvgText 
                  x="0" 
                  y="4" 
                  textAnchor="middle" 
                  fontSize="13" 
                  fontWeight="700" 
                  fill={boat1State.color || '#3B82F6'}
                >
                  {boat1State.label}
                </SvgText>
              </G>
            )}

            {/* Direction Line - showing boat's sailing direction */}
            {currentStep.visualState.directionLine && currentStep.visualState.directionLine.opacity && (
              <G opacity={currentStep.visualState.directionLine.opacity}>
                {currentStep.visualState.directionLine.boat === 'boat1' && boat1State.x && boat1State.y && (
                  <G>
                    {/* Convert rotation: 0° = North (up), so subtract 90° to convert to standard math coordinates */}
                    {/* Main direction line */}
                    <Line
                      x1={boat1State.x}
                      y1={boat1State.y}
                      x2={boat1State.x + Math.sin(boat1Rotation * Math.PI / 180) * (currentStep.visualState.directionLine.length || 150)}
                      y2={boat1State.y - Math.cos(boat1Rotation * Math.PI / 180) * (currentStep.visualState.directionLine.length || 150)}
                      stroke={boat1State.color || '#3B82F6'}
                      strokeWidth="4"
                      markerEnd="url(#arrowhead-row)"
                      opacity={0.9}
                      strokeLinecap="round"
                    />
                    {/* Glow/shadow effect */}
                    <Line
                      x1={boat1State.x}
                      y1={boat1State.y}
                      x2={boat1State.x + Math.sin(boat1Rotation * Math.PI / 180) * (currentStep.visualState.directionLine.length || 150)}
                      y2={boat1State.y - Math.cos(boat1Rotation * Math.PI / 180) * (currentStep.visualState.directionLine.length || 150)}
                      stroke="#60A5FA"
                      strokeWidth="6"
                      markerEnd="url(#arrowhead-row)"
                      opacity={0.3}
                      strokeLinecap="round"
                    />
                  </G>
                )}
                {currentStep.visualState.directionLine.boat === 'boat2' && boat2State.x && boat2State.y && (
                  <G>
                    <Line
                      x1={boat2State.x}
                      y1={boat2State.y}
                      x2={boat2State.x + Math.sin(boat2Rotation * Math.PI / 180) * (currentStep.visualState.directionLine.length || 150)}
                      y2={boat2State.y - Math.cos(boat2Rotation * Math.PI / 180) * (currentStep.visualState.directionLine.length || 150)}
                      stroke={boat2State.color || '#EF4444'}
                      strokeWidth="4"
                      markerEnd="url(#arrowhead-row)"
                      opacity={0.9}
                      strokeLinecap="round"
                    />
                    {/* Glow/shadow effect */}
                    <Line
                      x1={boat2State.x}
                      y1={boat2State.y}
                      x2={boat2State.x + Math.sin(boat2Rotation * Math.PI / 180) * (currentStep.visualState.directionLine.length || 150)}
                      y2={boat2State.y - Math.cos(boat2Rotation * Math.PI / 180) * (currentStep.visualState.directionLine.length || 150)}
                      stroke="#F87171"
                      strokeWidth="6"
                      markerEnd="url(#arrowhead-row)"
                      opacity={0.3}
                      strokeLinecap="round"
                    />
                  </G>
                )}
              </G>
            )}

            {/* Annotations */}
            {currentStep.visualState.annotations && (
              <G>
                {currentStep.visualState.annotations.mast && (
                  <G transform={`translate(${currentStep.visualState.annotations.mast.x}, ${currentStep.visualState.annotations.mast.y})`}>
                    {/* Arrow pointing to mast */}
                    <Line
                      x1="0"
                      y1="0"
                      x2={currentStep.visualState.annotations.mast.boat === 'boat1' 
                        ? (boat1State.x || 0) - currentStep.visualState.annotations.mast.x
                        : (boat2State.x || 0) - currentStep.visualState.annotations.mast.x}
                      y2={currentStep.visualState.annotations.mast.boat === 'boat1'
                        ? (boat1State.y || 0) - currentStep.visualState.annotations.mast.y
                        : (boat2State.y || 0) - currentStep.visualState.annotations.mast.y}
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeDasharray="6,4"
                      markerEnd="url(#arrowhead-row)"
                      opacity={0.9}
                    />
                    {/* Text box with better styling */}
                    <Rect x="-110" y="-18" width="220" height="36" rx="6" fill="#EFF6FF" opacity={0.98} stroke="#3B82F6" strokeWidth="2" />
                    <SvgText x="0" y="4" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1E40AF">
                      {currentStep.visualState.annotations.mast.text}
                    </SvgText>
                  </G>
                )}
                {currentStep.visualState.annotations.windSide && (
                  <G transform={`translate(${currentStep.visualState.annotations.windSide.x}, ${currentStep.visualState.annotations.windSide.y})`}>
                    {/* Arrow pointing to wind side */}
                    <Line
                      x1="0"
                      y1="0"
                      x2={currentStep.visualState.annotations.windSide.boat === 'boat1'
                        ? (boat1State.x || 0) - currentStep.visualState.annotations.windSide.x
                        : (boat2State.x || 0) - currentStep.visualState.annotations.windSide.x}
                      y2={currentStep.visualState.annotations.windSide.boat === 'boat1'
                        ? (boat1State.y || 0) - currentStep.visualState.annotations.windSide.y
                        : (boat2State.y || 0) - currentStep.visualState.annotations.windSide.y}
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeDasharray="6,4"
                      markerEnd="url(#arrowhead-row)"
                      opacity={0.9}
                    />
                    {/* Text box with better styling */}
                    <Rect x="-100" y="-18" width="200" height="36" rx="6" fill="#ECFDF5" opacity={0.98} stroke="#10B981" strokeWidth="2" />
                    <SvgText x="0" y="4" textAnchor="middle" fontSize="13" fontWeight="700" fill="#065F46">
                      {currentStep.visualState.annotations.windSide.text}
                    </SvgText>
                  </G>
                )}
              </G>
            )}

            {/* Wake Trail for Boat 2 - always render to preserve hook count */}
            <G opacity={mainWakeOpacity}>
              <WakeTrail
                boatRotation={boat2Rotation}
                boatColor={boat2State.color || '#EF4444'}
                progress={boatMovementProgress}
                startX={boat2State.startX || boat2State.x || 0}
                startY={boat2State.startY || boat2State.y || 0}
                endX={boat2State.endX || boat2State.x || 0}
                endY={boat2State.endY || boat2State.y || 0}
                curvedPath={false}
                enabled={!!(boat2State.showWake && currentStep.visualState.boatMovement?.enabled)}
              />
            </G>

            {/* Boat 2 */}
            <G opacity={mainBoat2State.opacity} transform={mainBoat2State.transform}>
              <TopDownSailboatSVG
                hullColor={boat2State.color || '#1E293B'}
                rotation={boat2Rotation}
                scale={1.0}
                showWake={false}
                externalRotation={true}
                windDirection={windState.rotate || 0}
                outlined={boat2State.isOutlined || false}
                showTackIndicator={boat2State.showTackIndicator || false}
                highlightBoom={boat2State.highlightBoom || false}
              />
            </G>

            {/* Boat 2 Label */}
            {boat2State.label && (
              <G transform={`translate(${boat2State.x || 0}, ${(boat2State.y || 0) - 30})`}>
                <Rect x="-100" y="-12" width="200" height="24" rx="4" fill="white" opacity={0.95} stroke={boat2State.color || '#EF4444'} strokeWidth="2" />
                <SvgText
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill={boat2State.color || '#EF4444'}
                >
                  {boat2State.label}
                </SvgText>
              </G>
            )}

            {/* Dynamic Labels that follow animated boat positions */}
            {currentStep.visualState.dynamicLabels && (
              <G>
                {/* Boat 1 dynamic label */}
                {currentStep.visualState.dynamicLabels.boat1Label && (
                  <G transform={mainBoat1LabelTransform}>
                    <Rect x="-60" y="-12" width="120" height="24" rx="4" fill="white" opacity={0.95} stroke={boat1State.color || '#EF4444'} strokeWidth="2" />
                    <SvgText
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill={boat1State.color || '#EF4444'}
                    >
                      {currentStep.visualState.dynamicLabels.boat1Label}
                    </SvgText>
                  </G>
                )}
                {/* Boat 2 dynamic label */}
                {currentStep.visualState.dynamicLabels.boat2Label && (
                  <G transform={mainBoat2LabelTransform}>
                    <Rect x="-60" y="-12" width="120" height="24" rx="4" fill="white" opacity={0.95} stroke={boat2State.color || '#10B981'} strokeWidth="2" />
                    <SvgText
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill={boat2State.color || '#10B981'}
                    >
                      {currentStep.visualState.dynamicLabels.boat2Label}
                    </SvgText>
                  </G>
                )}
              </G>
            )}

            {/* Right-of-Way Labels (GIVE WAY / STAND ON) */}
            {currentStep.visualState.rightOfWayLabels && (
              <G>
                {currentStep.visualState.rightOfWayLabels.giveWay && (
                  <G transform={`translate(${currentStep.visualState.rightOfWayLabels.giveWay.x}, ${currentStep.visualState.rightOfWayLabels.giveWay.y})`}>
                    <Rect x="-45" y="-12" width="90" height="24" rx="4" fill="#EF4444" opacity={0.95} />
                    <SvgText x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
                      {currentStep.visualState.rightOfWayLabels.giveWay.text}
                    </SvgText>
                  </G>
                )}
                {currentStep.visualState.rightOfWayLabels.standOn && (
                  <G transform={`translate(${currentStep.visualState.rightOfWayLabels.standOn.x}, ${currentStep.visualState.rightOfWayLabels.standOn.y})`}>
                    <Rect x="-50" y="-12" width="100" height="24" rx="4" fill="#22C55E" opacity={0.95} />
                    <SvgText x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
                      {currentStep.visualState.rightOfWayLabels.standOn.text}
                    </SvgText>
                  </G>
                )}
              </G>
            )}

            {/* Rule Summary Boxes - for review step */}
            {currentStep.visualState.ruleSummary && currentStep.visualState.ruleSummary.opacity && (
              <G opacity={currentStep.visualState.ruleSummary.opacity}>
                {currentStep.visualState.ruleSummary.rules.map((rule, idx) => (
                  <G key={`rule-box-${idx}`} transform={`translate(${rule.position.x}, ${rule.position.y})`}>
                    {/* Rule box background */}
                    <Rect
                      x="-80"
                      y="-40"
                      width="160"
                      height="80"
                      rx="8"
                      fill="white"
                      stroke={rule.color}
                      strokeWidth="3"
                    />
                    {/* Rule title */}
                    <SvgText
                      x="0"
                      y="-20"
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill={rule.color}
                    >
                      {rule.title}
                    </SvgText>
                    {/* Rule text line 1 */}
                    <SvgText
                      x="0"
                      y="0"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#1E293B"
                    >
                      {rule.text.split('\n')[0]}
                    </SvgText>
                    {/* Rule text line 2 */}
                    {rule.text.split('\n')[1] && (
                      <SvgText
                        x="0"
                        y="15"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#1E293B"
                      >
                        {rule.text.split('\n')[1]}
                      </SvgText>
                    )}
                  </G>
                ))}
              </G>
            )}

            {/* Rule Text - with fade-in animation */}
            {currentStep.visualState.ruleText && currentStep.visualState.ruleText.opacity && (
              <G
                transform={`translate(${currentStep.visualState.ruleText.x || 400}, ${currentStep.visualState.ruleText.y || 150})`}
                opacity={mainTextFadeOpacity}
              >
                <SvgText x="0" y="0" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1E293B">
                  {currentStep.visualState.ruleText.text}
                </SvgText>
              </G>
            )}

            {/* Highlight indicators - pulsing animation */}
            {currentStep.visualState.highlight && (
              <G>
                {currentStep.visualState.highlight.type === 'port' && (
                  <Circle
                    cx={currentStep.visualState.highlight.boat === 'boat1' ? (boat1State.x || 0) : (boat2State.x || 0)}
                    cy={currentStep.visualState.highlight.boat === 'boat1' ? (boat1State.y || 0) : (boat2State.y || 0)}
                    r={mainHighlightRadius}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                    opacity={0.7}
                  />
                )}
                {currentStep.visualState.highlight.type === 'starboard' && (
                  <Circle
                    cx={currentStep.visualState.highlight.boat === 'boat1' ? (boat1State.x || 0) : (boat2State.x || 0)}
                    cy={currentStep.visualState.highlight.boat === 'boat1' ? (boat1State.y || 0) : (boat2State.y || 0)}
                    r={mainHighlightRadius}
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                    opacity={0.7}
                  />
                )}
              </G>
            )}
          </Svg>

          {/* Replay Button - appears when animation is available */}
          {currentStep.visualState.boatMovement?.enabled && (
            <Pressable
              style={styles.replayButton}
              onPress={replayAnimation}
            >
              <Ionicons name="refresh" size={20} color="#3B82F6" />
              <Text style={styles.replayButtonText}>Replay</Text>
            </Pressable>
          )}
        </View>

        {/* Step Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.stepLabel}>{currentStep.label}</Text>
          <Text style={styles.stepDescription}>{currentStep.description}</Text>
          
          {currentStep.ruleReference && (
            <View style={styles.ruleReference}>
              <Ionicons name="document-text" size={16} color="#3B82F6" />
              <Text style={styles.ruleReferenceText}>{currentStep.ruleReference}</Text>
            </View>
          )}

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
              Step {currentStepIndex + 1} of {RIGHT_OF_WAY_STEPS.length}
            </Text>
          </View>

          <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary]} onPress={handleNext}>
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              {currentStepIndex === RIGHT_OF_WAY_STEPS.length - 1 ? 'Complete' : 'Next'}
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
          Answer these questions to reinforce what you've learned about right-of-way rules.
        </Text>
        <Quiz questions={RIGHT_OF_WAY_QUIZ} onComplete={handleQuizComplete} />
      </View>

      {/* Deep Dive Panel */}
      <DeepDivePanel
        visible={showDeepDive}
        onClose={() => setShowDeepDive(false)}
        stepTitle={currentStep.label}
        deepDive={currentStep.deepDive}
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
  svgContainer: {
    width: '100%',
    aspectRatio: 8 / 5,
    minHeight: 300,
    maxHeight: 500,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  replayButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.12)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
          elevation: 3,
        }),
  },
  replayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
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
  ruleReference: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  ruleReferenceText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 12,
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

const scenarioStyles = StyleSheet.create({
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  scenarioName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  scenarioDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  svgContainer: {
    width: '100%',
    aspectRatio: 8 / 5,
    minHeight: 280,
    maxHeight: 450,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  checklist: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  checklistItemHighlighted: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  checklistNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: 20,
  },
  checklistText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
  },
  decisionContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  decisionPrompt: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  decisionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
    justifyContent: 'center',
  },
  giveWayButton: {
    backgroundColor: '#EF4444',
  },
  standOnButton: {
    backgroundColor: '#22C55E',
  },
  decisionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedbackContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  feedbackCorrect: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  feedbackIncorrect: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  feedbackTitleCorrect: {
    color: '#166534',
  },
  feedbackTitleIncorrect: {
    color: '#991B1B',
  },
  feedbackText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  replayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

