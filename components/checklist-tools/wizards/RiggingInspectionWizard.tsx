/**
 * RiggingInspectionWizard
 *
 * Multi-step guided running rigging inspection wizard.
 * Walks through halyards, sheets, and control lines to verify condition.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Link2,
  BookOpen,
  Check,
  Anchor,
  GitBranch,
  Settings,
  Cable,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#636366',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

// Rigging categories
interface RiggingItem {
  id: string;
  label: string;
  description: string;
  checkPoints: string[];
  icon: React.ReactNode;
  priority: 'critical' | 'important' | 'routine';
}

const RIGGING_ITEMS: RiggingItem[] = [
  {
    id: 'halyards',
    label: 'Halyards',
    description: 'Main, jib, and spinnaker halyards',
    checkPoints: [
      'Check for chafe at sheave exit points',
      'Inspect splice or shackle connections',
      'Look for broken strands or fuzzing',
      'Verify clutch/stopper holds properly',
      'Check halyard tails for adequate length',
    ],
    icon: <Anchor size={24} color={IOS_COLORS.blue} />,
    priority: 'critical',
  },
  {
    id: 'sheets',
    label: 'Sheets',
    description: 'Main, jib, and spinnaker sheets',
    checkPoints: [
      'Inspect clew attachments and shackles',
      'Check for chafe where sheets contact blocks',
      'Verify winch wraps are clean (no override marks)',
      'Look for core-sheath slippage',
      'Ensure adequate tail length for conditions',
    ],
    icon: <GitBranch size={24} color={IOS_COLORS.purple} />,
    priority: 'critical',
  },
  {
    id: 'controls',
    label: 'Control Lines',
    description: 'Cunningham, outhaul, vang, etc.',
    checkPoints: [
      'Test all purchase systems for smooth operation',
      'Check for chafe at turning blocks',
      'Verify cleats hold under load',
      'Inspect any splices or knots',
      'Ensure lines run freely through blocks',
    ],
    icon: <Settings size={24} color={IOS_COLORS.orange} />,
    priority: 'important',
  },
  {
    id: 'standing',
    label: 'Standing Rigging Check',
    description: 'Quick visual of shrouds and stays',
    checkPoints: [
      'Look for broken strands on wire/rod',
      'Check toggles and chainplates for cracks',
      'Verify cotter pins are spread and taped',
      'Inspect turnbuckle threads for corrosion',
      'Check forestay and backstay connections',
    ],
    icon: <Cable size={24} color={IOS_COLORS.gray2} />,
    priority: 'critical',
  },
];

type WizardStep = 'overview' | 'inspection' | 'notes' | 'review';

interface RiggingInspectionWizardProps extends ChecklistToolProps {}

export function RiggingInspectionWizard({
  item,
  regattaId,
  boatId,
  onComplete,
  onCancel,
}: RiggingInspectionWizardProps) {
  const router = useRouter();

  // State
  const [step, setStep] = useState<WizardStep>('overview');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [completedChecks, setCompletedChecks] = useState<Record<string, Set<string>>>({});
  const [notes, setNotes] = useState('');
  const [issueItems, setIssueItems] = useState<Set<string>>(new Set());

  // Current rigging item
  const currentItem = RIGGING_ITEMS[currentItemIndex];
  const currentChecks = completedChecks[currentItem?.id] || new Set();

  // Progress calculation
  const totalCheckPoints = RIGGING_ITEMS.reduce(
    (sum, item) => sum + item.checkPoints.length,
    0
  );
  const completedCheckPoints = Object.values(completedChecks).reduce(
    (sum, set) => sum + set.size,
    0
  );
  const progress = completedCheckPoints / totalCheckPoints;

  // Check if current item is complete
  const isCurrentItemComplete = currentItem
    ? currentChecks.size === currentItem.checkPoints.length
    : false;

  // Check if all items are complete
  const allItemsComplete = RIGGING_ITEMS.every(
    (item) => (completedChecks[item.id]?.size || 0) === item.checkPoints.length
  );

  // Toggle a checkpoint
  const toggleCheckPoint = useCallback((itemId: string, checkPoint: string) => {
    setCompletedChecks((prev) => {
      const itemChecks = new Set(prev[itemId] || []);
      if (itemChecks.has(checkPoint)) {
        itemChecks.delete(checkPoint);
      } else {
        itemChecks.add(checkPoint);
      }
      return { ...prev, [itemId]: itemChecks };
    });
  }, []);

  // Mark item as having an issue
  const toggleIssue = useCallback((itemId: string) => {
    setIssueItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // Navigation
  const goToNextItem = useCallback(() => {
    if (currentItemIndex < RIGGING_ITEMS.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
    } else {
      setStep('notes');
    }
  }, [currentItemIndex]);

  const goToPreviousItem = useCallback(() => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex((prev) => prev - 1);
    } else {
      setStep('overview');
    }
  }, [currentItemIndex]);

  const startInspection = useCallback(() => {
    setStep('inspection');
    setCurrentItemIndex(0);
  }, []);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Handle learn more - navigate to Equipment & Rigging module in Race Preparation Mastery course
  const handleLearnMore = useCallback(() => {
    onCancel(); // Close modal first
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/learn/race-preparation-mastery',
        params: {
          moduleId: 'module-13-3', // Equipment & Rigging module
        },
      });
    }, 150);
  }, [router, onCancel]);

  const getPriorityColor = (priority: RiggingItem['priority']) => {
    switch (priority) {
      case 'critical':
        return IOS_COLORS.red;
      case 'important':
        return IOS_COLORS.orange;
      case 'routine':
        return IOS_COLORS.blue;
    }
  };

  // Render based on step
  const renderContent = () => {
    switch (step) {
      case 'overview':
        return renderOverview();
      case 'inspection':
        return renderInspection();
      case 'notes':
        return renderNotes();
      case 'review':
        return renderReview();
      default:
        return null;
    }
  };

  const renderOverview = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={styles.scrollContentInner}
    >
      <View style={styles.overviewHeader}>
        <View style={styles.iconCircle}>
          <Link2 size={32} color={IOS_COLORS.blue} />
        </View>
        <Text style={styles.overviewTitle}>Rigging Inspection</Text>
        <Text style={styles.overviewDescription}>
          Check your running rigging for wear and damage before racing.
          This will take about 10 minutes.
        </Text>
      </View>

      <View style={styles.itemsList}>
        {RIGGING_ITEMS.map((riggingItem, index) => {
          const itemChecks = completedChecks[riggingItem.id] || new Set();
          const isComplete = itemChecks.size === riggingItem.checkPoints.length;
          const hasPartial = itemChecks.size > 0 && !isComplete;
          const hasIssue = issueItems.has(riggingItem.id);

          return (
            <Pressable
              key={riggingItem.id}
              style={[styles.overviewItem, hasIssue && styles.overviewItemIssue]}
              onPress={() => {
                setCurrentItemIndex(index);
                setStep('inspection');
              }}
            >
              <View style={styles.overviewItemIcon}>{riggingItem.icon}</View>
              <View style={styles.overviewItemContent}>
                <Text style={styles.overviewItemLabel}>{riggingItem.label}</Text>
                <Text style={styles.overviewItemMeta}>
                  {isComplete
                    ? hasIssue
                      ? 'Issue noted'
                      : 'Complete'
                    : hasPartial
                    ? `${itemChecks.size}/${riggingItem.checkPoints.length} checked`
                    : `${riggingItem.checkPoints.length} checks`}
                </Text>
              </View>
              <View style={styles.overviewItemStatus}>
                {isComplete ? (
                  hasIssue ? (
                    <AlertTriangle size={22} color={IOS_COLORS.orange} />
                  ) : (
                    <CheckCircle2 size={22} color={IOS_COLORS.green} />
                  )
                ) : hasPartial ? (
                  <AlertTriangle size={22} color={IOS_COLORS.orange} />
                ) : (
                  <ChevronRight size={22} color={IOS_COLORS.gray} />
                )}
              </View>
              <View
                style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor(riggingItem.priority) },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Priority Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: IOS_COLORS.red }]} />
            <Text style={styles.legendText}>Critical</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: IOS_COLORS.orange }]} />
            <Text style={styles.legendText}>Important</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: IOS_COLORS.blue }]} />
            <Text style={styles.legendText}>Routine</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderInspection = () => (
    <View style={styles.inspectionContainer}>
      {/* Item Header */}
      <View style={styles.inspectionHeader}>
        <View style={styles.inspectionIconCircle}>{currentItem.icon}</View>
        <Text style={styles.inspectionTitle}>{currentItem.label}</Text>
        <Text style={styles.inspectionDescription}>
          {currentItem.description}
        </Text>
        <View style={styles.inspectionMeta}>
          <Text style={styles.inspectionProgressText}>
            Item {currentItemIndex + 1} of {RIGGING_ITEMS.length}
          </Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: `${getPriorityColor(currentItem.priority)}15` },
            ]}
          >
            <Text
              style={[
                styles.priorityBadgeText,
                { color: getPriorityColor(currentItem.priority) },
              ]}
            >
              {currentItem.priority.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Checkpoints */}
      <ScrollView style={styles.checkpointsList}>
        {currentItem.checkPoints.map((checkPoint, index) => {
          const isChecked = currentChecks.has(checkPoint);

          return (
            <Pressable
              key={index}
              style={[
                styles.checkpointRow,
                isChecked && styles.checkpointRowChecked,
              ]}
              onPress={() => toggleCheckPoint(currentItem.id, checkPoint)}
            >
              <View style={styles.checkpointCheckbox}>
                {isChecked ? (
                  <CheckCircle2 size={24} color={IOS_COLORS.green} />
                ) : (
                  <Circle size={24} color={IOS_COLORS.gray} />
                )}
              </View>
              <Text
                style={[
                  styles.checkpointText,
                  isChecked && styles.checkpointTextChecked,
                ]}
              >
                {checkPoint}
              </Text>
            </Pressable>
          );
        })}

        {/* Issue Toggle */}
        <Pressable
          style={[
            styles.issueToggle,
            issueItems.has(currentItem.id) && styles.issueToggleActive,
          ]}
          onPress={() => toggleIssue(currentItem.id)}
        >
          <AlertTriangle
            size={20}
            color={
              issueItems.has(currentItem.id)
                ? IOS_COLORS.orange
                : IOS_COLORS.gray
            }
          />
          <Text
            style={[
              styles.issueToggleText,
              issueItems.has(currentItem.id) && styles.issueToggleTextActive,
            ]}
          >
            {issueItems.has(currentItem.id)
              ? 'Issue noted - will require attention'
              : 'Mark if issue found'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.inspectionNav}>
        <Pressable style={styles.navButtonSecondary} onPress={goToPreviousItem}>
          <ChevronLeft size={20} color={IOS_COLORS.blue} />
          <Text style={styles.navButtonSecondaryText}>
            {currentItemIndex === 0 ? 'Overview' : 'Previous'}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.navButtonPrimary,
            !isCurrentItemComplete && styles.navButtonPrimaryDisabled,
          ]}
          onPress={goToNextItem}
        >
          <Text style={styles.navButtonPrimaryText}>
            {currentItemIndex === RIGGING_ITEMS.length - 1 ? 'Continue' : 'Next'}
          </Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );

  const renderNotes = () => (
    <View style={styles.notesContainer}>
      <Text style={styles.notesTitle}>Notes & Observations</Text>
      <Text style={styles.notesDescription}>
        Record any issues found or maintenance needed for your rigging.
      </Text>

      <TextInput
        style={styles.notesInput}
        placeholder="e.g., Main halyard showing chafe at masthead, jib sheet splices need re-whipping..."
        placeholderTextColor={IOS_COLORS.tertiaryLabel}
        multiline
        numberOfLines={4}
        value={notes}
        onChangeText={setNotes}
        textAlignVertical="top"
      />

      <View style={styles.notesActions}>
        <Pressable
          style={styles.navButtonSecondary}
          onPress={() => setStep('inspection')}
        >
          <ChevronLeft size={20} color={IOS_COLORS.blue} />
          <Text style={styles.navButtonSecondaryText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.navButtonPrimary}
          onPress={() => setStep('review')}
        >
          <Text style={styles.navButtonPrimaryText}>Review</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );

  const renderReview = () => {
    const issueCount = issueItems.size;

    return (
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
      >
        <View style={styles.reviewHeader}>
          {allItemsComplete && issueCount === 0 ? (
            <>
              <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
                <CheckCircle2 size={32} color={IOS_COLORS.green} />
              </View>
              <Text style={styles.reviewTitle}>Rigging Ready!</Text>
              <Text style={styles.reviewDescription}>
                All checks complete with no issues found.
              </Text>
            </>
          ) : issueCount > 0 ? (
            <>
              <View style={[styles.iconCircle, styles.iconCircleWarning]}>
                <AlertTriangle size={32} color={IOS_COLORS.orange} />
              </View>
              <Text style={styles.reviewTitle}>
                {issueCount} Issue{issueCount > 1 ? 's' : ''} Noted
              </Text>
              <Text style={styles.reviewDescription}>
                Review the items below before racing.
              </Text>
            </>
          ) : (
            <>
              <View style={[styles.iconCircle, styles.iconCircleWarning]}>
                <AlertTriangle size={32} color={IOS_COLORS.orange} />
              </View>
              <Text style={styles.reviewTitle}>Inspection Incomplete</Text>
              <Text style={styles.reviewDescription}>
                Some checks are still pending.
              </Text>
            </>
          )}
        </View>

        {/* Summary */}
        <View style={styles.reviewSummary}>
          {RIGGING_ITEMS.map((riggingItem) => {
            const itemChecks = completedChecks[riggingItem.id] || new Set();
            const isComplete =
              itemChecks.size === riggingItem.checkPoints.length;
            const hasIssue = issueItems.has(riggingItem.id);

            return (
              <View key={riggingItem.id} style={styles.reviewItem}>
                <View style={styles.reviewItemIcon}>{riggingItem.icon}</View>
                <Text style={styles.reviewItemLabel}>{riggingItem.label}</Text>
                <View style={styles.reviewItemStatus}>
                  {hasIssue ? (
                    <AlertTriangle size={20} color={IOS_COLORS.orange} />
                  ) : isComplete ? (
                    <CheckCircle2 size={20} color={IOS_COLORS.green} />
                  ) : (
                    <Circle size={20} color={IOS_COLORS.gray} />
                  )}
                  <Text
                    style={[
                      styles.reviewItemStatusText,
                      hasIssue
                        ? styles.reviewItemStatusIssue
                        : isComplete
                        ? styles.reviewItemStatusComplete
                        : styles.reviewItemStatusIncomplete,
                    ]}
                  >
                    {hasIssue
                      ? 'Issue'
                      : `${itemChecks.size}/${riggingItem.checkPoints.length}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.reviewNotes}>
            <Text style={styles.reviewNotesLabel}>Notes:</Text>
            <Text style={styles.reviewNotesText}>{notes}</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={IOS_COLORS.gray} />
        </Pressable>
        <Text style={styles.headerTitle}>Rigging Check</Text>
        <View style={styles.headerRight}>
          {item.learningModuleSlug && (
            <Pressable style={styles.learnIconButton} onPress={handleLearnMore}>
              <BookOpen size={20} color={IOS_COLORS.purple} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              allItemsComplete && issueItems.size === 0 && styles.progressComplete,
              issueItems.size > 0 && styles.progressWarning,
            ]}
          />
        </View>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Bottom Action (for overview and review) */}
      {(step === 'overview' || step === 'review') && (
        <View style={styles.bottomAction}>
          {step === 'overview' ? (
            <Pressable style={styles.primaryButton} onPress={startInspection}>
              <Text style={styles.primaryButtonText}>Start Inspection</Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.primaryButton,
                allItemsComplete && issueItems.size === 0
                  ? styles.primaryButtonSuccess
                  : styles.primaryButtonWarning,
              ]}
              onPress={handleComplete}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {allItemsComplete && issueItems.size === 0
                  ? 'Complete Check'
                  : 'Mark Complete Anyway'}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  learnIconButton: {
    padding: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  progressBar: {
    height: 4,
    backgroundColor: IOS_COLORS.separator,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 2,
  },
  progressComplete: {
    backgroundColor: IOS_COLORS.green,
  },
  progressWarning: {
    backgroundColor: IOS_COLORS.orange,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
  },
  // Overview styles
  overviewHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleSuccess: {
    backgroundColor: `${IOS_COLORS.green}15`,
  },
  iconCircleWarning: {
    backgroundColor: `${IOS_COLORS.orange}15`,
  },
  overviewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 8,
    textAlign: 'center',
  },
  overviewDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  itemsList: {
    gap: 12,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    gap: 12,
    overflow: 'hidden',
  },
  overviewItemIssue: {
    backgroundColor: `${IOS_COLORS.orange}08`,
  },
  overviewItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewItemContent: {
    flex: 1,
  },
  overviewItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  overviewItemMeta: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  overviewItemStatus: {
    marginLeft: 8,
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  legendContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  // Inspection styles
  inspectionContainer: {
    flex: 1,
  },
  inspectionHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  inspectionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  inspectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
    marginBottom: 4,
  },
  inspectionDescription: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    marginBottom: 8,
  },
  inspectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  inspectionProgressText: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  checkpointsList: {
    flex: 1,
    padding: 20,
  },
  checkpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  checkpointRowChecked: {
    backgroundColor: `${IOS_COLORS.green}08`,
  },
  checkpointCheckbox: {
    width: 24,
    height: 24,
  },
  checkpointText: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  checkpointTextChecked: {
    color: IOS_COLORS.secondaryLabel,
  },
  issueToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    marginTop: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    borderStyle: 'dashed',
  },
  issueToggleActive: {
    backgroundColor: `${IOS_COLORS.orange}08`,
    borderColor: IOS_COLORS.orange,
    borderStyle: 'solid',
  },
  issueToggleText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  issueToggleTextActive: {
    color: IOS_COLORS.orange,
    fontWeight: '500',
  },
  inspectionNav: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  navButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.background,
    gap: 4,
  },
  navButtonSecondaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  navButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.blue,
    gap: 4,
  },
  navButtonPrimaryDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  navButtonPrimaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Notes styles
  notesContainer: {
    flex: 1,
    padding: 20,
  },
  notesTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  notesDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 20,
    lineHeight: 22,
  },
  notesInput: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: IOS_COLORS.label,
    minHeight: 120,
    flex: 1,
    marginBottom: 20,
  },
  notesActions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  // Review styles
  reviewHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 8,
    textAlign: 'center',
  },
  reviewDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  reviewSummary: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    gap: 12,
  },
  reviewItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewItemLabel: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
  },
  reviewItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewItemStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewItemStatusComplete: {
    color: IOS_COLORS.green,
  },
  reviewItemStatusIncomplete: {
    color: IOS_COLORS.gray,
  },
  reviewItemStatusIssue: {
    color: IOS_COLORS.orange,
  },
  reviewNotes: {
    marginTop: 20,
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
  },
  reviewNotesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
  },
  reviewNotesText: {
    fontSize: 15,
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  // Bottom action
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.blue,
    gap: 8,
  },
  primaryButtonSuccess: {
    backgroundColor: IOS_COLORS.green,
  },
  primaryButtonWarning: {
    backgroundColor: IOS_COLORS.orange,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RiggingInspectionWizard;
