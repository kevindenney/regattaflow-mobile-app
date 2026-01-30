/**
 * BoatsSection - List of user's boats (gear)
 *
 * Similar to Strava's gear section, shows boats with class,
 * sail number, race count, and wins.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { UserBoat } from '@/hooks/useReflectProfile';

interface BoatsSectionProps {
  boats: UserBoat[];
  onAddBoat?: () => void;
  onSeeMore?: () => void;
}

function BoatRow({
  boat,
  onPress,
}: {
  boat: UserBoat;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.boatRow,
        pressed && styles.boatRowPressed,
      ]}
      onPress={onPress}
    >
      {/* Icon */}
      <View style={[
        styles.boatIcon,
        boat.isPrimary && styles.boatIconPrimary,
      ]}>
        <Ionicons
          name="boat"
          size={18}
          color={boat.isPrimary ? IOS_COLORS.systemOrange : IOS_COLORS.systemBlue}
        />
      </View>

      {/* Content */}
      <View style={styles.boatContent}>
        <View style={styles.boatNameRow}>
          <Text style={styles.boatName} numberOfLines={1}>
            {boat.name || boat.className}
          </Text>
          {boat.isPrimary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryText}>Primary</Text>
            </View>
          )}
        </View>
        <View style={styles.boatDetails}>
          {boat.name && (
            <>
              <Text style={styles.boatClass}>{boat.className}</Text>
              <Text style={styles.boatDot}>·</Text>
            </>
          )}
          {boat.sailNumber && (
            <Text style={styles.boatSailNumber}>{boat.sailNumber}</Text>
          )}
        </View>
      </View>

      {/* Stats & Arrow */}
      <View style={styles.boatStats}>
        <View style={styles.boatStatColumn}>
          <Text style={styles.boatStatValue}>{boat.raceCount}</Text>
          <Text style={styles.boatStatLabel}>races</Text>
        </View>
        {boat.winCount > 0 && (
          <View style={styles.boatStatColumn}>
            <Text style={[styles.boatStatValue, styles.boatWins]}>
              {boat.winCount}
            </Text>
            <Text style={styles.boatStatLabel}>wins</Text>
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={IOS_COLORS.tertiaryLabel}
        />
      </View>
    </Pressable>
  );
}

export function BoatsSection({
  boats,
  onAddBoat,
  onSeeMore,
}: BoatsSectionProps) {
  const handleBoatPress = (boat: UserBoat) => {
    router.push(`/(tabs)/boat/edit/${boat.id}`);
  };

  if (boats.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Boats</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="boat-outline"
            size={32}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No boats yet</Text>
          <Text style={styles.emptySubtext}>
            Add your boats to track your racing
          </Text>
          {onAddBoat && (
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
              onPress={onAddBoat}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color={IOS_COLORS.systemBlue}
              />
              <Text style={styles.addButtonText}>Add Boat</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Boats</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{boats.length}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {onAddBoat && (
            <Pressable
              onPress={onAddBoat}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <Ionicons
                name="add"
                size={20}
                color={IOS_COLORS.systemBlue}
              />
            </Pressable>
          )}
          {onSeeMore && boats.length > 3 && (
            <Pressable
              onPress={onSeeMore}
              style={({ pressed }) => [
                styles.seeMoreButton,
                pressed && styles.seeMoreButtonPressed,
              ]}
            >
              <Text style={styles.seeMoreText}>See All</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={IOS_COLORS.systemBlue}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Boat List */}
      <View style={styles.boatList}>
        {boats.slice(0, 3).map((boat, index) => (
          <React.Fragment key={boat.id}>
            <BoatRow boat={boat} onPress={() => handleBoatPress(boat)} />
            {index < Math.min(boats.length, 3) - 1 && (
              <View style={styles.separator} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Show More Indicator */}
      {boats.length > 3 && !onSeeMore && (
        <Text style={styles.moreIndicator}>
          +{boats.length - 3} more boats
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...IOS_SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  countBadge: {
    backgroundColor: IOS_COLORS.systemGray5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeMoreButtonPressed: {
    opacity: 0.6,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  boatList: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    overflow: 'hidden',
  },
  boatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  boatRowPressed: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  boatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  boatIconPrimary: {
    backgroundColor: IOS_COLORS.systemOrange + '15',
  },
  boatContent: {
    flex: 1,
    marginRight: 8,
  },
  boatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  boatName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
    maxWidth: 140,
  },
  primaryBadge: {
    backgroundColor: IOS_COLORS.systemOrange + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.systemOrange,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  boatDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boatClass: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  boatDot: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    marginHorizontal: 4,
  },
  boatSailNumber: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
  },
  boatStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boatStatColumn: {
    alignItems: 'center',
    minWidth: 32,
  },
  boatStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  boatWins: {
    color: IOS_COLORS.systemYellow,
  },
  boatStatLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
    textTransform: 'uppercase',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 60,
  },
  moreIndicator: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    borderRadius: 20,
    marginTop: 8,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
});

export default BoatsSection;
