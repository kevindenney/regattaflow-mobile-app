/**
 * ForecastCheckWizard
 *
 * Multi-step weather forecast check wizard for race preparation.
 * Captures forecast snapshots and shows AI-powered analysis of changes.
 *
 * Tufte-style data visualization:
 * - Sparklines showing forecast across race window
 * - Time-aligned values for precise reading
 * - Minimal decoration, maximum data-ink ratio
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  CloudSun,
  Wind,
  Waves,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Sparkles,
  Check,
  RefreshCw,
  BookOpen,
  ArrowRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useForecastCheck } from '@/hooks/useForecastCheck';
import { TinySparkline } from '@/components/shared/charts/TinySparkline';
import type { ChecklistItem } from '@/types/checklists';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import type { SailingVenue } from '@/lib/types/global-venues';
import type { ForecastSnapshot, ForecastAnalysis } from '@/types/raceIntentions';
import type { HourlyDataPoint } from '@/hooks/useRaceWeatherForecast';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  yellow: '#FFCC00',
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

type WizardStep = 'loading' | 'current' | 'comparison' | 'analysis' | 'confirm';

interface ForecastCheckWizardProps extends ChecklistToolProps {
  venue?: SailingVenue | null;
  raceDate?: string | null;
  /** Race name for header display */
  raceName?: string;
  /** Actual race start time (e.g., "10:30") - used instead of forecast timestamps */
  raceStartTime?: string;
}

