/**
 * TimelineGridView - "Zoom out" grid of mini race cards
 *
 * Like Photos app: toggle from single-card view to see all races at a glance.
 * Cards are grouped by month with section headers, arranged in a responsive grid.
 * Tapping a mini card zooms back to that race in the CardGrid.
 */

import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CardRaceData, isRacePast, formatTimeUntilRace } from './types';
import { IOS_COLORS } from './constants';
import { triggerHaptic } from '@/lib/haptics';

// =============================================================================
// TYPES
// =============================================================================

interface TimelineGridViewProps {
  races: CardRaceData[];
  /** Currently selected race ID */
  selectedRaceId?: string;
  /** Index of the next upcoming race */
  nextRaceIndex?: number | null;
  /** Called when user taps a mini card */
  onSelectRace: (index: number, race: CardRaceData) => void;
  /** Current user ID for ownership checks */
  userId?: string;
  /** Callback when edit is requested for a race */
  onEditRace?: (raceId: string) => void;
  /** Callback when delete is requested for a race */
  onDeleteRace?: (raceId: string, raceName: string) => void;
  /** Top inset to clear the toolbar */
  topInset?: number;
  /** Bulk update status for selected steps */
  onBulkUpdateStatus?: (raceIds: string[], status: 'completed' | 'planned') => Promise<void> | void;
  /** Bulk delete selected steps */
  onBulkDeleteRaces?: (raceIds: string[]) => Promise<void> | void;
  /** Persist reordered timeline race IDs */
  onReorderRaces?: (orderedRaceIds: string[]) => Promise<void> | void;
}

interface MonthGroup {
  key: string;
  label: string;
  races: { race: CardRaceData; index: number }[];
}
type IndexedRace = { race: CardRaceData; index: number };

