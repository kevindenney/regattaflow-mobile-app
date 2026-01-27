/**
 * IOSCheckInDashboard - iOS HIG Check-In Screen
 *
 * Check-in dashboard with:
 * - Large progress ring at top (percentage)
 * - Grid of sail numbers (tap to toggle)
 * - Status color coding (green = ready, gray = pending)
 * - Primary "Scan QR" button at bottom
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// Types
interface Participant {
  id: string;
  sailNumber: string;
  boatName?: string;
  helmName: string;
  isCheckedIn: boolean;
  checkInTime?: Date;
}

interface IOSCheckInDashboardProps {
  eventName: string;
  raceName?: string;
  participants: Participant[];
  onToggleCheckIn?: (participantId: string) => void;
  onScanQR?: () => void;
  onParticipantPress?: (participant: Participant) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Progress Ring Component
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  checkedIn: number;
  total: number;
}

function ProgressRing({ progress, size = 160, strokeWidth = 12, checkedIn, total }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={IOS_COLORS.systemGray5}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={IOS_COLORS.systemGreen}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.progressRingContent}>
        <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        <Text style={styles.progressLabel}>
          {checkedIn} of {total}
        </Text>
      </View>
    </View>
  );
}

// Sail Number Card
interface SailCardProps {
  participant: Participant;
  onToggle: () => void;
  onLongPress: () => void;
}

function SailCard({ participant, onToggle, onLongPress }: SailCardProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    triggerHaptic(participant.isCheckedIn ? 'impactLight' : 'notificationSuccess');
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.sailCard,
        participant.isCheckedIn && styles.sailCardCheckedIn,
        animatedStyle,
      ]}
      onPress={handlePress}
      onLongPress={() => {
        triggerHaptic('impactMedium');
        onLongPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.93, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${participant.sailNumber}, ${participant.isCheckedIn ? 'checked in' : 'pending'}`}
      accessibilityState={{ selected: participant.isCheckedIn }}
    >
      {/* Check Indicator */}
      {participant.isCheckedIn && (
        <View style={styles.checkIndicator}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      )}

      {/* Sail Number */}
      <Text
        style={[
          styles.sailCardNumber,
          participant.isCheckedIn && styles.sailCardNumberCheckedIn,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {participant.sailNumber}
      </Text>

      {/* Helm Name */}
      <Text
        style={[
          styles.sailCardName,
          participant.isCheckedIn && styles.sailCardNameCheckedIn,
        ]}
        numberOfLines={1}
      >
        {participant.helmName.split(' ')[0]}
      </Text>
    </AnimatedPressable>
  );
}

// Filter Chips
interface FilterChipProps {
  label: string;
  isActive: boolean;
  count: number;
  onPress: () => void;
}

function FilterChip({ label, isActive, count, onPress }: FilterChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.filterChip,
        isActive && styles.filterChipActive,
        animatedStyle,
      ]}
      onPress={() => {
        triggerHaptic('selection');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.95, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      <Text
        style={[
          styles.filterChipText,
          isActive && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.filterChipCount,
          isActive && styles.filterChipCountActive,
        ]}
      >
        {count}
      </Text>
    </AnimatedPressable>
  );
}

// Main Component
export function IOSCheckInDashboard({
  eventName,
  raceName,
  participants,
  onToggleCheckIn,
  onScanQR,
  onParticipantPress,
}: IOSCheckInDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const checkedInCount = participants.filter((p) => p.isCheckedIn).length;
  const pendingCount = participants.filter((p) => !p.isCheckedIn).length;
  const progress = participants.length > 0 ? (checkedInCount / participants.length) * 100 : 0;

  // Filter and search
  const filteredParticipants = participants.filter((p) => {
    // Apply status filter
    if (filter === 'checked_in' && !p.isCheckedIn) return false;
    if (filter === 'pending' && p.isCheckedIn) return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.sailNumber.toLowerCase().includes(query) ||
        p.helmName.toLowerCase().includes(query) ||
        p.boatName?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Sort: pending first, then by sail number
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    if (a.isCheckedIn !== b.isCheckedIn) {
      return a.isCheckedIn ? 1 : -1;
    }
    return a.sailNumber.localeCompare(b.sailNumber, undefined, { numeric: true });
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eventName}>{eventName}</Text>
        {raceName && <Text style={styles.raceName}>{raceName}</Text>}
      </View>

      {/* Progress Ring */}
      <View style={styles.progressSection}>
        <ProgressRing
          progress={progress}
          checkedIn={checkedInCount}
          total={participants.length}
        />
        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: IOS_COLORS.systemGreen }]} />
            <Text style={styles.statLabel}>Checked In</Text>
            <Text style={styles.statValue}>{checkedInCount}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: IOS_COLORS.systemGray3 }]} />
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{pendingCount}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={IOS_COLORS.secondaryLabel} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sail number or name..."
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

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <FilterChip
          label="All"
          isActive={filter === 'all'}
          count={participants.length}
          onPress={() => setFilter('all')}
        />
        <FilterChip
          label="Checked In"
          isActive={filter === 'checked_in'}
          count={checkedInCount}
          onPress={() => setFilter('checked_in')}
        />
        <FilterChip
          label="Pending"
          isActive={filter === 'pending'}
          count={pendingCount}
          onPress={() => setFilter('pending')}
        />
      </View>

      {/* Sail Number Grid */}
      <ScrollView
        style={styles.gridScrollView}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedParticipants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={IOS_COLORS.systemGray3} />
            <Text style={styles.emptyText}>No participants found</Text>
          </View>
        ) : (
          <View style={styles.sailGrid}>
            {sortedParticipants.map((participant) => (
              <SailCard
                key={participant.id}
                participant={participant}
                onToggle={() => onToggleCheckIn?.(participant.id)}
                onLongPress={() => onParticipantPress?.(participant)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Scan QR Button */}
      {onScanQR && (
        <View style={styles.bottomBar}>
          <Pressable
            style={styles.scanButton}
            onPress={() => {
              triggerHaptic('impactMedium');
              onScanQR();
            }}
          >
            <Ionicons name="qr-code" size={24} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },

  // Header
  header: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.sm,
  },
  eventName: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  raceName: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.xs,
  },

  // Progress Section
  progressSection: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.lg,
  },
  progressRingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  progressLabel: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.xs,
  },
  progressStats: {
    flexDirection: 'row',
    gap: IOS_SPACING.xxl,
    marginTop: IOS_SPACING.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statLabel: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
  statValue: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Search
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.sm,
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

  // Filter Chips
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
    gap: IOS_SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  filterChipActive: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  filterChipText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipCount: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  filterChipCountActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Grid
  gridScrollView: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.xxxl + 80,
  },
  sailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.sm,
  },
  sailCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: IOS_SPACING.xs,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  sailCardCheckedIn: {
    backgroundColor: `${IOS_COLORS.systemGreen}15`,
    borderColor: IOS_COLORS.systemGreen,
  },
  checkIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: IOS_COLORS.systemGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sailCardNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  sailCardNumberCheckedIn: {
    color: IOS_COLORS.systemGreen,
  },
  sailCardName: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
    textAlign: 'center',
  },
  sailCardNameCheckedIn: {
    color: IOS_COLORS.systemGreen,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xxxl,
  },
  emptyText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.md,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? IOS_SPACING.xl : IOS_SPACING.md,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: IOS_RADIUS.md,
    paddingVertical: IOS_SPACING.md,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
      },
      default: {
        shadowColor: IOS_COLORS.systemBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  scanButtonText: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default IOSCheckInDashboard;