export function ForecastCheckWizard({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
  venue,
  raceDate,
  raceName,
  raceStartTime,
}: ForecastCheckWizardProps) {
  const router = useRouter();

  // Forecast check hook
  const {
    currentForecast,
    isLoadingForecast,
    forecastError,
    snapshots,
    latestAnalysis,
    lastCheckedAt,
    captureSnapshot,
    isCapturing,
    captureError,
    hasSnapshots,
    hasChanges,
    changeLevel,
  } = useForecastCheck({
    raceEventId,
    venue: venue || null,
    raceDate: raceDate || null,
  });

  // State
  const [step, setStep] = useState<WizardStep>('loading');
  const [newSnapshot, setNewSnapshot] = useState<ForecastSnapshot | null>(null);
  const [newAnalysis, setNewAnalysis] = useState<ForecastAnalysis | null>(null);
  const [captureComplete, setCaptureComplete] = useState(false);

  // Determine initial step once forecast loads
  useEffect(() => {
    if (!isLoadingForecast && currentForecast) {
      setStep('current');
    } else if (!isLoadingForecast && !currentForecast) {
      // No forecast available - show error state
      setStep('current');
    }
  }, [isLoadingForecast, currentForecast]);

  // Format time for display (relative)
  const formatTime = useCallback((isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  }, []);

  // Format data source timestamp for footer
  const formatDataSourceTime = useCallback((date: Date | string | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  }, []);

  // Format race date for header display (e.g., "Sat 18 Jan")
  const formatRaceDate = useCallback((dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
    } catch {
      return '';
    }
  }, []);

  // Navigate to edit race
  const handleEditRace = useCallback(() => {
    if (!raceEventId) return;
    onCancel(); // Close modal first
    setTimeout(() => {
      router.push(`/race/edit/${raceEventId}`);
    }, 150);
  }, [raceEventId, onCancel, router]);

  // Get trend icon
  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'building':
        return <TrendingUp size={16} color={IOS_COLORS.orange} />;
      case 'easing':
        return <TrendingDown size={16} color={IOS_COLORS.green} />;
      default:
        return <Minus size={16} color={IOS_COLORS.gray} />;
    }
  }, []);

  // Get alert level color
  const getAlertColor = useCallback((level: string | null) => {
    switch (level) {
      case 'significant_change':
        return IOS_COLORS.red;
      case 'minor_change':
        return IOS_COLORS.orange;
      case 'stable':
        return IOS_COLORS.green;
      default:
        return IOS_COLORS.gray;
    }
  }, []);

  // Handle capture and move to next step
  const handleCapture = useCallback(async () => {
    try {
      const result = await captureSnapshot();
      setNewSnapshot(result.snapshot);
      setNewAnalysis(result.analysis);
      setCaptureComplete(true);

      // Move to appropriate step
      if (result.analysis) {
        setStep('analysis');
      } else {
        setStep('confirm');
      }
    } catch (error) {
      // Error is handled by hook, stay on current step
      console.error('Capture failed:', error);
    }
  }, [captureSnapshot]);

  // Handle learn more - navigate to Weather & Conditions module in Race Preparation Mastery course
  const handleLearnMore = useCallback(() => {
    onCancel(); // Close modal first
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/learn/race-preparation-mastery',
        params: {
          moduleId: 'module-13-1', // Weather & Conditions module
        },
      });
    }, 150);
  }, [router, onCancel]);

  // Calculate progress
  const progress = useMemo(() => {
    const steps = hasSnapshots ? 4 : 2;
    const stepMap: Record<WizardStep, number> = {
      loading: 0,
      current: 1,
      comparison: 2,
      analysis: 3,
      confirm: hasSnapshots ? 4 : 2,
    };
    return stepMap[step] / steps;
  }, [step, hasSnapshots]);

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={IOS_COLORS.blue} />
      <Text style={styles.loadingText}>Loading forecast data...</Text>
    </View>
  );

  // Helper: Inline sparkline component for summary rows
  const InlineSparkline = ({
    data,
    color,
    width = 80,
    height = 20,
  }: {
    data: number[];
    color: string;
    width?: number;
    height?: number;
  }) => {
    if (!data || data.length < 2) return null;
    return (
      <TinySparkline
        data={data}
        width={width}
        height={height}
        color={color}
        variant="line"
        highlightPeak
      />
    );
  };

  // Helper: Estimate tide flow state from height trend
  const getTideState = (
    currentHeight: number,
    highTide: { time: string; height: number } | undefined,
    lowTide: { time: string; height: number } | undefined,
    currentTime: string
  ): 'flood' | 'ebb' | 'slack' => {
    if (!highTide || !lowTide) return 'slack';

    // Parse times to compare
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const current = parseTime(currentTime);
    const high = parseTime(highTide.time);
    const low = parseTime(lowTide.time);

    // If high tide is before low tide, we're ebbing after high
    if (high < low) {
      if (current < high) return 'flood';
      if (current > low) return 'flood';
      return 'ebb';
    } else {
      // Low tide is before high tide
      if (current < low) return 'ebb';
      if (current > high) return 'ebb';
      return 'flood';
    }
  };

  // Helper: Interpolate wind at a specific time
  const interpolateWind = (
    hourlyWind: HourlyDataPoint[],
    targetTime: string
  ): { speed: number; direction: string } | null => {
    if (!hourlyWind.length) return null;

    // Find closest hour
    const targetHour = parseInt(targetTime.split(':')[0], 10);
    const closest = hourlyWind.reduce((prev, curr) => {
      const prevHour = parseInt(prev.time.split(':')[0], 10);
      const currHour = parseInt(curr.time.split(':')[0], 10);
      return Math.abs(currHour - targetHour) < Math.abs(prevHour - targetHour) ? curr : prev;
    });

    return { speed: closest.value, direction: closest.direction || '' };
  };

  // Render current forecast step - Race Conditions card style with event table
  const renderCurrentForecast = () => {
    // Check for missing venue first - this is the most common issue
    if (!venue) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={IOS_COLORS.orange} />
          <Text style={styles.errorTitle}>Venue Location Required</Text>
          <Text style={styles.errorDescription}>
            To see the weather forecast, please set a venue location for this race.
            You can do this by editing the race and selecting or creating a venue with coordinates.
          </Text>
        </View>
      );
    }

    if (!currentForecast?.raceWindow) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={IOS_COLORS.orange} />
          <Text style={styles.errorTitle}>Forecast Unavailable</Text>
          <Text style={styles.errorDescription}>
            {forecastError?.message ||
              'Unable to load forecast for this race. The race may be too far in the future or the weather service may be temporarily unavailable.'}
          </Text>
        </View>
      );
    }

    const rw = currentForecast.raceWindow;
    const hourlyWind = currentForecast.hourlyWind || [];
    const hourlyTide = currentForecast.hourlyTide || [];
    const hourlyWaves = currentForecast.hourlyWaves || [];

    // Extract data for sparklines
    const windSpeeds = hourlyWind.length > 0
      ? hourlyWind.map((d) => d.value)
      : currentForecast.windForecast;
    const tideSpeeds = hourlyTide.length > 0
      ? hourlyTide.map((d) => d.value)
      : currentForecast.tideForecast;
    const waveSpeeds = hourlyWaves.length > 0
      ? hourlyWaves.map((d) => d.value)
      : [];

    // Calculate min/max ranges
    const windMin = Math.min(...windSpeeds);
    const windMax = Math.max(...windSpeeds);
    const tideMin = Math.min(...tideSpeeds.filter((v) => v > 0));
    const tideMax = Math.max(...tideSpeeds);
    const waveMin = waveSpeeds.length > 0 ? Math.min(...waveSpeeds.filter((v) => v > 0)) : 0;
    const waveMax = waveSpeeds.length > 0 ? Math.max(...waveSpeeds) : 0;
    const hasWaveData = waveSpeeds.length > 0 && waveMax > 0;

    // Determine tide flow state
    const tideState = getTideState(
      rw.tideAtStart,
      currentForecast.highTide,
      currentForecast.lowTide,
      rw.raceStartTime
    );

    // Helper: Interpolate wave at a specific time
    const interpolateWave = (targetTime: string): number | null => {
      if (!hourlyWaves.length) return null;

      const targetHour = parseInt(targetTime.split(':')[0], 10);
      const closest = hourlyWaves.reduce((prev, curr) => {
        const prevHour = parseInt(prev.time.split(':')[0], 10);
        const currHour = parseInt(curr.time.split(':')[0], 10);
        return Math.abs(currHour - targetHour) < Math.abs(prevHour - targetHour) ? curr : prev;
      });

      return closest.value;
    };

    // Build race events timeline
    const buildRaceEvents = () => {
      const events: Array<{
        time: string;
        label: string;
        wind: number;
        direction: string;
        tide: number;
        tideState: string;
        wave?: number;
      }> = [];

      // Parse start time
      const [startH, startM] = rw.raceStartTime.split(':').map(Number);
      const [endH, endM] = rw.raceEndTime.split(':').map(Number);

      // Calculate duration in minutes
      let durationMin = (endH * 60 + endM) - (startH * 60 + startM);
      if (durationMin < 0) durationMin += 24 * 60; // Handle overnight

      // Helper to format time
      const formatEventTime = (h: number, m: number) => {
        const hh = ((h % 24) + 24) % 24;
        return `${hh.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      };

      // Helper to add minutes
      const addMinutes = (h: number, m: number, addMin: number) => {
        const totalMin = h * 60 + m + addMin;
        return {
          h: Math.floor(totalMin / 60) % 24,
          m: totalMin % 60,
        };
      };

      // -30m before start
      const minus30 = addMinutes(startH, startM, -30);
      const minus30Time = formatEventTime(minus30.h, minus30.m);
      const minus30Wind = interpolateWind(hourlyWind, minus30Time);
      const minus30Wave = interpolateWave(minus30Time);
      events.push({
        time: minus30Time,
        label: '-30m',
        wind: minus30Wind?.speed || rw.windAtStart,
        direction: minus30Wind?.direction || rw.windDirectionAtStart,
        tide: rw.tideAtStart,
        tideState: tideState,
        wave: minus30Wave ?? rw.waveHeightAtStart,
      });

      // Warning signal (-5m)
      const warn = addMinutes(startH, startM, -5);
      const warnTime = formatEventTime(warn.h, warn.m);
      const warnWind = interpolateWind(hourlyWind, warnTime);
      const warnWave = interpolateWave(warnTime);
      events.push({
        time: warnTime,
        label: 'Warn',
        wind: warnWind?.speed || rw.windAtStart,
        direction: warnWind?.direction || rw.windDirectionAtStart,
        tide: rw.tideAtStart,
        tideState: tideState,
        wave: warnWave ?? rw.waveHeightAtStart,
      });

      // Start
      events.push({
        time: rw.raceStartTime,
        label: 'Start',
        wind: rw.windAtStart,
        direction: rw.windDirectionAtStart,
        tide: rw.tideAtStart,
        tideState: tideState,
        wave: rw.waveHeightAtStart,
      });

      // Mid-race
      const mid = addMinutes(startH, startM, Math.floor(durationMin / 2));
      const midTime = formatEventTime(mid.h, mid.m);
      const midWind = interpolateWind(hourlyWind, midTime);
      const midWave = interpolateWave(midTime);
      const midTideState = getTideState(
        (rw.tideAtStart + rw.tideAtEnd) / 2,
        currentForecast.highTide,
        currentForecast.lowTide,
        midTime
      );
      const midWaveHeight = rw.waveHeightAtStart !== undefined && rw.waveHeightAtEnd !== undefined
        ? (rw.waveHeightAtStart + rw.waveHeightAtEnd) / 2
        : undefined;
      events.push({
        time: midTime,
        label: 'Mid',
        wind: midWind?.speed || Math.round((rw.windAtStart + rw.windAtEnd) / 2),
        direction: midWind?.direction || rw.windDirectionAtStart,
        tide: (rw.tideAtStart + rw.tideAtEnd) / 2,
        tideState: midTideState,
        wave: midWave ?? midWaveHeight,
      });

      // Finish
      const endTideState = getTideState(
        rw.tideAtEnd,
        currentForecast.highTide,
        currentForecast.lowTide,
        rw.raceEndTime
      );
      events.push({
        time: rw.raceEndTime,
        label: 'Finish',
        wind: rw.windAtEnd,
        direction: rw.windDirectionAtStart, // May shift but using start as default
        tide: rw.tideAtEnd,
        tideState: endTideState,
        wave: rw.waveHeightAtEnd,
      });

      return events;
    };

    const raceEvents = buildRaceEvents();

    // Use actual race start time if provided, otherwise use forecast timestamp
    const displayStartTime = raceStartTime || rw.raceStartTime;
    const formattedDate = formatRaceDate(raceDate);

    return (
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
      >
        {/* Header - tappable to edit race */}
        <Pressable
          style={rcStyles.header}
          onPress={handleEditRace}
          disabled={!raceEventId}
        >
          <Text style={rcStyles.headerTitle}>
            {raceName || 'Race Forecast'}
          </Text>
          <View style={rcStyles.headerTimeRow}>
            <Text style={rcStyles.headerTime}>
              {formattedDate ? `${formattedDate} · ` : ''}{displayStartTime} start
            </Text>
            {raceEventId && (
              <ChevronRight size={14} color={IOS_COLORS.gray} style={{ marginLeft: 4 }} />
            )}
          </View>
        </Pressable>

        {/* Summary Section */}
        <View style={rcStyles.summarySection}>
          {/* Wind Summary Row */}
          <View style={rcStyles.summaryRow}>
            <Text style={rcStyles.summaryLabel}>Wind</Text>
            <View style={rcStyles.sparklineContainer}>
              <InlineSparkline data={windSpeeds} color={IOS_COLORS.blue} />
            </View>
            <View style={rcStyles.rangeContainer}>
              <Text style={rcStyles.rangeValue}>{windMin}–{windMax}</Text>
              <Text style={rcStyles.rangeUnit}>kts</Text>
            </View>
            <View style={rcStyles.directionContainer}>
              <Text style={rcStyles.directionArrow}>↗</Text>
              <Text style={rcStyles.directionText}>{rw.windDirectionAtStart}</Text>
            </View>
          </View>

          {/* Current/Tide Summary Row */}
          <View style={rcStyles.summaryRow}>
            <Text style={rcStyles.summaryLabel}>Current</Text>
            <View style={rcStyles.sparklineContainer}>
              <InlineSparkline data={tideSpeeds} color={IOS_COLORS.green} />
            </View>
            <View style={rcStyles.rangeContainer}>
              <Text style={rcStyles.rangeValue}>
                {tideMin.toFixed(1)}–{tideMax.toFixed(1)}
              </Text>
              <Text style={rcStyles.rangeUnit}>m</Text>
            </View>
            <View style={rcStyles.directionContainer}>
              <Text style={rcStyles.tideStateText}>
                {tideState.charAt(0).toUpperCase() + tideState.slice(1)}
              </Text>
            </View>
          </View>

          {/* Waves Summary Row */}
          {hasWaveData && (
            <View style={rcStyles.summaryRow}>
              <Text style={rcStyles.summaryLabel}>Waves</Text>
              <View style={rcStyles.sparklineContainer}>
                <InlineSparkline data={waveSpeeds} color={IOS_COLORS.orange} />
              </View>
              <View style={rcStyles.rangeContainer}>
                <Text style={rcStyles.rangeValue}>
                  {waveMin.toFixed(1)}–{waveMax.toFixed(1)}
                </Text>
                <Text style={rcStyles.rangeUnit}>m</Text>
              </View>
              <View style={rcStyles.directionContainer}>
                <Text style={rcStyles.directionText}>
                  {currentForecast.swellDirection || rw.waveDirectionAtStart || ''}
                </Text>
                {currentForecast.wavePeriod && (
                  <Text style={rcStyles.wavePeriodText}> {currentForecast.wavePeriod}s</Text>
                )}
              </View>
            </View>
          )}

          {/* Temperature Row */}
          {rw.airTemperature !== undefined && (
            <View style={rcStyles.summaryRow}>
              <Text style={rcStyles.summaryLabel}>Temp</Text>
              <View style={rcStyles.sparklineContainer}>
                {/* Empty space for alignment */}
              </View>
              <View style={rcStyles.rangeContainer}>
                <Text style={rcStyles.rangeValue}>Air {rw.airTemperature}°</Text>
                <Text style={rcStyles.rangeUnit}>C</Text>
              </View>
              <View style={rcStyles.directionContainer}>
                {rw.waterTemperature !== undefined && (
                  <Text style={rcStyles.directionText}>
                    Water {rw.waterTemperature}°C
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Wind Trend */}
          {currentForecast.windTrend && (
            <Text style={rcStyles.trendInfo}>
              Wind {currentForecast.windTrend} · Beaufort {rw.beaufortAtStart}
              {rw.beaufortAtStart !== rw.beaufortAtEnd && ` → ${rw.beaufortAtEnd}`}
            </Text>
          )}
        </View>

        {/* Event-based Data Table */}
        <View style={rcStyles.eventTable}>
          {/* Table Header */}
          <View style={rcStyles.eventTableHeader}>
            <Text style={[rcStyles.eventTableHeaderCell, rcStyles.timeCol]}>TIME</Text>
            <Text style={[rcStyles.eventTableHeaderCell, rcStyles.eventCol]}>EVENT</Text>
            <Text style={[rcStyles.eventTableHeaderCell, rcStyles.windCol]}>WIND</Text>
            <Text style={[rcStyles.eventTableHeaderCell, rcStyles.tideCol]}>TIDE</Text>
            {hasWaveData && (
              <Text style={[rcStyles.eventTableHeaderCell, rcStyles.waveCol]}>WAVE</Text>
            )}
          </View>

          {/* Table Rows */}
          {raceEvents.map((event, index) => {
            const isRaceEvent = ['Start', 'Finish'].includes(event.label);
            return (
              <View
                key={index}
                style={[
                  rcStyles.eventTableRow,
                  isRaceEvent && rcStyles.eventTableRowHighlight,
                ]}
              >
                <Text style={[rcStyles.eventTableCell, rcStyles.timeCol, rcStyles.timeText]}>
                  {event.time}
                </Text>
                <Text
                  style={[
                    rcStyles.eventTableCell,
                    rcStyles.eventCol,
                    rcStyles.eventText,
                    isRaceEvent && rcStyles.eventTextBold,
                  ]}
                >
                  {event.label}
                </Text>
                <View style={[rcStyles.windCol, rcStyles.windCell]}>
                  <Text style={rcStyles.windValue}>{Math.round(event.wind)}</Text>
                  <Text style={rcStyles.windDirection}>↗ {event.direction}</Text>
                </View>
                <View style={[rcStyles.tideCol, rcStyles.tideCell]}>
                  <Text style={rcStyles.tideValue}>{event.tide.toFixed(1)}</Text>
                  <Text style={rcStyles.tideStateSmall}>
                    {event.tideState.slice(0, 3)}
                  </Text>
                </View>
                {hasWaveData && (
                  <View style={[rcStyles.waveCol, rcStyles.waveCell]}>
                    <Text style={rcStyles.waveValue}>
                      {event.wave !== undefined ? event.wave.toFixed(1) : '-'}
                    </Text>
                    <Text style={rcStyles.waveUnit}>m</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Tide Times */}
        <View style={rcStyles.tideTimesSection}>
          {currentForecast.highTide && (
            <Text style={rcStyles.tideTimeText}>
              <Text style={rcStyles.tideLabel}>HW</Text>{' '}
              {currentForecast.highTide.time}
              <Text style={rcStyles.tideHeight}> ({currentForecast.highTide.height.toFixed(1)}m)</Text>
            </Text>
          )}
          {currentForecast.highTide && currentForecast.lowTide && (
            <Text style={rcStyles.tideSeparator}> → </Text>
          )}
          {currentForecast.lowTide && (
            <Text style={rcStyles.tideTimeText}>
              <Text style={rcStyles.tideLabel}>LW</Text>{' '}
              {currentForecast.lowTide.time}
              <Text style={rcStyles.tideHeight}> ({currentForecast.lowTide.height.toFixed(1)}m)</Text>
            </Text>
          )}
        </View>

        {/* Tidal Range */}
        {currentForecast.tideRange !== undefined && (
          <Text style={rcStyles.rangeInfo}>
            Range {currentForecast.tideRange.toFixed(1)}m
          </Text>
        )}

        {/* First Check Notice */}
        {!hasSnapshots && (
          <View style={rcStyles.firstCheckNotice}>
            <Text style={rcStyles.firstCheckText}>
              First check · future checks will show changes
            </Text>
          </View>
        )}

        {/* Data Source Attribution Footer */}
        {currentForecast?.dataSource && (
          <View style={rcStyles.dataSourceFooter}>
            <Text style={rcStyles.dataSourceText}>
              {currentForecast.dataSource.isMock ? (
                'Mock data · Development mode'
              ) : (
                `${currentForecast.dataSource.provider} · Updated ${formatDataSourceTime(currentForecast.dataSource.fetchedAt)}`
              )}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // Render comparison step - Tufte style
  const renderComparison = () => {
    if (snapshots.length < 2) return null;

    const previous = snapshots[snapshots.length - 2];
    const current = newSnapshot || snapshots[snapshots.length - 1];

    // Calculate deltas
    const windDelta = current.raceWindow.windAtStart - previous.raceWindow.windAtStart;
    const tideDelta = current.raceWindow.tideAtStart - previous.raceWindow.tideAtStart;
    const directionChanged =
      current.raceWindow.windDirectionAtStart !== previous.raceWindow.windDirectionAtStart;

    return (
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
      >
        {/* Tufte header */}
        <View style={tufteStyles.header}>
          <Text style={tufteStyles.headerTitle}>Forecast Change</Text>
          <Text style={tufteStyles.headerSubtitle}>
            {formatTime(previous.capturedAt)} → now
          </Text>
        </View>

        {/* Wind Comparison - Tufte style */}
        <View style={tufteStyles.section}>
          <Text style={tufteStyles.sectionLabel}>WIND</Text>

          <View style={tufteCompStyles.comparisonRow}>
            {/* Previous */}
            <View style={tufteCompStyles.valueColumn}>
              <Text style={tufteCompStyles.columnLabel}>was</Text>
              <Text style={tufteCompStyles.oldValue}>
                {previous.raceWindow.windAtStart.toFixed(0)}
                <Text style={tufteCompStyles.oldUnit}> kt</Text>
              </Text>
              <Text style={tufteCompStyles.oldDirection}>
                {previous.raceWindow.windDirectionAtStart}
              </Text>
            </View>

            {/* Arrow */}
            <Text style={tufteCompStyles.arrow}>→</Text>

            {/* Current */}
            <View style={tufteCompStyles.valueColumn}>
              <Text style={tufteCompStyles.columnLabel}>now</Text>
              <Text style={tufteCompStyles.newValue}>
                {current.raceWindow.windAtStart.toFixed(0)}
                <Text style={tufteCompStyles.newUnit}> kt</Text>
              </Text>
              <Text style={tufteCompStyles.newDirection}>
                {current.raceWindow.windDirectionAtStart}
              </Text>
            </View>

            {/* Delta */}
            <View style={tufteCompStyles.deltaColumn}>
              <Text
                style={[
                  tufteCompStyles.deltaValue,
                  windDelta > 0 && tufteCompStyles.deltaUp,
                  windDelta < 0 && tufteCompStyles.deltaDown,
                ]}
              >
                {windDelta > 0 ? '+' : ''}{windDelta.toFixed(0)}
              </Text>
              {directionChanged && (
                <Text style={tufteCompStyles.deltaNote}>dir shift</Text>
              )}
            </View>
          </View>

          {/* Sparkline comparison if data available */}
          {previous.windForecast && current.windForecast && (
            <View style={tufteCompStyles.sparklineComparison}>
              <View style={tufteCompStyles.sparklineWithLabel}>
                <Text style={tufteCompStyles.sparklineLabel}>was</Text>
                <TinySparkline
                  data={previous.windForecast}
                  width={120}
                  height={24}
                  color={IOS_COLORS.gray}
                  variant="line"
                />
              </View>
              <View style={tufteCompStyles.sparklineWithLabel}>
                <Text style={tufteCompStyles.sparklineLabel}>now</Text>
                <TinySparkline
                  data={current.windForecast}
                  width={120}
                  height={24}
                  color={IOS_COLORS.blue}
                  variant="line"
                />
              </View>
            </View>
          )}
        </View>

        {/* Tide Comparison - Tufte style */}
        <View style={tufteStyles.section}>
          <Text style={tufteStyles.sectionLabel}>TIDE</Text>

          <View style={tufteCompStyles.comparisonRow}>
            {/* Previous */}
            <View style={tufteCompStyles.valueColumn}>
              <Text style={tufteCompStyles.columnLabel}>was</Text>
              <Text style={tufteCompStyles.oldValue}>
                {previous.raceWindow.tideAtStart.toFixed(1)}
                <Text style={tufteCompStyles.oldUnit}> m</Text>
              </Text>
            </View>

            {/* Arrow */}
            <Text style={tufteCompStyles.arrow}>→</Text>

            {/* Current */}
            <View style={tufteCompStyles.valueColumn}>
              <Text style={tufteCompStyles.columnLabel}>now</Text>
              <Text style={[tufteCompStyles.newValue, { color: IOS_COLORS.purple }]}>
                {current.raceWindow.tideAtStart.toFixed(1)}
                <Text style={tufteCompStyles.newUnit}> m</Text>
              </Text>
            </View>

            {/* Delta */}
            <View style={tufteCompStyles.deltaColumn}>
              <Text
                style={[
                  tufteCompStyles.deltaValue,
                  tideDelta > 0 && tufteCompStyles.deltaUp,
                  tideDelta < 0 && tufteCompStyles.deltaDown,
                ]}
              >
                {tideDelta > 0 ? '+' : ''}{tideDelta.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Sparkline comparison if data available */}
          {previous.tideForecast && current.tideForecast && (
            <View style={tufteCompStyles.sparklineComparison}>
              <View style={tufteCompStyles.sparklineWithLabel}>
                <Text style={tufteCompStyles.sparklineLabel}>was</Text>
                <TinySparkline
                  data={previous.tideForecast}
                  width={120}
                  height={24}
                  color={IOS_COLORS.gray}
                  variant="area"
                />
              </View>
              <View style={tufteCompStyles.sparklineWithLabel}>
                <Text style={tufteCompStyles.sparklineLabel}>now</Text>
                <TinySparkline
                  data={current.tideForecast}
                  width={120}
                  height={24}
                  color={IOS_COLORS.purple}
                  variant="area"
                />
              </View>
            </View>
          )}
        </View>

        {/* Snapshot Timeline */}
        <View style={tufteCompStyles.timeline}>
          <Text style={tufteStyles.sectionLabel}>HISTORY</Text>
          {snapshots.map((snapshot, index) => {
            const isLatest = index === snapshots.length - 1;
            return (
              <View key={snapshot.id} style={tufteCompStyles.timelineItem}>
                <View
                  style={[
                    tufteCompStyles.timelineDot,
                    isLatest && tufteCompStyles.timelineDotActive,
                  ]}
                />
                <Text style={tufteCompStyles.timelineText}>
                  {formatTime(snapshot.capturedAt)}
                </Text>
                <Text style={tufteCompStyles.timelineValue}>
                  {snapshot.raceWindow.windAtStart.toFixed(0)} kt{' '}
                  {snapshot.raceWindow.windDirectionAtStart}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  // Render analysis step
  const renderAnalysis = () => {
    const analysis = newAnalysis || latestAnalysis;

    if (!analysis) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Analysis Available</Text>
          <Text style={styles.errorDescription}>
            Analysis requires at least two forecast snapshots.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
      >
        {/* Header with Alert Level */}
        <View style={styles.overviewHeader}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${getAlertColor(analysis.alertLevel)}15` },
            ]}
          >
            <Sparkles size={32} color={getAlertColor(analysis.alertLevel)} />
          </View>
          <View
            style={[
              styles.alertBadge,
              { backgroundColor: `${getAlertColor(analysis.alertLevel)}15` },
            ]}
          >
            <Text
              style={[
                styles.alertBadgeText,
                { color: getAlertColor(analysis.alertLevel) },
              ]}
            >
              {analysis.alertLevel === 'significant_change'
                ? 'Significant Changes'
                : analysis.alertLevel === 'minor_change'
                ? 'Minor Changes'
                : 'Stable Forecast'}
            </Text>
          </View>
          <Text style={styles.overviewTitle}>AI Analysis</Text>
        </View>

        {/* Summary */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisCardTitle}>Summary</Text>
          <Text style={styles.analysisSummary}>{analysis.summary}</Text>
        </View>

        {/* Implications */}
        {analysis.implications.length > 0 && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisCardTitle}>
              Tactical Implications
            </Text>
            {analysis.implications.map((implication, index) => (
              <View key={index} style={styles.implicationRow}>
                <View style={styles.implicationBullet} />
                <Text style={styles.implicationText}>{implication}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Specific Changes */}
        {(analysis.changes.wind ||
          analysis.changes.tide ||
          analysis.changes.conditions) && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisCardTitle}>What Changed</Text>
            {analysis.changes.wind && (
              <View style={styles.changeItem}>
                <Wind size={18} color={IOS_COLORS.blue} />
                <View style={styles.changeContent}>
                  <Text style={styles.changeLabel}>Wind</Text>
                  <Text style={styles.changeDetail}>
                    {analysis.changes.wind.from} → {analysis.changes.wind.to}
                  </Text>
                  <Text style={styles.changeImpact}>
                    {analysis.changes.wind.impact}
                  </Text>
                </View>
              </View>
            )}
            {analysis.changes.tide && (
              <View style={styles.changeItem}>
                <Waves size={18} color={IOS_COLORS.purple} />
                <View style={styles.changeContent}>
                  <Text style={styles.changeLabel}>Tide</Text>
                  <Text style={styles.changeDetail}>
                    {analysis.changes.tide.from} → {analysis.changes.tide.to}
                  </Text>
                  <Text style={styles.changeImpact}>
                    {analysis.changes.tide.impact}
                  </Text>
                </View>
              </View>
            )}
            {analysis.changes.conditions && (
              <View style={styles.changeItem}>
                <CloudSun size={18} color={IOS_COLORS.orange} />
                <View style={styles.changeContent}>
                  <Text style={styles.changeLabel}>Conditions</Text>
                  <Text style={styles.changeDetail}>
                    {analysis.changes.conditions.from} →{' '}
                    {analysis.changes.conditions.to}
                  </Text>
                  <Text style={styles.changeImpact}>
                    {analysis.changes.conditions.impact}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  // Render confirm step
  const renderConfirm = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={styles.scrollContentInner}
    >
      <View style={styles.overviewHeader}>
        <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
          <CheckCircle2 size={32} color={IOS_COLORS.green} />
        </View>
        <Text style={styles.overviewTitle}>Forecast Saved</Text>
        <Text style={styles.overviewDescription}>
          Your forecast snapshot has been recorded. Check back later to see how
          conditions evolve.
        </Text>
      </View>

      {/* Summary Card */}
      <View style={styles.confirmCard}>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Snapshots saved</Text>
          <Text style={styles.confirmValue}>{snapshots.length}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Wind at race time</Text>
          <Text style={styles.confirmValue}>
            {newSnapshot?.raceWindow.windAtStart.toFixed(0) ||
              currentForecast?.raceWindow?.windAtStart.toFixed(0)}{' '}
            kt
          </Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Trend</Text>
          <Text style={styles.confirmValue}>
            {newSnapshot?.windTrend || currentForecast?.windTrend || 'steady'}
          </Text>
        </View>
      </View>

      {/* Tip */}
      <View style={styles.tipCard}>
        <Sparkles size={16} color={IOS_COLORS.purple} />
        <Text style={styles.tipText}>
          Check back daily as race day approaches. AI will analyze how the
          forecast evolves and suggest tactical adjustments.
        </Text>
      </View>
    </ScrollView>
  );

  // Render content based on step
  const renderContent = () => {
    switch (step) {
      case 'loading':
        return renderLoading();
      case 'current':
        return renderCurrentForecast();
      case 'comparison':
        return renderComparison();
      case 'analysis':
        return renderAnalysis();
      case 'confirm':
        return renderConfirm();
      default:
        return null;
    }
  };

  // Render bottom navigation
  const renderBottomNav = () => {
    if (step === 'loading') return null;

    return (
      <View style={styles.bottomAction}>
        {step === 'current' && (
          <Pressable
            style={[
              styles.primaryButton,
              (isCapturing || !currentForecast) && styles.primaryButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isCapturing || !currentForecast}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : hasSnapshots ? (
              <>
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Save Snapshot</Text>
              </>
            ) : (
              <>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Save First Check</Text>
              </>
            )}
          </Pressable>
        )}

        {step === 'comparison' && (
          <View style={styles.navRow}>
            <Pressable
              style={styles.navButtonSecondary}
              onPress={() => setStep('current')}
            >
              <ChevronLeft size={20} color={IOS_COLORS.blue} />
              <Text style={styles.navButtonSecondaryText}>Back</Text>
            </Pressable>
            <Pressable
              style={styles.navButtonPrimary}
              onPress={() => setStep('analysis')}
            >
              <Text style={styles.navButtonPrimaryText}>View Analysis</Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {step === 'analysis' && (
          <View style={styles.navRow}>
            <Pressable
              style={styles.navButtonSecondary}
              onPress={() => setStep('comparison')}
            >
              <ChevronLeft size={20} color={IOS_COLORS.blue} />
              <Text style={styles.navButtonSecondaryText}>Back</Text>
            </Pressable>
            <Pressable
              style={[styles.navButtonPrimary, styles.navButtonSuccess]}
              onPress={() => {
                setStep('confirm');
              }}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.navButtonPrimaryText}>Done</Text>
            </Pressable>
          </View>
        )}

        {step === 'confirm' && (
          <Pressable
            style={[styles.primaryButton, styles.primaryButtonSuccess]}
            onPress={onComplete}
          >
            <CheckCircle2 size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Complete Check</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <View style={styles.closeButtonInner}>
            <X size={20} color={IOS_COLORS.gray} strokeWidth={2.5} />
          </View>
        </Pressable>
        <Text style={styles.headerTitle}>Forecast Check</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.learnIconButton} onPress={handleLearnMore}>
            <BookOpen size={20} color={IOS_COLORS.purple} />
          </Pressable>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              captureComplete && styles.progressComplete,
            ]}
          />
        </View>
      </View>

      {/* Content */}
      {renderContent()}

      </SafeAreaView>

      {/* Bottom Navigation */}
      {renderBottomNav()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  safeArea: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 56,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  learnIconButton: {
    padding: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  progressBar: {
    height: 4,
    backgroundColor: IOS_COLORS.separator,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 2,
  },
  progressComplete: {
    backgroundColor: IOS_COLORS.green,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: IOS_COLORS.secondaryLabel,
  },
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Overview header
  overviewHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleSuccess: {
    backgroundColor: `${IOS_COLORS.green}15`,
  },
  overviewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 8,
    textAlign: 'center',
  },
  overviewDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  lastCheckedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 12,
  },
  lastCheckedText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  // Forecast cards
  forecastCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  forecastCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  forecastCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'capitalize',
  },
  forecastValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  forecastValue: {
    alignItems: 'center',
  },
  forecastValueLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
  },
  forecastValueMain: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  forecastValueSub: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  tideTurnAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  tideTurnText: {
    fontSize: 14,
    color: IOS_COLORS.orange,
    fontWeight: '500',
  },
  timeWindow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  timeWindowText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  firstCheckNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 20,
    padding: 16,
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 12,
  },
  firstCheckText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  // Comparison
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  comparisonCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  comparisonCardPrevious: {
    backgroundColor: IOS_COLORS.background,
  },
  comparisonCardCurrent: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderWidth: 2,
    borderColor: IOS_COLORS.blue,
  },
  comparisonCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
  },
  comparisonTime: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  comparisonValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comparisonValueText: {
    fontSize: 14,
    color: IOS_COLORS.label,
  },
  comparisonArrow: {
    paddingHorizontal: 4,
  },
  snapshotHistory: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
  },
  snapshotHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
  snapshotHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  snapshotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.blue,
  },
  snapshotHistoryText: {
    fontSize: 14,
    color: IOS_COLORS.label,
  },
  // Analysis
  alertBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  alertBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  analysisCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  analysisCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
  analysisSummary: {
    fontSize: 16,
    color: IOS_COLORS.label,
    lineHeight: 24,
  },
  implicationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  implicationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.purple,
    marginTop: 7,
  },
  implicationText: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  changeContent: {
    flex: 1,
  },
  changeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  changeDetail: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
  },
  changeImpact: {
    fontSize: 13,
    color: IOS_COLORS.purple,
    fontStyle: 'italic',
  },
  // Confirm
  confirmCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  confirmLabel: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  confirmValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    backgroundColor: `${IOS_COLORS.purple}08`,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  // Bottom action
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.blue,
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  primaryButtonSuccess: {
    backgroundColor: IOS_COLORS.green,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.background,
    gap: 4,
  },
  navButtonSecondaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  navButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.blue,
    gap: 4,
  },
  navButtonSuccess: {
    backgroundColor: IOS_COLORS.green,
  },
  navButtonPrimaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