// =============================================================================
// HELPERS
// =============================================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function groupByMonthIndexed(indexedRaces: IndexedRace[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  indexedRaces.forEach(({ race, index }) => {
    const dateStr = (race as any).start_date || race.date;
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[month]} ${year}`;

    if (!groups.has(key)) {
      groups.set(key, { key, label, races: [] });
    }
    groups.get(key)!.races.push({ race, index });
  });

  return Array.from(groups.values());
}

function getRaceStatusColor(race: CardRaceData, isNext: boolean): string {
  if (isNext) return IOS_COLORS.green;
  const dateStr = (race as any).start_date || race.date;
  const isPast = isRacePast(dateStr, race.startTime);
  if (isPast) return IOS_COLORS.gray3;
  return IOS_COLORS.blue;
}

function getRaceStatusLabel(race: CardRaceData, isNext: boolean): string {
  if (isNext) return 'NEXT';
  const dateStr = (race as any).start_date || race.date;
  const isPast = isRacePast(dateStr, race.startTime);
  if (isPast) return 'DONE';
  return formatTimeUntilRace(dateStr, race.startTime);
}

function getRaceTypeIcon(race: CardRaceData): string {
  const subtype = (race as any).metadata?.event_subtype;
  if (subtype === 'blank_activity') return 'add-circle-outline';
  switch (race.race_type) {
    case 'distance': return 'compass-outline';
    case 'match': return 'git-compare-outline';
    case 'team': return 'people-outline';
    default: return 'boat-outline';
  }
}

// =============================================================================
// MINI CARD
// =============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MiniCard = React.memo(function MiniCard({
  race,
  isSelected,
  isNext,
  canManage,
  onEdit,
  onDelete,
  isMenuOpen,
  onOpenMenu,
  onCloseMenu,
  onPress,
  isReorderMode = false,
  isDragging = false,
  onDragStartCard,
  onDragEnterCard,
  onDropCard,
  onLongPressCard,
}: {
  race: CardRaceData;
  isSelected: boolean;
  isNext: boolean;
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isMenuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onPress: () => void;
  isReorderMode?: boolean;
  isDragging?: boolean;
  onDragStartCard?: () => void;
  onDragEnterCard?: () => void;
  onDropCard?: () => void;
  onLongPressCard?: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const statusColor = getRaceStatusColor(race, isNext);
  const statusLabel = getRaceStatusLabel(race, isNext);
  const dateStr = (race as any).start_date || race.date;
  const d = new Date(dateStr);
  const dayNum = d.getDate();
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const isBlankActivity = (race as any).metadata?.event_subtype === 'blank_activity';

  const webDnDProps: any = Platform.OS === 'web' && isReorderMode
    ? {
        draggable: true,
        onDragStart: () => onDragStartCard?.(),
        onDragEnter: (event: any) => {
          event?.preventDefault?.();
          onDragEnterCard?.();
        },
        onDragOver: (event: any) => {
          event?.preventDefault?.();
        },
        onDrop: (event: any) => {
          event?.preventDefault?.();
          onDropCard?.();
        },
      }
    : {};

  return (
    <AnimatedPressable
      style={[
        miniStyles.card,
        isSelected && miniStyles.cardSelected,
        isNext && miniStyles.cardNext,
        isReorderMode && miniStyles.cardReorderMode,
        isDragging && miniStyles.cardDragging,
        animStyle,
      ]}
      onPress={() => {
        if (isMenuOpen) {
          onCloseMenu();
          return;
        }
        triggerHaptic('selection');
        onPress();
      }}
      onLongPress={isReorderMode && Platform.OS !== 'web' ? onLongPressCard : undefined}
      delayLongPress={140}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      {...webDnDProps}
    >
      <View style={miniStyles.topRow}>
        {/* Status badge */}
        <View style={[miniStyles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={miniStyles.statusText}>{statusLabel}</Text>
        </View>
        {canManage && !isReorderMode && (onEdit || onDelete) ? (
          <Pressable
            style={miniStyles.menuButton}
            onPress={(event) => {
              (event as any)?.stopPropagation?.();
              if (isMenuOpen) {
                onCloseMenu();
                return;
              }
              onOpenMenu();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Manage ${race.name || 'race'}`}
          >
            <Ionicons name="ellipsis-horizontal" size={14} color={IOS_COLORS.secondaryLabel} />
          </Pressable>
        ) : null}
      </View>

      {isMenuOpen ? (
        <View style={miniStyles.menuPopover}>
          {onEdit ? (
            <Pressable
              style={miniStyles.menuItem}
              onPress={(event) => {
                (event as any)?.stopPropagation?.();
                onCloseMenu();
                onEdit();
              }}
            >
              <Text style={miniStyles.menuItemText}>Edit</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              style={miniStyles.menuItem}
              onPress={(event) => {
                (event as any)?.stopPropagation?.();
                onCloseMenu();
                onDelete();
              }}
            >
              <Text style={[miniStyles.menuItemText, miniStyles.menuItemDestructive]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Date circle */}
      <View style={miniStyles.dateCircle}>
        <Text style={miniStyles.dateDay}>{dayNum}</Text>
        <Text style={miniStyles.dateDayName}>{dayName}</Text>
      </View>

      {/* Race name */}
      <Text style={miniStyles.raceName} numberOfLines={2}>
        {race.name || (isBlankActivity ? 'Blank Step' : 'Untitled')}
      </Text>

      {/* Venue */}
      {race.venue && race.venue !== 'Venue TBD' && (
        <Text style={miniStyles.venue} numberOfLines={1}>
          {race.venue}
        </Text>
      )}

      {/* Race type icon */}
      <View style={miniStyles.typeRow}>
        <Ionicons
          name={getRaceTypeIcon(race) as any}
          size={12}
          color={IOS_COLORS.tertiaryLabel}
        />
        {race.boatClass && race.boatClass !== 'Class TBD' && (
          <Text style={miniStyles.boatClass} numberOfLines={1}>{race.boatClass}</Text>
        )}
      </View>
    </AnimatedPressable>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TimelineGridView({
  races,
  selectedRaceId,
  nextRaceIndex,
  onSelectRace,
  userId,
  onEditRace,
  onDeleteRace,
  topInset = 0,
  onBulkUpdateStatus,
  onBulkDeleteRaces,
  onReorderRaces,
}: TimelineGridViewProps) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [openMenuRaceId, setOpenMenuRaceId] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectedRaceIds, setSelectedRaceIds] = useState<Set<string>>(new Set());
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [dragRaceId, setDragRaceId] = useState<string | null>(null);

  // Responsive columns
  const columns = screenWidth > 900 ? 4 : screenWidth > 600 ? 3 : 2;
  const horizontalPadding = 16;
  const gap = 10;
  const cardWidth = (screenWidth - horizontalPadding * 2 - gap * (columns - 1)) / columns;

  useEffect(() => {
    const incomingIds = races.map((race) => race.id);
    setOrderedIds((prev) => {
      if (prev.length === 0) return incomingIds;
      const next = prev.filter((id) => incomingIds.includes(id));
      for (const id of incomingIds) {
        if (!next.includes(id)) next.push(id);
      }
      return next;
    });
  }, [races]);

  const orderedRaces = useMemo(() => {
    if (orderedIds.length === 0) return races;
    const raceById = new Map(races.map((race) => [race.id, race]));
    const ordered = orderedIds
      .map((id) => raceById.get(id))
      .filter((race): race is CardRaceData => !!race);
    for (const race of races) {
      if (!ordered.some((row) => row.id === race.id)) {
        ordered.push(race);
      }
    }
    return ordered;
  }, [orderedIds, races]);

  const indexedRaces = useMemo<IndexedRace[]>(
    () => orderedRaces.map((race, index) => ({ race, index })),
    [orderedRaces],
  );
  const doneIndexedRaces = useMemo<IndexedRace[]>(() => {
    if (nextRaceIndex != null) {
      return indexedRaces.filter(({ index }) => index < nextRaceIndex);
    }
    return indexedRaces.filter(({ race }) => {
      const dateStr = (race as any).start_date || race.date;
      return isRacePast(dateStr, race.startTime);
    });
  }, [indexedRaces, nextRaceIndex]);
  const plannedIndexedRaces = useMemo<IndexedRace[]>(() => {
    if (nextRaceIndex != null) {
      return indexedRaces.filter(({ index }) => index >= nextRaceIndex);
    }
    return indexedRaces.filter(({ race }) => {
      const dateStr = (race as any).start_date || race.date;
      return !isRacePast(dateStr, race.startTime);
    });
  }, [indexedRaces, nextRaceIndex]);
  const plannedGroups = useMemo(() => groupByMonthIndexed(plannedIndexedRaces), [plannedIndexedRaces]);
  const doneGroups = useMemo(() => groupByMonthIndexed(doneIndexedRaces), [doneIndexedRaces]);

  const handleSelectRace = useCallback(
    (index: number, race: CardRaceData) => {
      setOpenMenuRaceId(null);
      if (bulkMode) {
        setSelectedRaceIds((prev) => {
          const next = new Set(prev);
          if (next.has(race.id)) {
            next.delete(race.id);
          } else {
            next.add(race.id);
          }
          return next;
        });
        return;
      }
      onSelectRace(index, race);
    },
    [bulkMode, onSelectRace],
  );

  const selectedIdsArray = useMemo(() => Array.from(selectedRaceIds), [selectedRaceIds]);
  const canBulkEdit = Boolean(onBulkUpdateStatus || onBulkDeleteRaces);
  const canReorder = Boolean(onReorderRaces);

  useEffect(() => {
    if (!canReorder && reorderMode) {
      setReorderMode(false);
      setDragRaceId(null);
    }
  }, [canReorder, reorderMode]);

  const clearBulk = useCallback(() => {
    setBulkMode(false);
    setSelectedRaceIds(new Set());
  }, []);

  const applyReorder = useCallback((fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    setOrderedIds((prev) => {
      const current = prev.length ? [...prev] : races.map((race) => race.id);
      const fromIdx = current.indexOf(fromId);
      const toIdx = current.indexOf(toId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return current;
      const next = [...current];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      void onReorderRaces?.(next);
      return next;
    });
  }, [onReorderRaces, races]);

  const handleCardPress = useCallback((index: number, race: CardRaceData) => {
    if (reorderMode && Platform.OS !== 'web') {
      if (!dragRaceId) {
        setDragRaceId(race.id);
        return;
      }
      if (dragRaceId === race.id) {
        setDragRaceId(null);
        return;
      }
      applyReorder(dragRaceId, race.id);
      setDragRaceId(null);
      return;
    }
    handleSelectRace(index, race);
  }, [applyReorder, dragRaceId, handleSelectRace, reorderMode]);

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={[gridStyles.container, { paddingTop: topInset + 8 }]}
    >
      <ScrollView
        ref={scrollRef}
        style={gridStyles.scrollView}
        contentContainerStyle={[
          gridStyles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setOpenMenuRaceId(null)}
      >
        {/* Summary bar */}
        <View style={gridStyles.summaryBar}>
          <View style={gridStyles.summaryLeft}>
            {canBulkEdit && (
              <Pressable
                style={[gridStyles.bulkChip, bulkMode && gridStyles.bulkChipActive]}
                onPress={() => {
                  if (bulkMode) {
                    clearBulk();
                  } else {
                    setBulkMode(true);
                    setSelectedRaceIds(new Set());
                  }
                }}
              >
                <Text style={[gridStyles.bulkChipText, bulkMode && gridStyles.bulkChipTextActive]}>
                  {bulkMode ? 'Exit Bulk' : 'Bulk Edit'}
                </Text>
              </Pressable>
            )}
            {canReorder ? (
              <Pressable
                style={[gridStyles.bulkChip, reorderMode && gridStyles.bulkChipActive]}
                onPress={() => {
                  setReorderMode((prev) => !prev);
                  setBulkMode(false);
                  setSelectedRaceIds(new Set());
                }}
              >
                <Text style={[gridStyles.bulkChipText, reorderMode && gridStyles.bulkChipTextActive]}>
                  {reorderMode ? 'Reordering…' : 'Reorder'}
                </Text>
              </Pressable>
            ) : null}
            {nextRaceIndex != null && nextRaceIndex >= 0 && (
              <View style={gridStyles.summaryNextBadge}>
                <View style={gridStyles.summaryNextDot} />
                <Text style={gridStyles.summaryNextText}>
                  Next: {orderedRaces[nextRaceIndex]?.name || 'Upcoming'}
                </Text>
              </View>
            )}
          </View>
          {bulkMode && selectedIdsArray.length > 0 && (
            <View style={gridStyles.bulkActions}>
              <Text style={gridStyles.bulkCount}>{selectedIdsArray.length}</Text>
              {onBulkUpdateStatus ? (
                <Pressable
                  style={gridStyles.bulkActionChip}
                  onPress={() => void onBulkUpdateStatus(selectedIdsArray, 'planned')}
                >
                  <Text style={gridStyles.bulkActionText}>Planned</Text>
                </Pressable>
              ) : null}
              {onBulkUpdateStatus ? (
                <Pressable
                  style={gridStyles.bulkActionChip}
                  onPress={() => void onBulkUpdateStatus(selectedIdsArray, 'completed')}
                >
                  <Text style={gridStyles.bulkActionText}>Done</Text>
                </Pressable>
              ) : null}
              {onBulkDeleteRaces ? (
                <Pressable
                  style={[gridStyles.bulkActionChip, gridStyles.bulkDeleteChip]}
                  onPress={() => void onBulkDeleteRaces(selectedIdsArray)}
                >
                  <Text style={[gridStyles.bulkActionText, gridStyles.bulkDeleteText]}>Delete</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>

        {reorderMode && Platform.OS !== 'web' ? (
          <View style={gridStyles.reorderHelpBar}>
            <Text style={gridStyles.reorderHelpText}>Long-press a step, then tap another step to move it.</Text>
          </View>
        ) : null}

        {plannedGroups.map((group) => (
          <View key={group.key} style={gridStyles.monthSection}>
            {/* Month header */}
            <Text style={gridStyles.monthHeader}>{group.label}</Text>

            {/* Card grid */}
            <View style={[gridStyles.grid, { gap }]}>
              {group.races.map(({ race, index }) => (
                <View key={race.id} style={{ width: cardWidth }}>
                  {(() => {
                    const canManage = !!userId && race.created_by === userId && !race.isDemo;
                    const handleEdit = canManage && onEditRace ? () => onEditRace(race.id) : undefined;
                    const handleDelete = canManage && onDeleteRace ? () => onDeleteRace(race.id, race.name) : undefined;
                    return (
                  <MiniCard
                    race={race}
                    isSelected={bulkMode ? selectedRaceIds.has(race.id) : race.id === selectedRaceId}
                    isNext={index === nextRaceIndex}
                    canManage={canManage}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isMenuOpen={openMenuRaceId === race.id}
                    onOpenMenu={() => setOpenMenuRaceId(race.id)}
                    onCloseMenu={() => setOpenMenuRaceId((current) => (current === race.id ? null : current))}
                    onPress={() => handleCardPress(index, race)}
                    isReorderMode={reorderMode}
                    isDragging={dragRaceId === race.id}
                    onLongPressCard={() => {
                      if (!reorderMode || Platform.OS === 'web') return;
                      setDragRaceId(race.id);
                    }}
                    onDragStartCard={() => setDragRaceId(race.id)}
                    onDragEnterCard={() => {
                      if (dragRaceId && dragRaceId !== race.id) {
                        applyReorder(dragRaceId, race.id);
                      }
                    }}
                    onDropCard={() => {
                      if (dragRaceId && dragRaceId !== race.id) {
                        applyReorder(dragRaceId, race.id);
                      }
                      setDragRaceId(null);
                    }}
                  />
                    );
                  })()}
                </View>
              ))}
            </View>
          </View>
        ))}

        {plannedGroups.length > 0 && doneGroups.length > 0 ? (
          <View style={gridStyles.nowDividerWrap}>
            <View style={gridStyles.nowDividerLine} />
            <View style={gridStyles.nowDividerBadge}>
              <Text style={gridStyles.nowDividerBadgeText}>NOW</Text>
            </View>
            <View style={gridStyles.nowDividerLine} />
          </View>
        ) : null}

        {doneGroups.map((group) => (
          <View key={`done-${group.key}`} style={gridStyles.monthSection}>
            <Text style={gridStyles.monthHeaderDone}>{group.label}</Text>
            <View style={[gridStyles.grid, { gap }]}>
              {group.races.map(({ race, index }) => (
                <View key={race.id} style={{ width: cardWidth }}>
                  {(() => {
                    const canManage = !!userId && race.created_by === userId && !race.isDemo;
                    const handleEdit = canManage && onEditRace ? () => onEditRace(race.id) : undefined;
                    const handleDelete = canManage && onDeleteRace ? () => onDeleteRace(race.id, race.name) : undefined;
                    return (
                      <MiniCard
                        race={race}
                        isSelected={bulkMode ? selectedRaceIds.has(race.id) : race.id === selectedRaceId}
                        isNext={index === nextRaceIndex}
                        canManage={canManage}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isMenuOpen={openMenuRaceId === race.id}
                        onOpenMenu={() => setOpenMenuRaceId(race.id)}
                        onCloseMenu={() => setOpenMenuRaceId((current) => (current === race.id ? null : current))}
                        onPress={() => handleCardPress(index, race)}
                        isReorderMode={reorderMode}
                        isDragging={dragRaceId === race.id}
                        onLongPressCard={() => {
                          if (!reorderMode || Platform.OS === 'web') return;
                          setDragRaceId(race.id);
                        }}
                        onDragStartCard={() => setDragRaceId(race.id)}
                        onDragEnterCard={() => {
                          if (dragRaceId && dragRaceId !== race.id) {
                            applyReorder(dragRaceId, race.id);
                          }
                        }}
                        onDropCard={() => {
                          if (dragRaceId && dragRaceId !== race.id) {
                            applyReorder(dragRaceId, race.id);
                          }
                          setDragRaceId(null);
                        }}
                      />
                    );
                  })()}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const miniStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    minHeight: 120,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: IOS_COLORS.blue,
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 2px #007AFF, 0 2px 8px rgba(0,122,255,0.15)',
      } as any,
      default: {
        shadowColor: IOS_COLORS.blue,
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  cardNext: {
    borderWidth: 2,
    borderColor: IOS_COLORS.green,
  },
  cardReorderMode: {
    ...Platform.select({
      web: {
        cursor: 'grab',
      } as any,
    }),
  },
  cardDragging: {
    opacity: 0.55,
    ...Platform.select({
      web: {
        cursor: 'grabbing',
      } as any,
    }),
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  menuButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.04)',
  },
  menuPopover: {
    position: 'absolute',
    top: 36,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    minWidth: 96,
    zIndex: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 6px 16px rgba(15,23,42,0.16)',
      } as any,
      default: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.16,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      },
    }),
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  menuItemDestructive: {
    color: IOS_COLORS.red,
  },
  dateCircle: {
    alignItems: 'center',
    marginBottom: 6,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    lineHeight: 26,
  },
  dateDayName: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  raceName: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 16,
    marginBottom: 2,
    textAlign: 'center',
  },
  venue: {
    fontSize: 10,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 'auto' as any,
  },
  boatClass: {
    fontSize: 10,
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '500',
  },
});

const gridStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  summaryNextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  summaryNextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.green,
  },
  summaryNextText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.green,
    maxWidth: 220,
  },
  bulkChip: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bulkChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  bulkChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  bulkChipTextActive: {
    color: '#1D4ED8',
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulkCount: {
    fontSize: 11,
    fontWeight: '700',
    color: IOS_COLORS.secondaryLabel,
    minWidth: 16,
    textAlign: 'right',
  },
  bulkActionChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bulkActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  bulkDeleteChip: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  bulkDeleteText: {
    color: '#B91C1C',
  },
  reorderHelpBar: {
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  reorderHelpText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  monthSection: {
    marginBottom: 20,
  },
  monthHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  monthHeaderDone: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nowDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  nowDividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
  },
  nowDividerBadge: {
    backgroundColor: '#0EA5E9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  nowDividerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
