/**
 * DaysBeforeContent - Days Before Race Phase Content
 *
 * Content shown when selectedPhase === 'days_before'
 * Now uses data-driven checklists based on race type.
 *
 * Includes:
 * - Equipment checklist (including carryover from previous races)
 * - Crew coordination
 * - Weather forecast (multi-day)
 * - Travel/logistics
 * - Race-type-specific items (distance, match, team)
 * - Team collaboration for team racing
 */

import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, TouchableOpacity, Modal, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Wrench,
  Users,
  CloudSun,
  Car,
  Shield,
  Compass,
  Target,
  BookOpen,
  AlertCircle,
  UserPlus,
  Sailboat,
  Camera,
  ListChecks,
  Info,
  FileText,
} from 'lucide-react-native';

import { CardRaceData, getTimeContext } from '../../types';
import { useRaceChecklist, ChecklistItemWithState } from '@/hooks/useRaceChecklist';
import { useTeamRaceEntry, useTeamChecklist } from '@/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { sailorBoatService, SailorBoat } from '@/services/SailorBoatService';
import { SailInspectionWizard } from '@/components/sail-inspection';
import { QuickTipsPanel } from '@/components/checklist-tools/QuickTipsPanel';
import { SafetyGearWizard, RiggingInspectionWizard, WatchScheduleWizard, ForecastCheckWizard, DocumentReviewWizard, CourseMapWizard } from '@/components/checklist-tools/wizards';
import { ElectronicsChecklist } from '@/components/checklist-tools/checklists/ElectronicsChecklist';
import { InteractiveChecklist } from '@/components/checklist-tools/InteractiveChecklist';
import { PositionAssignmentPanel, MeetingPointPicker } from '@/components/checklist-tools/crew';
import { hasTool } from '@/lib/checklists/toolRegistry';
import { CATEGORY_CONFIG, ChecklistCategory } from '@/types/checklists';
import type { RaceType } from '@/types/raceEvents';

// Team collaboration components
import {
  TeamSetupCard,
  TeamMembersList,
  TeamInviteModal,
  SharedChecklistItem,
} from '@/components/team';

// Pre-race sharing
import { ShareWithTeamSection } from './ShareWithTeamSection';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  purple: '#5856D6',
  pink: '#FF2D55',
  teal: '#0D9488',
};

// Icon mapping for categories
const CATEGORY_ICONS: Record<ChecklistCategory, React.ComponentType<any>> = {
  equipment: Wrench,
  crew: Users,
  logistics: Car,
  safety: Shield,
  navigation: Compass,
  tactics: Target,
  team_coordination: Users,
  rules: BookOpen,
  weather: CloudSun,
  morning: CloudSun,
  on_water: Compass,
  documents: FileText,
};

interface DaysBeforeContentProps {
  race: CardRaceData;
  isExpanded?: boolean;
}

/**
 * Get the race type, defaulting to 'fleet' if not specified
 */
function getRaceType(race: CardRaceData): RaceType {
  return race.race_type || 'fleet';
}

/**
 * Get the appropriate icon for a tool type
 */
function getToolIcon(toolType: string | undefined) {
  switch (toolType) {
    case 'full_wizard':
      return <Camera size={14} color={IOS_COLORS.blue} />;
    case 'interactive':
      return <ListChecks size={14} color={IOS_COLORS.blue} />;
    case 'quick_tips':
      return <Info size={14} color={IOS_COLORS.blue} />;
    default:
      return <Sailboat size={14} color={IOS_COLORS.blue} />;
  }
}

/**
 * Render a single checklist item
 */
