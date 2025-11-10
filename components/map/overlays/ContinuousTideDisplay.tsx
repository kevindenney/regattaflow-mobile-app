/**
 * ContinuousTideDisplay Component
 *
 * Real-time tide height visualization with predicted tide curves
 * Uses Storm Glass continuous tide height data
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface TideDataPoint {
  time: Date;
  height: number; // meters relative to chart datum
}

interface TideExtreme {
  type: 'high' | 'low';
  time: Date;
  height: number;
}

interface ContinuousTideDisplayProps {
  /** Current tide height */
  currentHeight: number;

  /** Tide forecast for next 24 hours */
  tideForecast: TideDataPoint[];

  /** Upcoming high and low tides */
  tideExtremes: TideExtreme[];

  /** Display mode */
  mode?: 'compact' | 'detailed';

  /** Show tide clock ring */
  showClock?: boolean;

  /** Height in pixels */
  height?: number;
}

/**
 * Calculate tide phase (0-1, where 0/1 = low tide, 0.5 = high tide)
 */
function calculateTidePhase(
  currentHeight: number,
  extremes: TideExtreme[]
): number {
  if (extremes.length < 2) return 0.5;

  // Find nearest low and high tides
  const now = Date.now();
  let nearestLow: TideExtreme | null = null;
  let nearestHigh: TideExtreme | null = null;

  for (const extreme of extremes) {
    if (extreme.type === 'low') {
      if (!nearestLow || Math.abs(extreme.time.getTime() - now) < Math.abs(nearestLow.time.getTime() - now)) {
        nearestLow = extreme;
      }
    } else {
      if (!nearestHigh || Math.abs(extreme.time.getTime() - now) < Math.abs(nearestHigh.time.getTime() - now)) {
        nearestHigh = extreme;
      }
    }
  }

  if (!nearestLow || !nearestHigh) return 0.5;

  const tideRange = nearestHigh.height - nearestLow.height;
  const currentFromLow = currentHeight - nearestLow.height;

  return Math.min(1, Math.max(0, currentFromLow / tideRange));
}

/**
 * Get tide status description
 */
function getTideStatus(
  currentHeight: number,
  tideForecast: TideDataPoint[],
  extremes: TideExtreme[]
): {
  status: 'rising' | 'falling' | 'slack-high' | 'slack-low';
  rate: number; // cm/hour
  nextExtreme: TideExtreme | null;
  timeToExtreme: number; // minutes
} {
  if (tideForecast.length < 2) {
    return {
      status: 'slack-high',
      rate: 0,
      nextExtreme: null,
      timeToExtreme: 0,
    };
  }

  // Calculate rate of change from forecast
  const first = tideForecast[0];
  const second = tideForecast[1];
  const timeDiff = (second.time.getTime() - first.time.getTime()) / 3600000; // hours
  const heightDiff = (second.height - first.height) * 100; // cm
  const rate = heightDiff / timeDiff;

  // Determine status
  let status: 'rising' | 'falling' | 'slack-high' | 'slack-low';
  if (Math.abs(rate) < 5) {
    // Near slack water (< 5cm/hour)
    const phase = calculateTidePhase(currentHeight, extremes);
    status = phase > 0.5 ? 'slack-high' : 'slack-low';
  } else {
    status = rate > 0 ? 'rising' : 'falling';
  }

  // Find next extreme
  const now = Date.now();
  const futureExtremes = extremes.filter(e => e.time.getTime() > now);
  const nextExtreme = futureExtremes.length > 0 ? futureExtremes[0] : null;
  const timeToExtreme = nextExtreme
    ? (nextExtreme.time.getTime() - now) / 60000
    : 0;

  return {
    status,
    rate,
    nextExtreme,
    timeToExtreme,
  };
}

/**
 * Tide Clock Ring Component
 */
