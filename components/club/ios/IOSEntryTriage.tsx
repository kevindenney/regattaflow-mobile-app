/**
 * IOSEntryTriage - Mail-Style Swipe Triage
 *
 * Mail-style entry approval interface:
 * - Swipe right: Approve (green)
 * - Swipe left: Reject/Waitlist
 * - Pull-down search
 * - Bulk selection mode with bottom toolbar
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// Types
interface Entry {
  id: string;
  sailNumber: string;
  boatName?: string;
  helmName: string;
  crewNames?: string[];
  boatClass?: string;
  clubName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  submittedAt: Date;
  avatarUrl?: string;
  isPaid?: boolean;
}

interface IOSEntryTriageProps {
  entries: Entry[];
  isLoading?: boolean;
  onApprove?: (entryId: string) => void;
  onReject?: (entryId: string) => void;
  onWaitlist?: (entryId: string) => void;
  onEntryPress?: (entry: Entry) => void;
  onBulkApprove?: (entryIds: string[]) => void;
  onBulkReject?: (entryIds: string[]) => void;
  onRefresh?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SWIPE_THRESHOLD = 80;

// Entry Row with Swipe Actions
interface EntryRowProps {
  entry: Entry;
  onApprove: () => void;
  onReject: () => void;
  onWaitlist: () => void;
  onPress: () => void;
  isSelected?: boolean;
  selectionMode?: boolean;
  onToggleSelect?: () => void;
}

function EntryRow({
  entry,
  onApprove,
  onReject,
  onWaitlist,
  onPress,
  isSelected = false,
  selectionMode = false,
  onToggleSelect,
}: EntryRowProps) {
  const translateX = useSharedValue(0);
  const rowHeight = useSharedValue(72);
  const scale = useSharedValue(1);

  const handleApprove = useCallback(() => {
    triggerHaptic('notificationSuccess');
    onApprove();
  }, [onApprove]);

  const handleReject = useCallback(() => {
    triggerHaptic('notificationWarning');
    onReject();
  }, [onReject]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right → Approve
        translateX.value = withTiming(300, { duration: 200 });
        rowHeight.value = withTiming(0, { duration: 200 });
        runOnJS(handleApprove)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left → Reject
        translateX.value = withTiming(-300, { duration: 200 });
        rowHeight.value = withTiming(0, { duration: 200 });
        runOnJS(handleReject)();
      } else {
        translateX.value = withSpring(0, IOS_ANIMATIONS.spring.snappy);
      }
    });

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    height: rowHeight.value,
    opacity: interpolate(rowHeight.value, [0, 72], [0, 1], Extrapolation.CLAMP),
  }));

  const approveBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const rejectBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const handlePress = () => {
    if (selectionMode) {
      onToggleSelect?.();
    } else {
      triggerHaptic('impactLight');
      onPress();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Animated.View style={[styles.entryContainer, containerAnimatedStyle]}>
      {/* Swipe Backgrounds */}
      <Animated.View style={[styles.swipeBackground, styles.approveBackground, approveBackgroundStyle]}>
        <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
        <Text style={styles.swipeText}>Approve</Text>
      </Animated.View>
      <Animated.View style={[styles.swipeBackground, styles.rejectBackground, rejectBackgroundStyle]}>
        <Text style={styles.swipeText}>Reject</Text>
        <Ionicons name="close-circle" size={28} color="#FFFFFF" />
      </Animated.View>

      {/* Row Content */}
      <GestureDetector gesture={panGesture}>
        <AnimatedPressable
          style={[styles.entryRow, rowAnimatedStyle]}
          onPress={handlePress}
          onPressIn={() => {
            scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
          }}
        >
          {/* Selection Indicator */}
          {selectionMode && (
            <View style={styles.selectionIndicator}>
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={isSelected ? IOS_COLORS.systemBlue : IOS_COLORS.systemGray3}
              />
            </View>
          )}

          {/* Sail Number Badge */}
          <View style={styles.sailBadge}>
            <Text style={styles.sailNumber}>{entry.sailNumber}</Text>
          </View>

          {/* Content */}
          <View style={styles.entryContent}>
            <View style={styles.entryHeader}>
              <Text style={styles.helmName} numberOfLines={1}>
                {entry.helmName}
              </Text>
              {entry.isPaid && (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark" size={10} color={IOS_COLORS.systemGreen} />
                </View>
              )}
            </View>
            <View style={styles.entryDetails}>
              {entry.boatName && (
                <Text style={styles.boatName} numberOfLines={1}>
                  {entry.boatName}
                </Text>
              )}
              {entry.boatClass && (
                <Text style={styles.boatClass} numberOfLines={1}>
                  {entry.boatClass}
                </Text>
              )}
            </View>
            {entry.clubName && (
              <Text style={styles.clubName} numberOfLines={1}>
                {entry.clubName}
              </Text>
            )}
          </View>

          {/* Trailing */}
          <View style={styles.entryTrailing}>
            <Text style={styles.dateText}>{formatDate(entry.submittedAt)}</Text>
            <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.systemGray3} />
          </View>
        </AnimatedPressable>
      </GestureDetector>
    </Animated.View>
  );
}

