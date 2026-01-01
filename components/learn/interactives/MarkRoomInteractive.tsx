/**
 * Mark Room Interactive Component
 *
 * Teaches mark room rules in sailboat racing (RRS Rule 18):
 * - The zone (3 boat lengths)
 * - Inside/outside boat rights
 * - Clear ahead/astern at zone entry
 * - Proper course obligations
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Marker, Polygon, Pattern, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import type { MarkRoomStep, MarkRoomQuizQuestion, MarkRoomScenario, MarkRoomRole } from './data/markRoomData';
import { MARK_ROOM_STEPS, MARK_ROOM_QUIZ, MARK_ROOM_DEEP_DIVE, PRACTICE_SCENARIOS } from './data/markRoomData';
import { TopDownSailboatSVG } from './shared';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Quiz Component
interface QuizProps {
  questions: MarkRoomQuizQuestion[];
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
  const content = deepDive || MARK_ROOM_DEEP_DIVE;

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
                <Text style={deepDiveStyles.proTipsTitle}>Pro Tips</Text>
                {content.proTips.map((tip, idx) => (
                  <View key={idx} style={deepDiveStyles.proTipItem}>
                    <Text style={deepDiveStyles.proTipText}>* {tip}</Text>
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
  scenarios: MarkRoomScenario[];
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
  const [userAnswer, setUserAnswer] = useState<MarkRoomRole | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const currentScenario = shuffledScenarios[currentScenarioIndex];

  // Animation values
  const approachProgress = useSharedValue(0);
  const resolutionProgress = useSharedValue(0);
  const decisionOverlayOpacity = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);
  const yourBoatBob = useSharedValue(0);
  const otherBoatBob = useSharedValue(0);
  const zonePulse = useSharedValue(0);

  // Start bobbing and zone pulse animations
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
    zonePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  // Handle phase transitions
  useEffect(() => {
    if (phase === 'approaching') {
      approachProgress.value = 0;
      resolutionProgress.value = 0;
      decisionOverlayOpacity.value = 0;
      feedbackOpacity.value = 0;

      approachProgress.value = withTiming(1, {
        duration: approachDuration,
        easing: Easing.inOut(Easing.quad),
      }, (finished) => {
        if (finished) {
          runOnJS(setPhase)('decision');
        }
      });
    } else if (phase === 'decision') {
      decisionOverlayOpacity.value = withTiming(1, { duration: 300 });
    } else if (phase === 'resolution') {
      decisionOverlayOpacity.value = withTiming(0, { duration: 200 });
      feedbackOpacity.value = withTiming(1, { duration: 300 });

      resolutionProgress.value = withTiming(1, {
        duration: resolutionDuration,
        easing: Easing.inOut(Easing.quad),
      }, (finished) => {
        if (finished) {
          runOnJS(setPhase)('complete');
        }
      });
    } else if (phase === 'complete') {
      // Wait then advance to next scenario
      const timeout = setTimeout(() => {
        if (currentScenarioIndex < shuffledScenarios.length - 1) {
          setCurrentScenarioIndex(prev => prev + 1);
          setPhase('approaching');
          setUserAnswer(null);
          setIsCorrect(null);
        }
      }, loopDelay);
      return () => clearTimeout(timeout);
    }
  }, [phase, currentScenarioIndex]);

  // Handle user decision
  const handleDecision = (answer: MarkRoomRole) => {
    if (phase !== 'decision') return;

    setUserAnswer(answer);
    const correct = answer === currentScenario.userRole;
    setIsCorrect(correct);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
    setPhase('resolution');
  };

  // Skip to next scenario
  const handleSkip = () => {
    if (currentScenarioIndex < shuffledScenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
      setPhase('approaching');
      setUserAnswer(null);
      setIsCorrect(null);
    }
  };

  // Animated props for your boat
  const yourBoatProps = useAnimatedProps(() => {
    const progress = phase === 'resolution' ? resolutionProgress.value : approachProgress.value;
    const config = currentScenario.yourBoat;

    let targetX = config.endX;
    let targetY = config.endY;

    if (phase === 'approaching') {
      targetX = config.decisionX;
      targetY = config.decisionY;
    } else if (phase === 'resolution' && config.giveWayPath && currentScenario.userRole === 'must-give-room') {
      targetX = config.resolutionEndX;
      targetY = config.resolutionEndY;
    } else if (phase === 'resolution') {
      targetX = config.resolutionEndX;
      targetY = config.resolutionEndY;
    }

    const x = interpolate(
      progress,
      [0, 1],
      [phase === 'resolution' ? config.decisionX : config.startX, targetX]
    );
    const y = interpolate(
      progress,
      [0, 1],
      [phase === 'resolution' ? config.decisionY : config.startY, targetY]
    ) + yourBoatBob.value;

    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  // Animated props for other boat
  const otherBoatProps = useAnimatedProps(() => {
    const progress = phase === 'resolution' ? resolutionProgress.value : approachProgress.value;
    const config = currentScenario.otherBoat;

    let targetX = config.endX;
    let targetY = config.endY;

    if (phase === 'approaching') {
      targetX = config.decisionX;
      targetY = config.decisionY;
    } else if (phase === 'resolution' && config.giveWayPath && currentScenario.userRole === 'entitled') {
      targetX = config.resolutionEndX;
      targetY = config.resolutionEndY;
    } else if (phase === 'resolution') {
      targetX = config.resolutionEndX;
      targetY = config.resolutionEndY;
    }

    const x = interpolate(
      progress,
      [0, 1],
      [phase === 'resolution' ? config.decisionX : config.startX, targetX]
    );
    const y = interpolate(
      progress,
      [0, 1],
      [phase === 'resolution' ? config.decisionY : config.startY, targetY]
    ) + otherBoatBob.value;

    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  // Zone circle animated props
  const zoneCircleProps = useAnimatedProps(() => {
    const pulseAmount = interpolate(zonePulse.value, [0, 1], [0, 8]);
    return {
      r: currentScenario.zoneRadius + pulseAmount,
      opacity: interpolate(zonePulse.value, [0, 1], [0.15, 0.25]),
    };
  });

  return (
    <View style={scenarioStyles.container}>
      {/* Score display */}
      <View style={scenarioStyles.scoreBar}>
        <Text style={scenarioStyles.scoreText}>
          Score: {score.correct}/{score.total}
        </Text>
        <Text style={scenarioStyles.scenarioCount}>
          Scenario {currentScenarioIndex + 1}/{shuffledScenarios.length}
        </Text>
      </View>

      {/* SVG Visualization */}
      <View style={scenarioStyles.svgContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet">
          <Defs>
            <LinearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.3" />
            </LinearGradient>
            <RadialGradient id="zoneGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.1" />
              <Stop offset="70%" stopColor="#F59E0B" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.3" />
            </RadialGradient>
          </Defs>

          {/* Water background */}
          <Rect x="0" y="0" width="800" height="520" fill="url(#waterGradient)" />

          {/* Wind indicator - pointing South (downward) */}
          <G transform={`translate(400, 40)`}>
            {/* Arrow shaft pointing down */}
            <Line x1="0" y1="-10" x2="0" y2="20" stroke="#64748B" strokeWidth="2" />
            {/* Arrowhead at bottom pointing down */}
            <Polygon points="0,28 -8,16 8,16" fill="#64748B" />
            <SvgText x="0" y="-18" textAnchor="middle" fill="#64748B" fontSize="12" fontWeight="600">
              WIND
            </SvgText>
          </G>

          {/* Mark */}
          <Circle
            cx={currentScenario.mark.x}
            cy={currentScenario.mark.y}
            r="12"
            fill="#F97316"
            stroke="#C2410C"
            strokeWidth="2"
          />

          {/* Zone circle - animated */}
          {currentScenario.showZone && (
            <AnimatedCircle
              cx={currentScenario.mark.x}
              cy={currentScenario.mark.y}
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="8,4"
              fill="url(#zoneGradient)"
              animatedProps={zoneCircleProps}
            />
          )}

          {/* Zone label */}
          <SvgText
            x={currentScenario.mark.x + currentScenario.zoneRadius + 15}
            y={currentScenario.mark.y}
            fill="#F59E0B"
            fontSize="11"
            fontWeight="600"
          >
            3 LENGTHS
          </SvgText>

          {/* Your boat */}
          <AnimatedG animatedProps={yourBoatProps}>
            <TopDownSailboatSVG
              hullColor={currentScenario.yourBoat.color}
              rotation={currentScenario.yourBoat.rotate}
              scale={0.6}
              windDirection={windDirection}
              showWake={phase !== 'decision'}
              externalRotation={false}
            />
            {/* Boat label */}
            <Rect
              x={(currentScenario.yourBoat.labelOffsetX || 0) - 35}
              y={(currentScenario.yourBoat.labelOffsetY || -50) - 12}
              width="70"
              height="24"
              rx="12"
              fill={currentScenario.yourBoat.color}
            />
            <SvgText
              x={currentScenario.yourBoat.labelOffsetX || 0}
              y={(currentScenario.yourBoat.labelOffsetY || -50) + 5}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="700"
            >
              YOU
            </SvgText>
          </AnimatedG>

          {/* Other boat */}
          <AnimatedG animatedProps={otherBoatProps}>
            <TopDownSailboatSVG
              hullColor={currentScenario.otherBoat.color}
              rotation={currentScenario.otherBoat.rotate}
              scale={0.6}
              windDirection={windDirection}
              showWake={phase !== 'decision'}
              externalRotation={false}
            />
            {/* Boat label */}
            <Rect
              x={(currentScenario.otherBoat.labelOffsetX || 0) - 35}
              y={(currentScenario.otherBoat.labelOffsetY || -50) - 12}
              width="70"
              height="24"
              rx="12"
              fill={currentScenario.otherBoat.color}
            />
            <SvgText
              x={currentScenario.otherBoat.labelOffsetX || 0}
              y={(currentScenario.otherBoat.labelOffsetY || -50) + 5}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="700"
            >
              OTHER
            </SvgText>
          </AnimatedG>

          {/* Overlap status indicator */}
          {currentScenario.showOverlapIndicator && phase !== 'approaching' && (
            <G transform={`translate(400, 480)`}>
              <Rect x="-80" y="-15" width="160" height="30" rx="15" fill="#1E293B" opacity="0.9" />
              <SvgText x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="600">
                {currentScenario.overlapStatus === 'overlapped' ? 'OVERLAPPED AT ZONE' :
                 currentScenario.overlapStatus === 'clear-ahead' ? 'YOU CLEAR AHEAD' : 'YOU CLEAR ASTERN'}
              </SvgText>
            </G>
          )}
        </Svg>
      </View>

      {/* Scenario info */}
      <View style={scenarioStyles.infoPanel}>
        <Text style={scenarioStyles.scenarioName}>{currentScenario.name}</Text>
        <Text style={scenarioStyles.scenarioDescription}>{currentScenario.description}</Text>
      </View>

      {/* Decision buttons */}
      {phase === 'decision' && (
        <View style={scenarioStyles.decisionPanel}>
          <Text style={scenarioStyles.decisionTitle}>Are you ENTITLED to mark room, or must you GIVE ROOM?</Text>
          <View style={scenarioStyles.decisionButtons}>
            <TouchableOpacity
              style={[scenarioStyles.decisionButton, scenarioStyles.entitledButton]}
              onPress={() => handleDecision('entitled')}
            >
              <Text style={scenarioStyles.decisionButtonText}>Entitled to Room</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[scenarioStyles.decisionButton, scenarioStyles.giveRoomButton]}
              onPress={() => handleDecision('must-give-room')}
            >
              <Text style={scenarioStyles.decisionButtonText}>Must Give Room</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Feedback panel */}
      {(phase === 'resolution' || phase === 'complete') && userAnswer && (
        <View style={[scenarioStyles.feedbackPanel, isCorrect ? scenarioStyles.feedbackCorrect : scenarioStyles.feedbackIncorrect]}>
          <View style={scenarioStyles.feedbackHeader}>
            <Ionicons
              name={isCorrect ? "checkmark-circle" : "close-circle"}
              size={24}
              color={isCorrect ? "#22C55E" : "#EF4444"}
            />
            <Text style={[scenarioStyles.feedbackTitle, isCorrect ? scenarioStyles.feedbackTitleCorrect : scenarioStyles.feedbackTitleIncorrect]}>
              {isCorrect ? 'Correct!' : 'Not Quite'}
            </Text>
          </View>
          <Text style={scenarioStyles.feedbackText}>
            {isCorrect ? currentScenario.correctExplanation : currentScenario.incorrectExplanation}
          </Text>
          <Text style={scenarioStyles.ruleText}>{currentScenario.ruleText}</Text>
        </View>
      )}

      {/* Skip button */}
      {phase === 'complete' && currentScenarioIndex < shuffledScenarios.length - 1 && (
        <TouchableOpacity style={scenarioStyles.skipButton} onPress={handleSkip}>
          <Text style={scenarioStyles.skipButtonText}>Next Scenario</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Main Component Props
interface MarkRoomInteractiveProps {
  onComplete?: () => void;
}

// Main Mark Room Interactive Component
export function MarkRoomInteractive({ onComplete }: MarkRoomInteractiveProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const currentStep = MARK_ROOM_STEPS[currentStepIndex];
  const totalSteps = MARK_ROOM_STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isInteractiveStep = currentStep.visualState.interactiveScenarios?.enabled;

  // Animation values for boat movement
  const boat1Progress = useSharedValue(0);
  const boat1Bob = useSharedValue(0);
  const boat2Bob = useSharedValue(0);
  const zonePulse = useSharedValue(0);

  // Start animations
  useEffect(() => {
    // Bobbing effect
    boat1Bob.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    boat2Bob.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(2, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    zonePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  // Run boat movement animation when step changes
  useEffect(() => {
    const movement = currentStep.visualState.boatMovement;
    if (movement?.enabled) {
      boat1Progress.value = 0;
      const runAnimation = () => {
        boat1Progress.value = withTiming(1, {
          duration: movement.duration || 3000,
          easing: Easing.inOut(Easing.quad),
        }, (finished) => {
          if (finished && movement.loop) {
            boat1Progress.value = 0;
            setTimeout(() => runAnimation(), movement.loopDelay || 1000);
          }
        });
      };
      setTimeout(runAnimation, movement.pauseAtEnd ? 0 : 500);
    }
  }, [currentStepIndex]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (isLastStep) {
      setShowQuiz(true);
    } else {
      setCurrentStepIndex(prev => prev + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [isLastStep]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [currentStepIndex]);

  const handleQuizComplete = useCallback(() => {
    setShowQuiz(false);
    onComplete?.();
  }, [onComplete]);

  // Animated props for boat 1
  const boat1AnimatedProps = useAnimatedProps(() => {
    const boat = currentStep.visualState.boat1;
    if (!boat || boat.opacity === 0) return { transform: [{ translateX: 0 }, { translateY: 0 }] };

    const startX = boat.startX ?? boat.x ?? 0;
    const startY = boat.startY ?? boat.y ?? 0;
    const endX = boat.endX ?? boat.x ?? 0;
    const endY = boat.endY ?? boat.y ?? 0;

    const x = interpolate(boat1Progress.value, [0, 1], [startX, endX]);
    const y = interpolate(boat1Progress.value, [0, 1], [startY, endY]) + boat1Bob.value;

    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  // Animated props for boat 2
  const boat2AnimatedProps = useAnimatedProps(() => {
    const boat = currentStep.visualState.boat2;
    if (!boat || boat.opacity === 0) return { transform: [{ translateX: 0 }, { translateY: 0 }] };

    const startX = boat.startX ?? boat.x ?? 0;
    const startY = boat.startY ?? boat.y ?? 0;
    const endX = boat.endX ?? boat.x ?? 0;
    const endY = boat.endY ?? boat.y ?? 0;

    const x = interpolate(boat1Progress.value, [0, 1], [startX, endX]);
    const y = interpolate(boat1Progress.value, [0, 1], [startY, endY]) + boat2Bob.value;

    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  // Zone animated props
  const zoneAnimatedProps = useAnimatedProps(() => {
    const mark = currentStep.visualState.mark;
    if (!mark?.showZone) return { r: 90, opacity: 0.2 };

    const pulseAmount = interpolate(zonePulse.value, [0, 1], [0, 6]);
    return {
      r: (mark.zoneRadius || 90) + pulseAmount,
      opacity: interpolate(zonePulse.value, [0, 1], [0.15, 0.25]),
    };
  });

  // Show quiz if active
  if (showQuiz) {
    return (
      <ScrollView style={styles.container}>
        <Quiz questions={MARK_ROOM_QUIZ} onComplete={handleQuizComplete} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {currentStepIndex + 1} of {totalSteps}</Text>
        </View>

        {/* Step header */}
        <View style={styles.stepHeader}>
          <Text style={styles.stepLabel}>{currentStep.label}</Text>
          <Text style={styles.stepDescription}>{currentStep.description}</Text>
        </View>

        {/* Interactive scenario trainer (for practice step) */}
        {isInteractiveStep ? (
          <InteractiveScenarioTrainer
            scenarios={currentStep.visualState.interactiveScenarios!.scenarios}
            approachDuration={currentStep.visualState.interactiveScenarios!.approachDuration}
            resolutionDuration={currentStep.visualState.interactiveScenarios!.resolutionDuration}
            loopDelay={currentStep.visualState.interactiveScenarios!.loopDelay}
            windDirection={0}
          />
        ) : (
          /* SVG Visualization */
          <View style={styles.svgContainer}>
            <Svg width="100%" height="100%" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
              <Defs>
                <LinearGradient id="waterGradientMain" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.15" />
                  <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.25" />
                </LinearGradient>
                <RadialGradient id="zoneGradientMain" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.05" />
                  <Stop offset="70%" stopColor="#F59E0B" stopOpacity="0.15" />
                  <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.25" />
                </RadialGradient>
              </Defs>

              {/* Water background */}
              <Rect x="0" y="0" width="800" height="500" fill="url(#waterGradientMain)" />

              {/* Wind indicator - pointing South (downward) */}
              {currentStep.visualState.windArrow?.opacity !== 0 && (
                <G transform={`translate(${currentStep.visualState.windArrow?.x || 400}, ${currentStep.visualState.windArrow?.y || 50})`}>
                  {/* Arrow shaft pointing down */}
                  <Line x1="0" y1="-10" x2="0" y2="20" stroke="#475569" strokeWidth="2" />
                  {/* Arrowhead at bottom pointing down */}
                  <Polygon points="0,28 -8,16 8,16" fill="#475569" />
                  <SvgText x="0" y="-18" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
                    WIND
                  </SvgText>
                </G>
              )}

              {/* Mark with zone */}
              {currentStep.visualState.mark?.opacity !== 0 && (
                <G>
                  {/* Zone circle - animated */}
                  {currentStep.visualState.mark?.showZone && (
                    <AnimatedCircle
                      cx={currentStep.visualState.mark.cx}
                      cy={currentStep.visualState.mark.cy}
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeDasharray="10,5"
                      fill="url(#zoneGradientMain)"
                      animatedProps={zoneAnimatedProps}
                    />
                  )}

                  {/* Zone label */}
                  {currentStep.visualState.mark?.showZone && (
                    <SvgText
                      x={(currentStep.visualState.mark.cx || 400) + (currentStep.visualState.mark.zoneRadius || 90) + 10}
                      y={currentStep.visualState.mark.cy || 200}
                      fill="#D97706"
                      fontSize="12"
                      fontWeight="600"
                    >
                      ZONE
                    </SvgText>
                  )}

                  {/* Mark */}
                  <Circle
                    cx={currentStep.visualState.mark.cx}
                    cy={currentStep.visualState.mark.cy}
                    r="14"
                    fill="#F97316"
                    stroke="#C2410C"
                    strokeWidth="2"
                  />
                  <SvgText
                    x={currentStep.visualState.mark.cx}
                    y={(currentStep.visualState.mark.cy || 200) - 22}
                    textAnchor="middle"
                    fill="#1E293B"
                    fontSize="11"
                    fontWeight="600"
                  >
                    MARK
                  </SvgText>
                </G>
              )}

              {/* Rounding paths */}
              {currentStep.visualState.roundingPath?.opacity !== 0 && currentStep.visualState.roundingPath?.properPath && (
                <G>
                  <Path
                    d={currentStep.visualState.roundingPath.properPath.d}
                    stroke="#22C55E"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    fill="none"
                    opacity={0.8}
                  />
                  {currentStep.visualState.roundingPath.properPath.label && (
                    <SvgText x="510" y="290" fill="#22C55E" fontSize="11" fontWeight="600">
                      {currentStep.visualState.roundingPath.properPath.label}
                    </SvgText>
                  )}
                </G>
              )}

              {currentStep.visualState.roundingPath?.improperPath && (
                <G>
                  <Path
                    d={currentStep.visualState.roundingPath.improperPath.d}
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    fill="none"
                    opacity={0.6}
                  />
                  {currentStep.visualState.roundingPath.improperPath.label && (
                    <SvgText x="540" y="280" fill="#EF4444" fontSize="11" fontWeight="600">
                      {currentStep.visualState.roundingPath.improperPath.label}
                    </SvgText>
                  )}
                </G>
              )}

              {/* Boat 1 */}
              {currentStep.visualState.boat1?.opacity !== 0 && (
                <AnimatedG animatedProps={boat1AnimatedProps}>
                  <TopDownSailboatSVG
                    hullColor={currentStep.visualState.boat1?.color || '#3B82F6'}
                    rotation={currentStep.visualState.boat1?.rotate || 0}
                    scale={0.6}
                    windDirection={0}
                    showWake={true}
                    externalRotation={false}
                  />
                  {currentStep.visualState.boat1?.label && (
                    <G transform="translate(0, -45)">
                      <Rect x="-40" y="-12" width="80" height="24" rx="12" fill={currentStep.visualState.boat1?.color || '#3B82F6'} />
                      <SvgText x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">
                        {currentStep.visualState.boat1?.label}
                      </SvgText>
                    </G>
                  )}
                </AnimatedG>
              )}

              {/* Boat 2 */}
              {currentStep.visualState.boat2?.opacity !== 0 && (
                <AnimatedG animatedProps={boat2AnimatedProps}>
                  <TopDownSailboatSVG
                    hullColor={currentStep.visualState.boat2?.color || '#10B981'}
                    rotation={currentStep.visualState.boat2?.rotate || 0}
                    scale={0.6}
                    windDirection={0}
                    showWake={true}
                    externalRotation={false}
                  />
                  {currentStep.visualState.boat2?.label && (
                    <G transform="translate(0, -45)">
                      <Rect x="-40" y="-12" width="80" height="24" rx="12" fill={currentStep.visualState.boat2?.color || '#10B981'} />
                      <SvgText x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">
                        {currentStep.visualState.boat2?.label}
                      </SvgText>
                    </G>
                  )}
                </AnimatedG>
              )}

              {/* Position labels */}
              {currentStep.visualState.positionLabels?.inside && (
                <G>
                  <Rect
                    x={(currentStep.visualState.positionLabels.inside.x || 0) - 60}
                    y={(currentStep.visualState.positionLabels.inside.y || 0) - 20}
                    width="120"
                    height="40"
                    rx="8"
                    fill="#10B981"
                    opacity={0.9}
                  />
                  <SvgText
                    x={currentStep.visualState.positionLabels.inside.x}
                    y={currentStep.visualState.positionLabels.inside.y}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="600"
                  >
                    INSIDE
                  </SvgText>
                  <SvgText
                    x={currentStep.visualState.positionLabels.inside.x}
                    y={(currentStep.visualState.positionLabels.inside.y || 0) + 14}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9"
                  >
                    (Entitled)
                  </SvgText>
                </G>
              )}

              {currentStep.visualState.positionLabels?.outside && (
                <G>
                  <Rect
                    x={(currentStep.visualState.positionLabels.outside.x || 0) - 60}
                    y={(currentStep.visualState.positionLabels.outside.y || 0) - 20}
                    width="120"
                    height="40"
                    rx="8"
                    fill="#3B82F6"
                    opacity={0.9}
                  />
                  <SvgText
                    x={currentStep.visualState.positionLabels.outside.x}
                    y={currentStep.visualState.positionLabels.outside.y}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="600"
                  >
                    OUTSIDE
                  </SvgText>
                  <SvgText
                    x={currentStep.visualState.positionLabels.outside.x}
                    y={(currentStep.visualState.positionLabels.outside.y || 0) + 14}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9"
                  >
                    (Must Give Room)
                  </SvgText>
                </G>
              )}

              {currentStep.visualState.positionLabels?.clearAhead && (
                <G>
                  <Rect
                    x={(currentStep.visualState.positionLabels.clearAhead.x || 0) - 60}
                    y={(currentStep.visualState.positionLabels.clearAhead.y || 0) - 20}
                    width="120"
                    height="40"
                    rx="8"
                    fill="#10B981"
                    opacity={0.9}
                  />
                  <SvgText
                    x={currentStep.visualState.positionLabels.clearAhead.x}
                    y={currentStep.visualState.positionLabels.clearAhead.y}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="600"
                  >
                    CLEAR AHEAD
                  </SvgText>
                  <SvgText
                    x={currentStep.visualState.positionLabels.clearAhead.x}
                    y={(currentStep.visualState.positionLabels.clearAhead.y || 0) + 14}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9"
                  >
                    (No Obligation)
                  </SvgText>
                </G>
              )}

              {currentStep.visualState.positionLabels?.clearAstern && (
                <G>
                  <Rect
                    x={(currentStep.visualState.positionLabels.clearAstern.x || 0) - 60}
                    y={(currentStep.visualState.positionLabels.clearAstern.y || 0) - 20}
                    width="120"
                    height="40"
                    rx="8"
                    fill="#EF4444"
                    opacity={0.9}
                  />
                  <SvgText
                    x={currentStep.visualState.positionLabels.clearAstern.x}
                    y={currentStep.visualState.positionLabels.clearAstern.y}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="600"
                  >
                    CLEAR ASTERN
                  </SvgText>
                  <SvgText
                    x={currentStep.visualState.positionLabels.clearAstern.x}
                    y={(currentStep.visualState.positionLabels.clearAstern.y || 0) + 14}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9"
                  >
                    (No Rights)
                  </SvgText>
                </G>
              )}

              {/* Zone entry indicator */}
              {currentStep.visualState.zoneEntry?.showOverlapIndicator && (
                <G transform="translate(400, 460)">
                  <Rect x="-80" y="-15" width="160" height="30" rx="15" fill="#1E293B" opacity={0.9} />
                  <SvgText x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="600">
                    {currentStep.visualState.zoneEntry.overlapText || 'OVERLAPPED'}
                  </SvgText>
                </G>
              )}

              {/* Rule text */}
              {currentStep.visualState.ruleText?.opacity !== 0 && (
                <G transform={`translate(${currentStep.visualState.ruleText?.x || 400}, ${currentStep.visualState.ruleText?.y || 470})`}>
                  <Rect x="-200" y="-18" width="400" height="36" rx="18" fill="#0F172A" opacity={0.85} />
                  <SvgText x="0" y="6" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="600">
                    {currentStep.visualState.ruleText?.text}
                  </SvgText>
                </G>
              )}
            </Svg>
          </View>
        )}

        {/* Details section */}
        <View style={styles.detailsSection}>
          {currentStep.details.map((detail, idx) => (
            <View key={idx} style={styles.detailItem}>
              <View style={styles.detailBullet} />
              <Text style={styles.detailText}>{detail}</Text>
            </View>
          ))}
        </View>

        {/* Pro tip */}
        {currentStep.proTip && (
          <View style={styles.proTipContainer}>
            <View style={styles.proTipHeader}>
              <Ionicons name="bulb" size={18} color="#F59E0B" />
              <Text style={styles.proTipLabel}>Pro Tip</Text>
            </View>
            <Text style={styles.proTipText}>{currentStep.proTip}</Text>
          </View>
        )}

        {/* Rule reference */}
        {currentStep.ruleReference && (
          <View style={styles.ruleRefContainer}>
            <Ionicons name="book-outline" size={14} color="#64748B" />
            <Text style={styles.ruleRefText}>{currentStep.ruleReference}</Text>
          </View>
        )}

        {/* Deep dive button */}
        {currentStep.deepDive && (
          <TouchableOpacity style={styles.deepDiveButton} onPress={() => setShowDeepDive(true)}>
            <Ionicons name="layers-outline" size={18} color="#3B82F6" />
            <Text style={styles.deepDiveButtonText}>Deep Dive: Learn More</Text>
            <Ionicons name="chevron-forward" size={18} color="#3B82F6" />
          </TouchableOpacity>
        )}

        {/* Spacer for navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentStepIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentStepIndex === 0 ? '#CBD5E1' : '#3B82F6'} />
          <Text style={[styles.navButtonText, currentStepIndex === 0 && styles.navButtonTextDisabled]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.stepDots}>
          {MARK_ROOM_STEPS.map((_, idx) => (
            <View
              key={idx}
              style={[styles.stepDot, idx === currentStepIndex && styles.stepDotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.navButton} onPress={handleNext}>
          <Text style={styles.navButtonText}>{isLastStep ? 'Quiz' : 'Next'}</Text>
          <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Deep Dive Modal */}
      <DeepDivePanel
        visible={showDeepDive}
        onClose={() => setShowDeepDive(false)}
        stepTitle={currentStep.label}
        deepDive={currentStep.deepDive}
      />
    </View>
  );
}

// Main styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  progressContainer: {
    padding: 16,
    paddingBottom: 8,
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
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  stepHeader: {
    padding: 16,
    paddingTop: 8,
  },
  stepLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  svgContainer: {
    width: '100%',
    aspectRatio: 8 / 5,
    minHeight: 300,
    maxHeight: 600,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.08)' }
      : { elevation: 2 }),
  },
  detailsSection: {
    padding: 16,
    paddingTop: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginTop: 7,
    marginRight: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
  proTipContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  proTipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  proTipText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  ruleRefContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 6,
  },
  ruleRefText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  deepDiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 8,
  },
  deepDiveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  navButtonTextDisabled: {
    color: '#CBD5E1',
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
    width: 20,
  },
});

// Quiz styles
const quizStyles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  progress: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
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
  },
  question: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 24,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  hintButtonText: {
    fontSize: 13,
    color: '#F59E0B',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 16,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontStyle: 'italic',
  },
  options: {
    gap: 10,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  optionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionCorrect: {
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },
  optionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
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
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginBottom: 20,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  actions: {
    alignItems: 'center',
  },
  submitButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// Deep dive styles
const deepDiveStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
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
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  proTipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 12,
  },
  proTipItem: {
    marginBottom: 8,
  },
  proTipText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
});

// Scenario trainer styles
const scenarioStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1E293B',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scenarioCount: {
    fontSize: 13,
    color: '#94A3B8',
  },
  svgContainer: {
    width: '100%',
    aspectRatio: 8 / 5,
    minHeight: 280,
    maxHeight: 550,
  },
  infoPanel: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  scenarioDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  decisionPanel: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  decisionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  decisionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  entitledButton: {
    backgroundColor: '#10B981',
  },
  giveRoomButton: {
    backgroundColor: '#3B82F6',
  },
  decisionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  feedbackPanel: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  feedbackCorrect: {
    backgroundColor: '#DCFCE7',
  },
  feedbackIncorrect: {
    backgroundColor: '#FEE2E2',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  feedbackTitleCorrect: {
    color: '#166534',
  },
  feedbackTitleIncorrect: {
    color: '#991B1B',
  },
  feedbackText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 4,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default MarkRoomInteractive;
