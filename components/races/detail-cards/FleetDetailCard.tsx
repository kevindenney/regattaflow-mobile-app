/**
 * Fleet Detail Card
 *
 * Apple Human Interface Guidelines (HIG) compliant design:
 * - iOS system colors from shared constants
 * - Expandable card showing fleet/competitor information
 * - Collapsed: Header + total entries + registration status
 * - Expanded: Full competitor list, detailed stats
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { CARD_EXPAND_DURATION, CARD_COLLAPSE_DURATION } from '@/constants/navigationAnimations';
import { IOS_COLORS } from '@/components/cards/constants';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Competitor {
  id: string;
  name: string;
  boatName?: string;
  sailNumber?: string;
  status: 'confirmed' | 'registered' | 'tentative';
}

interface FleetDetailCardProps {
  raceId: string;
  totalCompetitors?: number;
  confirmedCount?: number;
  competitors?: Competitor[];
  fleetName?: string;
  isRegistered?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  onRegister?: () => void;
}

export function FleetDetailCard({
  raceId,
  totalCompetitors = 0,
  confirmedCount = 0,
  competitors,
  fleetName,
  isRegistered,
  isExpanded = false,
  onToggle,
  onPress,
  onRegister,
}: FleetDetailCardProps) {
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  // Update rotation when isExpanded changes
  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  // Animated chevron rotation
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` }],
  }));

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

  const getStatusIcon = (status: Competitor['status']) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'registered': return 'time-outline';
      case 'tentative': return 'help-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  const getStatusColor = (status: Competitor['status']) => {
    switch (status) {
      case 'confirmed': return IOS_COLORS.green;
      case 'registered': return IOS_COLORS.orange;
      case 'tentative': return IOS_COLORS.gray;
      default: return IOS_COLORS.gray2;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header - Always visible */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="sail-boat" size={18} color={IOS_COLORS.indigo} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Fleet</Text>
          <Text style={styles.headerSubtitle}>
            {fleetName || 'Competitors & entries'}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{totalCompetitors}</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={IOS_COLORS.gray} />
        </Animated.View>
      </View>

      {/* Content */}
      <>
        {/* Collapsed: Key stats */}
        {!isExpanded && (
          <View style={styles.collapsedContent}>
            {/* Registration Status */}
            {isRegistered !== undefined && (
              <View style={[
                styles.registrationChip,
                isRegistered ? styles.registeredChip : styles.notRegisteredChip
              ]}>
                <Ionicons
                  name={isRegistered ? "checkmark-circle" : "add-circle"}
                  size={14}
                  color={isRegistered ? IOS_COLORS.green : IOS_COLORS.indigo}
                />
                <Text style={[
                  styles.registrationText,
                  isRegistered ? styles.registeredText : styles.notRegisteredText
                ]}>
                  {isRegistered ? 'Registered' : 'Not registered'}
                </Text>
              </View>
            )}

            <View style={styles.collapsedStats}>
              <View style={styles.statChip}>
                <Ionicons name="checkmark-circle" size={14} color={IOS_COLORS.green} />
                <Text style={styles.statValue}>{confirmedCount}</Text>
                <Text style={styles.statLabel}>confirmed</Text>
              </View>
            </View>
          </View>
        )}

        {/* Expanded: Full content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Registration Status */}
            {isRegistered !== undefined && (
              <View style={[
                styles.expandedRegistration,
                isRegistered ? styles.expandedRegistered : styles.expandedNotRegistered
              ]}>
                <Ionicons
                  name={isRegistered ? "checkmark-circle" : "add-circle"}
                  size={18}
                  color={isRegistered ? IOS_COLORS.green : IOS_COLORS.indigo}
                />
                <Text style={[
                  styles.expandedRegistrationText,
                  isRegistered ? styles.expandedRegisteredText : styles.expandedNotRegisteredText
                ]}>
                  {isRegistered ? 'You are registered' : 'You are not registered'}
                </Text>
                {!isRegistered && onRegister && (
                  <TouchableOpacity style={styles.registerButton} onPress={onRegister}>
                    <Text style={styles.registerButtonText}>Join</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.expandedStatValue}>{totalCompetitors}</Text>
                <Text style={styles.expandedStatLabel}>Total Entries</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.expandedStatValue}>{confirmedCount}</Text>
                <Text style={styles.expandedStatLabel}>Confirmed</Text>
              </View>
            </View>

            {/* Competitors List - Tufte style: sail number first, minimal status */}
            {competitors && competitors.length > 0 && (
              <View style={styles.competitorsSection}>
                <View style={styles.tufteCompetitorsList}>
                  {competitors.map((competitor) => (
                    <View key={competitor.id} style={styles.tufteCompetitorRow}>
                      <Text style={styles.tufteSailNumber}>
                        {competitor.sailNumber || '—'}
                      </Text>
                      <Text style={styles.tufteCompetitorName} numberOfLines={1}>
                        {competitor.name}
                      </Text>
                      <Text style={styles.tufteStatus}>
                        {competitor.status === 'confirmed' ? '✓' : '·'}
                      </Text>
                    </View>
                  ))}
                </View>
                {competitors.length < totalCompetitors && (
                  <Text style={styles.tufteMoreCount}>
                    ... {totalCompetitors - competitors.length} more
                  </Text>
                )}
              </View>
            )}

            {totalCompetitors === 0 && (
              <View style={styles.noCompetitors}>
                <MaterialCommunityIcons name="account-group-outline" size={24} color={IOS_COLORS.gray3} />
                <Text style={styles.noCompetitorsText}>No competitors registered yet</Text>
              </View>
            )}
          </View>
        )}
      </>
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
    backgroundColor: `${IOS_COLORS.indigo}15`,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: `${IOS_COLORS.indigo}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.indigo,
  },

  // Collapsed content
  collapsedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 10,
  },
  registrationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  registeredChip: {
    backgroundColor: `${IOS_COLORS.green}15`,
  },
  notRegisteredChip: {
    backgroundColor: `${IOS_COLORS.indigo}15`,
  },
  registrationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  registeredText: {
    color: IOS_COLORS.green,
  },
  notRegisteredText: {
    color: IOS_COLORS.indigo,
  },
  collapsedStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  statLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },

  // Expanded content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 16,
  },
  expandedRegistration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
  },
  expandedRegistered: {
    backgroundColor: `${IOS_COLORS.green}15`,
  },
  expandedNotRegistered: {
    backgroundColor: `${IOS_COLORS.indigo}15`,
  },
  expandedRegistrationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  expandedRegisteredText: {
    color: IOS_COLORS.green,
  },
  expandedNotRegisteredText: {
    color: IOS_COLORS.indigo,
  },
  registerButton: {
    backgroundColor: IOS_COLORS.indigo,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  registerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.systemBackground,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  expandedStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  expandedStatLabel: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  competitorsSection: {
    gap: 8,
  },
  // Tufte-style competitors list (no avatars, sail number first)
  tufteCompetitorsList: {
    gap: 4,
  },
  tufteCompetitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray6,
  },
  tufteSailNumber: {
    width: 60,
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
  tufteCompetitorName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteStatus: {
    width: 16,
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.green,
    textAlign: 'center',
  },
  tufteMoreCount: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 4,
  },
  noCompetitors: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  noCompetitorsText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },
});
