/**
 * Race Documents Basics Interactive Component
 * An introduction to essential race documents for beginners
 *
 * Features:
 * - Visual mockups of NOR, SI, and Course Diagram
 * - Interactive tap zones to explore document sections
 * - Step-by-step explanation of each document
 * - Timeline controls for navigation
 * - Quiz at the end
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import {
  RACE_DOCUMENTS_BASICS_STEPS,
  RACE_DOCUMENTS_BASICS_QUIZ,
  RACE_DOCUMENTS_DEEP_DIVE,
  DOCUMENT_METADATA,
  DOCUMENT_TIMELINE,
  NOR_SECTIONS,
  SI_SECTIONS,
  COURSE_SECTIONS,
  type RaceDocumentsStep,
  type DocumentSection,
  type QuizQuestion,
} from './data/raceDocumentsBasicsData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SVG_WIDTH = Math.min(400, SCREEN_WIDTH - 48);
const SVG_HEIGHT = 320;

// Quiz answer interface
interface QuizAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
}

interface RaceDocumentsBasicsInteractiveProps {
  onComplete?: () => void;
}

// Document Card Component - Renders a mock document
interface DocumentCardProps {
  type: 'nor' | 'si' | 'course';
  isActive: boolean;
  highlightedSections?: string[];
  onSectionTap?: (sectionId: string) => void;
  scale?: number;
}

function DocumentCard({ type, isActive, highlightedSections = [], onSectionTap, scale = 1 }: DocumentCardProps) {
  const metadata = DOCUMENT_METADATA[type];
  const sections = type === 'nor' ? NOR_SECTIONS : type === 'si' ? SI_SECTIONS : COURSE_SECTIONS;

  const baseWidth = 140;
  const baseHeight = 180;
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  if (type === 'course') {
    // Render course diagram
    return (
      <Svg width={width} height={height} viewBox="0 0 140 180">
        {/* Document background */}
        <Rect
          x={2}
          y={2}
          width={136}
          height={176}
          fill="#FFFFFF"
          stroke={isActive ? metadata.color : '#CBD5E1'}
          strokeWidth={isActive ? 3 : 1}
          rx={4}
        />

        {/* Title */}
        <Rect x={8} y={8} width={124} height={20} fill={metadata.color} rx={2} />
        <SvgText x={70} y={22} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF">
          COURSE DIAGRAM
        </SvgText>

        {/* Wind arrow */}
        <G transform="translate(115, 45)">
          <Line x1={0} y1={15} x2={0} y2={0} stroke="#3B82F6" strokeWidth={2} />
          <Polygon points="0,-5 -4,3 4,3" fill="#3B82F6" />
          <SvgText x={0} y={25} textAnchor="middle" fontSize="6" fill="#64748B">WIND</SvgText>
        </G>

        {/* Course marks */}
        {/* Windward mark */}
        <Circle
          cx={70}
          cy={50}
          r={8}
          fill={highlightedSections.includes('course-windward') ? '#FCD34D' : '#F59E0B'}
          stroke="#000"
          strokeWidth={1}
        />
        <SvgText x={70} y={40} textAnchor="middle" fontSize="6" fill="#1E293B">W</SvgText>

        {/* Leeward gate */}
        <Circle
          cx={55}
          cy={120}
          r={6}
          fill={highlightedSections.includes('course-leeward') ? '#6EE7B7' : '#10B981'}
          stroke="#000"
          strokeWidth={1}
        />
        <Circle
          cx={85}
          cy={120}
          r={6}
          fill={highlightedSections.includes('course-leeward') ? '#6EE7B7' : '#10B981'}
          stroke="#000"
          strokeWidth={1}
        />
        <SvgText x={70} y={135} textAnchor="middle" fontSize="6" fill="#1E293B">Gate</SvgText>

        {/* Start/Finish line */}
        <Line
          x1={30}
          y1={155}
          x2={110}
          y2={155}
          stroke={highlightedSections.includes('course-startline') ? '#F97316' : '#000'}
          strokeWidth={highlightedSections.includes('course-startline') ? 3 : 2}
          strokeDasharray="4,2"
        />
        <Rect x={25} y={150} width={12} height={10} fill="#1E293B" rx={1} />
        <Circle cx={110} cy={155} r={5} fill="#F97316" stroke="#000" strokeWidth={1} />
        <SvgText x={70} y={168} textAnchor="middle" fontSize="6" fill="#64748B">Start/Finish</SvgText>

        {/* Rounding arrows */}
        <Path
          d="M 78 55 Q 85 70, 75 85"
          fill="none"
          stroke={highlightedSections.includes('course-arrows') ? '#3B82F6' : '#94A3B8'}
          strokeWidth={1.5}
          markerEnd="url(#arrow)"
        />
      </Svg>
    );
  }

  // Render NOR or SI document
  return (
    <Svg width={width} height={height} viewBox="0 0 140 180">
      {/* Document background */}
      <Rect
        x={2}
        y={2}
        width={136}
        height={176}
        fill="#FFFFFF"
        stroke={isActive ? metadata.color : '#CBD5E1'}
        strokeWidth={isActive ? 3 : 1}
        rx={4}
      />

      {/* Header */}
      <Rect x={8} y={8} width={124} height={24} fill={metadata.color} rx={2} />
      <SvgText x={70} y={24} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFFFFF">
        {type === 'nor' ? 'NOTICE OF RACE' : 'SAILING INSTRUCTIONS'}
      </SvgText>

      {/* Club/Event name placeholder */}
      <Rect x={15} y={38} width={110} height={8} fill="#E2E8F0" rx={1} />
      <Rect x={30} y={50} width={80} height={6} fill="#E2E8F0" rx={1} />

      {/* Section lines */}
      {sections.slice(0, 5).map((section, index) => {
        const yPos = 65 + index * 22;
        const isHighlighted = highlightedSections.includes(section.id);

        return (
          <G key={section.id}>
            {/* Section header */}
            <Rect
              x={10}
              y={yPos}
              width={120}
              height={18}
              fill={isHighlighted ? `${metadata.color}20` : 'transparent'}
              stroke={isHighlighted ? metadata.color : 'transparent'}
              strokeWidth={1}
              rx={2}
            />
            <Circle
              cx={18}
              cy={yPos + 9}
              r={4}
              fill={isHighlighted ? metadata.color : '#94A3B8'}
            />
            <Rect x={26} y={yPos + 3} width={60} height={5} fill={isHighlighted ? metadata.color : '#94A3B8'} rx={1} />
            <Rect x={26} y={yPos + 10} width={95} height={4} fill="#CBD5E1" rx={1} />
          </G>
        );
      })}
    </Svg>
  );
}