// Bulk Action Toolbar
interface BulkToolbarProps {
  selectedCount: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onCancelSelection: () => void;
}

function BulkToolbar({ selectedCount, onApproveAll, onRejectAll, onCancelSelection }: BulkToolbarProps) {
  return (
    <View style={styles.bulkToolbar}>
      <Pressable style={styles.bulkCancelButton} onPress={onCancelSelection}>
        <Text style={styles.bulkCancelText}>Cancel</Text>
      </Pressable>

      <Text style={styles.bulkCount}>
        {selectedCount} selected
      </Text>

      <View style={styles.bulkActions}>
        <Pressable
          style={[styles.bulkActionButton, styles.rejectButton]}
          onPress={() => {
            triggerHaptic('notificationWarning');
            onRejectAll();
          }}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable
          style={[styles.bulkActionButton, styles.approveButton]}
          onPress={() => {
            triggerHaptic('notificationSuccess');
            onApproveAll();
          }}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

// Main Component
export function IOSEntryTriage({
  entries,
  isLoading = false,
  onApprove,
  onReject,
  onWaitlist,
  onEntryPress,
  onBulkApprove,
  onBulkReject,
  onRefresh,
}: IOSEntryTriageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.sailNumber.toLowerCase().includes(query) ||
      entry.helmName.toLowerCase().includes(query) ||
      entry.boatName?.toLowerCase().includes(query) ||
      entry.clubName?.toLowerCase().includes(query)
    );
  });

  const pendingEntries = filteredEntries.filter((e) => e.status === 'pending');

  const toggleSelect = (id: string) => {
    triggerHaptic('selection');
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleLongPress = (id: string) => {
    triggerHaptic('impactMedium');
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const handleBulkApprove = () => {
    onBulkApprove?.(Array.from(selectedIds));
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkReject = () => {
    onBulkReject?.(Array.from(selectedIds));
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const renderEntry = ({ item }: { item: Entry }) => (
    <Pressable
      onLongPress={() => handleLongPress(item.id)}
      delayLongPress={500}
    >
      <EntryRow
        entry={item}
        onApprove={() => onApprove?.(item.id)}
        onReject={() => onReject?.(item.id)}
        onWaitlist={() => onWaitlist?.(item.id)}
        onPress={() => onEntryPress?.(item)}
        isSelected={selectedIds.has(item.id)}
        selectionMode={selectionMode}
        onToggleSelect={() => toggleSelect(item.id)}
      />
    </Pressable>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={IOS_COLORS.secondaryLabel} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={IOS_COLORS.systemGray3} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <Text style={styles.statsText}>
          {pendingEntries.length} pending {pendingEntries.length === 1 ? 'entry' : 'entries'}
        </Text>
        {!selectionMode && pendingEntries.length > 1 && (
          <Pressable
            onPress={() => {
              triggerHaptic('impactLight');
              setSelectionMode(true);
            }}
          >
            <Text style={styles.selectAllText}>Select</Text>
          </Pressable>
        )}
      </View>

      {/* Swipe Hint */}
      {pendingEntries.length > 0 && !selectionMode && (
        <View style={styles.swipeHint}>
          <View style={styles.swipeHintItem}>
            <Ionicons name="arrow-forward" size={14} color={IOS_COLORS.systemGreen} />
            <Text style={[styles.swipeHintText, { color: IOS_COLORS.systemGreen }]}>
              Swipe right to approve
            </Text>
          </View>
          <View style={styles.swipeHintItem}>
            <Ionicons name="arrow-back" size={14} color={IOS_COLORS.systemRed} />
            <Text style={[styles.swipeHintText, { color: IOS_COLORS.systemRed }]}>
              Swipe left to reject
            </Text>
          </View>
        </View>
      )}

      {/* Entry List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
        </View>
      ) : pendingEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={IOS_COLORS.systemGray3} />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>No pending entries to review</Text>
        </View>
      ) : (
        <FlatList
          data={pendingEntries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={false}
        />
      )}

      {/* Bulk Action Toolbar */}
      {selectionMode && (
        <BulkToolbar
          selectedCount={selectedIds.size}
          onApproveAll={handleBulkApprove}
          onRejectAll={handleBulkReject}
          onCancelSelection={() => {
            setSelectionMode(false);
            setSelectedIds(new Set());
          }}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },

  // Search
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    paddingHorizontal: IOS_SPACING.md,
    height: 40,
    gap: IOS_SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.label,
  },

  // Stats Header
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
  },
  statsText: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
  selectAllText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },

  // Swipe Hint
  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: IOS_SPACING.xl,
    paddingVertical: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.lg,
  },
  swipeHintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  swipeHintText: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    fontWeight: '500',
  },

  // List
  listContent: {
    paddingBottom: IOS_SPACING.xxxl + 60,
  },

  // Entry Row
  entryContainer: {
    overflow: 'hidden',
  },
  swipeBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.xl,
  },
  approveBackground: {
    backgroundColor: IOS_COLORS.systemGreen,
    justifyContent: 'flex-start',
    gap: IOS_SPACING.sm,
  },
  rejectBackground: {
    backgroundColor: IOS_COLORS.systemRed,
    justifyContent: 'flex-end',
    gap: IOS_SPACING.sm,
  },
  swipeText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    gap: IOS_SPACING.md,
  },
  selectionIndicator: {
    marginRight: IOS_SPACING.xs,
  },
  sailBadge: {
    width: 48,
    height: 48,
    borderRadius: IOS_RADIUS.sm,
    backgroundColor: IOS_COLORS.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sailNumber: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  entryContent: {
    flex: 1,
    minWidth: 0,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  helmName: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  paidBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: `${IOS_COLORS.systemGreen}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    marginTop: 2,
  },
  boatName: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
  boatClass: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.tertiaryLabel,
  },
  clubName: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },
  entryTrailing: {
    alignItems: 'flex-end',
    gap: IOS_SPACING.xs,
  },
  dateText: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.tertiaryLabel,
  },

  // Bulk Toolbar
  bulkToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? IOS_SPACING.xl : IOS_SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    ...Platform.select({
      web: {
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
      },
    }),
  },
  bulkCancelButton: {
    paddingVertical: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.md,
  },
  bulkCancelText: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.systemBlue,
  },
  bulkCount: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: IOS_SPACING.md,
  },
  bulkActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: IOS_COLORS.systemGreen,
  },
  rejectButton: {
    backgroundColor: IOS_COLORS.systemRed,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.xl,
  },
  emptyIcon: {
    marginBottom: IOS_SPACING.lg,
  },
  emptyTitle: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  emptySubtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});

export default IOSEntryTriage;
