/**
 * Current & Tide Card - Tidal Flow and Current Analysis
 * Shows current direction/speed, tide phase, and impact on racing
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrategyCard } from './StrategyCard';
import { useRaceWeather } from '@/hooks/useRaceWeather';
import { useTidalIntel } from '@/hooks/useTidalIntel';

interface TideData {
  current: {
    speed: number; // knots
    direction: number; // degrees
    phase: 'flood' | 'ebb' | 'slack';
    strength: 'weak' | 'moderate' | 'strong';
    trend?: 'rising' | 'falling' | 'slack';
    flowLabel?: string;
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
  raceTimeForecast?: {
    phase: 'flood' | 'ebb' | 'slack' | 'high' | 'low';
    directionLabel?: string | null;
    directionDegrees?: number | null;
    height?: number | null;
    summary?: string;
  };
  raceTimeAnalysis?: {
    currentSpeed: number;
    currentDirection: number;
    phase: 'flood' | 'ebb' | 'slack';
    impact: string[];
    tacticalAdvice: string;
  };
  slackWindow?: {
    isSlackNow: boolean;
    nextSlackLabel: string;
    windowLabel: string;
    minutesUntilSlack: number | null;
  };
  source?: 'mock' | 'weather' | 'worldtides';
  lastUpdated: Date;
}

interface InitialTide {
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack' | 'high' | 'low';
    height: number;
    direction?: string;
  };
  fetchedAt?: string;
  provider?: string;
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
  initialTide?: InitialTide;
}

export function CurrentTideCard({
  raceId,
  raceTime,
  venueCoordinates,
  venue,
  initialTide
}: CurrentTideCardProps) {
  const [useMockData, setUseMockData] = useState(false);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  const [showLiveConditions, setShowLiveConditions] = useState(false);

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

  const intelCoordinates = useMemo(() => {
    if (venue?.coordinates) {
      const { latitude, longitude } = venue.coordinates;
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        return { lat: latitude, lng: longitude };
      }
    }

    if (venueCoordinates && typeof venueCoordinates.lat === 'number' && typeof venueCoordinates.lng === 'number') {
      return { lat: venueCoordinates.lat, lng: venueCoordinates.lng };
    }

    return null;
  }, [
    venue?.coordinates?.latitude,
    venue?.coordinates?.longitude,
    venueCoordinates?.lat,
    venueCoordinates?.lng
  ]);

  const {
    intel,
    loading: intelLoading,
    error: intelError,
    available: intelAvailable,
    refetch: refetchIntel
  } = useTidalIntel({
    coordinates: intelCoordinates,
    referenceTime: raceTime || null
  });

  // Fallback to mock data if real data fails
  const [mockTideData, setMockTideData] = useState<TideData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPastRace = useMemo(() => {
    if (!raceTime) return false;
    return new Date(raceTime).getTime() < Date.now();
  }, [raceTime]);

  const loadMockTideData = useCallback((reason?: string | null) => {
    if (reason !== undefined) {
      setError(reason || null);
    }
    setUseMockData(true);
    const placeholderData: TideData = {
      current: {
        speed: 0.8,
        direction: 90, // East
        phase: 'flood',
        strength: 'moderate',
        trend: 'rising',
        flowLabel: 'flood',
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
      slackWindow: {
        isSlackNow: false,
        nextSlackLabel: '15:00 (High)',
        windowLabel: '14:45 – 15:15',
        minutesUntilSlack: 35,
      },
      raceTimeForecast: {
        phase: 'flood',
        directionLabel: 'E',
        directionDegrees: 90,
        height: 2.1,
        summary: 'Flood 0.9 kts from E at race start',
      },
      source: 'mock',
      lastUpdated: new Date(),
    };
    setMockTideData(placeholderData);
    setHasAutoLoaded(true);
  }, []);

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

  const metadataTide = useMemo<TideData | null>(() => {
    if (!initialTide?.tide) return null;

    const directionDegrees = initialTide.tide.direction ? cardinalToDegrees(initialTide.tide.direction) : null;
    const directionLabel = initialTide.tide.direction ?? null;
    const phase = initialTide.tide.state === 'flooding'
      ? 'flood'
      : initialTide.tide.state === 'ebbing'
        ? 'ebb'
        : 'slack';

    const strength = initialTide.tide.height > 1.5
      ? 'strong'
      : initialTide.tide.height > 0.8
        ? 'moderate'
        : 'weak';

    const tideHeight = typeof initialTide.tide.height === 'number' && !Number.isNaN(initialTide.tide.height)
      ? initialTide.tide.height
      : null;

    return {
      current: {
        speed: 0.5,
        direction: directionDegrees ?? 0,
        phase,
        strength,
        flowLabel: phase
      },
      tides: {
        highTide: {
          time: '—',
          height: tideHeight ?? Number.NaN
        },
        lowTide: {
          time: '—',
          height: tideHeight !== null ? Math.max(tideHeight - 0.5, 0) : Number.NaN
        },
        tidalRange: tideHeight !== null ? Math.max(tideHeight - (Math.max(tideHeight - 0.5, 0)), 0) : Number.NaN
      },
      raceTimeForecast: {
        phase,
        directionLabel,
        directionDegrees,
        height: tideHeight,
        summary: buildForecastSummary(phase, directionLabel, directionDegrees, tideHeight),
      },
      source: 'weather' as const,
      lastUpdated: initialTide.fetchedAt ? new Date(initialTide.fetchedAt) : new Date()
    } as TideData;
  }, [initialTide?.tide, initialTide?.fetchedAt]);

  const recordedTideData = metadataTide;

  const hasValidCoordinates =
    (venueCoordinates && (venueCoordinates.lat !== 0 || venueCoordinates.lng !== 0)) ||
    (venue?.coordinates &&
      (venue.coordinates.latitude !== 0 || venue.coordinates.longitude !== 0));

  const handleRefresh = useCallback(() => {
    setHasAutoLoaded(false);
    setUseMockData(false);
    setMockTideData(null);
    setError(null);
    loadTideData();
    void refetchIntel();
  }, [loadTideData, refetchIntel]);

  const handleShowLiveConditions = useCallback(() => {
    setShowLiveConditions(true);
    handleRefresh();
  }, [handleRefresh]);

  const handleShowRecordedSnapshot = useCallback(() => {
    setShowLiveConditions(false);
    setError(null);
  }, []);

  useEffect(() => {
    setHasAutoLoaded(false);
    setUseMockData(false);
    setMockTideData(null);
    setError(null);
    setShowLiveConditions(false);
  }, [raceId, raceTime, venue?.id, venueCoordinates?.lat, venueCoordinates?.lng]);

  useEffect(() => {
    if (realWeather?.tide) {
      setUseMockData(false);
      setHasAutoLoaded(true);
      setError(null);
    }
  }, [realWeather]);

  useEffect(() => {
    if (metadataTide) {
      setUseMockData(false);
      setHasAutoLoaded(true);
      setError(null);
    }
  }, [metadataTide]);

  useEffect(() => {
    if (intel) {
      if (!hasAutoLoaded) {
        setHasAutoLoaded(true);
      }
      if (useMockData) {
        setUseMockData(false);
      }
      if (error) {
        setError(null);
      }
    }
  }, [intel, hasAutoLoaded, useMockData, error]);

  useEffect(() => {
    if (hasAutoLoaded || useMockData || metadataTide) return;
    if (intelAvailable) {
      if (intelLoading) return;
      if (intel) return;
    }

    if (weatherError) {
      setError(weatherError.message || 'Unable to fetch live tide data');
      loadMockTideData();
      return;
    }

    if (!loading && !realWeather?.tide && !metadataTide) {
      const timeout = setTimeout(() => {
        if (!hasAutoLoaded && !realWeather?.tide && !metadataTide && !useMockData) {
          loadMockTideData(
            hasValidCoordinates
              ? undefined
              : 'Showing simulated tide — add venue coordinates for live data'
          );
        }
      }, hasValidCoordinates ? 800 : 120);

      return () => clearTimeout(timeout);
    }
  }, [
    loading,
    realWeather?.tide,
    metadataTide,
    weatherError,
    hasAutoLoaded,
    useMockData,
    loadMockTideData,
    hasValidCoordinates,
    venueCoordinates?.lat,
    venueCoordinates?.lng,
    venue?.coordinates?.latitude,
    venue?.coordinates?.longitude,
    intelAvailable,
    intelLoading,
    intel
  ]);

  const formatTimeLabel = (date?: Date | null) => {
    if (!date) return '--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const tideDataFromIntel = useMemo(() => {
    if (!intel) return null;

    const safeHeight = (value?: number) =>
      typeof value === 'number' && !Number.isNaN(value) ? Math.round(value * 10) / 10 : null;

    const directionFromWeather = realWeather?.tide?.direction
      ? cardinalToDegrees(realWeather.tide.direction)
      : null;

    const directionDegrees = Number.isFinite(directionFromWeather as number)
      ? (directionFromWeather as number)
      : intel.current.flow === 'flood'
        ? 90
        : intel.current.flow === 'ebb'
          ? 270
          : 0;
    const directionLabel = degreesToCardinal(directionDegrees);

    const phase: 'flood' | 'ebb' | 'slack' =
      intel.current.flow === 'flood'
        ? 'flood'
        : intel.current.flow === 'ebb'
          ? 'ebb'
          : 'slack';

    const strength =
      intel.current.speed >= 2
        ? 'strong'
        : intel.current.speed >= 1
          ? 'moderate'
          : 'weak';

    const highHeight = safeHeight(intel.extremes.nextHigh?.height) ??
      Math.round((intel.current.height + intel.range / 2) * 10) / 10;
    const lowHeight = safeHeight(intel.extremes.nextLow?.height) ??
      Math.round((intel.current.height - intel.range / 2) * 10) / 10;

    const impacts: string[] = [];

    if (intel.slack.isSlackNow) {
      impacts.push('Slack water right now — minimal current set on the fleet.');
    } else if (typeof intel.slack.minutesUntilSlack === 'number') {
      const minutes = intel.slack.minutesUntilSlack;
      const slackDescriptor = minutes < 0
        ? `${Math.abs(minutes)} min ago`
        : `in ${minutes} min`;
      const slackType = intel.slack.slackType === 'high' ? 'high water turn' : 'low water turn';
      impacts.push(`Slack expected ${slackDescriptor} (${slackType}).`);
    }

    if (phase === 'flood') {
      impacts.push('Flood current building — expect set with the tide and acceleration on corners.');
    } else if (phase === 'ebb') {
      impacts.push('Ebb current running — anticipate set against the breeze and relief near shore.');
    } else {
      impacts.push('Current flow negligible; prepare for next tidal turn.');
    }

    const slackWindow = {
      isSlackNow: intel.slack.isSlackNow,
      nextSlackLabel: intel.slack.nextSlackTime
        ? `${formatTimeLabel(intel.slack.nextSlackTime)}${intel.slack.slackType ? ` (${intel.slack.slackType === 'high' ? 'High' : 'Low'})` : ''}`
        : '—',
      windowLabel: intel.slack.windowStart && intel.slack.windowEnd
        ? `${formatTimeLabel(intel.slack.windowStart)} – ${formatTimeLabel(intel.slack.windowEnd)}`
        : '—',
      minutesUntilSlack: intel.slack.minutesUntilSlack
    };

    const tacticalAdvice = intel.slack.isSlackNow
      ? 'Exploit the slack window to reposition or cross adverse current lanes before flow rebuilds.'
      : intel.slack.minutesUntilSlack !== null && intel.slack.minutesUntilSlack >= 0 && intel.slack.minutesUntilSlack <= 60
        ? 'Plan maneuvers around the upcoming slack to slip through chokepoints or anchor if VMG collapses.'
        : phase === 'flood'
          ? 'Sail the side that turns flood into a lift; look for eddies on the inside of points for relief.'
          : 'Seek shoreline relief during the ebb and be ready to anchor if the boat makes sternway.';

    return {
      current: {
        speed: intel.current.speed,
        direction: directionDegrees,
        phase,
        strength,
        trend: intel.current.trend,
        flowLabel: intel.current.flow
      },
      tides: {
        highTide: {
          time: formatTimeLabel(intel.extremes.nextHigh?.time),
          height: highHeight
        },
        lowTide: {
          time: formatTimeLabel(intel.extremes.nextLow?.time),
          height: lowHeight
        },
        tidalRange: intel.range
      },
      raceTimeAnalysis: {
        currentSpeed: intel.current.speed,
        currentDirection: directionDegrees,
        phase,
        impact: impacts,
        tacticalAdvice
      },
      raceTimeForecast: {
        phase,
        directionLabel,
        directionDegrees,
        height: intel.current.height ?? null,
        summary: buildForecastSummary(phase, directionLabel, directionDegrees, intel.current.height ?? null),
      },
      slackWindow,
      source: 'worldtides' as const,
      lastUpdated: intel.fetchedAt
    } as TideData;
  }, [intel, realWeather?.tide?.direction]);

  const tideDataFromWeather = useMemo(() => {
    if (!realWeather?.tide) return null;

    const directionDegrees = realWeather.tide.direction ? cardinalToDegrees(realWeather.tide.direction) : null;
    const directionLabel = realWeather.tide.direction ?? degreesToCardinal(directionDegrees);
    const phase = realWeather.tide.state === 'flooding'
      ? 'flood'
      : realWeather.tide.state === 'ebbing'
        ? 'ebb'
        : 'slack';

    const strength = realWeather.tide.height > 1.5
      ? 'strong'
      : realWeather.tide.height > 0.8
        ? 'moderate'
        : 'weak';

    const tideHeight = typeof realWeather.tide.height === 'number' && !Number.isNaN(realWeather.tide.height)
      ? realWeather.tide.height
      : null;

    return {
      current: {
        speed: 0.5,
        direction: directionDegrees ?? 0,
        phase,
        strength,
        flowLabel: phase
      },
      tides: {
        highTide: {
          time: '—',
          height: tideHeight ?? Number.NaN
        },
        lowTide: {
          time: '—',
          height: Number.NaN
        },
        tidalRange: tideHeight ?? Number.NaN
      },
      raceTimeForecast: {
        phase,
        directionLabel,
        directionDegrees,
        height: tideHeight,
        summary: buildForecastSummary(phase, directionLabel, directionDegrees, tideHeight),
      },
      source: 'weather' as const,
      lastUpdated: new Date()
    } as TideData;
  }, [realWeather?.tide]);

  const showingRecordedSnapshot = isPastRace && !showLiveConditions && !!recordedTideData;

  const liveTideData: TideData | null =
    tideDataFromIntel ?? (useMockData ? mockTideData : tideDataFromWeather ?? null);

  const tideData: TideData | null = showingRecordedSnapshot
    ? recordedTideData ?? liveTideData ?? mockTideData
    : liveTideData ?? recordedTideData ?? mockTideData;

  const dataSource: 'mock' | 'weather' | 'worldtides' | 'saved' | 'recorded' =
    showingRecordedSnapshot && recordedTideData ? 'recorded'
    : tideDataFromIntel ? 'worldtides'
    : useMockData ? 'mock'
    : tideDataFromWeather ? 'weather'
    : metadataTide ? 'saved'
    : 'mock';

  const liveLoading = loading || (intelAvailable && !!intelCoordinates && intelLoading);
  const shouldShowLiveState = !isPastRace || showLiveConditions || !recordedTideData;
  const isLoading = shouldShowLiveState && liveLoading;
  const displayError = shouldShowLiveState
    ? error || intelError?.message || weatherError?.message || null
    : null;

  const getCardStatus = () => {
    if (isLoading) return 'generating';
    if (displayError) return 'error';
    if (!tideData) return 'not_set';
    return 'ready';
  };

  const getStatusMessage = () => {
    if (isLoading) return 'Loading tide intelligence...';
    if (displayError) return displayError;
    if (!tideData) return isPastRace ? 'No recorded tide data' : 'Preparing tide data...';
    if (showingRecordedSnapshot && recordedTideData) {
      return `Recorded ${formatRecordedTimestamp(recordedTideData.lastUpdated, raceTime)}`;
    }
    if (tideData.slackWindow) {
      if (tideData.slackWindow.isSlackNow) return 'Slack water now';
      if (typeof tideData.slackWindow.minutesUntilSlack === 'number') {
        const minutes = tideData.slackWindow.minutesUntilSlack;
        if (minutes === 0) return 'Slack water now';
        if (minutes > 0) return `Slack in ${minutes} min`;
        return `Slack was ${Math.abs(minutes)} min ago`;
      }
    }
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
    if (!Number.isFinite(degrees)) return '—';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
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
            onPress={() => loadMockTideData(null)}
            disabled={isLoading}
          >
            {isLoading ? (
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

    const recordedTimestampLabel = formatRecordedTimestamp(recordedTideData?.lastUpdated, raceTime);

    return (
      <View style={styles.tideContent}>
        {(() => {
          const badgeIcon = dataSource === 'recorded'
            ? 'flag-checkered'
            : dataSource === 'mock'
              ? 'flask-outline'
              : dataSource === 'worldtides'
                ? 'radar'
                : dataSource === 'saved'
                  ? 'content-save'
                  : 'wifi';
          const badgeLabel = dataSource === 'recorded'
            ? 'RECORDED SNAPSHOT'
            : dataSource === 'mock'
              ? 'SIMULATED'
              : dataSource === 'worldtides'
                ? 'WORLDTIDES PRO'
                : dataSource === 'saved'
                  ? 'SAVED FORECAST'
                  : 'LIVE DATA';
          const badgeContainerStyle = [
            styles.dataSourceBadge,
            dataSource === 'recorded'
              ? styles.dataSourceBadgeRecorded
              : dataSource === 'mock'
                ? styles.dataSourceBadgeMock
                : dataSource === 'worldtides'
                  ? styles.dataSourceBadgeWorldTides
                  : dataSource === 'saved'
                    ? styles.dataSourceBadgeSaved
                    : styles.dataSourceBadgeLive
          ];
          const badgeTextStyle = [
            styles.dataSourceText,
            dataSource === 'recorded'
              ? styles.dataSourceTextRecorded
              : dataSource === 'mock'
                ? styles.dataSourceTextMock
                : dataSource === 'worldtides'
                  ? styles.dataSourceTextWorldTides
                  : dataSource === 'saved'
                    ? styles.dataSourceTextSaved
                    : styles.dataSourceTextLive
          ];

          return (
            <View style={badgeContainerStyle}>
              <MaterialCommunityIcons
                name={badgeIcon}
                size={14}
                color={
                  dataSource === 'recorded'
                    ? '#0F172A'
                    : dataSource === 'mock'
                      ? '#D97706'
                      : dataSource === 'worldtides'
                        ? '#0369A1'
                        : dataSource === 'saved'
                          ? '#6366F1'
                          : '#10B981'
                }
              />
              <Text style={badgeTextStyle}>
                {badgeLabel}
              </Text>
            </View>
          );
        })()}

        {/* Data Source Indicator Badge */}
        {dataSource === 'mock' && (
          <Text style={styles.mockDataNotice}>
            Using mock data — add venue coordinates to fetch live tide forecasts.
          </Text>
        )}
        {showingRecordedSnapshot && (
          <View style={styles.recordedBanner}>
            <View style={styles.recordedBannerIcon}>
              <MaterialCommunityIcons name="history" size={18} color="#0F172A" />
            </View>
            <View style={styles.recordedBannerCopy}>
              <Text style={styles.recordedBannerTitle}>Race completed</Text>
              <Text style={styles.recordedBannerText}>
                Showing tide snapshot captured {recordedTimestampLabel}.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.recordedBannerAction}
              onPress={handleShowLiveConditions}
            >
              <Text style={styles.recordedBannerActionText}>View live</Text>
            </TouchableOpacity>
          </View>
        )}
        {isPastRace && showLiveConditions && recordedTideData && (
          <View style={styles.recordedBanner}>
            <View style={styles.recordedBannerIcon}>
              <MaterialCommunityIcons name="radar" size={18} color="#0F172A" />
            </View>
            <View style={styles.recordedBannerCopy}>
              <Text style={styles.recordedBannerTitle}>Live preview</Text>
              <Text style={styles.recordedBannerText}>
                Compare against snapshot from {recordedTimestampLabel}.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.recordedBannerAction}
              onPress={handleShowRecordedSnapshot}
            >
              <Text style={styles.recordedBannerActionText}>View snapshot</Text>
            </TouchableOpacity>
          </View>
        )}
        {dataSource === 'recorded' && initialTide?.provider && (
          <Text style={styles.recordedDataNotice}>
            Snapshot from {initialTide.provider}{initialTide.fetchedAt ? ` • Captured ${recordedTimestampLabel}` : ''}.
          </Text>
        )}
        {dataSource === 'saved' && initialTide?.provider && (
          <Text style={styles.savedDataNotice}>
            Latest forecast from {initialTide.provider}{initialTide.fetchedAt ? ` • Fetched ${(() => {
              const seconds = Math.floor((new Date().getTime() - new Date(initialTide.fetchedAt).getTime()) / 1000);
              if (seconds < 60) return 'just now';
              const minutes = Math.floor(seconds / 60);
              if (minutes < 60) return `${minutes}m ago`;
              const hours = Math.floor(minutes / 60);
              return `${hours}h ago`;
            })()}` : ''}.
          </Text>
        )}
        {dataSource === 'worldtides' && (
          <Text style={styles.worldTidesNotice}>
            Powered by WorldTides Pro — includes slack timing and tidal range intel.
          </Text>
        )}
        {tideData.raceTimeForecast && (
          <View style={styles.forecastSection}>
            <Text style={styles.sectionTitle}>
              {showingRecordedSnapshot ? 'Race-Time Snapshot' : 'Race Time Forecast'}
            </Text>
            <View style={styles.forecastMetrics}>
              <View style={styles.forecastMetric}>
                <Text style={styles.metricLabel}>Phase</Text>
                <Text style={styles.metricValue}>{formatPhaseLabel(tideData.raceTimeForecast.phase)}</Text>
              </View>
              <View style={styles.forecastMetric}>
                <Text style={styles.metricLabel}>Direction</Text>
                <Text style={styles.metricValue}>
                  {tideData.raceTimeForecast.directionLabel
                    ?? (typeof tideData.raceTimeForecast.directionDegrees === 'number'
                      ? degreesToCardinal(tideData.raceTimeForecast.directionDegrees)
                      : '—')}
                  {typeof tideData.raceTimeForecast.directionDegrees === 'number'
                    ? ` (${Math.round(tideData.raceTimeForecast.directionDegrees)}°)`
                    : ''}
                </Text>
              </View>
              <View style={styles.forecastMetric}>
                <Text style={styles.metricLabel}>Height</Text>
                <Text style={styles.metricValue}>
                  {typeof tideData.raceTimeForecast.height === 'number'
                    ? `${tideData.raceTimeForecast.height.toFixed(1)}m`
                    : '—'}
                </Text>
              </View>
            </View>
            {tideData.raceTimeForecast.summary && (
              <Text style={styles.forecastSummary}>{tideData.raceTimeForecast.summary}</Text>
            )}
          </View>
        )}

        {/* Current Flow */}
        <View style={styles.currentSection}>
          <View style={styles.currentHeader}>
            <Text style={styles.sectionTitle}>
              {showingRecordedSnapshot ? 'Recorded Flow' : 'Current Flow'}
            </Text>
            {!showingRecordedSnapshot && (
              <TouchableOpacity onPress={handleRefresh} disabled={isLoading}>
                <MaterialCommunityIcons name="refresh" size={20} color="#3B82F6" />
              </TouchableOpacity>
            )}
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
                      transform: [{
                        rotate: `${Number.isFinite(tideData.current.direction) ? tideData.current.direction : 0}deg`
                      }]
                    }}
                  />
                </View>
                <Text style={styles.currentDirectionText}>
                  {Number.isFinite(tideData.current.direction)
                    ? `${getDirectionLabel(tideData.current.direction)} (${Math.round(tideData.current.direction)}°)`
                    : (tideData.current.flowLabel ? tideData.current.flowLabel.toUpperCase() : '—')}
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

        {/* Slack Window */}
        {tideData.slackWindow && (
          <View style={styles.slackSection}>
            <View style={styles.slackHeader}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#0EA5E9" />
              <Text style={styles.slackTitle}>Slack Window</Text>
            </View>

            <View style={styles.slackRow}>
              <View style={styles.slackItem}>
                <Text style={styles.slackLabel}>Next Slack</Text>
                <Text style={styles.slackValue}>{tideData.slackWindow.nextSlackLabel}</Text>
              </View>
              <View style={styles.slackItem}>
                <Text style={styles.slackLabel}>Window</Text>
                <Text style={styles.slackValue}>{tideData.slackWindow.windowLabel}</Text>
              </View>
            </View>

            {typeof tideData.slackWindow.minutesUntilSlack === 'number' && (
              <Text style={styles.slackCountdown}>
                {tideData.slackWindow.minutesUntilSlack === 0
                  ? 'Slack water is occurring now.'
                  : tideData.slackWindow.minutesUntilSlack > 0
                    ? `Slack arrives in ${tideData.slackWindow.minutesUntilSlack} minutes.`
                    : `Slack ended ${Math.abs(tideData.slackWindow.minutesUntilSlack)} minutes ago.`}
              </Text>
            )}
          </View>
        )}

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
              <Text style={styles.tideTime}>
                {tideData.tides.highTide.time && tideData.tides.highTide.time !== '—'
                  ? tideData.tides.highTide.time
                  : '—'}
              </Text>
              <Text style={styles.tideHeight}>
                {Number.isFinite(tideData.tides.highTide.height)
                  ? `${tideData.tides.highTide.height.toFixed(1)}m`
                  : '—'}
              </Text>
            </View>

            {/* Low Tide */}
            <View style={styles.tideItem}>
              <View style={styles.tideHeader}>
                <MaterialCommunityIcons name="arrow-down-bold" size={20} color="#10B981" />
                <Text style={styles.tideLabel}>Low Tide</Text>
              </View>
              <Text style={styles.tideTime}>
                {tideData.tides.lowTide.time && tideData.tides.lowTide.time !== '—'
                  ? tideData.tides.lowTide.time
                  : '—'}
              </Text>
              <Text style={styles.tideHeight}>
                {Number.isFinite(tideData.tides.lowTide.height)
                  ? `${tideData.tides.lowTide.height.toFixed(1)}m`
                  : '—'}
              </Text>
            </View>

            {/* Tidal Range */}
            <View style={styles.tideItem}>
              <View style={styles.tideHeader}>
                <MaterialCommunityIcons name="arrow-expand-vertical" size={20} color="#F59E0B" />
                <Text style={styles.tideLabel}>Range</Text>
              </View>
              <Text style={styles.tideRange}>
                {Number.isFinite(tideData.tides.tidalRange)
                  ? `${tideData.tides.tidalRange.toFixed(1)}m`
                  : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Race Time Analysis */}
        {tideData.raceTimeAnalysis && raceTime && (
          <View style={styles.analysisSection}>
            <Text style={styles.sectionTitle}>
              {showingRecordedSnapshot ? 'Race Notes' : 'Race Time Impact'}
            </Text>

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
  forecastSection: {
    marginBottom: 16,
    gap: 12,
  },
  forecastMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  forecastMetric: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  forecastSummary: {
    fontSize: 13,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  dataSourceBadgeRecorded: {
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5F5',
  },
  dataSourceBadgeMock: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  dataSourceBadgeWorldTides: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  dataSourceText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dataSourceTextLive: {
    color: '#059669',
  },
  dataSourceTextRecorded: {
    color: '#0F172A',
  },
  dataSourceTextMock: {
    color: '#D97706',
  },
  dataSourceTextWorldTides: {
    color: '#0369A1',
  },
  dataSourceBadgeSaved: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#A5B4FC',
  },
  dataSourceTextSaved: {
    color: '#6366F1',
  },
  mockDataNotice: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: 16,
  },
  recordedDataNotice: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 16,
  },
  savedDataNotice: {
    fontSize: 12,
    color: '#4F46E5',
    marginBottom: 16,
  },
  worldTidesNotice: {
    fontSize: 12,
    color: '#0C4A6E',
    marginBottom: 16,
  },
  recordedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  recordedBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordedBannerCopy: {
    flex: 1,
    gap: 2,
  },
  recordedBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordedBannerText: {
    fontSize: 12,
    color: '#1E293B',
  },
  recordedBannerAction: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1D4ED8',
  },
  recordedBannerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  slackSection: {
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#67E8F9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  slackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  slackRow: {
    flexDirection: 'row',
    gap: 12,
  },
  slackItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 4,
  },
  slackLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
    letterSpacing: 0.2,
  },
  slackValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  slackCountdown: {
    fontSize: 12,
    color: '#0C4A6E',
  },
});

