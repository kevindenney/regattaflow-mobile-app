/**
 * DistanceRaceCard Component
 * Card for distance/offshore racing with route preview and distance-specific info
 * Different layout from fleet racing cards - focuses on route, waypoints, and time limits
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Wind, 
  Flag, 
  Anchor,
  Route,
  Timer,
  Calendar
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { RaceTypeBadge } from './RaceTypeSelector';
import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Route waypoint structure
export interface RouteWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'waypoint' | 'gate' | 'finish';
  required: boolean;
  passingSide?: 'port' | 'starboard' | 'either';
}

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
  
  // Weather (at start location)
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;
  
  // UI state
  isPrimary?: boolean;
  raceStatus?: 'past' | 'next' | 'future';
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
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
  wind,
  isPrimary = false,
  raceStatus = 'future',
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  isDimmed = false,
}: DistanceRaceCardProps) {
  const router = useRouter();
  
  // Determine if it's a circumnavigation (same start/finish) or point-to-point
  const isSameStartFinish = !finishVenue || finishVenue === startVenue;
  
  // Count waypoints
  const waypointCount = routeWaypoints.filter(w => w.type === 'waypoint' || w.type === 'gate').length;
  
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
  
  // Format time limit
  const formattedTimeLimit = useMemo(() => {
    if (!timeLimitHours) return null;
    if (timeLimitHours < 24) {
      return `${timeLimitHours}h limit`;
    }
    const days = Math.floor(timeLimitHours / 24);
    const hours = timeLimitHours % 24;
    return hours > 0 ? `${days}d ${hours}h limit` : `${days}d limit`;
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
    if (onDelete) {
      items.push({
        label: 'Delete Race',
        icon: 'trash-outline',
        onPress: onDelete,
        destructive: true,
      });
    }
    return items;
  }, [onEdit, onDelete]);
  
  const handlePress = () => {
    if (onSelect) {
      onSelect();
    } else {
      router.push(`/(tabs)/race/scrollable/${id}` as any);
    }
  };
  
  return (
    <Pressable
      style={[
        styles.card,
        isPrimary && styles.cardPrimary,
        isSelected && styles.cardSelected,
        isDimmed && styles.cardDimmed,
      ]}
      onPress={handlePress}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <RaceTypeBadge type="distance" size="small" />
          {raceStatus === 'next' && (
            <View style={styles.nextBadge}>
              <Text style={styles.nextBadgeText}>NEXT</Text>
            </View>
          )}
          {raceStatus === 'past' && (
            <View style={styles.pastBadge}>
              <Text style={styles.pastBadgeText}>COMPLETED</Text>
            </View>
          )}
        </View>
        {menuItems.length > 0 && <CardMenu items={menuItems} />}
      </View>
      
      {/* Race Name */}
      <Text style={styles.raceName} numberOfLines={2}>
        {name}
      </Text>
      
      {/* Route Info */}
      <View style={styles.routeSection}>
        <View style={styles.routeRow}>
          <Flag size={14} color="#10B981" />
          <Text style={styles.routeLabel}>Start:</Text>
          <Text style={styles.routeValue}>{startVenue}</Text>
        </View>
        <View style={styles.routeRow}>
          <Anchor size={14} color="#EF4444" />
          <Text style={styles.routeLabel}>Finish:</Text>
          <Text style={styles.routeValue}>
            {isSameStartFinish ? startVenue : finishVenue}
            {isSameStartFinish && <Text style={styles.routeNote}> (same)</Text>}
          </Text>
        </View>
      </View>
      
      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Distance */}
        {totalDistanceNm && (
          <View style={styles.stat}>
            <Route size={16} color="#7C3AED" />
            <Text style={styles.statValue}>{totalDistanceNm} nm</Text>
          </View>
        )}
        
        {/* Waypoints */}
        {waypointCount > 0 && (
          <View style={styles.stat}>
            <Navigation size={16} color="#0284C7" />
            <Text style={styles.statValue}>{waypointCount} waypoints</Text>
          </View>
        )}
        
        {/* Time Limit */}
        {formattedTimeLimit && (
          <View style={styles.stat}>
            <Timer size={16} color="#F59E0B" />
            <Text style={styles.statValue}>{formattedTimeLimit}</Text>
          </View>
        )}
      </View>
      
      {/* Date/Time & Weather Row */}
      <View style={styles.footer}>
        <View style={styles.dateTime}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Clock size={14} color="#64748B" style={{ marginLeft: 8 }} />
          <Text style={styles.timeText}>{startTime}</Text>
        </View>
        
        {/* Wind at start */}
        {wind && (
          <View style={styles.weather}>
            <Wind size={14} color="#64748B" />
            <Text style={styles.weatherText}>
              {wind.direction} {wind.speedMin}-{wind.speedMax} kts
            </Text>
          </View>
        )}
      </View>
      
      {/* Mini Route Preview (placeholder for now) */}
      {routeWaypoints.length > 0 && (
        <View style={styles.routePreview}>
          <View style={styles.routePreviewPlaceholder}>
            <Route size={20} color="#94A3B8" />
            <Text style={styles.routePreviewText}>Route Preview</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPrimary: {
    borderColor: '#7C3AED',
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardSelected: {
    backgroundColor: '#FAF5FF',
    borderColor: '#7C3AED',
  },
  cardDimmed: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nextBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  pastBadge: {
    backgroundColor: '#64748B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pastBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  raceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 24,
  },
  routeSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  routeValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
  },
  routeNote: {
    color: '#94A3B8',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  weather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherText: {
    fontSize: 11,
    color: '#64748B',
  },
  routePreview: {
    marginTop: 12,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  routePreviewPlaceholder: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  routePreviewText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

export default DistanceRaceCard;

