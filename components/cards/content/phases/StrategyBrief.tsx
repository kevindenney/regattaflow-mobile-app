/**
 * StrategyBrief - Full Strategy Checklist with Collapsible Phases
 *
 * Shows all 14 strategy sections across 5 collapsible phases:
 * START, UPWIND, DOWNWIND, MARK_ROUNDING, FINISH
 *
 * Each section includes:
 * - Checkbox for completion tracking
 * - AI suggestion based on conditions + past performance
 * - Past learning/performance data (trend, avg rating)
 * - User intention text input
 *
 * Tufte principle: "Overview first, zoom and filter, then details on demand"
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  ChevronRight,
  X,
  Target,
  Edit3,
} from 'lucide-react-native';

import { CardRaceData } from '../../types';
import { TufteStrategyScreen } from '@/components/races/strategy';
import { useStrategyBrief, type StrategyBriefPhase } from '@/hooks/useStrategyBrief';
import { StrategyBriefPhaseHeader } from './StrategyBriefPhaseHeader';
import { StrategyBriefSection } from './StrategyBriefSection';
import type { StrategyPhase } from '@/types/raceStrategy';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

interface StrategyBriefProps {
  race: CardRaceData;
  isExpanded?: boolean;
  onOpenStrategyDetail?: () => void;
}

export function StrategyBrief({
  race,
  isExpanded = false,
  onOpenStrategyDetail,
}: StrategyBriefProps) {
  // Strategy brief hook with all phases and sections
  const {
    intention,
    setIntention,
    isIntentionSaving,
    phases,
    completedCount,
    totalCount,
    progress,
    toggleSectionCompletion,
    updateSectionPlan,
    isLoading,
  } = useStrategyBrief({
    raceEventId: race.id,
    race,
  });

  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [localIntention, setLocalIntention] = useState(intention);

  // Phase expansion state - start with first phase expanded
  const [expandedPhases, setExpandedPhases] = useState<Set<StrategyPhase>>(
    new Set(['start'])
  );

  // Sync local intention when external changes
  useEffect(() => {
    console.log('[StrategyBrief] useEffect sync - intention changed', {
      newIntention: intention,
      currentLocalIntention: localIntention
    });
    setLocalIntention(intention);
  }, [intention]);

  // Handle intention save on blur or submit
  const handleIntentionSave = useCallback(() => {
    console.log('[StrategyBrief] handleIntentionSave called', {
      localIntention,
      intention,
      willSave: localIntention !== intention
    });
    if (localIntention !== intention) {
      setIntention(localIntention);
    }
    setIsEditingIntention(false);
  }, [localIntention, intention, setIntention]);

  // Handle opening strategy detail
  const handleOpenDetail = useCallback(() => {
    if (onOpenStrategyDetail) {
      onOpenStrategyDetail();
    } else {
      setShowDetailModal(true);
    }
  }, [onOpenStrategyDetail]);

  // Toggle phase expansion
  const togglePhase = useCallback((phaseKey: StrategyPhase) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseKey)) {
        next.delete(phaseKey);
      } else {
        next.add(phaseKey);
      }
      return next;
    });
  }, []);

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>STRATEGY BRIEF</Text>
          <View style={styles.headerRight}>
            <Text style={styles.progressText}>
              {completedCount}/{totalCount}
            </Text>
            <Pressable style={styles.drillDownButton} onPress={handleOpenDetail}>
              <Text style={styles.drillDownText}>Full Strategy</Text>
              <ChevronRight size={14} color={IOS_COLORS.blue} />
            </Pressable>
          </View>
        </View>

        {/* Overall Intention Input */}
        <View style={styles.intentionContainer}>
          <View style={styles.intentionHeader}>
            <Target size={16} color={IOS_COLORS.blue} />
            <Text style={styles.intentionLabel}>My Race Intention</Text>
            {isIntentionSaving && (
              <Text style={styles.savingIndicator}>Saving...</Text>
            )}
          </View>
          <Pressable
            style={styles.intentionInputContainer}
            onPress={() => {
              if (!isEditingIntention) {
                setIsEditingIntention(true);
              }
            }}
          >
            {isEditingIntention ? (
              <TextInput
                style={styles.intentionInput}
                value={localIntention}
                onChangeText={(text) => {
                  console.log('[StrategyBrief] onChangeText', { text });
                  setLocalIntention(text);
                }}
                onBlur={() => {
                  console.log('[StrategyBrief] onBlur fired');
                  handleIntentionSave();
                }}
                onSubmitEditing={() => {
                  console.log('[StrategyBrief] onSubmitEditing fired');
                  handleIntentionSave();
                }}
                placeholder="What's your one key focus for today?"
                placeholderTextColor={IOS_COLORS.gray}
                autoFocus
                multiline={false}
                returnKeyType="done"
                blurOnSubmit
              />
            ) : (
              <Text
                style={[
                  styles.intentionText,
                  !localIntention && styles.intentionPlaceholder,
                ]}
              >
                {localIntention || 'Tap to set your race intention'}
              </Text>
            )}
            {!isEditingIntention && (
              <Edit3 size={16} color={IOS_COLORS.gray} />
            )}
          </Pressable>
        </View>

        {/* Phases with Collapsible Sections */}
        <ScrollView
          style={styles.phasesScrollView}
          contentContainerStyle={styles.phasesContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {phases.map((phase) => (
            <PhaseGroup
              key={phase.key}
              phase={phase}
              isExpanded={expandedPhases.has(phase.key)}
              onToggle={() => togglePhase(phase.key)}
              onToggleSectionComplete={toggleSectionCompletion}
              onUpdateSectionPlan={updateSectionPlan}
            />
          ))}
        </ScrollView>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              progress === 1 && styles.progressComplete,
            ]}
          />
        </View>
      </View>

      {/* Tufte Strategy Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalCloseBar}>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowDetailModal(false)}
            >
              <X size={24} color={IOS_COLORS.secondaryLabel} />
            </Pressable>
          </View>
          <TufteStrategyScreen
            raceId={race.id}
            raceName={race.name}
            raceDate={race.date ? new Date(race.date) : undefined}
          />
        </View>
      </Modal>
    </>
  );
}

/**
 * PhaseGroup - A collapsible phase with its sections
 */
interface PhaseGroupProps {
  phase: StrategyBriefPhase;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleSectionComplete: (sectionId: any) => void;
  onUpdateSectionPlan: (sectionId: any, plan: string) => void;
}

function PhaseGroup({
  phase,
  isExpanded,
  onToggle,
  onToggleSectionComplete,
  onUpdateSectionPlan,
}: PhaseGroupProps) {
  return (
    <View style={styles.phaseGroup}>
      <StrategyBriefPhaseHeader
        label={phase.label}
        isExpanded={isExpanded}
        onToggle={onToggle}
        completedCount={phase.completedCount}
        totalCount={phase.totalCount}
      />

      {isExpanded && (
        <View style={styles.phaseSections}>
          {phase.sections.map((section, index) => (
            <StrategyBriefSection
              key={section.id}
              section={section}
              onToggleComplete={() => onToggleSectionComplete(section.id)}
              onUpdatePlan={(plan) => onUpdateSectionPlan(section.id, plan)}
              isFirst={index === 0}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  drillDownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  drillDownText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // Intention
  intentionContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.blue,
    gap: 8,
  },
  intentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intentionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  savingIndicator: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
  intentionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intentionInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    padding: 0,
  },
  intentionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  intentionPlaceholder: {
    color: IOS_COLORS.gray,
    fontWeight: '400',
    fontStyle: 'italic',
  },

  // Phases ScrollView
  phasesScrollView: {
    flex: 1,
    maxHeight: 500, // Increased to allow more content visibility
  },
  phasesContent: {
    gap: 0,
    paddingBottom: 8,
  },
  phaseGroup: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  phaseSections: {
    paddingLeft: 8,
    paddingBottom: 8,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
    marginHorizontal: 4,
    marginBottom: 8,
  },

  // Progress
  progressBar: {
    height: 3,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 1.5,
  },
  progressComplete: {
    backgroundColor: IOS_COLORS.green,
  },

  // Modal - Tufte style
  modalContainer: {
    flex: 1,
    backgroundColor: '#F0EDE8', // TUFTE_BACKGROUND
  },
  modalCloseBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 50, // Safe area padding
    paddingBottom: 8,
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
});

export default StrategyBrief;
