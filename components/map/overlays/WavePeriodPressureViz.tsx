/**
 * WavePeriodPressureViz Component
 *
 * Combined visualization of wave period (critical for downwind) and pressure gradients
 * Uses Storm Glass wave period and atmospheric pressure data
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface WavePeriodData {
  latitude: number;
  longitude: number;
  wavePeriod: number; // seconds
  waveHeight: number; // meters
  swellPeriod?: number; // seconds
}

interface PressureData {
  latitude: number;
  longitude: number;
  pressure: number; // hPa/mb
  trend: 'rising' | 'falling' | 'steady';
}

interface WavePeriodPressureVizProps {
  waveData: WavePeriodData[];
  pressureData: PressureData[];
  mode?: 'wave-period' | 'pressure' | 'combined';
  showIsobars?: boolean;
  showWaveZones?: boolean;
}

/**
 * Classify wave period for downwind sailing
 */
function classifyWavePeriod(period: number): {
  classification: 'choppy' | 'moderate' | 'ideal' | 'long-swell';
  description: string;
  color: string;
  downwindImpact: 'poor' | 'fair' | 'good' | 'excellent';
} {
  if (period < 4) {
    return {
      classification: 'choppy',
      description: 'Short, choppy waves - challenging downwind',
      color: '#FF4444',
      downwindImpact: 'poor',
    };
  } else if (period < 7) {
    return {
      classification: 'moderate',
      description: 'Moderate waves - manageable downwind',
      color: '#FFA500',
      downwindImpact: 'fair',
    };
  } else if (period < 10) {
    return {
      classification: 'ideal',
      description: 'Ideal wave period - excellent surfing conditions',
      color: '#00FF00',
      downwindImpact: 'excellent',
    };
  } else {
    return {
      classification: 'long-swell',
      description: 'Long swell - good speed potential, requires skill',
      color: '#90EE90',
      downwindImpact: 'good',
    };
  }
}

/**
 * Calculate pressure gradient and weather implications
 */
function analyzePressureGradient(
  pressureData: PressureData[]
): {
  gradient: number; // hPa per 100km
  strength: 'weak' | 'moderate' | 'strong' | 'severe';
  windPrediction: string;
  weatherSystem: 'high' | 'low' | 'ridge' | 'trough' | 'normal';
} {
  if (pressureData.length < 2) {
    return {
      gradient: 0,
      strength: 'weak',
      windPrediction: 'Light winds expected',
      weatherSystem: 'normal',
    };
  }

  // Calculate pressure difference and distance
  const pressures = pressureData.map(d => d.pressure);
  const minPressure = Math.min(...pressures);
  const maxPressure = Math.max(...pressures);
  const pressureDiff = maxPressure - minPressure;

  // Approximate distance (simplified - should use actual distance calculation)
  const latDiff = Math.max(...pressureData.map(d => d.latitude)) - Math.min(...pressureData.map(d => d.latitude));
  const lonDiff = Math.max(...pressureData.map(d => d.longitude)) - Math.min(...pressureData.map(d => d.longitude));
  const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // Rough km conversion

  const gradient = distance > 0 ? (pressureDiff / distance) * 100 : 0;

  // Classify gradient strength
  let strength: 'weak' | 'moderate' | 'strong' | 'severe';
  let windPrediction: string;

  if (gradient < 2) {
    strength = 'weak';
    windPrediction = 'Light winds (< 10 kts)';
  } else if (gradient < 4) {
    strength = 'moderate';
    windPrediction = 'Moderate winds (10-15 kts)';
  } else if (gradient < 6) {
    strength = 'strong';
    windPrediction = 'Fresh winds (15-25 kts)';
  } else {
    strength = 'severe';
    windPrediction = 'Strong winds (25+ kts) - gale warning';
  }

  // Identify weather system
  const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length;
  let weatherSystem: 'high' | 'low' | 'ridge' | 'trough' | 'normal';

  if (avgPressure > 1020) {
    weatherSystem = 'high';
  } else if (avgPressure < 1000) {
    weatherSystem = 'low';
  } else if (maxPressure - avgPressure > 5) {
    weatherSystem = 'ridge';
  } else if (avgPressure - minPressure > 5) {
    weatherSystem = 'trough';
  } else {
    weatherSystem = 'normal';
  }

  return {
    gradient,
    strength,
    windPrediction,
    weatherSystem,
  };
}

/**
 * Wave Period Chart
 */