const TideClockRing: React.FC<{
  phase: number;
  status: 'rising' | 'falling' | 'slack-high' | 'slack-low';
}> = ({ phase, status }) => {
  const size = 100;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 40;

  // Calculate indicator position on clock ring
  const angle = phase * Math.PI * 2 - Math.PI / 2; // Start at top
  const indicatorX = centerX + radius * Math.cos(angle);
  const indicatorY = centerY + radius * Math.sin(angle);

  // Color based on status
  const getRingColor = () => {
    switch (status) {
      case 'rising':
        return '#00BFFF'; // Deep Sky Blue
      case 'falling':
        return '#FF6347'; // Tomato
      case 'slack-high':
        return '#32CD32'; // Lime Green
      case 'slack-low':
        return '#FFD700'; // Gold
    }
  };

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="tideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#87CEEB" stopOpacity="1" />
          <Stop offset="100%" stopColor="#4682B4" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Clock ring background */}
      <Circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke="#E0E0E0"
        strokeWidth="8"
      />

      {/* Clock ring progress */}
      <Circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke={getRingColor()}
        strokeWidth="8"
        strokeDasharray={`${phase * 2 * Math.PI * radius} ${2 * Math.PI * radius}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${centerX} ${centerY})`}
      />

      {/* Tide markers (High at top, Low at bottom) */}
      <SvgText
        x={centerX}
        y={centerY - radius - 8}
        fontSize="10"
        fontWeight="bold"
        fill="#666"
        textAnchor="middle"
      >
        HIGH
      </SvgText>
      <SvgText
        x={centerX}
        y={centerY + radius + 16}
        fontSize="10"
        fontWeight="bold"
        fill="#666"
        textAnchor="middle"
      >
        LOW
      </SvgText>

      {/* Current position indicator */}
      <Circle
        cx={indicatorX}
        cy={indicatorY}
        r="6"
        fill={getRingColor()}
        stroke="white"
        strokeWidth="2"
      />

      {/* Center text - tide phase percentage */}
      <SvgText
        x={centerX}
        y={centerY + 5}
        fontSize="16"
        fontWeight="bold"
        fill={getRingColor()}
        textAnchor="middle"
      >
        {Math.round(phase * 100)}%
      </SvgText>
    </Svg>
  );
};

/**
 * Tide Chart Component
 */
