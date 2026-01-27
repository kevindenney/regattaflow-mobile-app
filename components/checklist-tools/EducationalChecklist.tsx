/**
 * EducationalChecklist
 *
 * Full educational checklist section component with:
 * - Progress bar showing completion status
 * - List of checklist items with Tool and Lesson buttons
 * - Modal presentation of tools when clicked
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useEducationalChecklist } from '@/hooks/useEducationalChecklist';
import { useRaceDocuments } from '@/hooks/useRaceDocuments';
import { EducationalChecklistItem, type DocumentStatus } from './EducationalChecklistItem';
import type { ChecklistSectionConfig, EducationalChecklistItem as ItemType } from '@/types/checklists';

// Tool wizard imports - lazy loaded
import DocumentReviewWizard from './wizards/DocumentReviewWizard';
import { VHFInputWizard } from './wizards/VHFInputWizard';
import { StartLineAnalyzerWizard } from './wizards/StartLineAnalyzerWizard';
import { StrategyNotesWizard } from './wizards/StrategyNotesWizard';
import { CourseMapWizard } from './wizards/CourseMapWizard';
import { WeatherRoutingWizard } from './wizards/WeatherRoutingWizard/WeatherRoutingWizard';
import { PostRaceReviewWizard } from './wizards/PostRaceReviewWizard';
import AmendmentsViewer from './AmendmentsViewer';
import ScoringCalculator from './ScoringCalculator';
import DistanceCalculator from './DistanceCalculator';
import RestrictedAreasMap from './RestrictedAreasMap';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray2: '#636366',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
};

interface EducationalChecklistProps {
  config: ChecklistSectionConfig;
  raceId: string;
  /** Optional venue for context in tools */
  venue?: { id: string; name: string } | null;
  /** Optional collaboration indicator */
  collaborators?: number;
}

