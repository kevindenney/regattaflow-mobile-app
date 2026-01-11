/**
 * Race Documents Advanced Interactive Component
 * Comprehensive coverage of all race document types for experienced sailors
 *
 * Features:
 * - Visual mockups of all 6 document types
 * - Advanced section analysis with common mistakes
 * - Document review workflow visualization
 * - Scenario-based quiz questions
 * - Deep dive content for mastery
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import {
  RACE_DOCUMENTS_ADVANCED_STEPS,
  RACE_DOCUMENTS_ADVANCED_QUIZ,
  RACE_DOCUMENTS_ADVANCED_DEEP_DIVE,
  ALL_DOCUMENT_METADATA,
  DOCUMENT_REVIEW_WORKFLOW,
  NOR_LEGAL_SECTIONS,
  NOR_RULES_SECTIONS,
  SI_START_SECTIONS,
  SI_COURSE_SECTIONS,
  SI_SCORING_SECTIONS,
  AMENDMENT_SECTIONS,
  NOTAM_SECTIONS,
  OTHER_DOCS_SECTIONS,
  type AdvancedRaceDocumentsStep,
  type AdvancedDocumentSection,
  type DocumentWorkflowStep,
} from './data/raceDocumentsAdvancedData';
import { type QuizQuestion } from './data/raceDocumentsBasicsData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Quiz answer interface
interface QuizAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
}

interface RaceDocumentsAdvancedInteractiveProps {
  onComplete?: () => void;
}

// Document Card for all 6 types
interface AdvancedDocumentCardProps {
  type: 'nor' | 'si' | 'course' | 'amendment' | 'notam' | 'other';
  isActive: boolean;
  highlightedSections?: string[];
  scale?: number;
}

function AdvancedDocumentCard({ type, isActive, highlightedSections = [], scale = 1 }: AdvancedDocumentCardProps) {
  const metadata = ALL_DOCUMENT_METADATA[type];
  const baseWidth = 120;
  const baseHeight = 160;
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  const renderContent = () => {
    switch (type) {
      case 'course':
        return (
          <>
            {/* Wind arrow */}
            <G transform="translate(95, 40)">
              <Line x1={0} y1={12} x2={0} y2={0} stroke="#3B82F6" strokeWidth={1.5} />
              <Polygon points="0,-4 -3,2 3,2" fill="#3B82F6" />
            </G>
            {/* Marks */}
            <Circle cx={60} cy={45} r={6} fill="#F59E0B" stroke="#000" strokeWidth={0.5} />
            <Circle cx={50} cy={100} r={5} fill="#10B981" stroke="#000" strokeWidth={0.5} />
            <Circle cx={70} cy={100} r={5} fill="#10B981" stroke="#000" strokeWidth={0.5} />
            <Line x1={25} y1={130} x2={95} y2={130} stroke="#000" strokeWidth={1.5} strokeDasharray="3,2" />
          </>
        );

      case 'amendment':
        return (
          <>
            {/* Amendment styling */}
            <Rect x={10} y={40} width={100} height={10} fill="#FECACA" rx={1} />
            <Line x1={15} y1={45} x2={100} y2={45} stroke="#991B1B" strokeWidth={1} />
            <Rect x={10} y={55} width={100} height={10} fill="#D1FAE5" rx={1} />
            <Rect x={15} y={58} width={80} height={4} fill="#047857" rx={1} />
            <Rect x={10} y={80} width={100} height={6} fill="#E2E8F0" rx={1} />
            <Rect x={10} y={90} width={90} height={6} fill="#E2E8F0" rx={1} />
            <Rect x={10} y={100} width={95} height={6} fill="#E2E8F0" rx={1} />
          </>
        );

      case 'notam':
        return (
          <>
            {/* Warning symbol */}
            <G transform="translate(60, 50)">
              <Polygon points="0,-15 13,10 -13,10" fill="#FCD34D" stroke="#92400E" strokeWidth={1} />
              <SvgText x={0} y={5} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#92400E">!</SvgText>
            </G>
            {/* Map area */}
            <Rect x={15} y={75} width={90} height={50} fill="#DBEAFE" stroke="#3B82F6" strokeWidth={1} rx={2} />
            <Circle cx={60} cy={100} r={15} fill="none" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="3,2" />
            <SvgText x={60} y={103} textAnchor="middle" fontSize="6" fill="#EF4444">AREA</SvgText>
          </>
        );

      case 'other':
        return (
          <>
            {/* Folder/document stack effect */}
            <Rect x={25} y={45} width={70} height={85} fill="#F1F5F9" stroke="#94A3B8" strokeWidth={1} rx={2} />
            <Rect x={20} y={50} width={70} height={85} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={1} rx={2} />
            <Rect x={15} y={55} width={70} height={85} fill="#FFFFFF" stroke="#64748B" strokeWidth={1} rx={2} />
            <Rect x={22} y={65} width={50} height={5} fill="#E2E8F0" rx={1} />
            <Rect x={22} y={75} width={55} height={4} fill="#E2E8F0" rx={1} />
            <Rect x={22} y={83} width={45} height={4} fill="#E2E8F0" rx={1} />
          </>
        );

      default: // nor, si
        return (
          <>
            {/* Section lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const yPos = 40 + i * 22;
              return (
                <G key={i}>
                  <Circle cx={18} cy={yPos + 5} r={3} fill={metadata.color} />
                  <Rect x={26} y={yPos} width={50} height={4} fill="#94A3B8" rx={1} />
                  <Rect x={26} y={yPos + 6} width={80} height={3} fill="#CBD5E1" rx={1} />
                </G>
              );
            })}
          </>
        );
    }
  };

  return (
    <Svg width={width} height={height} viewBox="0 0 120 160">
      {/* Document background */}
      <Rect
        x={2}
        y={2}
        width={116}
        height={156}
        fill="#FFFFFF"
        stroke={isActive ? metadata.color : '#CBD5E1'}
        strokeWidth={isActive ? 2.5 : 1}
        rx={4}
      />

      {/* Header */}
      <Rect x={6} y={6} width={108} height={22} fill={metadata.color} rx={2} />
      <SvgText x={60} y={20} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#FFFFFF">
        {metadata.title.toUpperCase()}
      </SvgText>

      {renderContent()}
    </Svg>
  );
}