const TideChart: React.FC<{
  tideForecast: TideDataPoint[];
  currentHeight: number;
  tideExtremes: TideExtreme[];
  width: number;
  height: number;
}> = ({ tideForecast, currentHeight, tideExtremes, width, height }) => {
  if (tideForecast.length === 0) {
    return null;
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const minTime = tideForecast[0].time.getTime();
  const maxTime = tideForecast[tideForecast.length - 1].time.getTime();
  const minHeight = Math.min(...tideForecast.map(d => d.height), currentHeight) - 0.2;
  const maxHeight = Math.max(...tideForecast.map(d => d.height), currentHeight) + 0.2;

  const xScale = (time: number) =>
    padding.left + ((time - minTime) / (maxTime - minTime)) * chartWidth;

  const yScale = (h: number) =>
    padding.top + chartHeight - ((h - minHeight) / (maxHeight - minHeight)) * chartHeight;

  // Create path for tide curve
  const pathData = tideForecast
    .map((point, i) => {
      const x = xScale(point.time.getTime());
      const y = yScale(point.height);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="tideChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#4A90E2" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#4A90E2" stopOpacity="0.1" />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
        const y = padding.top + chartHeight * fraction;
        const h = maxHeight - (maxHeight - minHeight) * fraction;
        return (
          <React.Fragment key={`grid-${fraction}`}>
            <Line
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke="#E0E0E0"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <SvgText
              x={padding.left - 8}
              y={y + 4}
              fontSize="10"
              fill="#666"
              textAnchor="end"
            >
              {h.toFixed(1)}m
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Tide curve area fill */}
      <Path
        d={`${pathData} L ${xScale(maxTime)} ${padding.top + chartHeight} L ${xScale(minTime)} ${padding.top + chartHeight} Z`}
        fill="url(#tideChartGradient)"
      />

      {/* Tide curve line */}
      <Path
        d={pathData}
        fill="none"
        stroke="#4A90E2"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Mark tide extremes */}
      {tideExtremes
        .filter(e => e.time.getTime() >= minTime && e.time.getTime() <= maxTime)
        .map((extreme, i) => {
          const x = xScale(extreme.time.getTime());
          const y = yScale(extreme.height);
          const color = extreme.type === 'high' ? '#32CD32' : '#FFD700';

          return (
            <React.Fragment key={`extreme-${i}`}>
              <Circle cx={x} cy={y} r="5" fill={color} stroke="white" strokeWidth="2" />
              <SvgText
                x={x}
                y={y - 12}
                fontSize="9"
                fontWeight="bold"
                fill={color}
                textAnchor="middle"
              >
                {extreme.type.toUpperCase()}
              </SvgText>
            </React.Fragment>
          );
        })}

      {/* Current time indicator */}
      <Line
        x1={xScale(Date.now())}
        y1={padding.top}
        x2={xScale(Date.now())}
        y2={padding.top + chartHeight}
        stroke="#FF4444"
        strokeWidth="2"
        strokeDasharray="4,2"
      />

      {/* Time labels */}
      {[0, 6, 12, 18, 24].map(hour => {
        const time = minTime + hour * 60 * 60 * 1000;
        if (time > maxTime) return null;

        const x = xScale(time);
        const date = new Date(time);

        return (
          <SvgText
            key={`time-${hour}`}
            x={x}
            y={padding.top + chartHeight + 18}
            fontSize="10"
            fill="#666"
            textAnchor="middle"
          >
            {date.getHours()}:00
          </SvgText>
        );
      })}
    </Svg>
  );
};

export const ContinuousTideDisplay: React.FC<ContinuousTideDisplayProps> = ({
  currentHeight,
  tideForecast,
  tideExtremes,
  mode = 'detailed',
  showClock = true,
  height = 200,
}) => {
  const tidePhase = useMemo(
    () => calculateTidePhase(currentHeight, tideExtremes),
    [currentHeight, tideExtremes]
  );

  const tideStatus = useMemo(
    () => getTideStatus(currentHeight, tideForecast, tideExtremes),
    [currentHeight, tideForecast, tideExtremes]
  );

  const statusLabels = {
    'rising': '⬆️ Rising',
    'falling': '⬇️ Falling',
    'slack-high': '🔄 Slack (High)',
    'slack-low': '🔄 Slack (Low)',
  };

  if (mode === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <ThemedText style={styles.currentHeight}>
          {currentHeight.toFixed(2)}m
        </ThemedText>
        <ThemedText style={styles.status}>
          {statusLabels[tideStatus.status]}
        </ThemedText>
        <ThemedText style={styles.rate}>
          {Math.abs(tideStatus.rate).toFixed(1)} cm/h
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.detailedContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.title}>Tide Status</ThemedText>
          <ThemedText style={styles.subtitle}>
            {statusLabels[tideStatus.status]}
          </ThemedText>
        </View>
        <View style={styles.currentHeightBox}>
          <ThemedText style={styles.currentHeightLabel}>Current</ThemedText>
          <ThemedText style={styles.currentHeightValue}>
            {currentHeight.toFixed(2)}m
          </ThemedText>
        </View>
      </View>

      {/* Tide Clock and Stats */}
      <View style={styles.middleRow}>
        {showClock && (
          <View style={styles.clockContainer}>
            <TideClockRing phase={tidePhase} status={tideStatus.status} />
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Rate:</ThemedText>
            <ThemedText style={styles.statValue}>
              {tideStatus.rate > 0 ? '+' : ''}
              {tideStatus.rate.toFixed(1)} cm/h
            </ThemedText>
          </View>

          {tideStatus.nextExtreme && (
            <>
              <View style={styles.statRow}>
                <ThemedText style={styles.statLabel}>Next {tideStatus.nextExtreme.type}:</ThemedText>
                <ThemedText style={styles.statValue}>
                  {Math.floor(tideStatus.timeToExtreme)}m
                </ThemedText>
              </View>
              <View style={styles.statRow}>
                <ThemedText style={styles.statLabel}>Height:</ThemedText>
                <ThemedText style={styles.statValue}>
                  {tideStatus.nextExtreme.height.toFixed(2)}m
                </ThemedText>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Tide Chart */}
      {tideForecast.length > 0 && (
        <View style={styles.chartContainer}>
          <TideChart
            tideForecast={tideForecast}
            currentHeight={currentHeight}
            tideExtremes={tideExtremes}
            width={350}
            height={height}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
  },
  detailedContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#4A90E2',
    marginTop: 4,
  },
  currentHeightBox: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  currentHeightLabel: {
    fontSize: 10,
    color: '#AAA',
    textAlign: 'center',
  },
  currentHeightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
  },
  currentHeight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  status: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  rate: {
    fontSize: 12,
    color: '#AAA',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  clockContainer: {
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#AAA',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chartContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
});
