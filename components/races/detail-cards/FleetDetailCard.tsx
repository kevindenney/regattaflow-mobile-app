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
      {/* Header - Tufte typography-only */}
      <View style={styles.tufteHeader}>
        <Text style={styles.tufteHeaderTitle}>FLEET</Text>
        {fleetName && (
          <Text style={styles.tufteHeaderSubtitle}>{fleetName}</Text>
        )}
        {!fleetName && totalCompetitors > 0 && (
          <Text style={styles.tufteHeaderSubtitle}>{totalCompetitors} entries</Text>
        )}
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={IOS_COLORS.gray} />
        </Animated.View>
      </View>

      {/* Content */}
      <>
        {/* Collapsed: Tufte flat typography */}
        {!isExpanded && (
          <View style={styles.tufteCollapsedContent}>
            <Text style={styles.tufteCollapsedData}>
              {[
                totalCompetitors > 0 && `${totalCompetitors} entries`,
                confirmedCount > 0 && `${confirmedCount} confirmed`,
                isRegistered === true && 'You: ✓',
                isRegistered === false && 'Not registered',
              ].filter(Boolean).join(' · ')}
            </Text>
          </View>
        )}

        {/* Expanded: Tufte flat content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Registration Status - Tufte flat row */}
            {isRegistered !== undefined && (
              <View style={styles.tufteRegistrationRow}>
                <Text style={styles.tufteRegistrationLabel}>You</Text>
                <Text style={styles.tufteRegistrationValue}>
                  {isRegistered ? 'Registered ✓' : 'Not registered'}
                </Text>
                {!isRegistered && onRegister && (
                  <TouchableOpacity style={styles.tufteRegisterButton} onPress={onRegister}>
                    <Text style={styles.tufteRegisterButtonText}>Join →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Stats - Tufte summary line */}
            <Text style={styles.tufteSummary}>
              {totalCompetitors} entries · {confirmedCount} confirmed
            </Text>

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

  // ==========================================================================
  // TUFTE STYLES - Typography-only, flat design
  // ==========================================================================
  tufteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tufteHeaderTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tufteHeaderSubtitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tufteCollapsedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  tufteCollapsedData: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteRegistrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tufteRegistrationLabel: {
    width: 40,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteRegistrationValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tufteRegisterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tufteRegisterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  tufteSummary: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
  },
});
