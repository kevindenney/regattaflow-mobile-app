/**
 * Upwind Tactics Interactive Component
 * A beginner-friendly introduction to upwind sailing strategies.
 *
 * Features:
 * - Step-by-step explanation of upwind sailing
 * - Visual demonstrations with boats beating upwind
 * - Layline and tack zone visualizations
 * - Wind shift indicators
 * - Quiz at the end
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
} from 'react-native-svg';

import {
  UPWIND_TACTICS_STEPS,
  UPWIND_TACTICS_QUIZ,
  DEEP_DIVE_CONTENT,
  type UpwindTacticsStep,
  type BoatPosition,
  type MarkPosition,
  type QuizQuestion,
} from './data/upwindTacticsData';
import { TopDownSailboatSVG } from './shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Quiz answer interface
interface QuizAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
}

interface UpwindTacticsInteractiveProps {
  onComplete?: () => void;
}

export function UpwindTacticsInteractive({ onComplete }: UpwindTacticsInteractiveProps) {
  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Animation timer ref
  const animationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get current step
  const currentStep = useMemo(() => {
    return UPWIND_TACTICS_STEPS[currentStepIndex];
  }, [currentStepIndex]);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      animationTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= UPWIND_TACTICS_STEPS.length - 1) {
            setIsPlaying(false);
            setIsCompleted(true);
            return prev;
          }
          return prev + 1;
        });
      }, 6000);
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
    if (currentStepIndex >= UPWIND_TACTICS_STEPS.length - 1) {
      setCurrentStepIndex(0);
      setIsCompleted(false);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepChange = (stepIndex: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.min(Math.max(0, stepIndex), UPWIND_TACTICS_STEPS.length - 1));
  };

  const handleNext = () => {
    if (currentStepIndex < UPWIND_TACTICS_STEPS.length - 1) {
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
    const question = UPWIND_TACTICS_QUIZ.find((q) => q.id === questionId);
    const option = question?.options.find((o) => o.id === optionId);
    const isCorrect = option?.isCorrect ?? false;

    setQuizAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId);
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
    const correct = quizAnswers.filter((a) => a.isCorrect).length;
    return { correct, total: UPWIND_TACTICS_QUIZ.length };
  };

  const resetQuiz = () => {
    setQuizAnswers([]);
  };

  // Render a single boat
  const renderBoat = (boat: BoatPosition) => {
    const windDirection = 0; // Wind from north (pointing south)
    const scale = 0.4;
    const isNoGoBoat = boat.id === 'noGo';

    return (
      <G key={boat.id} transform={`translate(${boat.x}, ${boat.y})`}>
        {/* Path trail if showing */}
        {boat.showPath && boat.pathPoints && boat.pathPoints.length > 1 && (
          <Path
            d={`M ${boat.pathPoints.map((p) => `${p.x - boat.x} ${p.y - boat.y}`).join(' L ')}`}
            stroke={boat.color}
            strokeWidth={2}
            strokeDasharray="6,4"
            fill="none"
            opacity={0.5}
          />
        )}

        {/* Special rendering for no-go boat with luffing sails */}
        {isNoGoBoat ? (
          <G transform={`rotate(${boat.rotation}) scale(${scale})`}>
            {/* Hull - same base dimensions as TopDownSailboatSVG (centered at ~25,40) */}
            <Path
              d="M 0,-32 L 12,-24 L 12,28 Q 0,40 -12,28 L -12,-24 Z"
              fill={boat.color}
              stroke="#64748B"
              strokeWidth={2}
            />
            {/* Luffing mainsail - wavy/flapping */}
            <Path
              d="M 0,-16 Q 6,-8 0,0 Q -6,8 0,16"
              stroke="#94A3B8"
              strokeWidth={4}
              fill="none"
              transform="translate(0, -4)"
            />
            {/* Luffing jib - wavy/flapping */}
            <Path
              d="M 0,-12 Q 4,-6 0,0 Q -4,6 0,8"
              stroke="#94A3B8"
              strokeWidth={3}
              fill="none"
              transform="translate(0, -14)"
            />
            {/* X mark to show can't sail here - scaled up to match */}
            <Line x1={-24} y1={-24} x2={24} y2={24} stroke="#EF4444" strokeWidth={4} />
            <Line x1={24} y1={-24} x2={-24} y2={24} stroke="#EF4444" strokeWidth={4} />
          </G>
        ) : (
          <TopDownSailboatSVG
            hullColor={boat.color}
            rotation={boat.rotation}
            scale={scale}
            showWake={true}
            windDirection={windDirection}
          />
        )}

        {/* Position label - offset further to avoid overlapping rotated boats */}
        {boat.label && (
          <G transform="translate(0, 55)">
            <Rect
              x={-48}
              y={-12}
              width={96}
              height={24}
              fill="#FFFFFF"
              stroke={boat.color}
              strokeWidth={1.5}
              rx={4}
            />
            <SvgText
              x={0}
              y={5}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill={boat.color}
            >
              {boat.label}
            </SvgText>
          </G>
        )}
      </G>
    );
  };

  // Render course marks
  const renderMarks = () => {
    const marks = currentStep.marks || [];

    return (
      <G>
        {marks.map((mark) => {
          switch (mark.type) {
            case 'windward':
              return (
                <G key={mark.id}>
                  <Circle
                    cx={mark.x}
                    cy={mark.y}
                    r={14}
                    fill="#F59E0B"
                    stroke="#000000"
                    strokeWidth={2}
                  />
                  {mark.label && (
                    <SvgText
                      x={mark.x}
                      y={mark.y - 25}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#1E293B"
                    >
                      {mark.label}
                    </SvgText>
                  )}
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
                </G>
              );
            case 'rc-boat':
              return (
                <G key={mark.id}>
                  <Rect
                    x={mark.x - 22}
                    y={mark.y - 8}
                    width={44}
                    height={16}
                    fill="#1E293B"
                    rx={3}
                  />
                  <SvgText
                    x={mark.x}
                    y={mark.y + 25}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#1E293B"
                  >
                    Race Committee
                  </SvgText>
                </G>
              );
            default:
              return null;
          }
        })}

        {/* Start line if both marks present */}
        {marks.some((m) => m.type === 'start-pin') && marks.some((m) => m.type === 'rc-boat') && (
          <G>
            {(() => {
              const pin = marks.find((m) => m.type === 'start-pin');
              const rc = marks.find((m) => m.type === 'rc-boat');
              if (pin && rc) {
                const midX = (pin.x + rc.x) / 2;
                const midY = (pin.y + rc.y) / 2;
                return (
                  <>
                    <Line
                      x1={pin.x}
                      y1={pin.y}
                      x2={rc.x}
                      y2={rc.y}
                      stroke="#000000"
                      strokeWidth={2}
                      strokeDasharray="8,4"
                      opacity={0.5}
                    />
                    <SvgText
                      x={midX}
                      y={midY - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#1E293B"
                    >
                      Start Line
                    </SvgText>
                  </>
                );
              }
              return null;
            })()}
          </G>
        )}
      </G>
    );
  };

  // Render laylines
  const renderLaylines = () => {
    if (!currentStep.showLaylines) return null;

    const windwardMark = currentStep.marks?.find((m) => m.type === 'windward');
    if (!windwardMark) return null;

    const laylineAngle = 45; // Degrees from wind
    const laylineLength = 350;

    return (
      <G>
        {/* Port layline (left) */}
        <Line
          x1={windwardMark.x}
          y1={windwardMark.y}
          x2={windwardMark.x - laylineLength * Math.sin((laylineAngle * Math.PI) / 180)}
          y2={windwardMark.y + laylineLength * Math.cos((laylineAngle * Math.PI) / 180)}
          stroke="#EF4444"
          strokeWidth={2}
          strokeDasharray="10,5"
          opacity={0.7}
        />
        <SvgText
          x={windwardMark.x - 120}
          y={windwardMark.y + 150}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="#EF4444"
          transform={`rotate(-45, ${windwardMark.x - 120}, ${windwardMark.y + 150})`}
        >
          Port Layline
        </SvgText>

        {/* Starboard layline (right) */}
        <Line
          x1={windwardMark.x}
          y1={windwardMark.y}
          x2={windwardMark.x + laylineLength * Math.sin((laylineAngle * Math.PI) / 180)}
          y2={windwardMark.y + laylineLength * Math.cos((laylineAngle * Math.PI) / 180)}
          stroke="#3B82F6"
          strokeWidth={2}
          strokeDasharray="10,5"
          opacity={0.7}
        />
        <SvgText
          x={windwardMark.x + 120}
          y={windwardMark.y + 150}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="#3B82F6"
          transform={`rotate(45, ${windwardMark.x + 120}, ${windwardMark.y + 150})`}
        >
          Starboard Layline
        </SvgText>
      </G>
    );
  };

  // Render no-go zone
  const renderNoGoZone = () => {
    if (currentStepIndex !== 0) return null; // Only show on first step

    // Based on windward mark at y: 120
    return (
      <G>
        {/* No-go zone triangle - expanded size */}
        <Path
          d="M 400 120 L 300 280 A 140 140 0 0 1 500 280 Z"
          fill="#FEE2E2"
          stroke="#EF4444"
          strokeWidth={2}
          strokeDasharray="6,3"
          opacity={0.4}
        />
        <SvgText
          x={400}
          y={220}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#DC2626"
        >
          No-Go Zone
        </SvgText>
        <SvgText
          x={400}
          y={236}
          textAnchor="middle"
          fontSize="10"
          fill="#DC2626"
        >
          (~45° each side)
        </SvgText>
      </G>
    );
  };

  // Render tack zone indicator
  const renderTackZone = () => {
    if (!currentStep.showTackZone) return null;

    return (
      <G>
        {/* Curved arrow showing tack path */}
        <Path
          d="M 340 290 Q 400 230 460 230"
          stroke="#3B82F6"
          strokeWidth={3}
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <SvgText
          x={400}
          y={210}
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="#3B82F6"
        >
          Tacking Through Wind
        </SvgText>
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
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 800 500"
              preserveAspectRatio="xMidYMid meet"
            >
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
              </Defs>

              {/* Water background */}
              <Rect width="800" height="500" fill="#BFDBFE" />
              <Rect width="800" height="500" fill="url(#water-pattern)" />

              {/* Wind indicator - arrow points south showing wind blowing from north */}
              <G transform="translate(750, 60)">
                <Circle cx={0} cy={0} r={25} fill="#FFFFFF" stroke="#3B82F6" strokeWidth={2} />
                <Path d="M 0,15 L 5,-5 L 0,0 L -5,-5 Z" fill="#3B82F6" />
                <SvgText x={0} y={-30} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1E293B">
                  WIND
                </SvgText>
              </G>

              {/* No-go zone visualization */}
              {renderNoGoZone()}

              {/* Laylines */}
              {renderLaylines()}

              {/* Tack zone */}
              {renderTackZone()}

              {/* Course marks */}
              {renderMarks()}

              {/* Boats */}
              {currentStep.boats.map((boat) => renderBoat(boat))}

              {/* Step label overlay */}
              <G transform="translate(400, 30)">
                <Rect x={-150} y={-20} width={300} height={40} fill="#1E293B" rx={20} opacity={0.9} />
                <SvgText x={0} y={5} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#FFFFFF">
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
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentStepIndex === 0 ? '#CBD5E1' : '#3B82F6'}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                currentStepIndex === UPWIND_TACTICS_STEPS.length - 1 && styles.navButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={currentStepIndex === UPWIND_TACTICS_STEPS.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentStepIndex === UPWIND_TACTICS_STEPS.length - 1 ? '#CBD5E1' : '#3B82F6'}
              />
            </TouchableOpacity>
          </View>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {UPWIND_TACTICS_STEPS.map((step, index) => (
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
          <View style={styles.lessonBadge}>
            <Text style={styles.lessonBadgeText}>Upwind Tactics</Text>
          </View>
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
            <Ionicons
              name={showDeepDive ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#8B5CF6"
            />
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
                <Text style={styles.deepDiveProTipsTitle}>Quick Tips</Text>
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

        {/* Quiz Prompt */}
        {isCompleted && !showQuiz && (
          <View style={styles.quizPrompt}>
            <View style={styles.quizPromptContent}>
              <Ionicons name="school" size={32} color="#3B82F6" />
              <Text style={styles.quizPromptTitle}>Test Your Knowledge?</Text>
              <Text style={styles.quizPromptText}>
                Take a quick quiz to check your understanding of upwind tactics.
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

            {UPWIND_TACTICS_QUIZ.map((question, qIndex) => {
              const answer = quizAnswers.find((a) => a.questionId === question.id);

              return (
                <View key={question.id} style={styles.questionCard}>
                  <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                  <Text style={styles.questionText}>{question.question}</Text>

                  <View style={styles.optionsContainer}>
                    {question.options.map((option) => {
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
                            answer.isCorrect
                              ? styles.feedbackTitleCorrect
                              : styles.feedbackTitleIncorrect,
                          ]}
                        >
                          {answer.isCorrect ? 'Correct!' : 'Not quite - try again!'}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.feedbackText,
                          answer.isCorrect
                            ? styles.feedbackTextCorrect
                            : styles.feedbackTextIncorrect,
                        ]}
                      >
                        {answer.isCorrect
                          ? question.explanation
                          : question.hint || 'Review the lesson and try again.'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Quiz Results */}
            {quizAnswers.length === UPWIND_TACTICS_QUIZ.length &&
              quizAnswers.every((a) => a.isCorrect) && (
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
                    <TouchableOpacity style={styles.completeButton} onPress={() => onComplete?.()}>
                      <Text style={styles.completeButtonText}>Complete Lesson</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
          </View>
        )}

        {/* Navigation */}
        {!showQuiz && (
          <View style={styles.navControls}>
            {isCompleted ? (
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
            ) : (
              <View style={styles.progressText}>
                <Text style={styles.progressLabel}>
                  Step {currentStepIndex + 1} of {UPWIND_TACTICS_STEPS.length}
                </Text>
              </View>
            )}
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
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    }),
  },
  visualizationArea: { backgroundColor: '#EFF6FF', borderBottomWidth: 1, borderBottomColor: '#DBEAFE' },
  svgContainer: { width: '100%', aspectRatio: 16 / 10, minHeight: 300, maxHeight: 500 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(255, 255, 255, 0.9)' },
  navButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  navButtonDisabled: { opacity: 0.5 },
  playButton: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ web: { boxShadow: '0px 4px 12px rgba(59, 130, 246, 0.4)' }, default: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 } }),
  },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 16, flexWrap: 'wrap', paddingHorizontal: 16 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1' },
  stepDotActive: { backgroundColor: '#3B82F6', width: 24 },
  stepDotComplete: { backgroundColor: '#10B981' },
  contentSection: { padding: 20 },
  lessonBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#93C5FD', marginBottom: 8 },
  lessonBadgeText: { fontSize: 12, fontWeight: '600', color: '#1E40AF' },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  stepDescription: { fontSize: 16, color: '#475569', lineHeight: 24, marginBottom: 16 },
  detailsList: { marginTop: 8, gap: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailBullet: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  detailText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 20 },
  proTipBox: { marginTop: 16, backgroundColor: '#FFFBEB', borderRadius: 10, padding: 14, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  proTipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  proTipLabel: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  proTipText: { fontSize: 14, color: '#78350F', lineHeight: 20, fontStyle: 'italic' },
  deepDiveSection: { marginTop: 8, paddingHorizontal: 16, paddingBottom: 16 },
  deepDiveToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3E8FF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, gap: 8 },
  deepDiveToggleText: { fontSize: 15, fontWeight: '600', color: '#8B5CF6' },
  deepDiveContent: { marginTop: 12, backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  deepDiveTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  deepDiveItem: { marginBottom: 16 },
  deepDiveSectionTitle: { fontSize: 15, fontWeight: '600', color: '#3B82F6', marginBottom: 6 },
  deepDiveSectionContent: { fontSize: 14, color: '#475569', lineHeight: 20 },
  deepDiveProTips: { marginTop: 8, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 12 },
  deepDiveProTipsTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 10 },
  deepDiveProTipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  deepDiveProTipText: { flex: 1, fontSize: 13, color: '#78350F', lineHeight: 18 },
  quizPrompt: { marginTop: 16, paddingHorizontal: 16 },
  quizPromptContent: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  quizPromptTitle: { fontSize: 20, fontWeight: '700', color: '#1E40AF', marginTop: 12, marginBottom: 8 },
  quizPromptText: { fontSize: 14, color: '#3B82F6', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  quizPromptButtons: { flexDirection: 'row', gap: 12 },
  quizPromptButtonSecondary: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  quizPromptButtonSecondaryText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  quizPromptButtonPrimary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#3B82F6' },
  quizPromptButtonPrimaryText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  quizSection: { marginTop: 16, paddingHorizontal: 16, paddingBottom: 16 },
  quizTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  quizSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  questionCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  questionNumber: { fontSize: 12, fontWeight: '600', color: '#3B82F6', marginBottom: 4, textTransform: 'uppercase' },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12, lineHeight: 22 },
  optionsContainer: { gap: 8 },
  optionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  optionSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  optionCorrect: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  optionIncorrect: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  optionText: { flex: 1, fontSize: 14, color: '#334155' },
  optionTextSelected: { color: '#1E40AF', fontWeight: '500' },
  feedbackBox: { marginTop: 12, padding: 12, borderRadius: 8, borderWidth: 1 },
  feedbackCorrect: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  feedbackIncorrect: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  feedbackTitle: { fontSize: 14, fontWeight: '700' },
  feedbackTitleCorrect: { color: '#166534' },
  feedbackTitleIncorrect: { color: '#92400E' },
  feedbackText: { fontSize: 13, lineHeight: 19 },
  feedbackTextCorrect: { color: '#166534' },
  feedbackTextIncorrect: { color: '#92400E' },
  quizResults: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#BBF7D0' },
  quizResultsTitle: { fontSize: 20, fontWeight: '700', color: '#166534', marginBottom: 4 },
  quizResultsScore: { fontSize: 16, color: '#15803D', marginBottom: 16 },
  quizResultsButtons: { flexDirection: 'row', gap: 12 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#3B82F6' },
  retryButtonText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
  completeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#3B82F6', borderRadius: 8 },
  completeButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  navControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16, paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  resetButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  resetButtonText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
  progressText: { paddingHorizontal: 16, paddingVertical: 10 },
  progressLabel: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  nextLessonButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#3B82F6', borderRadius: 8 },
  nextLessonButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});

export default UpwindTacticsInteractive;