/**
 * Race Conditions card style - matching the web app layout
 * Label | Sparkline | Min-Max Range | Direction
 */
const rcStyles = StyleSheet.create({
  // Header
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
  },
  headerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerTime: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },

  // Summary section with inline sparklines
  summarySection: {
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    width: 40,
  },
  sparklineContainer: {
    width: 80,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    minWidth: 60,
  },
  rangeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  rangeUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  directionArrow: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  directionText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  trendSeparator: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'capitalize',
  },
  beaufortText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 4,
  },

  // Hourly data table
  tableContainer: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
  },
  tableHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 32,
  },
  tableHeaderTime: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    fontVariant: ['tabular-nums'],
  },
  tableHeaderTimeActive: {
    color: IOS_COLORS.blue,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 32,
  },
  tableValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  tableValueActive: {
    color: IOS_COLORS.blue,
    fontWeight: '700',
  },
  tableDirection: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 1,
  },
  tableDirectionActive: {
    color: IOS_COLORS.blue,
  },
  tableUnit: {
    fontSize: 10,
    color: IOS_COLORS.gray,
    marginTop: 4,
    marginLeft: 2,
  },

  // Tide times
  tideTimesSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  tideTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  tideLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: IOS_COLORS.purple,
  },
  tideHeight: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tideSeparator: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  rangeInfo: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginBottom: 8,
  },

  // Turn alert
  turnAlert: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: `${IOS_COLORS.orange}10`,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  turnAlertText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },

  // First check notice
  firstCheckNotice: {
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  firstCheckText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  dataSourceFooter: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  dataSourceText: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },

  // Event-based table styles
  eventTable: {
    marginBottom: 16,
  },
  eventTableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  eventTableHeaderCell: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
  },
  eventTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${IOS_COLORS.separator}50`,
  },
  eventTableRowHighlight: {
    backgroundColor: `${IOS_COLORS.blue}08`,
  },
  eventTableCell: {
    fontSize: 14,
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  timeCol: {
    width: 50,
  },
  eventCol: {
    width: 55,
  },
  windCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tideCol: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  waveCol: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
  eventText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  eventTextBold: {
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  windCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  windValue: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
    minWidth: 24,
  },
  windDirection: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  tideCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tideValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.purple,
    fontVariant: ['tabular-nums'],
  },
  tideStateSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
  },
  waveCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveValue: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.orange,
    fontVariant: ['tabular-nums'],
  },
  waveUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  tideStateText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'capitalize',
  },
  wavePeriodText: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },
  trendInfo: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
    marginTop: 4,
  },
});

/**
 * Tufte-style data visualization styles
 * Maximum data-ink ratio, minimal decoration
 */
const tufteStyles = StyleSheet.create({
  // Header
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  lastChecked: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Sections
  section: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  primaryValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  primaryNumber: {
    fontSize: 28,
    fontWeight: '300',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  primaryUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginLeft: 1,
  },
  primaryDirection: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginLeft: 6,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  trendLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'capitalize',
  },

  // Sparkline table
  sparklineTable: {
    marginTop: 8,
    marginBottom: 8,
  },
  sparklineRow: {
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
  },
  valueRow: {
    flexDirection: 'row',
  },
  cell: {
    width: 32,
    alignItems: 'center',
    paddingVertical: 2,
  },
  raceWindowCell: {
    backgroundColor: `${IOS_COLORS.blue}08`,
  },
  raceStartCell: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  raceEndCell: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    fontVariant: ['tabular-nums'],
  },
  raceWindowText: {
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  directionText: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  unitLabel: {
    fontSize: 10,
    color: IOS_COLORS.gray,
    marginTop: 4,
    marginLeft: 2,
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },

  // Context text
  contextText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 4,
  },

  // Tide times
  tideTimesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  tideTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  tideTimeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.purple,
    textTransform: 'uppercase',
  },
  tideHeight: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tideSeparator: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },

  // Turn alert
  turnAlert: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: `${IOS_COLORS.orange}10`,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  turnAlertText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },

  // First check notice
  firstCheckNotice: {
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  firstCheckText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

/**
 * Tufte comparison styles - for before/after visualization
 */
const tufteCompStyles = StyleSheet.create({
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 12,
  },
  valueColumn: {
    alignItems: 'center',
    minWidth: 60,
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  oldValue: {
    fontSize: 22,
    fontWeight: '300',
    color: IOS_COLORS.gray,
    fontVariant: ['tabular-nums'],
  },
  oldUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  oldDirection: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  newValue: {
    fontSize: 22,
    fontWeight: '500',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },
  newUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  newDirection: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: IOS_COLORS.gray,
    marginTop: 20,
  },
  deltaColumn: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
    paddingTop: 16,
  },
  deltaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    fontVariant: ['tabular-nums'],
  },
  deltaUp: {
    color: IOS_COLORS.orange,
  },
  deltaDown: {
    color: IOS_COLORS.green,
  },
  deltaNote: {
    fontSize: 10,
    color: IOS_COLORS.orange,
    marginTop: 2,
  },

  // Sparkline comparison
  sparklineComparison: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  sparklineWithLabel: {
    flex: 1,
  },
  sparklineLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginBottom: 4,
  },

  // Timeline
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: IOS_COLORS.gray,
  },
  timelineDotActive: {
    backgroundColor: IOS_COLORS.blue,
  },
  timelineText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    width: 60,
  },
  timelineValue: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
});

export default ForecastCheckWizard;
