/**
 * PredictiveCurrentsOverlay Component
 *
 * Displays predicted current vectors with timing predictions
 * Shows optimal timing for current-assisted tactical maneuvers
 * Uses Storm Glass current forecast data
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface CurrentPrediction {
  time: Date;
  latitude: number;
  longitude: number;
  speed: number; // m/s
  direction: number; // degrees
  confidence: number; // 0-1
}

interface TacticalWindow {
  type: 'favorable' | 'neutral' | 'unfavorable';
  startTime: Date;
  endTime: Date;
  speedGain: number; // knots gained/lost
  description: string;
}

interface PredictiveCurrentsOverlayProps {
  currentForecasts: CurrentPrediction[];
  raceStartTime?: Date;
  courseHeading?: number; // Intended sailing direction
  showTacticalWindows?: boolean;
  predictionHours?: number;
}

/**
 * Calculate speed gain/loss from current
 */
function calculateCurrentImpact(
  currentSpeed: number, // m/s
  currentDirection: number, // degrees
  courseHeading: number // degrees
): {
  speedGain: number; // knots
  angle: number; // degrees (relative to course)
  type: 'boost' | 'push' | 'neutral' | 'drag';
} {
  // Convert current speed to knots
  const currentKnots = currentSpeed * 1.944;

  // Calculate relative angle
  let relativeAngle = currentDirection - courseHeading;
  if (relativeAngle > 180) relativeAngle -= 360;
  if (relativeAngle < -180) relativeAngle += 360;

  // Calculate component along course direction
  const alongCourseComponent = currentKnots * Math.cos((relativeAngle * Math.PI) / 180);

  // Classify impact
  let type: 'boost' | 'push' | 'neutral' | 'drag';
  if (Math.abs(relativeAngle) < 45) {
    type = alongCourseComponent > 0 ? 'boost' : 'drag';
  } else if (Math.abs(relativeAngle) < 135) {
    type = 'push';
  } else {
    type = alongCourseComponent > 0 ? 'boost' : 'drag';
  }

  return {
    speedGain: alongCourseComponent,
    angle: relativeAngle,
    type,
  };
}

/**
 * Identify tactical windows in current forecast
 */
function identifyTacticalWindows(
  forecasts: CurrentPrediction[],
  courseHeading: number,
  minImpact: number = 0.5 // knots
): TacticalWindow[] {
  if (forecasts.length === 0) return [];

  const windows: TacticalWindow[] = [];
  let currentWindow: TacticalWindow | null = null;

  for (let i = 0; i < forecasts.length; i++) {
    const forecast = forecasts[i];
    const impact = calculateCurrentImpact(
      forecast.speed,
      forecast.direction,
      courseHeading
    );

    // Determine window type
    let windowType: 'favorable' | 'neutral' | 'unfavorable';
    if (Math.abs(impact.speedGain) < minImpact) {
      windowType = 'neutral';
    } else if (impact.speedGain > 0) {
      windowType = 'favorable';
    } else {
      windowType = 'unfavorable';
    }

    // Start new window or continue existing
    if (!currentWindow) {
      currentWindow = {
        type: windowType,
        startTime: forecast.time,
        endTime: forecast.time,
        speedGain: impact.speedGain,
        description: generateWindowDescription(windowType, impact.speedGain, impact.type),
      };
    } else if (currentWindow.type === windowType) {
      // Continue current window
      currentWindow.endTime = forecast.time;
    } else {
      // Close current window and start new one
      windows.push(currentWindow);
      currentWindow = {
        type: windowType,
        startTime: forecast.time,
        endTime: forecast.time,
        speedGain: impact.speedGain,
        description: generateWindowDescription(windowType, impact.speedGain, impact.type),
      };
    }
  }

  // Add final window
  if (currentWindow) {
    windows.push(currentWindow);
  }

  return windows;
}

/**
 * Generate window description
 */
function generateWindowDescription(
  type: 'favorable' | 'neutral' | 'unfavorable',
  speedGain: number,
  impactType: 'boost' | 'push' | 'neutral' | 'drag'
): string {
  if (type === 'favorable') {
    if (impactType === 'boost') {
      return `Current boost: +${speedGain.toFixed(1)} kts directly aiding course`;
    } else {
      return `Favorable push: +${speedGain.toFixed(1)} kts assisting progress`;
    }
  } else if (type === 'unfavorable') {
    if (impactType === 'drag') {
      return `Current drag: ${speedGain.toFixed(1)} kts directly opposing course`;
    } else {
      return `Adverse current: ${speedGain.toFixed(1)} kts hindering progress`;
    }
  } else {
    return `Neutral current: minimal impact`;
  }
}

