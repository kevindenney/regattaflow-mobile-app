/**
 * SocialTimelineView Component
 *
 * Displays the current user's race timeline with horizontal card scrolling.
 * Provides:
 * - Current user's enriched races displayed as scrollable cards
 * - Callbacks to parent for race selection, edit, delete
 *
 * Usage:
 * ```tsx
 * <SocialTimelineView
 *   myRaces={enrichedRaces}
 *   currentUserId={user?.id}
 *   onSelectRace={handleSelectRace}
 *   onEditRace={handleEditRace}
 *   onDeleteRace={handleDeleteRace}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TimelineScreen } from './TimelineScreen';
import { TimelineUser } from '@/hooks/useFollowedTimelines';
import { useAuth } from '@/providers/AuthProvider';
import { TUFTE_BACKGROUND } from '@/components/cards';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SocialTimelineViewProps {
  /** Current user's enriched races */
  myRaces: any[];
  /** Currently selected race ID */
  selectedRaceId?: string | null;
  /** Callback when a race is selected */
  onSelectRace?: (raceId: string) => void;
  /** Callback to edit a race */
  onEditRace?: (raceId: string) => void;
  /** Callback to delete a race */
  onDeleteRace?: (raceId: string) => void;
  /** Card height override */
  cardHeight?: number;
  /** Style override */
  style?: any;
}

export function SocialTimelineView({
  myRaces,
  selectedRaceId,
  onSelectRace,
  onEditRace,
  onDeleteRace,
  cardHeight,
  style,
}: SocialTimelineViewProps) {
  const { user, userProfile } = useAuth();
  const currentUserId = user?.id;

  // Build current user's timeline info
  const currentUserTimeline: TimelineUser = useMemo(() => {
    const userName = userProfile?.full_name || 'My Timeline';
    const sailorProfile = userProfile as any;

    return {
      id: currentUserId || '',
      name: userName,
      avatar: {
        emoji: sailorProfile?.avatar_emoji || '⛵',
        color: sailorProfile?.avatar_color || '#3B82F6',
      },
      isCurrentUser: true,
    };
  }, [currentUserId, userProfile]);

  // Calculate card height based on available space
  const calculatedCardHeight = useMemo(() => {
    if (cardHeight) return cardHeight;
    // Default: ~70% of screen height minus headers
    const headerHeight = 140;
    const padding = 32;
    return Math.floor(SCREEN_HEIGHT - headerHeight - padding);
  }, [cardHeight]);

  return (
    <View style={[styles.container, style]}>
      <TimelineScreen
        user={currentUserTimeline}
        races={myRaces}
        isActive={true}
        onSelectRace={onSelectRace}
        selectedRaceId={selectedRaceId}
        currentUserId={currentUserId}
        onEditRace={onEditRace}
        onDeleteRace={onDeleteRace}
        cardHeight={calculatedCardHeight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
});

export default SocialTimelineView;
