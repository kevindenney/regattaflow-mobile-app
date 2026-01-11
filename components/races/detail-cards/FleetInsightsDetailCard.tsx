/**
 * Fleet Insights Detail Card
 * Expandable card showing what other sailors logged about the race
 * Collapsed: Header + count badge + first insight preview
 * Expanded: Full list of insights with avatars, badges, snippets
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { supabase } from '@/services/supabase';
import { CARD_EXPAND_DURATION, CARD_COLLAPSE_DURATION } from '@/constants/navigationAnimations';
import { IOS_COLORS } from '@/components/cards/constants';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FleetInsight {
  sailorName: string;
  snippet: string | null;
  hasTrack: boolean;
  hasNotes: boolean;
}

interface FleetInsightsDetailCardProps {
  raceId: string;
  currentUserId?: string | null;
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
}

function truncate(text: string | null | undefined, maxLength = 80): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export function FleetInsightsDetailCard({
  raceId,
  currentUserId,
  isExpanded = false,
  onToggle,
  onPress,
}: FleetInsightsDetailCardProps) {
  const [insights, setInsights] = useState<FleetInsight[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => {
    'worklet';
    const rotationValue = rotation.value ?? 0;
    return {
      transform: [{ rotate: `${interpolate(rotationValue, [0, 1], [0, 90])}deg` }],
    };
  });

  const handlePress = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: isExpanded ? CARD_COLLAPSE_DURATION : CARD_EXPAND_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });

    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  }, [isExpanded, onToggle, onPress]);

  useEffect(() => {
    async function loadFleetInsights() {
      if (!raceId) {
        setInsights([]);
        setLoading(false);
        return;
      }

      try {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('race_timer_sessions')
          .select('id, sailor_id, notes, track_points')
          .eq('regatta_id', raceId)
          .not('sailor_id', 'eq', currentUserId || '')
          .limit(10);

        if (sessionsError) {
          console.warn('[FleetInsightsCard] Sessions query error:', sessionsError);
          setInsights([]);
          setLoading(false);
          return;
        }

        const sessions = sessionsData ?? [];
        setTotalCount(sessions.length);

        if (sessions.length === 0) {
          setInsights([]);
          setLoading(false);
          return;
        }

        const sailorIds = sessions
          .map((s) => s.sailor_id)
          .filter((id): id is string => !!id);

        let userNames: Map<string, string> = new Map();
        if (sailorIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', sailorIds);

          if (usersData) {
            userNames = new Map(usersData.map((u) => [u.id, u.full_name || 'Sailor']));
          }
        }

        const computedInsights: FleetInsight[] = sessions.slice(0, 5).map((session) => {
          const hasNotes = typeof session.notes === 'string' && session.notes.trim().length > 0;
          const hasTrack = Array.isArray(session.track_points) && session.track_points.length > 0;

          return {
            sailorName: userNames.get(session.sailor_id || '') || 'Sailor',
            snippet: hasNotes ? truncate(session.notes) : null,
            hasTrack,
            hasNotes,
          };
        });

        setInsights(computedInsights);
      } catch (error) {
        console.warn('[FleetInsightsCard] Error loading insights:', error);
        setInsights([]);
      } finally {
        setLoading(false);
      }
    }

    loadFleetInsights();
  }, [raceId, currentUserId]);

  const hasInsights = insights.length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header - Always visible */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, hasInsights && styles.headerIconActive]}>
          <MaterialCommunityIcons
            name="account-group"
            size={18}
            color={hasInsights ? IOS_COLORS.cyan : IOS_COLORS.gray}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Fleet Insights</Text>
          <Text style={styles.headerSubtitle}>Other sailors' experiences</Text>
        </View>
        {totalCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalCount}</Text>
          </View>
        )}
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={IOS_COLORS.gray} />
        </Animated.View>
      </View>

      {loading ? (
        <View style={styles.loadingContent}>
          <ActivityIndicator size="small" color={IOS_COLORS.gray} />
        </View>
      ) : hasInsights ? (
        <>
          {/* Collapsed: First insight preview */}
          {!isExpanded && (
            <View style={styles.collapsedContent}>
              <View style={styles.previewRow}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{insights[0].sailorName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.previewContent}>
                  <Text style={styles.sailorNamePreview}>{insights[0].sailorName}</Text>
                  {insights[0].snippet && (
                    <Text style={styles.snippetPreview} numberOfLines={1}>
                      {insights[0].snippet}
                    </Text>
                  )}
                </View>
                <View style={styles.previewBadges}>
                  {insights[0].hasTrack && (
                    <View style={styles.trackBadge}>
                      <MaterialCommunityIcons name="map-marker-path" size={10} color={IOS_COLORS.green} />
                    </View>
                  )}
                  {insights[0].hasNotes && (
                    <View style={styles.notesBadge}>
                      <MaterialCommunityIcons name="note-text" size={10} color={IOS_COLORS.blue} />
                    </View>
                  )}
                </View>
              </View>
              {totalCount > 1 && (
                <Text style={styles.morePreview}>+{totalCount - 1} more</Text>
              )}
            </View>
          )}

          {/* Expanded: Full list */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightRow}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{insight.sailorName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.insightContent}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.sailorName}>{insight.sailorName}</Text>
                      <View style={styles.badges}>
                        {insight.hasTrack && (
                          <View style={styles.trackBadge}>
                            <MaterialCommunityIcons name="map-marker-path" size={10} color={IOS_COLORS.green} />
                          </View>
                        )}
                        {insight.hasNotes && (
                          <View style={styles.notesBadge}>
                            <MaterialCommunityIcons name="note-text" size={10} color={IOS_COLORS.blue} />
                          </View>
                        )}
                      </View>
                    </View>
                    {insight.snippet && (
                      <Text style={styles.snippetText}>{insight.snippet}</Text>
                    )}
                  </View>
                </View>
              ))}

              {totalCount > 5 && (
                <Text style={styles.moreText}>+{totalCount - 5} more sailors</Text>
              )}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="account-group-outline" size={32} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyTitle}>No Fleet Insights</Text>
          <Text style={styles.emptySubtext}>Be the first to share your race experience</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconActive: {
    backgroundColor: `${IOS_COLORS.cyan}15`,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: IOS_COLORS.cyan,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.systemBackground,
  },
  loadingContent: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  // Collapsed content
  collapsedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewContent: {
    flex: 1,
    gap: 2,
  },
  sailorNamePreview: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  snippetPreview: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  previewBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  morePreview: {
    fontSize: 12,
    color: IOS_COLORS.blue,
    fontWeight: '500',
    textAlign: 'right',
  },

  // Expanded content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 12,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    padding: 10,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.gray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  insightContent: {
    flex: 1,
    gap: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sailorName: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  trackBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${IOS_COLORS.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snippetText: {
    fontSize: 13,
    lineHeight: 18,
    color: IOS_COLORS.secondaryLabel,
  },
  moreText: {
    fontSize: 13,
    color: IOS_COLORS.blue,
    fontWeight: '500',
    textAlign: 'center',
    paddingTop: 4,
  },

  // Empty state
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
});