// Workflow Visualization
function WorkflowVisualization() {
  return (
    <View style={styles.workflowContainer}>
      {DOCUMENT_REVIEW_WORKFLOW.map((step, index) => (
        <View key={index} style={styles.workflowStep}>
          <View style={styles.workflowHeader}>
            <View style={styles.workflowBadge}>
              <Text style={styles.workflowBadgeText}>{index + 1}</Text>
            </View>
            <View style={styles.workflowTitleArea}>
              <Text style={styles.workflowTiming}>{step.timing}</Text>
              <View style={styles.workflowDocs}>
                {step.documents.slice(0, 3).map((doc, i) => (
                  <View key={i} style={styles.workflowDocBadge}>
                    <Text style={styles.workflowDocText}>{doc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.workflowCritical}>
            <Text style={styles.workflowCriticalLabel}>Key checks:</Text>
            {step.criticalItems.slice(0, 2).map((item, i) => (
              <Text key={i} style={styles.workflowCriticalItem}>• {item}</Text>
            ))}
          </View>
          {index < DOCUMENT_REVIEW_WORKFLOW.length - 1 && (
            <View style={styles.workflowConnector}>
              <Ionicons name="chevron-down" size={20} color="#CBD5E1" />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// Section Detail Modal (Advanced)
interface AdvancedSectionModalProps {
  section: AdvancedDocumentSection | null;
  visible: boolean;
  onClose: () => void;
}

function AdvancedSectionModal({ section, visible, onClose }: AdvancedSectionModalProps) {
  if (!section) return null;

  const importanceColors = {
    critical: '#EF4444',
    important: '#F59E0B',
    helpful: '#10B981',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <ScrollView contentContainerStyle={styles.modalScrollContent}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
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

            {section.commonMistakes && section.commonMistakes.length > 0 && (
              <>
                <Text style={[styles.modalSubtitle, { color: '#EF4444', marginTop: 16 }]}>
                  Common Mistakes:
                </Text>
                {section.commonMistakes.map((mistake, i) => (
                  <View key={i} style={styles.mistakeItem}>
                    <Ionicons name="warning" size={14} color="#EF4444" />
                    <Text style={styles.mistakeText}>{mistake}</Text>
                  </View>
                ))}
              </>
            )}

            {section.ruleReferences && section.ruleReferences.length > 0 && (
              <>
                <Text style={[styles.modalSubtitle, { marginTop: 16 }]}>Rule References:</Text>
                {section.ruleReferences.map((ref, i) => (
                  <Text key={i} style={styles.ruleRef}>📖 {ref}</Text>
                ))}
              </>
            )}
          </Pressable>
        </ScrollView>
      </Pressable>
    </Modal>
  );
}

// Quiz Component
function Quiz({
  questions,
  answers,
  onAnswer,
  onComplete,
  onReset
}: {
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  onAnswer: (qId: string, oId: string) => void;
  onComplete: () => void;
  onReset: () => void;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);
  const score = answers.filter(a => a.isCorrect).length;
  const isComplete = answers.length === questions.length && answers.every(a => a.selectedOptionId !== null);

  const handleSelectOption = (optionId: string) => {
    if (currentAnswer?.selectedOptionId) return;
    onAnswer(currentQuestion.id, optionId);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPassing = percentage >= 75;

    return (
      <View style={styles.quizComplete}>
        <Ionicons
          name={isPassing ? 'trophy' : 'refresh-circle'}
          size={64}
          color={isPassing ? '#F59E0B' : '#64748B'}
        />
        <Text style={styles.quizScoreText}>
          {score} / {questions.length} Correct ({percentage}%)
        </Text>
        <Text style={styles.quizResultText}>
          {isPassing
            ? 'Excellent! You\'ve mastered race document analysis.'
            : 'Good effort! Review the scenarios you missed and try again.'}
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
      <View style={styles.quizProgress}>
        <Text style={styles.quizProgressText}>
          Scenario {currentQuestionIndex + 1} of {questions.length}
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

      <Text style={styles.questionText}>{currentQuestion.question}</Text>

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

      {showExplanation && currentAnswer && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>
            {currentAnswer.isCorrect ? '✓ Correct!' : '✗ Not quite'}
          </Text>
          <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
        </View>
      )}

      <View style={styles.quizNavigation}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
          onPress={() => { setShowExplanation(false); setCurrentQuestionIndex(p => p - 1); }}
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
export function RaceDocumentsAdvancedInteractive({ onComplete }: RaceDocumentsAdvancedInteractiveProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [selectedSection, setSelectedSection] = useState<AdvancedDocumentSection | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);

  const currentStep = useMemo(() => RACE_DOCUMENTS_ADVANCED_STEPS[currentStepIndex], [currentStepIndex]);

  const handleStepChange = (stepIndex: number) => {
    setCurrentStepIndex(Math.min(Math.max(0, stepIndex), RACE_DOCUMENTS_ADVANCED_STEPS.length - 1));
  };

  const handleNext = () => {
    if (currentStepIndex < RACE_DOCUMENTS_ADVANCED_STEPS.length - 1) {
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

  const handleQuizAnswer = (questionId: string, optionId: string) => {
    const question = RACE_DOCUMENTS_ADVANCED_QUIZ.find(q => q.id === questionId);
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

  const getSectionsForStep = (): AdvancedDocumentSection[] => {
    const { visualState, interactiveSections } = currentStep;
    if (interactiveSections) return interactiveSections;

    // Return appropriate sections based on focus area
    const { activeDocument, focusArea } = visualState;
    if (activeDocument === 'nor') {
      return focusArea === 'legal' ? NOR_LEGAL_SECTIONS : NOR_RULES_SECTIONS;
    }
    if (activeDocument === 'si') {
      if (focusArea === 'start') return SI_START_SECTIONS;
      if (focusArea === 'course') return SI_COURSE_SECTIONS;
      if (focusArea === 'scoring') return SI_SCORING_SECTIONS;
    }
    if (activeDocument === 'amendment') return AMENDMENT_SECTIONS;
    if (activeDocument === 'notam') return NOTAM_SECTIONS;
    if (activeDocument === 'other') return OTHER_DOCS_SECTIONS;
    return [];
  };

  const renderVisualization = () => {
    const { visualState } = currentStep;

    if (visualState.animationState === 'workflow') {
      return <WorkflowVisualization />;
    }

    if (visualState.activeDocument === 'all') {
      return (
        <View style={styles.allDocsGrid}>
          {(['nor', 'si', 'course', 'amendment', 'notam', 'other'] as const).map(type => (
            <View key={type} style={styles.miniDocWrapper}>
              <AdvancedDocumentCard type={type} isActive={true} scale={0.65} />
              <Text style={styles.miniDocLabel}>{ALL_DOCUMENT_METADATA[type].abbreviation}</Text>
            </View>
          ))}
        </View>
      );
    }

    const docType = visualState.activeDocument;
    if (docType && docType !== 'none' && docType !== 'all' && docType !== 'workflow') {
      const sections = getSectionsForStep();
      return (
        <View style={styles.singleDocContainer}>
          <AdvancedDocumentCard
            type={docType as any}
            isActive={true}
            highlightedSections={visualState.highlightedSections}
            scale={1.5}
          />

          {sections.length > 0 && (
            <View style={styles.sectionButtons}>
              <Text style={styles.sectionButtonsLabel}>Explore sections:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sections.slice(0, 5).map(section => (
                  <TouchableOpacity
                    key={section.id}
                    style={[
                      styles.sectionButton,
                      visualState.highlightedSections?.includes(section.id) && styles.sectionButtonHighlighted,
                    ]}
                    onPress={() => { setSelectedSection(section); setShowSectionModal(true); }}
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

  if (showQuiz) {
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <TouchableOpacity onPress={handlePrevious} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            <Text style={styles.backButtonText}>Back to Lesson</Text>
          </TouchableOpacity>

          <Text style={styles.quizTitle}>Advanced Scenarios</Text>

          <Quiz
            questions={RACE_DOCUMENTS_ADVANCED_QUIZ}
            answers={quizAnswers}
            onAnswer={handleQuizAnswer}
            onComplete={() => onComplete?.()}
            onReset={() => setQuizAnswers([])}
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
            {currentStepIndex + 1} / {RACE_DOCUMENTS_ADVANCED_STEPS.length}
          </Text>
          <View style={styles.stepDots}>
            {RACE_DOCUMENTS_ADVANCED_STEPS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleStepChange(i)}
                style={[styles.stepDot, i === currentStepIndex && styles.stepDotActive]}
              />
            ))}
          </View>
        </View>

        {/* Visualization */}
        <View style={styles.visualizationArea}>
          {renderVisualization()}
        </View>

        {/* Content */}
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

          {currentStep.commonMistakes && (
            <View style={styles.mistakesBox}>
              <Text style={styles.mistakesTitle}>⚠️ Common Mistakes</Text>
              {currentStep.commonMistakes.map((mistake, i) => (
                <Text key={i} style={styles.mistakeText}>• {mistake}</Text>
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
            <Text style={[styles.navButtonText, currentStepIndex === 0 && styles.navButtonTextDisabled]}>Prev</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deepDiveButton} onPress={() => setShowDeepDive(true)}>
            <Ionicons name="school-outline" size={18} color="#6366F1" />
            <Text style={styles.deepDiveButtonText}>Master</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStepIndex === RACE_DOCUMENTS_ADVANCED_STEPS.length - 1 ? 'Quiz' : 'Next'}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <AdvancedSectionModal
          section={selectedSection}
          visible={showSectionModal}
          onClose={() => setShowSectionModal(false)}
        />

        <Modal visible={showDeepDive} animationType="slide" onRequestClose={() => setShowDeepDive(false)}>
          <View style={styles.deepDiveModal}>
            <View style={styles.deepDiveHeader}>
              <Text style={styles.deepDiveTitle}>{RACE_DOCUMENTS_ADVANCED_DEEP_DIVE.title}</Text>
              <TouchableOpacity onPress={() => setShowDeepDive(false)}>
                <Ionicons name="close" size={28} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.deepDiveContent}>
              {RACE_DOCUMENTS_ADVANCED_DEEP_DIVE.sections.map((section, i) => (
                <View key={i} style={styles.deepDiveSection}>
                  <Text style={styles.deepDiveSectionTitle}>{section.title}</Text>
                  <Text style={styles.deepDiveSectionContent}>{section.content}</Text>
                </View>
              ))}

              <View style={styles.deepDiveProTips}>
                <Text style={styles.deepDiveProTipsTitle}>Pro Tips for Mastery</Text>
                {RACE_DOCUMENTS_ADVANCED_DEEP_DIVE.proTips.map((tip, i) => (
                  <View key={i} style={styles.deepDiveProTip}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
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
  scrollContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  container: { flex: 1, padding: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backButtonText: { color: '#3B82F6', fontSize: 16, fontWeight: '500' },
  stepIndicator: { alignItems: 'center', marginBottom: 16 },
  stepCount: { fontSize: 14, color: '#64748B', marginBottom: 8 },
  stepDots: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center' },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  stepDotActive: { backgroundColor: '#3B82F6', width: 18 },
  visualizationArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  allDocsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  miniDocWrapper: { alignItems: 'center', width: 85 },
  miniDocLabel: { marginTop: 4, fontSize: 10, fontWeight: '600', color: '#64748B' },
  singleDocContainer: { alignItems: 'center' },
  sectionButtons: { marginTop: 16, width: '100%' },
  sectionButtonsLabel: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  sectionButton: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#F1F5F9', borderRadius: 14, marginRight: 6 },
  sectionButtonHighlighted: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#3B82F6' },
  sectionButtonText: { fontSize: 11, color: '#1E293B' },
  workflowContainer: { width: '100%' },
  workflowStep: { marginBottom: 8 },
  workflowHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  workflowBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  workflowBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  workflowTitleArea: { flex: 1 },
  workflowTiming: { fontSize: 12, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  workflowDocs: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  workflowDocBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  workflowDocText: { fontSize: 9, color: '#4338CA' },
  workflowCritical: { marginLeft: 34 },
  workflowCriticalLabel: { fontSize: 10, color: '#64748B', marginBottom: 2 },
  workflowCriticalItem: { fontSize: 10, color: '#475569' },
  workflowConnector: { alignItems: 'center', marginVertical: 4 },
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
  stepLabel: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  stepDescription: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12 },
  detailsList: { gap: 6 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },
  mistakesBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#EF4444' },
  mistakesTitle: { fontSize: 13, fontWeight: '600', color: '#991B1B', marginBottom: 6 },
  proTipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFFBEB', padding: 12, borderRadius: 8, marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  proTipText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 16 },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  navButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  navButtonDisabled: { opacity: 0.5 },
  navButtonText: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  navButtonTextDisabled: { color: '#CBD5E1' },
  deepDiveButton: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  deepDiveButtonText: { fontSize: 14, color: '#6366F1', fontWeight: '500' },
  nextButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, gap: 4 },
  nextButtonText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center', width: '100%' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  importanceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  importanceText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  modalClose: { padding: 4 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  modalDescription: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 12 },
  modalSubtitle: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  modalExample: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  mistakeItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  mistakeText: { flex: 1, fontSize: 12, color: '#991B1B' },
  ruleRef: { fontSize: 12, color: '#4338CA', marginBottom: 4 },
  // Quiz styles
  quizTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 20 },
  quizContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18 },
  quizProgress: { alignItems: 'center', marginBottom: 16 },
  quizProgressText: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  progressDots: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E2E8F0' },
  progressDotActive: { backgroundColor: '#3B82F6' },
  progressDotCorrect: { backgroundColor: '#10B981' },
  progressDotIncorrect: { backgroundColor: '#EF4444' },
  questionText: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 16, lineHeight: 22 },
  optionsContainer: { gap: 10 },
  optionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  optionSelected: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  optionCorrect: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  optionIncorrect: { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
  optionText: { flex: 1, fontSize: 13, color: '#475569' },
  optionTextSelected: { color: '#1E40AF', fontWeight: '500' },
  optionTextCorrect: { color: '#047857', fontWeight: '500' },
  explanationBox: { marginTop: 16, padding: 14, backgroundColor: '#F1F5F9', borderRadius: 8 },
  explanationTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  explanationText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  quizNavigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  quizComplete: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 28, alignItems: 'center' },
  quizScoreText: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginTop: 14, marginBottom: 6 },
  quizResultText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#64748B', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  completeButton: { backgroundColor: '#10B981', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 8 },
  completeButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  // Deep Dive Modal
  deepDiveModal: { flex: 1, backgroundColor: '#FFFFFF' },
  deepDiveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  deepDiveTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  deepDiveContent: { padding: 16 },
  deepDiveSection: { marginBottom: 20 },
  deepDiveSectionTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  deepDiveSectionContent: { fontSize: 13, color: '#475569', lineHeight: 20 },
  deepDiveProTips: { backgroundColor: '#FFFBEB', padding: 14, borderRadius: 10, marginTop: 8 },
  deepDiveProTipsTitle: { fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 10 },
  deepDiveProTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  deepDiveProTipText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 16 },
});

export default RaceDocumentsAdvancedInteractive;
