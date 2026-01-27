/**
 * TimelineScreen Component
 *
 * Displays a single user's race timeline with:
 * - User header (avatar, name, follow button)
 * - Horizontal scrolling race cards
 * - Empty state for users with no races
 *
 * Part of the social sailing multi-timeline navigation.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { UserPlus, UserCheck, Sailboat, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { RaceCard } from './RaceCard';
import { RaceShareActions } from './RaceShareActions';
import { TimelineTimeAxis, TimeAxisRace } from './TimelineTimeAxis';
import { SharedRaceContentView } from '@/components/discover/SharedRaceContentView';
import { useIsFollowing, TimelineUser } from '@/hooks/useFollowedTimelines';
import { TUFTE_BACKGROUND } from '@/components/cards';
import { IOS_COLORS } from '@/components/cards/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Card dimensions - matching existing races screen
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 375);
const CARD_GAP = 16;
const CENTERING_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

interface TimelineScreenProps {
  /** User info for header */
  user: TimelineUser;
  /** User's races (enriched) */
  races: any[];
  /** Whether this timeline is currently active (visible) */
  isActive: boolean;
  /** Callback when a race card is selected */
  onSelectRace?: (raceId: string) => void;
  /** Currently selected race ID */
  selectedRaceId?: string | null;
  /** Callback when scroll position changes (for parent sync) */
  onScrollChange?: (x: number) => void;
  /** Current user ID for edit/delete permissions */
  currentUserId?: string;
  /** Callback to edit a race */
  onEditRace?: (raceId: string) => void;
  /** Callback to delete a race */
  onDeleteRace?: (raceId: string) => void;
  /** Card height override */
  cardHeight?: number;
  /** Callback when a race is copied to timeline */
  onRaceCopied?: (newRaceId: string) => void;
  /** Callback when "Start Planning" is pressed - copies race and navigates */
  onStartPlanning?: (newRaceId: string) => void;
}