const DEGREE_DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function degreesToCardinal(degrees: number | null | undefined): string {
  if (typeof degrees !== 'number' || Number.isNaN(degrees)) {
    return '—';
  }
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % DEGREE_DIRECTIONS.length;
  return DEGREE_DIRECTIONS[index];
}

function formatPhaseLabel(phase: 'flood' | 'ebb' | 'slack' | 'high' | 'low'): string {
  switch (phase) {
    case 'flood':
      return 'Flood';
    case 'ebb':
      return 'Ebb';
    case 'slack':
      return 'Slack';
    case 'high':
      return 'High Tide';
    case 'low':
      return 'Low Tide';
    default:
      return phase;
  }
}

function buildForecastSummary(
  phase: 'flood' | 'ebb' | 'slack' | 'high' | 'low',
  directionLabel: string | null | undefined,
  directionDegrees: number | null | undefined,
  height: number | null | undefined
): string | undefined {
  const segments: string[] = [];
  const phaseLabel = formatPhaseLabel(phase);
  if (phaseLabel) {
    segments.push(
      phase === 'slack'
        ? 'Slack water'
        : `${phaseLabel} current`
    );
  }

  if (typeof height === 'number' && !Number.isNaN(height)) {
    segments.push(`${height.toFixed(1)}m tide height`);
  }

  const direction = directionLabel || degreesToCardinal(directionDegrees ?? null);
  if (direction && direction !== '—') {
    segments.push(`Flow from ${direction}`);
  }

  if (segments.length === 0) {
    return undefined;
  }

  return segments.join(' • ');
}

function formatRecordedTimestamp(recordedDate?: Date, raceTime?: string): string {
  const snapshot = recordedDate ?? (raceTime ? new Date(raceTime) : null);
  if (!snapshot || Number.isNaN(snapshot.getTime())) {
    return 'at race start';
  }

  return snapshot.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