const WavePeriodChart: React.FC<{
  waveData: WavePeriodData[];
  width: number;
  height: number;
}> = ({ waveData, width, height }) => {
  if (waveData.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxPeriod = Math.max(...waveData.map(d => d.wavePeriod), 12);
  const maxHeight = Math.max(...waveData.map(d => d.waveHeight), 3);

  return (
    <Svg width={width} height={height}>
      {/* Period bars */}
      {waveData.map((data, i) => {
        const x = padding.left + (i / waveData.length) * chartWidth;
        const barWidth = chartWidth / waveData.length * 0.8;
        const periodHeight = (data.wavePeriod / maxPeriod) * chartHeight;
        const y = padding.top + chartHeight - periodHeight;

        const classification = classifyWavePeriod(data.wavePeriod);

        return (
          <React.Fragment key={i}>
            <Path
              d={`M ${x} ${y + periodHeight} L ${x} ${y} L ${x + barWidth} ${y} L ${x + barWidth} ${y + periodHeight} Z`}
              fill={classification.color}
              opacity={0.7}
            />
            <SvgText
              x={x + barWidth / 2}
              y={y - 5}
              fontSize={9}
              fill="#FFFFFF"
              textAnchor="middle"
            >
              {data.wavePeriod.toFixed(1)}s
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Axes */}
      <Line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        stroke="#666"
        strokeWidth={2}
      />
      <Line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke="#666"
        strokeWidth={2}
      />

      {/* Labels */}
      <SvgText
        x={padding.left + chartWidth / 2}
        y={padding.top + chartHeight + 25}
        fontSize={11}
        fill="#FFFFFF"
        textAnchor="middle"
      >
        Wave Period (seconds)
      </SvgText>
    </Svg>
  );
};

/**
 * Pressure Isobar Display
 */
const PressureIsobars: React.FC<{
  pressureData: PressureData[];
  width: number;
  height: number;
}> = ({ pressureData, width, height }) => {
  if (pressureData.length === 0) return null;

  const minPressure = Math.min(...pressureData.map(d => d.pressure));
  const maxPressure = Math.max(...pressureData.map(d => d.pressure));
  const avgPressure = pressureData.reduce((sum, d) => sum + d.pressure, 0) / pressureData.length;

  // Generate isobars (simplified)
  const isobars = [
    Math.floor(minPressure / 4) * 4,
    Math.floor(avgPressure / 4) * 4,
    Math.ceil(maxPressure / 4) * 4,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="pressureGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#4A90E2" stopOpacity="0.3" />
          <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <Stop offset="100%" stopColor="#FF4444" stopOpacity="0.3" />
        </LinearGradient>
      </Defs>

      {/* Pressure gradient background */}
      <Path
        d={`M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`}
        fill="url(#pressureGradient)"
      />

      {/* Isobars */}
      {isobars.map((isobar, i) => {
        const y = ((isobar - minPressure) / (maxPressure - minPressure)) * height;

        return (
          <React.Fragment key={i}>
            <Line
              x1={0}
              y1={height - y}
              x2={width}
              y2={height - y}
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeDasharray="5,5"
              opacity={0.6}
            />
            <SvgText
              x={10}
              y={height - y - 5}
              fontSize={12}
              fill="#FFFFFF"
              fontWeight="bold"
            >
              {isobar} hPa
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Center pressure value */}
      <Circle cx={width / 2} cy={height / 2} r={40} fill="rgba(0, 0, 0, 0.7)" />
      <SvgText
        x={width / 2}
        y={height / 2 - 8}
        fontSize={16}
        fill="#FFFFFF"
        fontWeight="bold"
        textAnchor="middle"
      >
        {avgPressure.toFixed(1)}
      </SvgText>
      <SvgText
        x={width / 2}
        y={height / 2 + 10}
        fontSize={10}
        fill="#AAA"
        textAnchor="middle"
      >
        hPa
      </SvgText>
    </Svg>
  );
};

export const WavePeriodPressureViz: React.FC<WavePeriodPressureVizProps> = ({
  waveData,
  pressureData,
  mode = 'combined',
  showIsobars = true,
  showWaveZones = true,
}) => {
  // Analyze wave periods
  const waveAnalysis = useMemo(() => {
    if (waveData.length === 0) return null;

    const avgPeriod = waveData.reduce((sum, d) => sum + d.wavePeriod, 0) / waveData.length;
    const avgHeight = waveData.reduce((sum, d) => sum + d.waveHeight, 0) / waveData.length;

    const classification = classifyWavePeriod(avgPeriod);

    return {
      avgPeriod,
      avgHeight,
      classification,
    };
  }, [waveData]);

  // Analyze pressure
  const pressureAnalysis = useMemo(() => {
    return analyzePressureGradient(pressureData);
  }, [pressureData]);

  const showWaves = mode === 'wave-period' || mode === 'combined';
  const showPressure = mode === 'pressure' || mode === 'combined';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>
          {mode === 'combined' ? 'Wave Period & Pressure Analysis' : mode === 'wave-period' ? 'Wave Period Analysis' : 'Pressure Analysis'}
        </ThemedText>
      </View>

      {/* Wave Period Section */}
      {showWaves && waveAnalysis && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>🌊 Wave Period</ThemedText>
            <ThemedText style={[styles.sectionValue, { color: waveAnalysis.classification.color }]}>
              {waveAnalysis.avgPeriod.toFixed(1)}s
            </ThemedText>
          </View>

          <View style={styles.classificationBox}>
            <ThemedText style={styles.classificationLabel}>
              {waveAnalysis.classification.classification.toUpperCase()}
            </ThemedText>
            <ThemedText style={styles.classificationDesc}>
              {waveAnalysis.classification.description}
            </ThemedText>
            <ThemedText style={[styles.downwindImpact, { color: waveAnalysis.classification.color }]}>
              Downwind: {waveAnalysis.classification.downwindImpact.toUpperCase()}
            </ThemedText>
          </View>

          {showWaveZones && (
            <View style={styles.chartContainer}>
              <WavePeriodChart waveData={waveData} width={300} height={150} />
            </View>
          )}

          {/* Surfing Recommendation */}
          {waveAnalysis.classification.downwindImpact === 'excellent' && (
            <View style={styles.tipBox}>
              <ThemedText style={styles.tipText}>
                💡 Excellent surfing conditions! {waveAnalysis.avgPeriod.toFixed(1)}s period allows for sustained planing and speed gains.
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Pressure Section */}
      {showPressure && pressureData.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>📊 Pressure Gradient</ThemedText>
            <ThemedText style={styles.sectionValue}>
              {pressureAnalysis.gradient.toFixed(2)} hPa/100km
            </ThemedText>
          </View>

          <View style={styles.pressureInfo}>
            <View style={styles.pressureRow}>
              <ThemedText style={styles.pressureLabel}>Gradient Strength:</ThemedText>
              <ThemedText style={[
                styles.pressureValue,
                { color: pressureAnalysis.strength === 'severe' ? '#FF0000' : pressureAnalysis.strength === 'strong' ? '#FFA500' : '#FFFF00' }
              ]}>
                {pressureAnalysis.strength.toUpperCase()}
              </ThemedText>
            </View>

            <View style={styles.pressureRow}>
              <ThemedText style={styles.pressureLabel}>Weather System:</ThemedText>
              <ThemedText style={styles.pressureValue}>
                {pressureAnalysis.weatherSystem.toUpperCase()}
              </ThemedText>
            </View>

            <View style={styles.pressureRow}>
              <ThemedText style={styles.pressureLabel}>Wind Prediction:</ThemedText>
              <ThemedText style={styles.pressureValue}>
                {pressureAnalysis.windPrediction}
              </ThemedText>
            </View>
          </View>

          {showIsobars && (
            <View style={styles.chartContainer}>
              <PressureIsobars pressureData={pressureData} width={300} height={150} />
            </View>
          )}

          {/* Weather Warning */}
          {pressureAnalysis.strength === 'severe' && (
            <View style={styles.warningBox}>
              <ThemedText style={styles.warningText}>
                ⚠️ Severe pressure gradient detected. Strong winds expected - exercise caution.
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Combined Tactical Insight */}
      {mode === 'combined' && waveAnalysis && pressureAnalysis.gradient > 2 && (
        <View style={styles.insightBox}>
          <ThemedText style={styles.insightTitle}>🎯 Tactical Insight</ThemedText>
          <ThemedText style={styles.insightText}>
            {waveAnalysis.classification.downwindImpact === 'excellent'
              ? `Strong pressure gradient (${pressureAnalysis.gradient.toFixed(1)} hPa/100km) combined with ideal wave period (${waveAnalysis.avgPeriod.toFixed(1)}s) creates exceptional downwind conditions. Maximize VMG downwind legs.`
              : `Pressure gradient of ${pressureAnalysis.gradient.toFixed(1)} hPa/100km suggests ${pressureAnalysis.windPrediction.toLowerCase()}. Wave period ${waveAnalysis.avgPeriod.toFixed(1)}s is ${waveAnalysis.classification.downwindImpact} for surfing.`}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  classificationBox: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  classificationLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  classificationDesc: {
    fontSize: 10,
    color: '#AAA',
    marginBottom: 4,
  },
  downwindImpact: {
    fontSize: 11,
    fontWeight: '600',
  },
  pressureInfo: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  pressureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pressureLabel: {
    fontSize: 11,
    color: '#AAA',
  },
  pressureValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  tipBox: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  tipText: {
    fontSize: 10,
    color: '#90EE90',
    lineHeight: 14,
  },
  warningBox: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  warningText: {
    fontSize: 10,
    color: '#FF6666',
    lineHeight: 14,
  },
  insightBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 10,
    color: '#DDA0DD',
    lineHeight: 14,
  },
});