export function TimelineScreen({
  user,
  races,
  isActive,
  onSelectRace,
  selectedRaceId,
  onScrollChange,
  currentUserId,
  onEditRace,
  onDeleteRace,
  cardHeight = 480,
  onRaceCopied,
  onStartPlanning,
}: TimelineScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
  const { isFollowing, isLoading: followLoading, toggleFollow } = useIsFollowing(
    user.isCurrentUser ? null : user.id
  );

  // Get race status helper
  const getRaceStatus = useCallback((date: string, startTime?: string): 'past' | 'next' | 'future' => {
    const raceDate = new Date(date);
    const now = new Date();

    // Check if race is in the past
    const raceEndEstimate = new Date(raceDate);
    raceEndEstimate.setHours(raceEndEstimate.getHours() + 4); // Assume 4 hour race duration

    if (raceEndEstimate < now) {
      return 'past';
    }

    // Check if this is the next upcoming race (within 24 hours)
    const hoursUntil = (raceDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil <= 24 && hoursUntil > -4) {
      return 'next';
    }

    return 'future';
  }, []);

  // Find the next race index
  const nextRaceIndex = useMemo(() => {
    return races.findIndex((race) => {
      const status = getRaceStatus(race.start_date || race.date, race.startTime);
      return status === 'next' || status === 'future';
    });
  }, [races, getRaceStatus]);

  // Handle scroll events
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = event.nativeEvent.contentOffset.x;
      onScrollChange?.(x);

      // Track current race index from scroll position
      const newIndex = Math.round(x / SNAP_INTERVAL);
      if (newIndex !== currentRaceIndex && newIndex >= 0 && newIndex < races.length) {
        setCurrentRaceIndex(newIndex);
      }
    },
    [onScrollChange, currentRaceIndex, races.length]
  );

  // Convert races to TimeAxisRace format for the Tufte time axis
  const timeAxisRaces: TimeAxisRace[] = useMemo(() => {
    return races.map((race) => ({
      id: race.id,
      date: race.start_date || race.date,
      raceType: race.race_type || 'fleet',
      seriesName: race.series_name || race.metadata?.series_name,
      name: race.name,
    }));
  }, [races]);

  // Handle time axis race selection
  const handleTimeAxisSelect = useCallback((index: number) => {
    setCurrentRaceIndex(index);
    const race = races[index];
    if (race && onSelectRace) {
      onSelectRace(race.id);
    }
  }, [races, onSelectRace]);

  // Scroll to specific race index
  const scrollToIndex = useCallback((index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * SNAP_INTERVAL,
        animated: true,
      });
    }
  }, []);

  // Scroll left/right arrows
  const handleScrollLeft = useCallback(() => {
    if (scrollViewRef.current) {
      const currentIndex = Math.round(0 / SNAP_INTERVAL); // Would need state for actual position
      scrollToIndex(Math.max(0, currentIndex - 1));
    }
  }, [scrollToIndex]);

  const handleScrollRight = useCallback(() => {
    if (scrollViewRef.current) {
      const currentIndex = Math.round(0 / SNAP_INTERVAL);
      scrollToIndex(Math.min(races.length - 1, currentIndex + 1));
    }
  }, [scrollToIndex, races.length]);

  return (
    <View style={styles.container}>
      {/* Timeline Header */}
      <View style={styles.header}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: user.avatar.color || '#3B82F6' },
          ]}
        >
          <Text style={styles.avatarEmoji}>{user.avatar.emoji || '⛵'}</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.isCurrentUser ? 'My Timeline' : user.name}
          </Text>
          <Text style={styles.raceCount}>
            {races.length} {races.length === 1 ? 'race' : 'races'}
          </Text>
        </View>

        {/* Follow Button (only for other users) */}
        {!user.isCurrentUser && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followButtonActive,
            ]}
            onPress={toggleFollow}
            disabled={followLoading}
          >
            {isFollowing ? (
              <>
                <UserCheck size={16} color="#10B981" />
                <Text style={[styles.followButtonText, styles.followingText]}>
                  Following
                </Text>
              </>
            ) : (
              <>
                <UserPlus size={16} color="#3B82F6" />
                <Text style={styles.followButtonText}>Follow</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Race Cards */}
      {races.length > 0 ? (
        <View style={styles.cardsContainer}>
          {/* Scroll Arrows (web only) */}
          {Platform.OS === 'web' && races.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.scrollArrow, styles.scrollArrowLeft]}
                onPress={handleScrollLeft}
              >
                <ChevronLeft size={24} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scrollArrow, styles.scrollArrowRight]}
                onPress={handleScrollRight}
              >
                <ChevronRight size={24} color="#64748B" />
              </TouchableOpacity>
            </>
          )}

          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled={false}
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: CENTERING_PADDING },
            ]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {races.map((race, index) => {
              const raceStatus = getRaceStatus(
                race.start_date || race.date,
                race.startTime
              );
              const isSelected = race.id === selectedRaceId;
              const canEdit = race.created_by === currentUserId;

              const isOtherUserTimeline = !user.isCurrentUser;

              return (
                <View
                  key={race.id}
                  style={[
                    styles.cardWrapper,
                    index < races.length - 1 && { marginRight: CARD_GAP },
                  ]}
                >
                  <RaceCard
                    id={race.id}
                    name={race.name}
                    venue={race.venue || race.metadata?.venue_name || 'Venue TBD'}
                    date={race.start_date || race.date}
                    startTime={race.startTime || race.warning_signal_time || '10:00'}
                    wind={race.wind}
                    tide={race.tide}
                    weatherStatus={race.weatherStatus}
                    critical_details={race.critical_details}
                    vhf_channel={race.vhf_channel}
                    raceStatus={raceStatus}
                    isSelected={isSelected}
                    onSelect={() => onSelectRace?.(race.id)}
                    onEdit={canEdit && onEditRace ? () => onEditRace(race.id) : undefined}
                    onDelete={canEdit && onDeleteRace ? () => onDeleteRace(race.id) : undefined}
                    venueCoordinates={race.venueCoordinates}
                    cardWidth={CARD_WIDTH}
                    cardHeight={isOtherUserTimeline ? cardHeight - 60 : cardHeight}
                    raceType={race.race_type || 'fleet'}
                    isPrimary={raceStatus === 'next'}
                    showTimelineIndicator={index === nextRaceIndex}
                  />
                  {/* Share actions for other users' races */}
                  {isOtherUserTimeline && (
                    <>
                      <RaceShareActions
                        raceId={race.id}
                        raceName={race.name}
                        raceOwnerId={race.created_by || race.user_id}
                        onRaceCopied={onRaceCopied}
                        onStartPlanning={onStartPlanning}
                        compact
                      />
                      {/* Shared content display */}
                      <SharedRaceContentView
                        race={race}
                        sailorName={user.name}
                      />
                    </>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Tufte-inspired Time Axis Navigation */}
          {races.length > 1 && (
            <TimelineTimeAxis
              races={timeAxisRaces}
              currentIndex={currentRaceIndex}
              onSelectRace={handleTimeAxisSelect}
              nextRaceIndex={nextRaceIndex !== -1 ? nextRaceIndex : undefined}
              scrollViewRef={scrollViewRef}
              snapInterval={SNAP_INTERVAL}
            />
          )}
        </View>
      ) : (
        /* Empty State */
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Sailboat size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>
            {user.isCurrentUser
              ? 'No races yet'
              : `${user.name} hasn't added any races`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {user.isCurrentUser
              ? 'Add your first race to get started'
              : 'Check back later for updates'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  raceCount: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  followButtonActive: {
    backgroundColor: '#ECFDF5',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  followingText: {
    color: '#10B981',
  },
  cardsContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingVertical: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  scrollArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  scrollArrowLeft: {
    left: 8,
  },
  scrollArrowRight: {
    right: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default TimelineScreen;
