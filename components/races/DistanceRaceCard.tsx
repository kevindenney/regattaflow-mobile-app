/**
 * DistanceRaceCard Component
 * Compact card for distance/offshore racing matching fleet RaceCard layout
 * Shows countdown box, race details, and condition chips
 *
 * Visual Differentiation:
 * - Purple/violet accent color (vs blue for fleet racing)
 * - "DISTANCE" badge to identify race type
 * - Distance chip showing total nautical miles
 */

import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import { calculateCountdown } from '@/constants/mockData';
import { useRouter } from 'expo-router';
import {
    MapPin,
    Navigation,
    Radio,
    Route,
    Wind
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Route waypoint type for distance races
interface RouteWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'waypoint' | 'gate' | 'finish';
  required: boolean;
  passingSide?: 'port' | 'starboard' | 'either';
  notes?: string;
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
  isMock?: boolean; // True for demo/mock data
  raceStatus?: 'past' | 'next' | 'future';
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  isDimmed?: boolean;
  cardWidth?: number;
  cardHeight?: number;
  numberOfLegs?: number; // Number of legs/waypoints in the race
  rigTension?: {
    uppers?: string;
    lowers?: string;
    description?: string;
  } | null;
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
  isMock = false,
  raceStatus = 'future',
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onHide,
  isDimmed = false,
  cardWidth: propCardWidth,
  cardHeight: propCardHeight,
  numberOfLegs,
  rigTension,
}: DistanceRaceCardProps) {
  const router = useRouter();

  // Calculate countdown
  const countdown = useMemo(() => {
    return calculateCountdown(date, startTime);
  }, [date, startTime]);
  
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
  
  // Full-screen card dimensions for all platforms
  const cardWidth = propCardWidth ?? Math.min(SCREEN_WIDTH - 32, 375);
  const cardHeight = propCardHeight ?? 520;
  
  // Color based on countdown urgency (matching RaceCard)
  const getCountdownColor = () => {
    if (raceStatus === 'past') return { bg: '#F3F4F6', text: '#6B7280' };
    if (countdown.days > 7) return { bg: '#D1FAE5', text: '#065F46' }; // Green
    if (countdown.days >= 2) return { bg: '#FEF3C7', text: '#92400E' }; // Yellow
    if (countdown.days >= 1) return { bg: '#FFEDD5', text: '#C2410C' }; // Orange
    return { bg: '#FEE2E2', text: '#DC2626' }; // Red - less than 24 hours
  };
  const countdownColors = getCountdownColor();

  return (
    <View
      style={{
        width: cardWidth,
        flexShrink: 0,
        flexGrow: 0,
      }}
    >
      <View style={[
        styles.cardWrapper,
        isDimmed && styles.cardDimmed,
      ]}>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            styles.cardFullScreen,
            {
              width: '100%',
              height: cardHeight,
              opacity: pressed ? 0.9 : 1,
            },
            isPrimary && styles.cardPrimary,
            isSelected && styles.cardSelected,
          ]}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${name}`}
        >
        {/* Menu in upper right corner */}
        {menuItems.length > 0 && (
          <View style={styles.menuContainer}>
            <CardMenu items={menuItems} />
          </View>
        )}

        {/* Card Content - Full-screen Layout */}
        <View style={[styles.cardContent, styles.cardContentFullScreen]}>
          {/* Header Zone: Countdown box on left, details on right */}
          <View style={[styles.headerZone, styles.headerZoneFullScreen]}>
            {/* Countdown Box */}
            <View style={[styles.countdownBox, styles.countdownBoxFullScreen, { backgroundColor: countdownColors.bg }]}>
              {raceStatus === 'past' ? (
                <Text style={[styles.countdownDone, styles.countdownDoneFullScreen, { color: countdownColors.text }]}>DONE</Text>
              ) : (
                <>
                  <Text style={[styles.countdownNumber, styles.countdownNumberFullScreen, { color: countdownColors.text }]}>
                    {countdown.days}
                  </Text>
                  <Text style={[styles.countdownLabel, styles.countdownLabelFullScreen, { color: countdownColors.text }]}>
                    {countdown.days === 1 ? 'DAY' : 'DAYS'}
                  </Text>
                </>
              )}
            </View>

            {/* Race Details */}
            <View style={[styles.raceDetails, styles.raceDetailsFullScreen]}>
              {/* Distance Badge + Course + Demo Badge */}
              <View style={styles.badgeRow}>
                <View style={[styles.distanceBadge, styles.distanceBadgeFullScreen]}>
                  <Navigation size={10} color="#7C3AED" />
                  <Text style={[styles.distanceBadgeText, styles.distanceBadgeTextFullScreen]}>DISTANCE</Text>
                </View>
                {courseName && (
                  <View style={styles.courseBadge}>
                    <Route size={10} color="#059669" />
                    <Text style={styles.courseBadgeText}>{courseName}</Text>
                  </View>
                )}
                {(numberOfLegs || routeWaypoints.length > 0) && (
                  <View style={styles.legCountBadge}>
                    <Text style={styles.legCountBadgeText}>
                      {numberOfLegs || routeWaypoints.length} {(numberOfLegs || routeWaypoints.length) === 1 ? 'leg' : 'legs'}
                    </Text>
                  </View>
                )}
                {isMock && (
                  <View style={styles.mockBadge}>
                    <Text style={styles.mockBadgeText}>DEMO</Text>
                  </View>
                )}
              </View>

              {/* Race Name */}
              <Text style={[styles.raceName, styles.raceNameFullScreen]} numberOfLines={3}>
                {name}
              </Text>

              {/* Venue + Date */}
              <View style={styles.metaRow}>
                <MapPin size={12} color="#64748B" />
                <Text style={[styles.metaText, styles.metaTextFullScreen]} numberOfLines={1}>
                  {startVenue}
                </Text>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={[styles.metaText, styles.metaTextFullScreen]}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>

              {/* Finish Venue (if different) */}
              {finishVenue && finishVenue !== startVenue && (
                <View style={[styles.metaRow, { marginTop: 4 }]}>
                  <MapPin size={12} color="#7C3AED" />
                  <Text style={[styles.metaText, styles.metaTextFullScreen, { color: '#7C3AED' }]}>
                    Finish: {finishVenue}
                  </Text>
                </View>
              )}

              {/* Start Time Row */}
              <View style={styles.startTimeRow}>
                <Text style={styles.startTimeLabel}>Start:</Text>
                <Text style={styles.startTimeValue}>{startTime}</Text>
                {timeLimitHours && (
                  <View style={styles.timeLimitBadge}>
                    <Text style={styles.timeLimitBadgeText}>{timeLimitHours}h limit</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Conditions Row - Full-screen horizontal chips */}
          <View style={[styles.conditionsRow, styles.conditionsRowFullScreen]}>
            {/* Distance Chip */}
            <View style={[styles.conditionChip, styles.conditionChipFullScreen]}>
              <Route size={18} color="#7C3AED" strokeWidth={2.5} />
              <Text style={[styles.conditionChipText, styles.conditionChipTextFullScreen]}>
                {totalDistanceNm ? `${totalDistanceNm}nm` : '--'}
              </Text>
            </View>

            {/* Wind Chip */}
            <View style={[styles.conditionChip, styles.conditionChipFullScreen]}>
              <Wind size={18} color="#3B82F6" strokeWidth={2.5} />
              {wind ? (
                <Text style={[styles.conditionChipText, styles.conditionChipTextFullScreen]}>
                  {wind.direction} {wind.speedMin}-{wind.speedMax}kt
                </Text>
              ) : (
                <Text style={[styles.conditionChipTextMuted, styles.conditionChipTextFullScreen]}>--</Text>
              )}
            </View>

            {/* VHF Chip */}
            <View style={[styles.conditionChip, styles.conditionChipFullScreen]}>
              <Radio size={18} color="#8B5CF6" strokeWidth={2.5} />
              {vhf_channel ? (
                <Text style={[styles.conditionChipText, styles.conditionChipTextFullScreen]}>Ch {vhf_channel}</Text>
              ) : (
                <Text style={[styles.conditionChipTextMuted, styles.conditionChipTextFullScreen]}>--</Text>
              )}
            </View>
          </View>

          {/* Rig Tension Indicator - compact display */}
          {rigTension && raceStatus !== 'past' && (
            <View style={styles.rigTensionRow}>
              <View style={styles.rigTensionIndicator}>
                <Text style={styles.rigTensionLabel}>Uppers</Text>
                <Text style={styles.rigTensionValue}>{rigTension.uppers || '--'}</Text>
              </View>
              {rigTension.lowers && (
                <View style={styles.rigTensionIndicator}>
                  <Text style={styles.rigTensionLabel}>Lowers</Text>
                  <Text style={styles.rigTensionValue}>{rigTension.lowers}</Text>
                </View>
              )}
              {rigTension.description && (
                <Text style={styles.rigTensionDescription}>{rigTension.description}</Text>
              )}
            </View>
          )}

          {/* Waypoints Preview (if available) */}
          {routeWaypoints.length > 0 && (
            <View style={styles.waypointsPreview}>
              <Text style={styles.waypointsTitle}>Route Waypoints</Text>
              <View style={styles.waypointsList}>
                {routeWaypoints.slice(0, 4).map((wp, idx) => (
                  <View key={idx} style={styles.waypointItem}>
                    <View style={styles.waypointDot} />
                    <Text style={styles.waypointName} numberOfLines={1}>{wp.name}</Text>
                  </View>
                ))}
                {routeWaypoints.length > 4 && (
                  <Text style={styles.waypointsMore}>+{routeWaypoints.length - 4} more</Text>
                )}
              </View>
            </View>
          )}
        </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    // marginHorizontal removed - parent ScrollView handles gap via `gap` prop
    marginVertical: 4,
  },
  cardDimmed: {
    opacity: 0.45,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 6px rgba(124, 58, 237, 0.08)',
      },
      default: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  cardFullScreen: {
    borderRadius: 24,
  },
  cardPrimary: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
    transform: [{ scale: 1.02 }],
  },
  menuContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 20,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardContentFullScreen: {
    padding: 20,
    justifyContent: 'flex-start',
  },
  // Header zone: countdown on left, details on right
  headerZone: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  headerZoneFullScreen: {
    gap: 16,
    marginBottom: 20,
  },
  countdownBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownBoxFullScreen: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  countdownNumber: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  countdownNumberFullScreen: {
    fontSize: 42,
  },
  countdownLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  countdownLabelFullScreen: {
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 0,
  },
  countdownDone: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  countdownDoneFullScreen: {
    fontSize: 16,
  },
  raceDetails: {
    flex: 1,
    paddingRight: 24, // Space for menu
  },
  raceDetailsFullScreen: {
    paddingRight: 32,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceBadgeFullScreen: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  distanceBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.3,
  },
  distanceBadgeTextFullScreen: {
    fontSize: 10,
  },
  mockBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  raceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 4,
  },
  raceNameFullScreen: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  metaTextFullScreen: {
    fontSize: 14,
  },
  metaSeparator: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  // Conditions row at bottom
  conditionsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  conditionsRowFullScreen: {
    gap: 10,
    paddingTop: 16,
    marginTop: 8,
  },
  conditionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  conditionChipFullScreen: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
  },
  conditionChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  conditionChipTextFullScreen: {
    fontSize: 15,
  },
  conditionChipTextMuted: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  // Waypoints preview section
  waypointsPreview: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  waypointsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  waypointsList: {
    gap: 8,
  },
  waypointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waypointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
  },
  waypointName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
  },
  waypointsMore: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
    marginTop: 4,
  },
  // Time limit section
  timeLimitContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLimitLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timeLimitValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  // Course and leg count badges
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  courseBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  legCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  legCountBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Start time row
  startTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  startTimeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  startTimeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  timeLimitBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeLimitBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#7C3AED',
  },
  // Rig tension indicator
  rigTensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rigTensionIndicator: {
    alignItems: 'center',
  },
  rigTensionLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rigTensionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  rigTensionDescription: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    fontStyle: 'italic',
  },
});

export default DistanceRaceCard;