/**
 * Get optimal timing recommendation
 */
function getOptimalTiming(
  windows: TacticalWindow[],
  raceStartTime?: Date
): {
  recommendation: string;
  bestWindow: TacticalWindow | null;
  worstWindow: TacticalWindow | null;
  timingAdvice: string;
} {
  if (windows.length === 0) {
    return {
      recommendation: 'No current data available',
      bestWindow: null,
      worstWindow: null,
      timingAdvice: 'Monitor conditions',
    };
  }

  // Find best and worst windows
  const favorableWindows = windows.filter(w => w.type === 'favorable');
  const unfavorableWindows = windows.filter(w => w.type === 'unfavorable');

  const bestWindow = favorableWindows.length > 0
    ? favorableWindows.reduce((best, w) => w.speedGain > best.speedGain ? w : best)
    : null;

  const worstWindow = unfavorableWindows.length > 0
    ? unfavorableWindows.reduce((worst, w) => w.speedGain < worst.speedGain ? w : worst)
    : null;

  // Generate timing advice
  let timingAdvice = '';
  if (bestWindow && raceStartTime) {
    const minutesToBest = (bestWindow.startTime.getTime() - raceStartTime.getTime()) / 60000;

    if (minutesToBest > -30 && minutesToBest < 30) {
      timingAdvice = `Race timing aligns with favorable current window. Expect ${bestWindow.speedGain.toFixed(1)} kts boost.`;
    } else if (minutesToBest > 30) {
      timingAdvice = `Favorable window starts ${Math.round(minutesToBest)}m after race start. Consider delaying tactics.`;
    } else {
      timingAdvice = `Favorable window ended ${Math.abs(Math.round(minutesToBest))}m before race start. Current conditions less optimal.`;
    }
  } else if (bestWindow) {
    const duration = (bestWindow.endTime.getTime() - bestWindow.startTime.getTime()) / 60000;
    timingAdvice = `Best window: ${bestWindow.startTime.toLocaleTimeString()} for ${Math.round(duration)}m. Plan accordingly.`;
  }

  const recommendation = bestWindow
    ? `Target ${bestWindow.startTime.toLocaleTimeString()} - ${bestWindow.endTime.toLocaleTimeString()} for ${bestWindow.speedGain.toFixed(1)} kts gain`
    : 'No strongly favorable windows predicted';

  return {
    recommendation,
    bestWindow,
    worstWindow,
    timingAdvice,
  };
}