function ChecklistItem({
  item,
  onToggle,
  onAction,
  onLearnPress,
  hasAction,
}: {
  item: ChecklistItemWithState;
  onToggle: () => void;
  onAction?: () => void;
  onLearnPress?: () => void;
  hasAction?: boolean;
}) {
  // Determine if item has a learning link
  const hasLearningLink = !!item.learningModuleSlug;

  return (
    <View style={styles.checklistItem}>
      {/* Checkbox + Label area - toggles completion */}
      <Pressable style={styles.checklistMainArea} onPress={onToggle}>
        <View style={[styles.checkbox, item.isCompleted && styles.checkboxDone]}>
          {item.isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.checklistItemContent}>
          <Text
            style={[
              styles.checklistLabel,
              item.isCompleted && styles.checklistLabelDone,
            ]}
          >
            {item.label}
          </Text>
          {item.isCarryover && item.carryoverSource && (
            <Text style={styles.carryoverSource}>from {item.carryoverSource}</Text>
          )}
          {item.completion?.completedByName && (
            <Text style={styles.completedByText}>
              ✓ {item.completion.completedByName}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Action icons area */}
      <View style={styles.actionIconsRow}>
        {/* Learning link badge - tappable */}
        {hasLearningLink && (
          <Pressable
            style={styles.learnBadge}
            onPress={onLearnPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <BookOpen size={14} color={IOS_COLORS.purple} />
          </Pressable>
        )}
        {/* Tool action badge - tappable */}
        {hasAction && onAction ? (
          <Pressable
            style={styles.actionBadge}
            onPress={onAction}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {getToolIcon(item.toolType)}
          </Pressable>
        ) : item.priority === 'high' && !hasLearningLink ? (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>!</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Render a category section with its items
 */
function CategorySection({
  category,
  items,
  onToggle,
  onItemAction,
  onLearnPress,
  actionItems,
  showCarryoverHeader,
}: {
  category: ChecklistCategory;
  items: ChecklistItemWithState[];
  onToggle: (itemId: string) => void;
  onItemAction?: (itemId: string) => void;
  onLearnPress?: (item: ChecklistItemWithState) => void;
  actionItems?: string[];
  showCarryoverHeader?: boolean;
}) {
  const config = CATEGORY_CONFIG[category];
  const IconComponent = CATEGORY_ICONS[category] || Wrench;

  // Separate carryover items from regular items
  const carryoverItems = items.filter((item) => item.isCarryover);
  const regularItems = items.filter((item) => !item.isCarryover);

  const hasAction = (itemId: string) => actionItems?.includes(itemId) ?? false;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <IconComponent size={16} color={config.color} />
        <Text style={styles.sectionLabel}>{config.label}</Text>
      </View>

      {/* Carryover items from previous races */}
      {carryoverItems.length > 0 && (
        <View style={styles.carryoverContainer}>
          <View style={styles.carryoverHeader}>
            <AlertCircle size={14} color={IOS_COLORS.orange} />
            <Text style={styles.carryoverLabel}>From previous race:</Text>
          </View>
          {carryoverItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={() => onToggle(item.id)}
              onAction={() => onItemAction?.(item.id)}
              onLearnPress={() => onLearnPress?.(item)}
              hasAction={hasAction(item.id)}
            />
          ))}
        </View>
      )}

      {/* Regular checklist items */}
      <View style={styles.checklistContainer}>
        {regularItems.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={() => onToggle(item.id)}
            onAction={() => onItemAction?.(item.id)}
            onLearnPress={() => onLearnPress?.(item)}
            hasAction={hasAction(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

export function DaysBeforeContent({
  race,
  isExpanded = true,
}: DaysBeforeContentProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const raceType = getRaceType(race);
  const isTeamRace = raceType === 'team';

  // State for team invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);

  // State for sail inspection (legacy - kept for specific sail inspection)
  const [showSailInspection, setShowSailInspection] = useState(false);
  const [userBoat, setUserBoat] = useState<SailorBoat | null>(null);

  // State for generic tool launcher
  const [activeTool, setActiveTool] = useState<ChecklistItemWithState | null>(null);

  // Fetch user's primary boat for sail inspection
  // Use useFocusEffect to refresh when returning from adding a boat
  // Note: sailor_boats.sailor_id = auth.uid() (user.id), not sailor_profiles.id
  useFocusEffect(
    useCallback(() => {
      const fetchUserBoat = async () => {
        if (!user?.id) return;

        try {
          // Get boats for this user (ordered by is_primary)
          // sailor_boats uses user.id as sailor_id (matches auth.uid() in RLS)
          const boats = await sailorBoatService.listBoatsForSailor(user.id);
          if (boats.length > 0) {
            setUserBoat(boats[0]); // First one is primary
          } else {
            setUserBoat(null); // Clear if no boats found
          }
        } catch (error) {
          console.error('[DaysBeforeContent] Failed to fetch user boat:', error);
          setUserBoat(null);
        }
      };

      fetchUserBoat();
    }, [user?.id])
  );

  // Check if this is a demo race (no carryover for demo races)
  const isDemo = race.isDemo === true;

  // Use the data-driven checklist hook (for non-team or fallback)
  const {
    itemsByCategory,
    categories,
    completedCount,
    totalCount,
    progress,
    toggleItem,
    isLoading,
  } = useRaceChecklist({
    raceEventId: race.id,
    raceName: race.name,
    raceType,
    phase: 'days_before',
    includeCarryover: !isDemo, // Don't include carryover for demo races
  });

  // Get items that have tools (computed from the actual items)
  const actionItems = useMemo(() => {
    const allItems = Object.values(itemsByCategory).flat();
    return allItems.filter(item => hasTool(item)).map(item => item.id);
  }, [itemsByCategory]);

  // Handle checklist item actions (launch tools)
  const handleItemAction = useCallback((itemId: string) => {
    // Special handling for sails - requires boat
    if (itemId === 'sails') {
      if (userBoat) {
        setShowSailInspection(true);
      } else {
        Alert.alert(
          'Add a Boat First',
          'To inspect your sails, you need to add a boat to your profile.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Boat',
              onPress: () => router.push('/(tabs)/boat/add'),
            },
          ]
        );
      }
      return;
    }

    // Find the item and launch its tool
    const allItems = Object.values(itemsByCategory).flat();
    const item = allItems.find((i) => i.id === itemId);
    if (item && hasTool(item)) {
      setActiveTool(item);
    }
  }, [userBoat, itemsByCategory]);

  // Handle tool completion
  const handleToolComplete = useCallback(() => {
    if (activeTool) {
      toggleItem(activeTool.id);
    }
    setActiveTool(null);
  }, [activeTool, toggleItem]);

  // Handle tool cancellation
  const handleToolCancel = useCallback(() => {
    setActiveTool(null);
  }, []);

  // Handle learning module press - navigate to learn tab with specific module
  const handleLearnPress = useCallback((item: ChecklistItemWithState) => {
    if (item.learningModuleSlug) {
      router.push(`/(tabs)/learn?module=${item.learningModuleSlug}`);
    }
  }, []);

  // Handle sail inspection completion
  const handleSailInspectionComplete = useCallback(() => {
    setShowSailInspection(false);
    // Mark the sails item as completed
    toggleItem('sails');
  }, [toggleItem]);

  // Team race entry hook (only active for team racing)
  const {
    teamEntry,
    members,
    isTeamMember,
    isTeamCreator,
    inviteCode,
    inviteLink,
    createTeamEntry,
    generateInviteCode,
    joinTeam,
    isLoading: isTeamLoading,
    isCreating,
    isJoining,
    error: teamError,
  } = useTeamRaceEntry({
    raceEventId: race.id,
    raceType,
  });

  // Team checklist hook (only active when team entry exists)
  const {
    items: teamItems,
    completedCount: teamCompletedCount,
    totalCount: teamTotalCount,
    progress: teamProgress,
    toggleItem: teamToggleItem,
    isLoading: isTeamChecklistLoading,
    isSyncing,
  } = useTeamChecklist({
    teamEntryId: teamEntry?.id || null,
    raceType,
    phase: 'days_before',
  });

  // Time context (handles past and future races)
  const timeContext = getTimeContext(race.date, race.startTime);

  // Categories to show based on expansion state
  const visibleCategories = useMemo(() => {
    if (isExpanded) {
      return categories;
    }
    // In collapsed state, show main categories only
    const mainCategories: ChecklistCategory[] = [
      'equipment',
      'safety',
      'crew',
      'team_coordination',
      'tactics',
    ];
    return categories.filter((cat) => mainCategories.includes(cat));
  }, [categories, isExpanded]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // For past races, show a different view
  if (timeContext.isPast) {
    return (
      <View style={styles.container}>
        <View style={styles.pastRaceNotice}>
          <Text style={styles.pastRaceValue}>{timeContext.value}</Text>
          <Text style={styles.pastRaceLabel}>This phase has passed</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <View style={[styles.loadingContainer, { flex: 1 }]}>
          <Text style={styles.loadingText}>Loading checklist...</Text>
        </View>
      </View>
    );
  }

  // ==========================================================================
  // TEAM RACING - Show team setup or collaboration UI
  // ==========================================================================

  if (isTeamRace) {
    // Still loading team state
    if (isTeamLoading) {
      return (
        <View style={[styles.container, { flex: 1 }]}>
          <View style={[styles.loadingContainer, { flex: 1 }]}>
            <Text style={styles.loadingText}>Loading team...</Text>
          </View>
        </View>
      );
    }

    // No team entry yet - show setup card
    if (!teamEntry) {
      return (
        <View style={styles.container}>
          {/* Time Context */}
          <View style={styles.timeContext}>
            <Text style={styles.timeContextValue}>{timeContext.value}</Text>
            {timeContext.label && (
              <Text style={styles.timeContextLabel}>{timeContext.label}</Text>
            )}
          </View>

          <TeamSetupCard
            raceName={race.name}
            onCreateTeam={createTeamEntry}
            onJoinTeam={(code) => joinTeam({ inviteCode: code })}
            isCreating={isCreating}
            isJoining={isJoining}
            error={teamError?.message}
          />
        </View>
      );
    }

    // Team exists - show team collaboration UI
    const effectiveProgress = teamProgress;
    const effectiveCompleted = teamCompletedCount;
    const effectiveTotal = teamTotalCount;

    return (
      <View style={styles.container}>
        {/* Time Context */}
        <View style={styles.timeContext}>
          <Text style={styles.timeContextValue}>{timeContext.value}</Text>
          {timeContext.label && (
            <Text style={styles.timeContextLabel}>{timeContext.label}</Text>
          )}
        </View>

        {/* Team Header */}
        <View style={styles.teamHeader}>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{teamEntry.teamName}</Text>
            {isSyncing && (
              <View style={styles.syncBadge}>
                <Text style={styles.syncText}>Syncing...</Text>
              </View>
            )}
          </View>
          {isTeamCreator && (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => setShowInviteModal(true)}
            >
              <UserPlus size={16} color={IOS_COLORS.teal} />
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Team Members */}
        <TeamMembersList
          members={members}
          currentUserId={currentUserId}
          compact={!isExpanded}
        />

        {/* Team Checklist */}
        {isTeamChecklistLoading ? (
          <View style={[styles.loadingContainer, { flex: 1 }]}>
            <Text style={styles.loadingText}>Loading checklist...</Text>
          </View>
        ) : (
          <>
            {teamItems.map((item) => (
              <SharedChecklistItem
                key={item.id}
                id={item.id}
                label={item.label}
                isCompleted={item.isCompleted}
                completion={item.completion}
                currentUserId={currentUserId}
                onToggle={() => teamToggleItem(item.id)}
                priority={item.priority}
                disabled={isSyncing}
              />
            ))}
          </>
        )}

        {/* Progress Summary */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            {effectiveCompleted} / {effectiveTotal} items completed
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${effectiveProgress * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Team Invite Modal */}
        <TeamInviteModal
          visible={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          inviteCode={inviteCode}
          inviteLink={inviteLink}
          teamName={teamEntry.teamName}
          onGenerateCode={generateInviteCode}
        />
      </View>
    );
  }

  // ==========================================================================
  // NON-TEAM RACING - Standard checklist UI
  // ==========================================================================

  return (
    <View style={styles.container}>
      {/* Time Context */}
      <View style={styles.timeContext}>
        <Text style={styles.timeContextValue}>{timeContext.value}</Text>
        {timeContext.label && (
          <Text style={styles.timeContextLabel}>{timeContext.label}</Text>
        )}
      </View>

      {/* Race Type Badge (for non-fleet races) */}
      {raceType !== 'fleet' && (
        <View style={styles.raceTypeBadge}>
          <Text style={styles.raceTypeBadgeText}>
            {raceType.charAt(0).toUpperCase() + raceType.slice(1)} Racing
          </Text>
        </View>
      )}

      {/* Category Sections */}
      {visibleCategories.map((category) => {
        const items = itemsByCategory[category];
        if (!items || items.length === 0) return null;

        return (
          <CategorySection
            key={category}
            category={category}
            items={items}
            onToggle={toggleItem}
            onItemAction={handleItemAction}
            onLearnPress={handleLearnPress}
            actionItems={actionItems}
          />
        );
      })}

      {/* Share with Team Section */}
      <ShareWithTeamSection race={race} />

      {/* Progress Summary */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>
          {completedCount} / {totalCount} items completed
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Sail Inspection Modal */}
      {userBoat && (
        <Modal
          visible={showSailInspection}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSailInspection(false)}
        >
          <SailInspectionWizard
            equipmentId={userBoat.id}
            boatId={userBoat.id}
            sailName={userBoat.name || 'Main Sail'}
            inspectionType="pre_race"
            onComplete={handleSailInspectionComplete}
            onCancel={() => setShowSailInspection(false)}
          />
        </Modal>
      )}

      {/* Full Wizard Modals */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'safety_gear' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <SafetyGearWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'rigging_inspection' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <RiggingInspectionWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'watch_schedule' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <WatchScheduleWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'forecast_check' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <ForecastCheckWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            venue={race.venue}
            raceDate={race.date}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Document Review Wizard (NOR) */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'nor_review' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <DocumentReviewWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            venue={race.venue}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Document Review Wizard (SI) */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'si_review' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <DocumentReviewWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            venue={race.venue}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Course Map Wizard */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'course_map' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <CourseMapWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            course={race.course}
            venue={race.venue}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Interactive Checklist Modal */}
      {activeTool?.toolType === 'interactive' && activeTool.toolId === 'electronics_checklist' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <ElectronicsChecklist
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Position Assignment Modal */}
      {activeTool?.toolType === 'interactive' && activeTool.toolId === 'position_assignment' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <PositionAssignmentPanel
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Meeting Point Modal */}
      {activeTool?.toolType === 'interactive' && activeTool.toolId === 'meeting_point' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <MeetingPointPicker
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Generic Interactive Checklist Modal (for other interactive items) */}
      {activeTool?.toolType === 'interactive' &&
       activeTool.toolId !== 'electronics_checklist' &&
       activeTool.toolId !== 'position_assignment' &&
       activeTool.toolId !== 'meeting_point' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <InteractiveChecklist
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Quick Tips Panel (bottom sheet, not modal) */}
      <QuickTipsPanel
        item={activeTool ?? { id: '', label: '', priority: 'normal' }}
        visible={activeTool?.toolType === 'quick_tips'}
        onComplete={handleToolComplete}
        onCancel={handleToolCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Time Context
  timeContext: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  timeContextValue: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },
  timeContextLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Past Race Notice
  pastRaceNotice: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  pastRaceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  pastRaceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Race Type Badge
  raceTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  raceTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },

  // Carryover
  carryoverContainer: {
    backgroundColor: `${IOS_COLORS.orange}15`,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.orange,
    gap: 8,
    marginBottom: 8,
  },
  carryoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  carryoverLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },
  carryoverSource: {
    fontSize: 11,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },

  // Checklist
  checklistContainer: {
    gap: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistMainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checklistItemContent: {
    flex: 1,
    gap: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checklistLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  checklistLabelDone: {
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },
  completedByText: {
    fontSize: 11,
    fontWeight: '400',
    color: IOS_COLORS.green,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadgeText: {
    color: IOS_COLORS.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  learnBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${IOS_COLORS.purple}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  // Progress
  progressContainer: {
    gap: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.green,
    borderRadius: 2,
  },

  // Team Racing
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  syncBadge: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${IOS_COLORS.teal}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.teal,
  },
});

export default DaysBeforeContent;
