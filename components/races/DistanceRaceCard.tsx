/**
 * DistanceRaceCard Component
 * Card for distance/offshore racing with route preview and distance-specific info
 * Different layout from fleet racing cards - focuses on route, waypoints, and time limits
 * 
 * Visual Differentiation:
 * - Purple/violet color scheme (vs blue for fleet racing)
 * - Gradient background with nautical wave pattern
 * - Route visualization showing journey
 * - Different countdown layout emphasizing duration
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Wind, 
  Flag, 
  Anchor,
  Route,
  Timer,
  PlayCircle,
  ChevronRight,
  Radio,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import { calculateCountdown } from '@/constants/mockData';
import type { RouteWaypoint } from './DistanceRouteMap';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface DistanceRaceCardProps {
  id: string;
  name: string;
  date: string; // ISO date
  startTime: string;
  
  // Distance race specific
  startVenue: string;
  finishVenue?: string; // May differ from start
  totalDistanceNm?: number;
  timeLimitHours?: number;
  routeWaypoints?: RouteWaypoint[];
  courseName?: string | null; // Selected course name
  
  // Weather (at start location)
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;
  
  // Communications
  vhf_channel?: string | null;
  
  // UI state
  isPrimary?: boolean;
  raceStatus?: 'past' | 'next' | 'future';
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  isDimmed?: boolean;
}

export function DistanceRaceCard({
  id,
  name,
  date,
  startTime,
  startVenue,
  finishVenue,
  totalDistanceNm,
  timeLimitHours,
  routeWaypoints = [],
  courseName,
  wind,
  vhf_channel,
  isPrimary = false,
  raceStatus = 'future',
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onHide,
  isDimmed = false,
}: DistanceRaceCardProps) {
  const router = useRouter();
  
  // Determine if it's a circumnavigation (same start/finish) or point-to-point
  const isSameStartFinish = !finishVenue || finishVenue === startVenue;
  
  // Count waypoints (handle null/undefined)
  const waypointCount = (routeWaypoints || []).filter(w => w.type === 'waypoint' || w.type === 'gate').length;
  
  // Format date
  const formattedDate = useMemo(() => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return date;
    }
  }, [date]);
  
  // Calculate countdown
  const countdown = useMemo(() => {
    return calculateCountdown(date, startTime);
  }, [date, startTime]);
  
  // Format time limit
  const formattedTimeLimit = useMemo(() => {
    if (!timeLimitHours) return null;
    if (timeLimitHours < 24) {
      return `${timeLimitHours}h`;
    }
    const days = Math.floor(timeLimitHours / 24);
    const hours = timeLimitHours % 24;
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }, [timeLimitHours]);
  
  // Menu items
  const menuItems = useMemo<CardMenuItem[]>(() => {
    const items: CardMenuItem[] = [];
    if (onEdit) {
      items.push({
        label: 'Edit Race',
        icon: 'create-outline',
        onPress: onEdit,
      });
    }
    if (onHide) {
      items.push({
        label: 'Hide from Timeline',
        icon: 'eye-off-outline',
        onPress: onHide,
      });
    }
    if (onDelete) {
      items.push({
        label: 'Delete Race',
        icon: 'trash-outline',
        onPress: onDelete,
        variant: 'destructive',
      });
    }
    return items;
  }, [onEdit, onDelete, onHide]);
  
  const handlePress = () => {
    if (onSelect) {
      onSelect();
    } else {
      router.push(`/(tabs)/race/scrollable/${id}` as any);
    }
  };
  
  // Card dimensions matching fleet RaceCard exactly
  const cardWidth = 240;
  const cardHeight = 400; // Match fleet RaceCard height for alignment
  
  return (
    <View style={[
      styles.cardWrapper,
      isDimmed && styles.cardDimmed,
    ]}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
            opacity: pressed ? 0.9 : 1,
          },
          isPrimary && styles.cardPrimary,
          isSelected && styles.cardSelected,
        ]}
        onPress={handlePress}
      >
        {/* Gradient Background for Distance Racing */}
        <LinearGradient
          colors={
            isSelected 
              ? ['#EDE9FE', '#DDD6FE', '#C4B5FD']
              : isPrimary 
                ? ['#F5F3FF', '#EDE9FE', '#E9D5FF']
                : ['#FAFAFA', '#F5F3FF', '#EDE9FE']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        
        {/* Decorative Route Pattern */}
        <View style={styles.decorativePattern}>
          <View style={[styles.decorativeLine, styles.decorativeLine1]} />
          <View style={[styles.decorativeLine, styles.decorativeLine2]} />
          <View style={[styles.decorativeLine, styles.decorativeLine3]} />
        </View>
        
        {/* Menu in upper right corner */}
        {menuItems.length > 0 && (
          <View style={styles.menuContainer}>
            <CardMenu items={menuItems} />
          </View>
        )}
        
        {/* Card Content Wrapper for consistent flex layout */}
        <View style={styles.cardContent}>
          {/* Header with Badges */}
          <View style={styles.header}>
            {/* Distance Race Badge */}
            <View style={styles.distanceBadge}>
              <Navigation size={10} color="#7C3AED" />
              <Text style={styles.distanceBadgeText}>DISTANCE</Text>
            </View>
            
            {raceStatus === 'next' && (
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>⚡ NEXT</Text>
              </View>
            )}
            {raceStatus === 'past' && (
              <View style={styles.pastBadge}>
                <Text style={styles.pastBadgeText}>✓ COMPLETED</Text>
              </View>
            )}
          </View>
          
          {/* Race Name - Uniform styling with fleet card */}
          <Text style={styles.raceName} numberOfLines={2}>
            {name}
          </Text>
          
          {/* Venue row */}
          <View style={styles.venueRow}>
            <MapPin size={12} color="#64748B" />
            <Text style={styles.venueText}>{startVenue}</Text>
          </View>
          
          {/* Course Name - show if selected */}
          {courseName && (
            <View style={styles.courseRow}>
              <Route size={12} color="#7C3AED" />
              <Text style={styles.courseText}>{courseName}</Text>
            </View>
          )}
        
          {/* Countdown Section - Right after name/venue to match Fleet card */}
          {raceStatus !== 'past' ? (
            <View style={styles.countdownSection}>
              <View style={styles.countdownRow}>
                {countdown.days > 0 && (
                  <>
                    <Text style={styles.countdownNumber}>{countdown.days}</Text>
                    <Text style={styles.countdownUnit}>{countdown.days === 1 ? 'day' : 'days'}</Text>
                  </>
                )}
                <Text style={styles.countdownNumber}>{countdown.hours}</Text>
                <Text style={styles.countdownUnit}>h</Text>
                <Text style={styles.countdownNumber}>{String(countdown.minutes).padStart(2, '0')}</Text>
                <Text style={styles.countdownUnit}>m</Text>
              </View>
              <View style={styles.startPrompt}>
                <PlayCircle size={14} color="#C4B5FD" />
                <Text style={styles.startPromptText}>Tap when ready to start</Text>
              </View>
            </View>
          ) : (
            <View style={styles.completedSection}>
              <Text style={styles.completedLabel}>RACE COMPLETED</Text>
              <Text style={styles.completedDate}>
                {new Date(date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
          )}
          
          {/* Route Visualization - Below timer */}
          <View style={styles.routeVisualization}>
            {/* Start Point */}
            <View style={styles.routePoint}>
              <View style={styles.routePointDotStart}>
                <Flag size={8} color="#FFFFFF" />
              </View>
              <View style={styles.routePointInfo}>
                <Text style={styles.routePointLabel}>START</Text>
                <Text style={styles.routePointVenue} numberOfLines={1}>{startVenue}</Text>
              </View>
            </View>
            
            {/* Connecting Line with Waypoints */}
            <View style={styles.routeLine}>
              <View style={styles.routeLineInner} />
              {waypointCount > 0 && (
                <View style={styles.waypointIndicators}>
                  {Array.from({ length: Math.min(waypointCount, 3) }).map((_, i) => (
                    <View key={i} style={styles.waypointDot} />
                  ))}
                  {waypointCount > 3 && (
                    <Text style={styles.moreWaypoints}>+{waypointCount - 3}</Text>
                  )}
                </View>
              )}
            </View>
            
            {/* Finish Point */}
            <View style={styles.routePoint}>
              <View style={styles.routePointDotFinish}>
                <Anchor size={8} color="#FFFFFF" />
              </View>
              <View style={styles.routePointInfo}>
                <Text style={styles.routePointLabel}>FINISH</Text>
                <Text style={styles.routePointVenue} numberOfLines={1}>
                  {isSameStartFinish ? startVenue : finishVenue}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Stats Grid - Distance Specific (compact) */}
          <View style={styles.statsGrid}>
            {/* Distance */}
            <View style={styles.statBox}>
              <Route size={14} color="#7C3AED" />
              <Text style={styles.statValue}>
                {totalDistanceNm ? `${totalDistanceNm}nm` : '—'}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            
            {/* Waypoints */}
            <View style={styles.statBox}>
              <Navigation size={14} color="#9333EA" />
              <Text style={styles.statValue}>
                {waypointCount > 0 ? waypointCount : '—'}
              </Text>
              <Text style={styles.statLabel}>Waypoints</Text>
            </View>
            
            {/* Time Limit */}
            <View style={styles.statBox}>
              <Timer size={14} color="#A855F7" />
              <Text style={styles.statValue}>
                {formattedTimeLimit || '—'}
              </Text>
              <Text style={styles.statLabel}>Limit</Text>
            </View>
          </View>
        
          {/* Weather Footer - Pushed to bottom */}
          {wind && (
            <View style={styles.weatherFooter}>
              <Wind size={12} color="#64748B" />
              <Text style={styles.weatherText}>
                {wind.direction} {wind.speedMin}-{wind.speedMax}kts
              </Text>
            </View>
          )}
          
          {/* VHF Channel */}
          {vhf_channel && (
            <View style={styles.vhfFooter}>
              <Radio size={12} color="#8B5CF6" />
              <Text style={styles.vhfText}>Ch {vhf_channel}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 6,
    marginVertical: 6,
  },
  cardDimmed: {
    opacity: 0.45,
  },
  card: {
    borderRadius: 16, // Match fleet RaceCard
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    padding: 12, // Match fleet RaceCard padding
  },
  menuContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
  },
  cardPrimary: {
    borderWidth: 2,
    borderColor: '#7C3AED',
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  cardSelected: {
    borderWidth: 2.5,
    borderColor: '#7C3AED',
    transform: [{ translateY: -4 }, { scale: 1.02 }],
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativePattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    overflow: 'hidden',
    opacity: 0.1,
  },
  decorativeLine: {
    position: 'absolute',
    width: 150,
    height: 2,
    backgroundColor: '#7C3AED',
    borderRadius: 1,
  },
  decorativeLine1: {
    top: 20,
    right: -30,
    transform: [{ rotate: '-45deg' }],
  },
  decorativeLine2: {
    top: 40,
    right: -30,
    transform: [{ rotate: '-45deg' }],
  },
  decorativeLine3: {
    top: 60,
    right: -30,
    transform: [{ rotate: '-45deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingRight: 30, // Space for menu
    flexWrap: 'wrap',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  distanceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  nextBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nextBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  pastBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pastBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  raceName: {
    fontSize: 13, // Match fleet RaceCard
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 4,
    lineHeight: 17,
    paddingRight: 30, // Space for menu
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  venueText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  courseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  routeVisualization: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
    marginBottom: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routePointDotStart: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  routePointDotFinish: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  routePointInfo: {
    flex: 1,
  },
  routePointLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  routePointVenue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  routeLine: {
    marginLeft: 12,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#A855F7',
    borderStyle: 'dashed',
    minHeight: 18,
    justifyContent: 'center',
    marginVertical: 2,
  },
  routeLineInner: {
    position: 'absolute',
    left: -6,
    top: '50%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A855F7',
    opacity: 0.3,
  },
  waypointIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
  },
  waypointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A855F7',
  },
  moreWaypoints: {
    fontSize: 9,
    fontWeight: '600',
    color: '#7C3AED',
    marginLeft: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E1B4B',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  countdownSection: {
    backgroundColor: '#5B21B6', // Purple variant matching fleet's bg-gray-700 / bg-sky-600
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 6,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'baseline', // Align numbers with unit text
    gap: 2, // Tighter gap like RaceTimer
    marginBottom: 4,
  },
  countdownNumber: {
    fontSize: 20, // Match RaceTimer text-xl
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    marginRight: 1,
  },
  countdownUnit: {
    fontSize: 12, // Match RaceTimer text-xs
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)', // Match RaceTimer text-white/80
    marginRight: 8, // Space between units
  },
  startPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startPromptText: {
    fontSize: 12, // Match RaceTimer text-xs
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)', // Match RaceTimer text-white/70
  },
  completedSection: {
    backgroundColor: '#F1F5F9', // Match fleet card pastCountdownSection
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  completedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  completedDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  weatherFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 'auto', // Push to bottom
    paddingTop: 6,
  },
  weatherText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  vhfFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  vhfText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});

export default DistanceRaceCard;
