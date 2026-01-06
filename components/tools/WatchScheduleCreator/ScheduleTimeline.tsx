/**
 * ScheduleTimeline Component
 *
 * Step 3 of Watch Schedule Creator: View generated schedule timeline.
 * Features:
 * - Visual horizontal timeline bar
 * - Watch block list view
 * - Optional notes
 * - Save button
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  Check,
  Clock,
  Users,
  Calendar,
  FileText,
} from 'lucide-react-native';

import type { WatchSchedule, WatchGroup, WatchBlock } from '@/types/watchSchedule';
import { getWatchSystemName } from '@/types/watchSchedule';
import {
  formatTimeRange,
  formatDateTime,
  getTotalWatchHours,
  getWatchPeriodCount,
} from '@/lib/watchSchedule';

// =============================================================================
// iOS SYSTEM COLORS (Apple HIG)
// =============================================================================

const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  cardBackground: '#FFFFFF',
};

// Watch group colors
const WATCH_COLORS = {
  A: { primary: '#AF52DE', light: '#F3E8FF', text: '#7C3AED' },
  B: { primary: '#007AFF', light: '#EFF6FF', text: '#1D4ED8' },
};

// =============================================================================
// TYPES
// =============================================================================

interface ScheduleTimelineProps {
  schedule: WatchSchedule;
  onSave: () => void;
  onNotesChange: (notes: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ScheduleTimeline({
  schedule,
  onSave,
  onNotesChange,
}: ScheduleTimelineProps) {
  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const watchAHours = useMemo(
    () => getTotalWatchHours(schedule.blocks, 'A'),
    [schedule.blocks]
  );
  const watchBHours = useMemo(
    () => getTotalWatchHours(schedule.blocks, 'B'),
    [schedule.blocks]
  );
  const watchAPeriods = useMemo(
    () => getWatchPeriodCount(schedule.blocks, 'A'),
    [schedule.blocks]
  );
  const watchBPeriods = useMemo(
    () => getWatchPeriodCount(schedule.blocks, 'B'),
    [schedule.blocks]
  );

  const watchACrew = useMemo(
    () => schedule.crew.filter((c) => c.watch === 'A').map((c) => c.name),
    [schedule.crew]
  );
  const watchBCrew = useMemo(
    () => schedule.crew.filter((c) => c.watch === 'B').map((c) => c.name),
    [schedule.crew]
  );

  // Calculate timeline proportions
  const timelineData = useMemo(() => {
    const totalDuration = schedule.estimatedDuration;
    return schedule.blocks.map((block) => ({
      ...block,
      widthPercent: (block.durationHours / totalDuration) * 100,
    }));
  }, [schedule.blocks, schedule.estimatedDuration]);

  // ==========================================================================
  // RENDER TIMELINE BAR
  // ==========================================================================

  const renderTimelineBar = () => {
    const startTime = new Date(schedule.raceStart);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + schedule.estimatedDuration);

    const formatTime = (date: Date) =>
      date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

    return (
      <View style={styles.timelineContainer}>
        {/* Time labels */}
        <View style={styles.timeLabels}>
          <Text style={styles.timeLabel}>{formatTime(startTime)}</Text>
          <Text style={styles.timeLabel}>{formatTime(endTime)}</Text>
        </View>

        {/* Timeline bar */}
        <View style={styles.timelineBar}>
          {timelineData.map((block, index) => (
            <View
              key={index}
              style={[
                styles.timelineBlock,
                {
                  width: `${block.widthPercent}%`,
                  backgroundColor: WATCH_COLORS[block.watch].primary,
                },
              ]}
            >
              {block.widthPercent > 15 && (
                <Text style={styles.timelineBlockLabel}>{block.watch}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.timelineLegend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: WATCH_COLORS.A.primary }]}
            />
            <Text style={styles.legendText}>Watch A</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: WATCH_COLORS.B.primary }]}
            />
            <Text style={styles.legendText}>Watch B</Text>
          </View>
        </View>
      </View>
    );
  };

  // ==========================================================================
  // RENDER WATCH BLOCK LIST
  // ==========================================================================

  const renderWatchBlockList = () => {
    // Group blocks by watch
    const watchABlocks = schedule.blocks.filter((b) => b.watch === 'A');
    const watchBBlocks = schedule.blocks.filter((b) => b.watch === 'B');

    return (
      <View style={styles.watchBlocksContainer}>
        {/* Watch A */}
        <View style={styles.watchSection}>
          <View
            style={[styles.watchSectionHeader, { backgroundColor: WATCH_COLORS.A.light }]}
          >
            <View
              style={[styles.watchBadge, { backgroundColor: WATCH_COLORS.A.primary }]}
            >
              <Text style={styles.watchBadgeText}>A</Text>
            </View>
            <View style={styles.watchSectionInfo}>
              <Text style={styles.watchSectionTitle}>Watch A</Text>
              <Text style={styles.watchSectionCrew}>
                {watchACrew.join(', ')}
              </Text>
            </View>
            <View style={styles.watchSectionStats}>
              <Text style={styles.watchStatValue}>{watchAHours}h</Text>
              <Text style={styles.watchStatLabel}>{watchAPeriods} periods</Text>
            </View>
          </View>
          <View style={styles.blockList}>
            {watchABlocks.map((block, index) => (
              <View key={index} style={styles.blockItem}>
                <View style={styles.blockTimeIndicator}>
                  <View
                    style={[styles.blockDot, { backgroundColor: WATCH_COLORS.A.primary }]}
                  />
                  <View style={styles.blockLine} />
                </View>
                <View style={styles.blockContent}>
                  <Text style={styles.blockTime}>
                    {formatTimeRange(block.startTime, block.endTime)}
                  </Text>
                  <Text style={styles.blockDuration}>
                    {block.durationHours} hour{block.durationHours !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Watch B */}
        <View style={styles.watchSection}>
          <View
            style={[styles.watchSectionHeader, { backgroundColor: WATCH_COLORS.B.light }]}
          >
            <View
              style={[styles.watchBadge, { backgroundColor: WATCH_COLORS.B.primary }]}
            >
              <Text style={styles.watchBadgeText}>B</Text>
            </View>
            <View style={styles.watchSectionInfo}>
              <Text style={styles.watchSectionTitle}>Watch B</Text>
              <Text style={styles.watchSectionCrew}>
                {watchBCrew.join(', ')}
              </Text>
            </View>
            <View style={styles.watchSectionStats}>
              <Text style={styles.watchStatValue}>{watchBHours}h</Text>
              <Text style={styles.watchStatLabel}>{watchBPeriods} periods</Text>
            </View>
          </View>
          <View style={styles.blockList}>
            {watchBBlocks.map((block, index) => (
              <View key={index} style={styles.blockItem}>
                <View style={styles.blockTimeIndicator}>
                  <View
                    style={[styles.blockDot, { backgroundColor: WATCH_COLORS.B.primary }]}
                  />
                  <View style={styles.blockLine} />
                </View>
                <View style={styles.blockContent}>
                  <Text style={styles.blockTime}>
                    {formatTimeRange(block.startTime, block.endTime)}
                  </Text>
                  <Text style={styles.blockDuration}>
                    {block.durationHours} hour{block.durationHours !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Clock size={16} color={IOS_COLORS.purple} />
              <Text style={styles.summaryText}>
                {getWatchSystemName(schedule.system)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Calendar size={16} color={IOS_COLORS.purple} />
              <Text style={styles.summaryText}>
                {schedule.estimatedDuration} hour race
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Users size={16} color={IOS_COLORS.gray} />
              <Text style={styles.summaryText}>
                {schedule.crew.length} crew total
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline Visualization */}
        {renderTimelineBar()}

        {/* Watch Block Lists */}
        {renderWatchBlockList()}

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <FileText size={16} color={IOS_COLORS.gray} />
            <Text style={styles.notesLabel}>Notes (optional)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes about the watch schedule..."
            placeholderTextColor={IOS_COLORS.gray3}
            multiline
            numberOfLines={3}
            value={schedule.notes || ''}
            onChangeText={onNotesChange}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Footer with Save button */}
      <View style={styles.footer}>
        <Pressable style={styles.saveButton} onPress={onSave}>
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Schedule</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: IOS_COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },

  // Timeline
  timelineContainer: {
    backgroundColor: IOS_COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    fontVariant: ['tabular-nums'],
  },
  timelineBar: {
    flexDirection: 'row',
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timelineBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
  },
  timelineBlockLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
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
    fontSize: 12,
    color: IOS_COLORS.gray,
  },

  // Watch Blocks
  watchBlocksContainer: {
    gap: 12,
  },
  watchSection: {
    backgroundColor: IOS_COLORS.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  watchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  watchBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  watchSectionInfo: {
    flex: 1,
  },
  watchSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  watchSectionCrew: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 1,
  },
  watchSectionStats: {
    alignItems: 'flex-end',
  },
  watchStatValue: {
    fontSize: 17,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  watchStatLabel: {
    fontSize: 11,
    color: IOS_COLORS.gray,
  },

  // Block List
  blockList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  blockItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  blockTimeIndicator: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  blockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  blockLine: {
    width: 2,
    flex: 1,
    backgroundColor: IOS_COLORS.gray5,
    marginTop: 4,
  },
  blockContent: {
    flex: 1,
  },
  blockTime: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  blockDuration: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },

  // Notes
  notesSection: {
    backgroundColor: IOS_COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  notesInput: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: IOS_COLORS.label,
    minHeight: 80,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: IOS_COLORS.gray6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.green,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ScheduleTimeline;
