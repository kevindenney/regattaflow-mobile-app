/**
 * NudgeBanner Component
 *
 * Displays personalized learning nudges inline within wizards and cards.
 * Shows relevant past learnings based on current context (venue, conditions, boat).
 *
 * Features:
 * - Compact banner format for inline display
 * - Expandable detail view
 * - Acknowledge/dismiss actions
 * - Tracks delivery for effectiveness measurement
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  History,
  MapPin,
  Wind,
  Sailboat,
} from 'lucide-react-native';
import type { PersonalizedNudge, NudgeDeliveryChannel } from '@/types/adaptiveLearning';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  yellow: '#FFCC00',
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
};

export interface NudgeBannerProps {
  /** The nudge to display */
  nudge: PersonalizedNudge;
  /** Channel for tracking delivery */
  channel?: NudgeDeliveryChannel;
  /** Called when nudge is acknowledged */
  onAcknowledge?: (nudge: PersonalizedNudge) => void;
  /** Called when nudge is dismissed */
  onDismiss?: (nudge: PersonalizedNudge) => void;
  /** Called to record delivery */
  onRecordDelivery?: (learnableEventId: string, channel: NudgeDeliveryChannel) => Promise<string>;
  /** Compact mode - single line */
  compact?: boolean;
  /** Show match reasons */
  showMatchReasons?: boolean;
}

/**
 * Icon for nudge category
 */
function getCategoryIcon(category: string) {
  switch (category) {
    case 'venue_learning':
      return MapPin;
    case 'weather_adaptation':
    case 'equipment_issue':
      return Wind;
    case 'successful_strategy':
    case 'performance_issue':
      return Sailboat;
    default:
      return Lightbulb;
  }
}

/**
 * Color for outcome type
 */
function getOutcomeColor(outcome: string): string {
  switch (outcome) {
    case 'positive':
      return IOS_COLORS.green;
    case 'negative':
      return IOS_COLORS.orange;
    default:
      return IOS_COLORS.gray;
  }
}

/**
 * Single nudge banner
 */
