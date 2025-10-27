/**
 * Current & Tide Card - Tidal Flow and Current Analysis
 * Shows current direction/speed, tide phase, and impact on racing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrategyCard } from './StrategyCard';
import { useRaceWeather } from '@/hooks/useRaceWeather';

interface TideData {
  current: {
    speed: number; // knots
    direction: number; // degrees
    phase: 'flood' | 'ebb' | 'slack';
    strength: 'weak' | 'moderate' | 'strong';
  };
  tides: {
    highTide: {
      time: string;
      height: number; // meters
    };
    lowTide: {
      time: string;
      height: number; // meters
    };
    tidalRange: number; // meters
  };
  raceTimeAnalysis?: {
    currentSpeed: number;
    currentDirection: number;
    phase: 'flood' | 'ebb' | 'slack';
    impact: string[];
    tacticalAdvice: string;
  };
  lastUpdated: Date;
}

interface CurrentTideCardProps {
  raceId: string;
  raceTime?: string;
  venueCoordinates?: {
    lat: number;
    lng: number;
  };
  venue?: {
    id: string;
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    region: string;
    country: string;
  };
}

export function CurrentTideCard({
  raceId,
  raceTime,
  venueCoordinates,
  venue
}: CurrentTideCardProps) {
  const [useMockData, setUseMockData] = useState(false);

  // Try to fetch REAL weather/tide data first
  const { weather: realWeather, loading, error: weatherError, refetch: loadTideData } = useRaceWeather(
    venue || (venueCoordinates ? {
      id: `venue-${venueCoordinates.lat}-${venueCoordinates.lng}`,
      name: 'Race Venue',
      coordinates: {
        latitude: venueCoordinates.lat,
        longitude: venueCoordinates.lng
      },
      region: 'unknown',
      country: 'unknown'
    } as any : null),
    raceTime
  );

  // Fallback to mock data if real data fails
  const [mockTideData, setMockTideData] = useState<TideData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If real weather fails or is unavailable, use mock data
    if (weatherError || (!loading && !realWeather && venueCoordinates)) {
      loadMockTideData();
      setUseMockData(true);
    } else if (realWeather) {
      setUseMockData(false);
    }
  }, [weatherError, loading, realWeather, venueCoordinates]);

  const loadMockTideData = () => {
    const placeholderData: TideData = {
      current: {
        speed: 0.8,
        direction: 90, // East
        phase: 'flood',
        strength: 'moderate',
      },
      tides: {
        highTide: {
          time: '14:23',
          height: 2.1,
        },
        lowTide: {
          time: '08:45',
          height: 0.4,
        },
        tidalRange: 1.7,
      },
      raceTimeAnalysis: {
        currentSpeed: 0.9,
        currentDirection: 95,
        phase: 'flood',
        impact: [
          'Strong flood current from East',
          'Current will push boats toward shore',
          'Favors boats on port tack upwind'
        ],
        tacticalAdvice: 'Start on port tack to gain advantage from current. Stay right of rhumb line on upwind legs.',
      },
      lastUpdated: new Date(),
    };
    setMockTideData(placeholderData);
  };

  // Helper to convert cardinal to degrees
  const cardinalToDegrees = (cardinal: string): number => {
    const directions: { [key: string]: number } = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    return directions[cardinal] || 0;
  };

  // Convert real weather/tide to display format
  const tideData: TideData | null = useMockData ? mockTideData : (realWeather?.tide ? {
    current: {
      speed: 0.5, // Estimated from tide state
      direction: realWeather.tide.direction ? cardinalToDegrees(realWeather.tide.direction) : 0,
      phase: realWeather.tide.state === 'flooding' ? 'flood' : (realWeather.tide.state === 'ebbing' ? 'ebb' : 'slack'),
      strength: realWeather.tide.height > 1.5 ? 'strong' : (realWeather.tide.height > 0.8 ? 'moderate' : 'weak'),
    },
    tides: {
      highTide: {
        time: '14:00', // Not available from API yet
        height: realWeather.tide.height,
      },
      lowTide: {
        time: '08:00', // Not available from API yet
        height: 0.4, // Not available from API yet
      },
      tidalRange: realWeather.tide.height * 1.5, // Estimated
    },
    raceTimeAnalysis: undefined, // Not yet implemented
    lastUpdated: new Date(),
  } : null);

  const getCardStatus = () => {
    if (loading) return 'generating';
    if (error) return 'error';
    if (!tideData) return 'not_set';
    return 'ready';
  };

  const getStatusMessage = () => {
    if (loading) return 'Loading tide data...';
    if (error) return error;
    if (!tideData) return 'Tap to load';
    return tideData.current.phase.charAt(0).toUpperCase() + tideData.current.phase.slice(1);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'flood': return '#3B82F6'; // Blue
      case 'ebb': return '#10B981'; // Green
      case 'slack': return '#94A3B8'; // Gray
      default: return '#64748B';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'flood': return 'arrow-up-bold';
      case 'ebb': return 'arrow-down-bold';
      case 'slack': return 'minus';
      default: return 'help-circle';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return '#EF4444';
      case 'moderate': return '#F59E0B';
      case 'weak': return '#10B981';
      default: return '#64748B';
    }
  };

  const getDirectionLabel = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const renderTideContent = () => {
    if (!tideData) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="waves" size={48} color="#E2E8F0" />
          <Text style={styles.emptyText}>
            Tidal flow and current strength analysis for tactical advantage.
          </Text>
          <TouchableOpacity
            style={styles.loadButton}
            onPress={loadMockTideData}
            disabled={loading || !venueCoordinates}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="cloud-download" size={20} color="#fff" />
                <Text style={styles.loadButtonText}>Load Tide Data</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.tideContent}>
        {/* Data Source Indicator Badge */}
        <View style={[
          styles.dataSourceBadge,
          useMockData ? styles.dataSourceBadgeMock : styles.dataSourceBadgeLive
        ]}>
          <MaterialCommunityIcons
            name={useMockData ? "flask-outline" : "wifi"}
            size={14}
            color={useMockData ? "#D97706" : "#10B981"}
          />
          <Text style={[
            styles.dataSourceText,
            useMockData ? styles.dataSourceTextMock : styles.dataSourceTextLive
          ]}>
            {useMockData ? "MOCK DATA" : "LIVE DATA"}
          </Text>
        </View>
        {/* Current Flow */}
        <View style={styles.currentSection}>
          <View style={styles.currentHeader}>
            <Text style={styles.sectionTitle}>Current Flow</Text>
            <TouchableOpacity onPress={loadTideData} disabled={loading}>
              <MaterialCommunityIcons name="refresh" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <View style={[
            styles.currentDisplay,
            { backgroundColor: getPhaseColor(tideData.current.phase) + '15' }
          ]}>
            {/* Phase Badge */}
            <View style={[
              styles.phaseBadge,
              { backgroundColor: getPhaseColor(tideData.current.phase) }
            ]}>
              <MaterialCommunityIcons
                name={getPhaseIcon(tideData.current.phase)}
                size={24}
                color="#fff"
              />
              <Text style={styles.phaseText}>
                {tideData.current.phase.toUpperCase()}
              </Text>
            </View>

            {/* Current Speed & Direction */}
            <View style={styles.currentInfo}>
              <View style={styles.currentSpeed}>
                <Text style={styles.currentSpeedValue}>{tideData.current.speed.toFixed(1)}</Text>
                <Text style={styles.currentSpeedUnit}>kts</Text>
              </View>

              <View style={styles.currentDirection}>
                <View style={styles.currentCompass}>
                  <MaterialCommunityIcons
                    name="navigation"
                    size={20}
                    color={getPhaseColor(tideData.current.phase)}
                    style={{
                      transform: [{ rotate: `${tideData.current.direction}deg` }]
                    }}
                  />
                </View>
                <Text style={styles.currentDirectionText}>
                  {getDirectionLabel(tideData.current.direction)} ({tideData.current.direction}°)
                </Text>
              </View>

              {/* Strength Indicator */}
              <View style={[
                styles.strengthBadge,
                { borderColor: getStrengthColor(tideData.current.strength) }
              ]}>
                <View style={[
                  styles.strengthDot,
                  { backgroundColor: getStrengthColor(tideData.current.strength) }
                ]} />
                <Text style={[
                  styles.strengthText,
                  { color: getStrengthColor(tideData.current.strength) }
                ]}>
                  {tideData.current.strength.toUpperCase()} CURRENT
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tide Times */}
        <View style={styles.tidesSection}>
          <Text style={styles.sectionTitle}>Tide Times</Text>
          <View style={styles.tidesGrid}>
            {/* High Tide */}
            <View style={styles.tideItem}>
              <View style={styles.tideHeader}>
                <MaterialCommunityIcons name="arrow-up-bold" size={20} color="#3B82F6" />
                <Text style={styles.tideLabel}>High Tide</Text>
              </View>
              <Text style={styles.tideTime}>{tideData.tides.highTide.time}</Text>
              <Text style={styles.tideHeight}>{tideData.tides.highTide.height.toFixed(1)}m</Text>
            </View>

            {/* Low Tide */}
            <View style={styles.tideItem}>
              <View style={styles.tideHeader}>
                <MaterialCommunityIcons name="arrow-down-bold" size={20} color="#10B981" />
                <Text style={styles.tideLabel}>Low Tide</Text>
              </View>
              <Text style={styles.tideTime}>{tideData.tides.lowTide.time}</Text>
              <Text style={styles.tideHeight}>{tideData.tides.lowTide.height.toFixed(1)}m</Text>
            </View>

            {/* Tidal Range */}
            <View style={styles.tideItem}>
              <View style={styles.tideHeader}>
                <MaterialCommunityIcons name="arrow-expand-vertical" size={20} color="#F59E0B" />
                <Text style={styles.tideLabel}>Range</Text>
              </View>
              <Text style={styles.tideRange}>{tideData.tides.tidalRange.toFixed(1)}m</Text>
            </View>
          </View>
        </View>

        {/* Race Time Analysis */}
        {tideData.raceTimeAnalysis && raceTime && (
          <View style={styles.analysisSection}>
            <Text style={styles.sectionTitle}>Race Time Impact</Text>

            {/* Impact Points */}
            <View style={styles.impactList}>
              {tideData.raceTimeAnalysis.impact.map((item, index) => (
                <View key={index} style={styles.impactItem}>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#3B82F6" />
                  <Text style={styles.impactText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Tactical Advice */}
            <View style={styles.adviceBox}>
              <View style={styles.adviceHeader}>
                <MaterialCommunityIcons name="lightbulb" size={20} color="#F59E0B" />
                <Text style={styles.adviceTitle}>Tactical Advice</Text>
              </View>
              <Text style={styles.adviceText}>
                {tideData.raceTimeAnalysis.tacticalAdvice}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <StrategyCard
      icon="waves"
      title="Current & Tide"
      status={getCardStatus()}
      statusMessage={getStatusMessage()}
      expandable={false}
    >
      {renderTideContent()}
    </StrategyCard>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  loadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  tideContent: {
    gap: 20,
  },
  currentSection: {
    gap: 12,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  currentDisplay: {
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  phaseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  currentInfo: {
    gap: 12,
  },
  currentSpeed: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentSpeedValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0F172A',
  },
  currentSpeedUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  currentDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentCompass: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  currentDirectionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  strengthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  strengthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tidesSection: {
    gap: 12,
  },
  tidesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  tideItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tideLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tideTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  tideHeight: {
    fontSize: 14,
    color: '#64748B',
  },
  tideRange: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  analysisSection: {
    gap: 12,
  },
  impactList: {
    gap: 8,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  impactText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  adviceBox: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  adviceText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  dataSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  dataSourceBadgeLive: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  dataSourceBadgeMock: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  dataSourceText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dataSourceTextLive: {
    color: '#059669',
  },
  dataSourceTextMock: {
    color: '#D97706',
  },
});
