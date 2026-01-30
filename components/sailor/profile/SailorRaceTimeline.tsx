/**
 * SailorRaceTimeline - Recent races list with timeline styling
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Sailboat, MapPin, Calendar, ChevronRight } from 'lucide-react-native';
import { useSailorRaceHistory } from '@/hooks/useSailorRaceHistory';
import type { SailorRaceSummary } from '@/services/SailorProfileService';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_LIST_INSETS,
  IOS_TOUCH,
  IOS_SHADOWS,
} from '@/lib/design-tokens-ios';

interface SailorRaceTimelineProps {
  userId: string;
  onRacePress: (raceId: string) => void;
}

export function SailorRaceTimeline({
  userId,
  onRacePress,
}: SailorRaceTimelineProps) {
  const { races, isLoading, hasMore, loadMore, isLoadingMore } =
    useSailorRaceHistory(userId);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Races</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
        </View>
      </View>
    );
  }

  if (races.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Races</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No races yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Races</Text>

      <View style={styles.listContainer}>
        {races.map((race, index) => (
          <Pressable
            key={race.id}
            style={({ pressed }) => [
              styles.raceRow,
              pressed && styles.raceRowPressed,
            ]}
            onPress={() => onRacePress(race.id)}
          >
            {/* Timeline indicator */}
            <View style={styles.timelineColumn}>
              <View
                style={[
                  styles.timelineDot,
                  race.isPast
                    ? styles.timelineDotPast
                    : styles.timelineDotUpcoming,
                ]}
              />
              {index < races.length - 1 && <View style={styles.timelineLine} />}
            </View>

            {/* Content */}
            <View style={styles.raceContent}>
              <Text style={styles.raceName} numberOfLines={1}>
                {race.name}
              </Text>

              <View style={styles.raceDetails}>
                <View style={styles.raceDetail}>
                  <Calendar size={12} color={IOS_COLORS.secondaryLabel} />
                  <Text style={styles.raceDetailText}>
                    {formatDate(race.startDate)}
                  </Text>
                </View>

                {race.venue && (
                  <View style={styles.raceDetail}>
                    <MapPin size={12} color={IOS_COLORS.secondaryLabel} />
                    <Text style={styles.raceDetailText} numberOfLines={1}>
                      {race.venue}
                    </Text>
                  </View>
                )}

                {race.boatClass && (
                  <View style={styles.raceDetail}>
                    <Sailboat size={12} color={IOS_COLORS.secondaryLabel} />
                    <Text style={styles.raceDetailText}>{race.boatClass}</Text>
                  </View>
                )}
              </View>

              {/* Result Badge */}
              {race.result && race.fleetSize && (
                <View style={styles.resultBadge}>
                  <Text style={styles.resultText}>
                    {race.result}/{race.fleetSize}
                  </Text>
                </View>
              )}
            </View>

            <ChevronRight size={16} color={IOS_COLORS.systemGray3} />

            {/* Separator */}
            {index < races.length - 1 && <View style={styles.separator} />}
          </Pressable>
        ))}

        {/* Load More */}
        {hasMore && (
          <Pressable
            style={({ pressed }) => [
              styles.loadMoreButton,
              pressed && styles.loadMoreButtonPressed,
            ]}
            onPress={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
            ) : (
              <Text style={styles.loadMoreText}>Show More</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: IOS_LIST_INSETS.insetGrouped.marginHorizontal,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.lg,
    ...IOS_SHADOWS.sm,
  },
  title: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.md,
  },
  listContainer: {},
  loadingContainer: {
    padding: IOS_SPACING.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: IOS_SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.secondaryLabel,
  },
  raceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: IOS_SPACING.md,
    minHeight: IOS_TOUCH.listItemHeight,
  },
  raceRowPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
    marginHorizontal: -IOS_SPACING.lg,
    paddingHorizontal: IOS_SPACING.lg,
  },
  timelineColumn: {
    width: 20,
    alignItems: 'center',
    marginRight: IOS_SPACING.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineDotUpcoming: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  timelineDotPast: {
    backgroundColor: IOS_COLORS.systemGray3,
  },
  timelineLine: {
    position: 'absolute',
    top: 18,
    bottom: -IOS_SPACING.md,
    width: 2,
    backgroundColor: IOS_COLORS.separator,
  },
  raceContent: {
    flex: 1,
    marginRight: IOS_SPACING.sm,
  },
  raceName: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  raceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: IOS_SPACING.md,
  },
  raceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  raceDetailText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  resultBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: IOS_COLORS.systemGreen + '20',
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 2,
    borderRadius: IOS_RADIUS.xs,
  },
  resultText: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: IOS_COLORS.systemGreen,
  },
  separator: {
    position: 'absolute',
    left: 32,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    marginTop: IOS_SPACING.sm,
  },
  loadMoreButtonPressed: {
    opacity: 0.7,
  },
  loadMoreText: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
});