export function NudgeBanner({
  nudge,
  channel = 'checklist',
  onAcknowledge,
  onDismiss,
  onRecordDelivery,
  compact = false,
  showMatchReasons = false,
}: NudgeBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);

  const Icon = getCategoryIcon(nudge.category);
  const outcomeColor = getOutcomeColor(nudge.outcome);

  // Record delivery on mount
  useEffect(() => {
    if (onRecordDelivery && !deliveryId) {
      onRecordDelivery(nudge.learnableEventId, channel)
        .then(setDeliveryId)
        .catch(console.error);
    }
  }, [nudge.learnableEventId, channel, onRecordDelivery, deliveryId]);

  const handleAcknowledge = useCallback(() => {
    setIsAcknowledged(true);
    onAcknowledge?.(nudge);
  }, [nudge, onAcknowledge]);

  const handleDismiss = useCallback(() => {
    onDismiss?.(nudge);
  }, [nudge, onDismiss]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Compact single-line version
  if (compact) {
    return (
      <View style={[styles.compactBanner, { borderLeftColor: outcomeColor }]}>
        <Icon size={14} color={outcomeColor} />
        <Text style={styles.compactText} numberOfLines={1}>
          {nudge.actionText}
        </Text>
        {nudge.isNew && <View style={styles.newDot} />}
      </View>
    );
  }

  return (
    <View style={[styles.banner, { borderLeftColor: outcomeColor }]}>
      {/* Header row */}
      <Pressable style={styles.headerRow} onPress={handleToggleExpand}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${outcomeColor}15` }]}>
            <Icon size={16} color={outcomeColor} />
          </View>
          <View style={styles.headerTextContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {nudge.title}
              </Text>
              {nudge.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
            {!isExpanded && (
              <Text style={styles.actionPreview} numberOfLines={1}>
                {nudge.actionText}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {!isAcknowledged && (
            isExpanded ? (
              <ChevronUp size={18} color={IOS_COLORS.gray} />
            ) : (
              <ChevronDown size={18} color={IOS_COLORS.gray} />
            )
          )}
          {isAcknowledged && (
            <Check size={18} color={IOS_COLORS.green} />
          )}
        </View>
      </Pressable>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Main message */}
          <Text style={styles.message}>{nudge.message}</Text>

          {/* Action text */}
          <View style={styles.actionRow}>
            <Lightbulb size={14} color={IOS_COLORS.purple} />
            <Text style={styles.actionText}>{nudge.actionText}</Text>
          </View>

          {/* Match reasons */}
          {showMatchReasons && nudge.matchReasons.length > 0 && (
            <View style={styles.matchReasons}>
              <Text style={styles.matchReasonsLabel}>Why showing this:</Text>
              {nudge.matchReasons.map((reason, i) => (
                <Text key={i} style={styles.matchReason}>
                  • {reason}
                </Text>
              ))}
            </View>
          )}

          {/* Source date */}
          {nudge.sourceRaceDate && (
            <View style={styles.sourceRow}>
              <History size={12} color={IOS_COLORS.gray} />
              <Text style={styles.sourceText}>
                From race on {new Date(nudge.sourceRaceDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Actions */}
          {!isAcknowledged && (
            <View style={styles.actions}>
              <Pressable
                style={styles.acknowledgeButton}
                onPress={handleAcknowledge}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.acknowledgeButtonText}>Got it</Text>
              </Pressable>
              <Pressable
                style={styles.dismissButton}
                onPress={handleDismiss}
              >
                <X size={16} color={IOS_COLORS.gray} />
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Props for NudgeList
 */
export interface NudgeListProps {
  /** Nudges to display */
  nudges: PersonalizedNudge[];
  /** Title for the section */
  title?: string;
  /** Channel for tracking */
  channel?: NudgeDeliveryChannel;
  /** Called when a nudge is acknowledged */
  onAcknowledge?: (nudge: PersonalizedNudge) => void;
  /** Called when a nudge is dismissed */
  onDismiss?: (nudge: PersonalizedNudge) => void;
  /** Called to record delivery */
  onRecordDelivery?: (learnableEventId: string, channel: NudgeDeliveryChannel) => Promise<string>;
  /** Max nudges to show (default 3) */
  maxVisible?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Compact mode */
  compact?: boolean;
  /** Show match reasons on expanded nudges */
  showMatchReasons?: boolean;
}

/**
 * List of nudge banners
 */
export function NudgeList({
  nudges,
  title = 'From Your Past Races',
  channel = 'checklist',
  onAcknowledge,
  onDismiss,
  onRecordDelivery,
  maxVisible = 3,
  isLoading = false,
  emptyMessage,
  compact = false,
  showMatchReasons = false,
}: NudgeListProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Filter out dismissed nudges
  const visibleNudges = nudges
    .filter((n) => !dismissedIds.has(n.id))
    .slice(0, maxVisible);

  const handleDismiss = useCallback((nudge: PersonalizedNudge) => {
    setDismissedIds((prev) => new Set([...prev, nudge.id]));
    onDismiss?.(nudge);
  }, [onDismiss]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={IOS_COLORS.purple} />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  if (visibleNudges.length === 0) {
    if (emptyMessage) {
      return (
        <View style={styles.emptyContainer}>
          <Lightbulb size={20} color={IOS_COLORS.gray} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      );
    }
    return null;
  }

  return (
    <View style={styles.listContainer}>
      {/* Section header */}
      <View style={styles.listHeader}>
        <History size={14} color={IOS_COLORS.purple} />
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.listCount}>{visibleNudges.length}</Text>
      </View>

      {/* Nudge banners */}
      <View style={styles.listContent}>
        {visibleNudges.map((nudge) => (
          <NudgeBanner
            key={nudge.id}
            nudge={nudge}
            channel={channel}
            onAcknowledge={onAcknowledge}
            onDismiss={handleDismiss}
            onRecordDelivery={onRecordDelivery}
            compact={compact}
            showMatchReasons={showMatchReasons}
          />
        ))}
      </View>

      {/* Show more indicator */}
      {nudges.length > maxVisible && (
        <Text style={styles.moreText}>
          +{nudges.length - maxVisible} more insights available
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact banner
  compactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  compactText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.purple,
  },

  // Full banner
  banner: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    borderLeftWidth: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: IOS_COLORS.purple,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  actionPreview: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },
  headerRight: {
    marginLeft: 8,
  },

  // Expanded content
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  message: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
    marginTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: `${IOS_COLORS.purple}08`,
    borderRadius: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.purple,
    fontWeight: '500',
    lineHeight: 18,
  },
  matchReasons: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  matchReasonsLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  matchReason: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    lineHeight: 18,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  sourceText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: IOS_COLORS.green,
    borderRadius: 8,
  },
  acknowledgeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    padding: 8,
  },

  // List container
  listContainer: {
    marginBottom: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.purple,
    flex: 1,
  },
  listCount: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  listContent: {
    gap: 0,
  },
  moreText: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Loading state
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  loadingText: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },

  // Empty state
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 8,
  },
  emptyText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
});

export default NudgeBanner;