// Timeline Visualization Component
function TimelineVisualization() {
  return (
    <View style={styles.timelineContainer}>
      {DOCUMENT_TIMELINE.map((item, index) => (
        <View key={item.document} style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: DOCUMENT_METADATA[item.document as keyof typeof DOCUMENT_METADATA].color }]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTiming}>{item.timing}</Text>
            <Text style={styles.timelineDoc}>{DOCUMENT_METADATA[item.document as keyof typeof DOCUMENT_METADATA].title}</Text>
            {item.actions.slice(0, 2).map((action, i) => (
              <Text key={i} style={styles.timelineAction}>• {action}</Text>
            ))}
          </View>
          {index < DOCUMENT_TIMELINE.length - 1 && <View style={styles.timelineLine} />}
        </View>
      ))}
    </View>
  );
}

// Section Detail Modal
interface SectionModalProps {
  section: DocumentSection | null;
  documentType: 'nor' | 'si' | 'course';
  visible: boolean;
  onClose: () => void;
}

function SectionDetailModal({ section, documentType, visible, onClose }: SectionModalProps) {
  if (!section) return null;

  const importanceColors = {
    critical: '#EF4444',
    important: '#F59E0B',
    helpful: '#10B981',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={[styles.importanceBadge, { backgroundColor: importanceColors[section.importance] }]}>
              <Text style={styles.importanceText}>{section.importance.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalTitle}>{section.name}</Text>
          <Text style={styles.modalDescription}>{section.description}</Text>

          <Text style={styles.modalSubtitle}>Examples:</Text>
          {section.examples.map((example, i) => (
            <Text key={i} style={styles.modalExample}>• {example}</Text>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// Quiz Component
interface QuizProps {
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  onAnswer: (questionId: string, optionId: string) => void;
  onComplete: () => void;
  onReset: () => void;
}

function Quiz({ questions, answers, onAnswer, onComplete, onReset }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

  const score = answers.filter(a => a.isCorrect).length;
  const isComplete = answers.length === questions.length && answers.every(a => a.selectedOptionId !== null);

  const handleSelectOption = (optionId: string) => {
    if (currentAnswer?.selectedOptionId) return; // Already answered
    onAnswer(currentQuestion.id, optionId);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setShowExplanation(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPassing = percentage >= 80;

    return (
      <View style={styles.quizComplete}>
        <Ionicons
          name={isPassing ? 'checkmark-circle' : 'refresh-circle'}
          size={64}
          color={isPassing ? '#10B981' : '#F59E0B'}
        />
        <Text style={styles.quizScoreText}>
          {score} / {questions.length} Correct ({percentage}%)
        </Text>
        <Text style={styles.quizResultText}>
          {isPassing
            ? 'Great job! You understand the essential race documents.'
            : 'Good effort! Review the sections you missed and try again.'}
        </Text>
        {!isPassing && (
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            onReset();
            setCurrentQuestionIndex(0);
            setShowExplanation(false);
          }}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        {isPassing && (
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <Text style={styles.completeButtonText}>Complete Lesson</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.quizContainer}>
      {/* Progress indicator */}
      <View style={styles.quizProgress}>
        <Text style={styles.quizProgressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <View style={styles.progressDots}>
          {questions.map((_, i) => {
            const answer = answers.find(a => a.questionId === questions[i].id);
            return (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i === currentQuestionIndex && styles.progressDotActive,
                  answer?.isCorrect === true && styles.progressDotCorrect,
                  answer?.isCorrect === false && styles.progressDotIncorrect,
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Question */}
      <Text style={styles.questionText}>{currentQuestion.question}</Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map(option => {
          const isSelected = currentAnswer?.selectedOptionId === option.id;
          const showResult = currentAnswer?.selectedOptionId !== null;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                isSelected && styles.optionSelected,
                showResult && option.isCorrect && styles.optionCorrect,
                showResult && isSelected && !option.isCorrect && styles.optionIncorrect,
              ]}
              onPress={() => handleSelectOption(option.id)}
              disabled={currentAnswer?.selectedOptionId !== null}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                  showResult && option.isCorrect && styles.optionTextCorrect,
                ]}
              >
                {option.text}
              </Text>
              {showResult && option.isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              )}
              {showResult && isSelected && !option.isCorrect && (
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Explanation */}
      {showExplanation && currentAnswer && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>
            {currentAnswer.isCorrect ? '✓ Correct!' : '✗ Not quite'}
          </Text>
          <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.quizNavigation}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentQuestionIndex === 0 ? '#CBD5E1' : '#3B82F6'} />
          <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>Previous</Text>
        </TouchableOpacity>

        {currentAnswer && currentQuestionIndex < questions.length - 1 && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Main Component
export function RaceDocumentsBasicsInteractive({ onComplete }: RaceDocumentsBasicsInteractiveProps) {
  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [selectedSection, setSelectedSection] = useState<DocumentSection | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);

  // Get current step
  const currentStep = useMemo(() => {
    return RACE_DOCUMENTS_BASICS_STEPS[currentStepIndex];
  }, [currentStepIndex]);

  // Handlers
  const handleStepChange = (stepIndex: number) => {
    setCurrentStepIndex(Math.min(Math.max(0, stepIndex), RACE_DOCUMENTS_BASICS_STEPS.length - 1));
  };

  const handleNext = () => {
    if (currentStepIndex < RACE_DOCUMENTS_BASICS_STEPS.length - 1) {
      handleStepChange(currentStepIndex + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handlePrevious = () => {
    if (showQuiz) {
      setShowQuiz(false);
    } else if (currentStepIndex > 0) {
      handleStepChange(currentStepIndex - 1);
    }
  };

  const handleSectionTap = (section: DocumentSection) => {
    setSelectedSection(section);
    setShowSectionModal(true);
  };

  // Quiz handlers
  const handleQuizAnswer = (questionId: string, optionId: string) => {
    const question = RACE_DOCUMENTS_BASICS_QUIZ.find(q => q.id === questionId);
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

  const resetQuiz = () => {
    setQuizAnswers([]);
  };

  const handleComplete = () => {
    onComplete?.();
  };

  // Render document visualization based on current step
  const renderVisualization = () => {
    const { visualState } = currentStep;

    if (visualState.animationState === 'timeline') {
      return <TimelineVisualization />;
    }

    if (visualState.showAllDocuments) {
      return (
        <View style={styles.allDocumentsContainer}>
          <View style={styles.documentRow}>
            <View style={styles.documentWrapper}>
              <DocumentCard
                type="nor"
                isActive={visualState.activeDocument === 'nor' || visualState.activeDocument === 'all'}
                highlightedSections={visualState.highlightedSections}
                scale={0.85}
              />
              <Text style={styles.documentLabel}>NOR</Text>
            </View>
            <View style={styles.documentWrapper}>
              <DocumentCard
                type="si"
                isActive={visualState.activeDocument === 'si' || visualState.activeDocument === 'all'}
                highlightedSections={visualState.highlightedSections}
                scale={0.85}
              />
              <Text style={styles.documentLabel}>SI</Text>
            </View>
            <View style={styles.documentWrapper}>
              <DocumentCard
                type="course"
                isActive={visualState.activeDocument === 'course' || visualState.activeDocument === 'all'}
                highlightedSections={visualState.highlightedSections}
                scale={0.85}
              />
              <Text style={styles.documentLabel}>Course</Text>
            </View>
          </View>
        </View>
      );
    }

    // Single document focus
    const docType = visualState.activeDocument as 'nor' | 'si' | 'course';
    if (docType && docType !== 'none' && docType !== 'all' && docType !== 'timeline') {
      return (
        <View style={styles.singleDocContainer}>
          <DocumentCard
            type={docType}
            isActive={true}
            highlightedSections={visualState.highlightedSections}
            scale={1.4}
          />

          {/* Interactive section buttons */}
          {currentStep.interactiveSections && (
            <View style={styles.sectionButtons}>
              <Text style={styles.sectionButtonsLabel}>Tap to explore:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {currentStep.interactiveSections.slice(0, 4).map(section => (
                  <TouchableOpacity
                    key={section.id}
                    style={[
                      styles.sectionButton,
                      visualState.highlightedSections?.includes(section.id) && styles.sectionButtonHighlighted,
                    ]}
                    onPress={() => handleSectionTap(section)}
                  >
                    <Text style={styles.sectionButtonText}>{section.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  // If showing quiz
  if (showQuiz) {
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevious} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
              <Text style={styles.backButtonText}>Back to Lesson</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.quizTitle}>Test Your Knowledge</Text>

          <Quiz
            questions={RACE_DOCUMENTS_BASICS_QUIZ}
            answers={quizAnswers}
            onAnswer={handleQuizAnswer}
            onComplete={handleComplete}
            onReset={resetQuiz}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <Text style={styles.stepCount}>
            Step {currentStepIndex + 1} of {RACE_DOCUMENTS_BASICS_STEPS.length}
          </Text>
          <View style={styles.stepDots}>
            {RACE_DOCUMENTS_BASICS_STEPS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleStepChange(i)}
                style={[styles.stepDot, i === currentStepIndex && styles.stepDotActive]}
              />
            ))}
          </View>
        </View>

        {/* Visualization Area */}
        <View style={styles.visualizationArea}>
          {renderVisualization()}
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          <Text style={styles.stepLabel}>{currentStep.label}</Text>
          <Text style={styles.stepDescription}>{currentStep.description}</Text>

          {currentStep.details && (
            <View style={styles.detailsList}>
              {currentStep.details.map((detail, i) => (
                <View key={i} style={styles.detailItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
          )}

          {currentStep.proTip && (
            <View style={styles.proTipBox}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.proTipText}>{currentStep.proTip}</Text>
            </View>
          )}
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentStepIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <Ionicons name="chevron-back" size={24} color={currentStepIndex === 0 ? '#CBD5E1' : '#3B82F6'} />
            <Text style={[styles.navButtonText, currentStepIndex === 0 && styles.navButtonTextDisabled]}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deepDiveButton} onPress={() => setShowDeepDive(true)}>
            <Ionicons name="book-outline" size={18} color="#6366F1" />
            <Text style={styles.deepDiveButtonText}>Deep Dive</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStepIndex === RACE_DOCUMENTS_BASICS_STEPS.length - 1 ? 'Take Quiz' : 'Next'}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Section Detail Modal */}
        <SectionDetailModal
          section={selectedSection}
          documentType={currentStep.visualState.activeDocument as 'nor' | 'si' | 'course'}
          visible={showSectionModal}
          onClose={() => setShowSectionModal(false)}
        />

        {/* Deep Dive Modal */}
        <Modal visible={showDeepDive} animationType="slide" onRequestClose={() => setShowDeepDive(false)}>
          <View style={styles.deepDiveModal}>
            <View style={styles.deepDiveHeader}>
              <Text style={styles.deepDiveTitle}>{RACE_DOCUMENTS_DEEP_DIVE.title}</Text>
              <TouchableOpacity onPress={() => setShowDeepDive(false)}>
                <Ionicons name="close" size={28} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.deepDiveContent}>
              {RACE_DOCUMENTS_DEEP_DIVE.sections.map((section, i) => (
                <View key={i} style={styles.deepDiveSection}>
                  <Text style={styles.deepDiveSectionTitle}>{section.title}</Text>
                  <Text style={styles.deepDiveSectionContent}>{section.content}</Text>
                </View>
              ))}

              <View style={styles.deepDiveProTips}>
                <Text style={styles.deepDiveProTipsTitle}>Pro Tips</Text>
                {RACE_DOCUMENTS_DEEP_DIVE.proTips.map((tip, i) => (
                  <View key={i} style={styles.deepDiveProTip}>
                    <Ionicons name="bulb" size={16} color="#F59E0B" />
                    <Text style={styles.deepDiveProTipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stepCount: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
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
    width: 24,
  },
  visualizationArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  allDocumentsContainer: {
    width: '100%',
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  documentWrapper: {
    alignItems: 'center',
  },
  documentLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  singleDocContainer: {
    alignItems: 'center',
  },
  sectionButtons: {
    marginTop: 16,
    width: '100%',
  },
  sectionButtonsLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  sectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    marginRight: 8,
  },
  sectionButtonHighlighted: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  sectionButtonText: {
    fontSize: 12,
    color: '#1E293B',
  },
  timelineContainer: {
    width: '100%',
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTiming: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  timelineDoc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  timelineAction: {
    fontSize: 12,
    color: '#64748B',
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 20,
    width: 2,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  contentArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsList: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  proTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  proTipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  navButtonTextDisabled: {
    color: '#CBD5E1',
  },
  deepDiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  deepDiveButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  nextButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  importanceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalClose: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalExample: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  // Quiz styles
  quizTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 24,
  },
  quizContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  quizProgress: {
    alignItems: 'center',
    marginBottom: 20,
  },
  quizProgressText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  progressDotActive: {
    backgroundColor: '#3B82F6',
  },
  progressDotCorrect: {
    backgroundColor: '#10B981',
  },
  progressDotIncorrect: {
    backgroundColor: '#EF4444',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
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
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  optionCorrect: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  optionIncorrect: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  optionTextSelected: {
    color: '#1E40AF',
    fontWeight: '500',
  },
  optionTextCorrect: {
    color: '#047857',
    fontWeight: '500',
  },
  explanationBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  quizNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  quizComplete: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  quizScoreText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  quizResultText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Deep Dive Modal
  deepDiveModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  deepDiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  deepDiveTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  deepDiveContent: {
    padding: 16,
  },
  deepDiveSection: {
    marginBottom: 24,
  },
  deepDiveSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  deepDiveSectionContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  deepDiveProTips: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  deepDiveProTipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  deepDiveProTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  deepDiveProTipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
});

export default RaceDocumentsBasicsInteractive;