export function EducationalChecklist({
  config,
  raceId,
  venue,
  collaborators,
}: EducationalChecklistProps) {
  const { user } = useAuth();

  // Tool modal state
  const [activeToolItem, setActiveToolItem] = useState<ItemType | null>(null);
  const [toolModalVisible, setToolModalVisible] = useState(false);

  // Checklist state
  const {
    isCompleted,
    toggleCompletion,
    progress,
    completedCount,
    totalCount,
    isLoading,
  } = useEducationalChecklist({
    raceId,
    userId: user?.id,
    sectionId: config.id,
    items: config.items,
  });

  // Get document status for document-related items
  const {
    documentsForDisplay,
    loading: docsLoading,
    isExtracting,
  } = useRaceDocuments({
    raceId,
    userId: user?.id,
  });

  // Map toolId to document type and get status
  const getDocumentStatusForItem = useCallback((toolId?: string): DocumentStatus => {
    if (!toolId) return null;

    // Map tool IDs to document types
    const docTypeMap: Record<string, string> = {
      'nor_review': 'nor',
      'si_review': 'sailing_instructions',
      'amendments_viewer': 'amendment',
    };

    const docType = docTypeMap[toolId];
    if (!docType) return null;

    // Check if document exists
    const doc = documentsForDisplay.find(d => d.type === docType);

    if (isExtracting && doc) return 'extracting';
    if (doc) return 'uploaded';
    return 'missing';
  }, [documentsForDisplay, isExtracting]);

  // Handle opening a tool
  const handleOpenTool = useCallback((item: ItemType) => {
    setActiveToolItem(item);
    setToolModalVisible(true);
  }, []);

  // Handle closing tool modal
  const handleCloseTool = useCallback(() => {
    setToolModalVisible(false);
    setActiveToolItem(null);
  }, []);

  // Handle tool completion
  const handleToolComplete = useCallback(() => {
    if (activeToolItem) {
      // Mark the item as complete when tool is completed
      if (!isCompleted(activeToolItem.id)) {
        toggleCompletion(activeToolItem.id);
      }
    }
    handleCloseTool();
  }, [activeToolItem, isCompleted, toggleCompletion, handleCloseTool]);

  // Render the appropriate tool component
  const renderToolContent = useMemo(() => {
    if (!activeToolItem) return null;

    const toolId = activeToolItem.toolId;
    const commonProps = {
      item: activeToolItem,
      regattaId: raceId,
      onComplete: handleToolComplete,
      onCancel: handleCloseTool,
    };

    // Document review wizards
    if (toolId === 'nor_review' || toolId === 'si_review') {
      return (
        <DocumentReviewWizard
          {...commonProps}
          venue={venue}
        />
      );
    }

    // VHF Input
    if (toolId === 'vhf_input') {
      return <VHFInputWizard {...commonProps} />;
    }

    // Amendments Viewer
    if (toolId === 'amendments_viewer') {
      return <AmendmentsViewer {...commonProps} />;
    }

    // Scoring Calculator
    if (toolId === 'scoring_calculator') {
      return <ScoringCalculator {...commonProps} />;
    }

    // Start Line Analyzer
    if (toolId === 'start_line_analyzer') {
      return <StartLineAnalyzerWizard {...commonProps} />;
    }

    // Distance Calculator
    if (toolId === 'distance_calculator') {
      return <DistanceCalculator {...commonProps} />;
    }

    // Restricted Areas Map
    if (toolId === 'restricted_areas_map') {
      return <RestrictedAreasMap {...commonProps} />;
    }

    // Strategy Notes
    if (toolId === 'strategy_notes') {
      return <StrategyNotesWizard {...commonProps} />;
    }

    // Course Map
    if (toolId === 'course_map') {
      return <CourseMapWizard {...commonProps} />;
    }

    // Weather Routing
    if (toolId === 'weather_routing_wizard') {
      return <WeatherRoutingWizard {...commonProps} />;
    }

    // Post-Race Review Wizards
    const postRaceReviewToolIds = [
      'review_start_quality',
      'review_upwind_performance',
      'review_downwind_performance',
      'review_mark_roundings',
      'review_tactical_decisions',
      'identify_key_learning',
      'note_what_worked',
      'plan_improvement_areas',
      'request_coach_feedback',
    ];
    if (toolId && postRaceReviewToolIds.includes(toolId)) {
      return <PostRaceReviewWizard {...commonProps} />;
    }

    // Placeholder for tools not yet implemented
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderTitle}>Coming Soon</Text>
        <Text style={styles.placeholderText}>
          The {activeToolItem.toolButtonLabel || 'tool'} wizard is being developed.
        </Text>
      </View>
    );
  }, [activeToolItem, raceId, venue, handleToolComplete, handleCloseTool]);

  // Progress bar color based on completion
  const progressBarColor = progress === 1 ? IOS_COLORS.green : IOS_COLORS.blue;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={IOS_COLORS.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: progressBarColor },
            ]}
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {completedCount}/{totalCount} Complete
          </Text>
          {collaborators !== undefined && collaborators > 0 && (
            <Text style={styles.collaboratorText}>
              Shared with {collaborators} crew
            </Text>
          )}
        </View>
      </View>

      {/* Checklist Items */}
      <View style={styles.itemsContainer}>
        {config.items.map((item) => {
          // DEBUG: Log each checklist item being rendered
          if (typeof window !== 'undefined' && (window as any).__PERIOD_DEBUG__?.enabled) {
            (window as any).__PERIOD_DEBUG__.log('EducationalChecklist.item', item.id, { itemId: item.id, itemTitle: item.label, toolId: item.toolId });
          }
          return (
            <EducationalChecklistItem
              key={item.id}
              item={item}
              isCompleted={isCompleted(item.id)}
              onToggleComplete={() => toggleCompletion(item.id)}
              onOpenTool={() => handleOpenTool(item)}
              documentStatus={getDocumentStatusForItem(item.toolId)}
            />
          );
        })}
      </View>

      {/* Tool Modal */}
      <Modal
        visible={toolModalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={handleCloseTool}
      >
        {renderToolContent}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: IOS_COLORS.separator,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  collaboratorText: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  itemsContainer: {
    gap: 0,
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default EducationalChecklist;
