/**
 * SafetyGearWizard
 *
 * Multi-step guided safety gear inspection wizard.
 * Walks through each safety item to ensure complete verification.
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  Shield,
  Siren,
  Scissors,
  Cross,
  BookOpen,
  Check,
  LifeBuoy,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { ChecklistItem } from '@/types/checklists';
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
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

// Safety gear categories
interface SafetyItem {
  id: string;
  label: string;
  description: string;
  checkPoints: string[];
  icon: React.ReactNode;
  priority: 'required' | 'recommended';
}

const SAFETY_ITEMS: SafetyItem[] = [
  {
    id: 'pfd',
    label: 'Personal Flotation Device (PFD)',
    description: 'Life jacket or buoyancy aid',
    checkPoints: [
      'PFD is Coast Guard/class approved',
      'All buckles and zippers work properly',
      'Straps are not frayed or damaged',
      'Fits snugly when worn',
      'Whistle attached (if required)',
    ],
    icon: <LifeBuoy size={24} color={IOS_COLORS.blue} />,
    priority: 'required',
  },
  {
    id: 'whistle',
    label: 'Whistle & Signaling Device',
    description: 'For emergency signaling',
    checkPoints: [
      'Whistle is attached to PFD',
      'Whistle is loud and clear',
      'Lanyard is secure',
    ],
    icon: <Siren size={24} color={IOS_COLORS.orange} />,
    priority: 'required',
  },
  {
    id: 'knife',
    label: 'Sailing Knife',
    description: 'For cutting lines in emergencies',
    checkPoints: [
      'Blade is sharp and clean',
      'Shackle key/marlinspike works (if equipped)',
      'Easily accessible location',
      'Lanyard attached (recommended)',
    ],
    icon: <Scissors size={24} color={IOS_COLORS.gray2} />,
    priority: 'recommended',
  },
  {
    id: 'firstaid',
    label: 'First Aid Kit',
    description: 'Basic medical supplies',
    checkPoints: [
      'Kit is complete and stocked',
      'No expired medications',
      'Waterproof container/bag',
      'Accessible location known to all crew',
    ],
    icon: <Cross size={24} color={IOS_COLORS.red} />,
    priority: 'required',
  },
];

type WizardStep = 'overview' | 'inspection' | 'notes' | 'review';

interface SafetyGearWizardProps extends ChecklistToolProps {}

export function SafetyGearWizard({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
}: SafetyGearWizardProps) {
  const router = useRouter();

  // State
  const [step, setStep] = useState<WizardStep>('overview');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [completedChecks, setCompletedChecks] = useState<Record<string, Set<string>>>({});
  const [notes, setNotes] = useState('');
  const [issues, setIssues] = useState<string[]>([]);

  // Current safety item
  const currentItem = SAFETY_ITEMS[currentItemIndex];
  const currentChecks = completedChecks[currentItem?.id] || new Set();

  // Progress calculation
  const totalCheckPoints = SAFETY_ITEMS.reduce(
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
  const allItemsComplete = SAFETY_ITEMS.every(
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

  // Navigation
  const goToNextItem = useCallback(() => {
    if (currentItemIndex < SAFETY_ITEMS.length - 1) {
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
    // Find any incomplete required items
    const incompleteRequired = SAFETY_ITEMS.filter(
      (item) =>
        item.priority === 'required' &&
        (completedChecks[item.id]?.size || 0) < item.checkPoints.length
    );

    if (incompleteRequired.length > 0) {
      setIssues(
        incompleteRequired.map(
          (item) =>
            `${item.label}: ${item.checkPoints.length - (completedChecks[item.id]?.size || 0)} checks remaining`
        )
      );
    }

    onComplete();
  }, [completedChecks, onComplete]);

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
          <Shield size={32} color={IOS_COLORS.red} />
        </View>
        <Text style={styles.overviewTitle}>Safety Gear Check</Text>
        <Text style={styles.overviewDescription}>
          Let's verify all your safety equipment is ready for racing. This will
          take about 5 minutes.
        </Text>
      </View>

      <View style={styles.itemsList}>
        {SAFETY_ITEMS.map((safetyItem, index) => {
          const itemChecks = completedChecks[safetyItem.id] || new Set();
          const isComplete = itemChecks.size === safetyItem.checkPoints.length;
          const hasPartial = itemChecks.size > 0 && !isComplete;

          return (
            <Pressable
              key={safetyItem.id}
              style={styles.overviewItem}
              onPress={() => {
                setCurrentItemIndex(index);
                setStep('inspection');
              }}
            >
              <View style={styles.overviewItemIcon}>{safetyItem.icon}</View>
              <View style={styles.overviewItemContent}>
                <Text style={styles.overviewItemLabel}>{safetyItem.label}</Text>
                <Text style={styles.overviewItemMeta}>
                  {isComplete
                    ? 'Complete'
                    : hasPartial
                    ? `${itemChecks.size}/${safetyItem.checkPoints.length} checked`
                    : `${safetyItem.checkPoints.length} checks`}
                </Text>
              </View>
              <View style={styles.overviewItemStatus}>
                {isComplete ? (
                  <CheckCircle2 size={22} color={IOS_COLORS.green} />
                ) : hasPartial ? (
                  <AlertTriangle size={22} color={IOS_COLORS.orange} />
                ) : (
                  <ChevronRight size={22} color={IOS_COLORS.gray} />
                )}
              </View>
              {safetyItem.priority === 'required' && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>Required</Text>
                </View>
              )}
            </Pressable>
          );
        })}
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
        <View style={styles.inspectionProgress}>
          <Text style={styles.inspectionProgressText}>
            Item {currentItemIndex + 1} of {SAFETY_ITEMS.length}
          </Text>
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
            {currentItemIndex === SAFETY_ITEMS.length - 1 ? 'Continue' : 'Next'}
          </Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );

  const renderNotes = () => (
    <View style={styles.notesContainer}>
      <Text style={styles.notesTitle}>Any Issues or Notes?</Text>
      <Text style={styles.notesDescription}>
        Add any observations about your safety gear that need attention.
      </Text>

      <TextInput
        style={styles.notesInput}
        placeholder="e.g., PFD strap showing wear, need to replace knife lanyard..."
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

  const renderReview = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={styles.scrollContentInner}
    >
      <View style={styles.reviewHeader}>
        {allItemsComplete ? (
          <>
            <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
              <CheckCircle2 size={32} color={IOS_COLORS.green} />
            </View>
            <Text style={styles.reviewTitle}>All Checks Complete!</Text>
            <Text style={styles.reviewDescription}>
              Your safety gear is verified and ready for racing.
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.iconCircle, styles.iconCircleWarning]}>
              <AlertTriangle size={32} color={IOS_COLORS.orange} />
            </View>
            <Text style={styles.reviewTitle}>Some Items Incomplete</Text>
            <Text style={styles.reviewDescription}>
              Please review the items below before racing.
            </Text>
          </>
        )}
      </View>

      {/* Summary */}
      <View style={styles.reviewSummary}>
        {SAFETY_ITEMS.map((safetyItem) => {
          const itemChecks = completedChecks[safetyItem.id] || new Set();
          const isComplete =
            itemChecks.size === safetyItem.checkPoints.length;

          return (
            <View key={safetyItem.id} style={styles.reviewItem}>
              <View style={styles.reviewItemIcon}>{safetyItem.icon}</View>
              <Text style={styles.reviewItemLabel}>{safetyItem.label}</Text>
              <View style={styles.reviewItemStatus}>
                {isComplete ? (
                  <CheckCircle2 size={20} color={IOS_COLORS.green} />
                ) : (
                  <AlertTriangle size={20} color={IOS_COLORS.orange} />
                )}
                <Text
                  style={[
                    styles.reviewItemStatusText,
                    isComplete
                      ? styles.reviewItemStatusComplete
                      : styles.reviewItemStatusIncomplete,
                  ]}
                >
                  {itemChecks.size}/{safetyItem.checkPoints.length}
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
        <Text style={styles.headerTitle}>Safety Check</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.learnIconButton} onPress={handleLearnMore}>
            <BookOpen size={20} color={IOS_COLORS.purple} />
          </Pressable>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              allItemsComplete && styles.progressComplete,
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
                allItemsComplete
                  ? styles.primaryButtonSuccess
                  : styles.primaryButtonWarning,
              ]}
              onPress={handleComplete}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {allItemsComplete ? 'Complete Check' : 'Mark Complete Anyway'}
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
    backgroundColor: `${IOS_COLORS.red}15`,
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
  requiredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: `${IOS_COLORS.red}15`,
    borderRadius: 4,
  },
  requiredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.red,
    textTransform: 'uppercase',
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
  inspectionProgress: {
    marginTop: 8,
  },
  inspectionProgressText: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
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

export default SafetyGearWizard;