export const PredictiveCurrentsOverlay: React.FC<PredictiveCurrentsOverlayProps> = ({
  currentForecasts,
  raceStartTime,
  courseHeading = 0,
  showTacticalWindows = true,
  predictionHours = 6,
}) => {
  // Filter forecasts to prediction window
  const filteredForecasts = useMemo(() => {
    const now = Date.now();
    const endTime = now + predictionHours * 60 * 60 * 1000;

    return currentForecasts.filter(
      f => f.time.getTime() >= now && f.time.getTime() <= endTime
    );
  }, [currentForecasts, predictionHours]);

  // Identify tactical windows
  const tacticalWindows = useMemo(() => {
    return identifyTacticalWindows(filteredForecasts, courseHeading);
  }, [filteredForecasts, courseHeading]);

  // Get optimal timing
  const timing = useMemo(() => {
    return getOptimalTiming(tacticalWindows, raceStartTime);
  }, [tacticalWindows, raceStartTime]);

  if (filteredForecasts.length === 0) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.noData}>No current forecast data available</ThemedText>
      </View>
    );
  }

  const currentForecast = filteredForecasts[0];
  const currentImpact = calculateCurrentImpact(
    currentForecast.speed,
    currentForecast.direction,
    courseHeading
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Predictive Currents</ThemedText>
        <ThemedText style={styles.subtitle}>
          {predictionHours}hr forecast • {tacticalWindows.length} tactical windows
        </ThemedText>
      </View>

      {/* Current Conditions */}
      <View style={styles.currentBox}>
        <ThemedText style={styles.currentLabel}>Current Impact</ThemedText>
        <ThemedText
          style={[
            styles.currentValue,
            { color: currentImpact.speedGain > 0 ? '#00FF00' : '#FF4444' }
          ]}
        >
          {currentImpact.speedGain > 0 ? '+' : ''}
          {currentImpact.speedGain.toFixed(1)} kts
        </ThemedText>
        <ThemedText style={styles.currentType}>
          {currentImpact.type.toUpperCase()} @ {Math.abs(Math.round(currentImpact.angle))}°
        </ThemedText>
      </View>

      {/* Optimal Timing */}
      <View style={styles.timingBox}>
        <ThemedText style={styles.timingTitle}>⏱️ Optimal Timing</ThemedText>
        <ThemedText style={styles.timingRecommendation}>
          {timing.recommendation}
        </ThemedText>
        {timing.timingAdvice && (
          <ThemedText style={styles.timingAdvice}>
            {timing.timingAdvice}
          </ThemedText>
        )}
      </View>

      {/* Tactical Windows */}
      {showTacticalWindows && tacticalWindows.length > 0 && (
        <View style={styles.windowsContainer}>
          <ThemedText style={styles.windowsTitle}>Tactical Windows</ThemedText>
          {tacticalWindows.slice(0, 5).map((window, index) => {
            const duration = (window.endTime.getTime() - window.startTime.getTime()) / 60000;
            const windowColor = {
              favorable: '#00FF00',
              neutral: '#FFFF00',
              unfavorable: '#FF4444',
            }[window.type];

            return (
              <View key={index} style={styles.windowItem}>
                <View style={[styles.windowIndicator, { backgroundColor: windowColor }]} />
                <View style={styles.windowInfo}>
                  <ThemedText style={styles.windowTime}>
                    {window.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {window.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                  <ThemedText style={styles.windowDescription}>
                    {window.description}
                  </ThemedText>
                  <ThemedText style={styles.windowDuration}>
                    Duration: {Math.round(duration)}m
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Strategy Tip */}
      {timing.bestWindow && (
        <View style={styles.strategyBox}>
          <ThemedText style={styles.strategyTitle}>💡 Strategy Tip</ThemedText>
          <ThemedText style={styles.strategyText}>
            {timing.bestWindow.speedGain > 1
              ? `Strong favorable current predicted. Consider aggressive tactics to maximize advantage.`
              : `Moderate current assistance available. Plan maneuvers to coincide with favorable windows.`}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

/**
 * MapLibre GL layer specification for predictive currents
 */
export function getPredictiveCurrentsLayerSpec(
  forecasts: CurrentPrediction[],
  courseHeading: number
): any[] {
  const layers: any[] = [];

  // Generate arrow features with color coding based on impact
  const features = forecasts.map((forecast, index) => {
    const impact = calculateCurrentImpact(forecast.speed, forecast.direction, courseHeading);

    let color = '#FFFF00'; // neutral
    if (impact.type === 'boost') color = '#00FF00';
    else if (impact.type === 'drag') color = '#FF0000';
    else if (impact.type === 'push') color = '#FFA500';

    return {
      type: 'Feature',
      id: `current-pred-${index}`,
      geometry: {
        type: 'Point',
        coordinates: [forecast.longitude, forecast.latitude],
      },
      properties: {
        speed: forecast.speed * 1.944, // Convert to knots
        direction: forecast.direction,
        speedGain: impact.speedGain,
        type: impact.type,
        color,
        confidence: forecast.confidence,
      },
    };
  });

  // Current arrow layer
  layers.push({
    id: 'predictive-currents',
    type: 'symbol',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    },
    layout: {
      'icon-image': 'current-arrow',
      'icon-size': [
        'interpolate',
        ['linear'],
        ['get', 'speed'],
        0, 0.5,
        2, 1.5,
      ],
      'icon-rotate': ['get', 'direction'],
      'icon-allow-overlap': true,
    },
    paint: {
      'icon-color': ['get', 'color'],
      'icon-opacity': ['get', 'confidence'],
    },
  });

  return layers;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 11,
    color: '#AAA',
    marginTop: 2,
  },
  noData: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    padding: 20,
  },
  currentBox: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  currentLabel: {
    fontSize: 11,
    color: '#AAA',
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  currentType: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  timingBox: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  timingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  timingRecommendation: {
    fontSize: 11,
    color: '#00FF00',
    marginBottom: 4,
  },
  timingAdvice: {
    fontSize: 10,
    color: '#AAA',
    fontStyle: 'italic',
  },
  windowsContainer: {
    marginBottom: 12,
  },
  windowsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  windowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  windowIndicator: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 10,
  },
  windowInfo: {
    flex: 1,
  },
  windowTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  windowDescription: {
    fontSize: 10,
    color: '#AAA',
    marginTop: 2,
  },
  windowDuration: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  strategyBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  strategyTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  strategyText: {
    fontSize: 10,
    color: '#DDA0DD',
    lineHeight: 14,
  },
});
