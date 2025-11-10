/**
 * LayeredWindField Component
 *
 * Displays wind field with multiple altitude layers
 * Useful for identifying wind shear and optimal sailing height
 * Uses Storm Glass wind data with altitude variations
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Svg, { Path, Circle, Text as SvgText, Defs, Marker as SvgMarker } from 'react-native-svg';

interface WindLayer {
  altitude: number; // meters above surface
  speed: number; // knots
  direction: number; // degrees
  label: string; // e.g., "Surface", "10m", "50m"
}

interface WindFieldPoint {
  latitude: number;
  longitude: number;
  layers: WindLayer[];
}

interface LayeredWindFieldProps {
  windData: WindFieldPoint[];
  selectedLayers?: number[]; // Altitude levels to display
  showShear?: boolean; // Highlight wind shear zones
  vectorDensity?: 'low' | 'medium' | 'high';
  opacity?: number;
}

/**
 * Calculate wind shear between layers
 */
function calculateWindShear(
  layer1: WindLayer,
  layer2: WindLayer
): {
  speedShear: number; // knots per meter
  directionShear: number; // degrees per meter
  intensity: 'low' | 'moderate' | 'high' | 'severe';
} {
  const altitudeDiff = Math.abs(layer2.altitude - layer1.altitude);
  if (altitudeDiff === 0) {
    return { speedShear: 0, directionShear: 0, intensity: 'low' };
  }

  const speedShear = Math.abs(layer2.speed - layer1.speed) / altitudeDiff;
  const directionShear = Math.abs(layer2.direction - layer1.direction) / altitudeDiff;

  // Determine intensity
  let intensity: 'low' | 'moderate' | 'high' | 'severe' = 'low';
  if (speedShear > 1.0 || directionShear > 10) {
    intensity = 'severe';
  } else if (speedShear > 0.5 || directionShear > 5) {
    intensity = 'high';
  } else if (speedShear > 0.2 || directionShear > 2) {
    intensity = 'moderate';
  }

  return { speedShear, directionShear, intensity };
}

/**
 * Get color for wind speed
 */
function getWindSpeedColor(speed: number): string {
  if (speed < 5) return '#87CEEB'; // Light blue - light wind
  if (speed < 10) return '#4A90E2'; // Blue - moderate wind
  if (speed < 15) return '#2E7BCF'; // Dark blue - fresh wind
  if (speed < 20) return '#FFD700'; // Yellow - strong wind
  if (speed < 25) return '#FFA500'; // Orange - gale
  return '#FF4500'; // Red - storm
}

/**
 * Wind Arrow with Layer Styling
 */
const LayeredWindArrow: React.FC<{
  layer: WindLayer;
  x: number;
  y: number;
  scale?: number;
}> = ({ layer, x, y, scale = 1.0 }) => {
  const color = getWindSpeedColor(layer.speed);

  // Arrow size based on wind speed
  const baseSize = 30 * scale;
  const length = baseSize * Math.min(layer.speed / 20, 1.5);

  // Opacity based on altitude (higher = more transparent)
  const opacity = Math.max(0.4, 1 - layer.altitude / 100);

  return (
    <g transform={`translate(${x}, ${y}) rotate(${layer.direction})`}>
      {/* Arrow shaft */}
      <Path
        d={`M 0 0 L 0 ${length}`}
        stroke={color}
        strokeWidth={2 * scale}
        strokeLinecap="round"
        opacity={opacity}
      />

      {/* Arrow head */}
      <Path
        d={`M 0 ${length} L ${-5 * scale} ${length - 8 * scale} M 0 ${length} L ${5 * scale} ${length - 8 * scale}`}
        stroke={color}
        strokeWidth={2 * scale}
        strokeLinecap="round"
        opacity={opacity}
      />

      {/* Wind speed label */}
      <SvgText
        x={8 * scale}
        y={length / 2}
        fontSize={10 * scale}
        fill={color}
        fontWeight="bold"
        opacity={opacity}
      >
        {layer.speed.toFixed(0)}
      </SvgText>

      {/* Altitude label */}
      <SvgText
        x={8 * scale}
        y={length / 2 + 12 * scale}
        fontSize={8 * scale}
        fill="#FFFFFF"
        opacity={opacity * 0.8}
      >
        {layer.label}
      </SvgText>
    </g>
  );
};

/**
 * Wind Shear Indicator
 */
const WindShearIndicator: React.FC<{
  point: WindFieldPoint;
  x: number;
  y: number;
}> = ({ point, x, y }) => {
  if (point.layers.length < 2) return null;

  // Calculate shear between surface and first upper layer
  const surfaceLayer = point.layers[0];
  const upperLayer = point.layers[1];
  const shear = calculateWindShear(surfaceLayer, upperLayer);

  if (shear.intensity === 'low') return null;

  const shearColor = {
    moderate: '#FFFF00',
    high: '#FFA500',
    severe: '#FF0000',
  }[shear.intensity] || '#FFFF00';

  return (
    <Circle
      cx={x}
      cy={y}
      r={15}
      fill="none"
      stroke={shearColor}
      strokeWidth={2}
      strokeDasharray="4,2"
      opacity={0.7}
    />
  );
};

/**
 * Wind Profile Display
 */
const WindProfile: React.FC<{
  layers: WindLayer[];
  width: number;
  height: number;
}> = ({ layers, width, height }) => {
  if (layers.length === 0) return null;

  const maxAltitude = Math.max(...layers.map(l => l.altitude));
  const maxSpeed = Math.max(...layers.map(l => l.speed), 20);

  const padding = { top: 20, right: 40, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  return (
    <Svg width={width} height={height}>
      {/* Axes */}
      <Path
        d={`M ${padding.left} ${padding.top} L ${padding.left} ${padding.top + chartHeight} L ${padding.left + chartWidth} ${padding.top + chartHeight}`}
        stroke="#666"
        strokeWidth={2}
        fill="none"
      />

      {/* Speed profile line */}
      <Path
        d={layers
          .map((layer, i) => {
            const x = padding.left + (layer.speed / maxSpeed) * chartWidth;
            const y = padding.top + chartHeight - (layer.altitude / maxAltitude) * chartHeight;
            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
          })
          .join(' ')}
        stroke="#4A90E2"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />

      {/* Data points */}
      {layers.map((layer, i) => {
        const x = padding.left + (layer.speed / maxSpeed) * chartWidth;
        const y = padding.top + chartHeight - (layer.altitude / maxAltitude) * chartHeight;
        const color = getWindSpeedColor(layer.speed);

        return (
          <g key={i}>
            <Circle cx={x} cy={y} r={5} fill={color} stroke="white" strokeWidth={2} />
            <SvgText
              x={x + 10}
              y={y + 4}
              fontSize={10}
              fill="#FFFFFF"
            >
              {layer.label}: {layer.speed.toFixed(1)}kts @ {layer.direction}°
            </SvgText>
          </g>
        );
      })}

      {/* Axis labels */}
      <SvgText
        x={padding.left + chartWidth / 2}
        y={padding.top + chartHeight + 25}
        fontSize={12}
        fill="#FFFFFF"
        textAnchor="middle"
      >
        Wind Speed (knots)
      </SvgText>

      <SvgText
        x={padding.left - 35}
        y={padding.top + chartHeight / 2}
        fontSize={12}
        fill="#FFFFFF"
        textAnchor="middle"
        transform={`rotate(-90 ${padding.left - 35} ${padding.top + chartHeight / 2})`}
      >
        Altitude (m)
      </SvgText>
    </Svg>
  );
};

export const LayeredWindField: React.FC<LayeredWindFieldProps> = ({
  windData,
  selectedLayers = [0, 10, 50], // Surface, 10m, 50m
  showShear = true,
  vectorDensity = 'medium',
  opacity = 0.8,
}) => {
  // Filter data by selected layers
  const filteredData = useMemo(() => {
    return windData.map(point => ({
      ...point,
      layers: point.layers.filter(layer =>
        selectedLayers.includes(layer.altitude)
      ),
    }));
  }, [windData, selectedLayers]);

  // For detailed display, show first point's profile
  const firstPoint = filteredData[0];

  if (!firstPoint || firstPoint.layers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Layered Wind Field</ThemedText>
        <ThemedText style={styles.subtitle}>
          {selectedLayers.length} altitude levels
        </ThemedText>
      </View>

      {/* Wind Profile Chart */}
      <View style={styles.profileContainer}>
        <WindProfile
          layers={firstPoint.layers}
          width={300}
          height={200}
        />
      </View>

      {/* Shear Analysis */}
      {showShear && firstPoint.layers.length >= 2 && (
        <View style={styles.shearContainer}>
          <ThemedText style={styles.shearTitle}>Wind Shear Analysis</ThemedText>
          {firstPoint.layers.slice(0, -1).map((layer, i) => {
            const nextLayer = firstPoint.layers[i + 1];
            const shear = calculateWindShear(layer, nextLayer);

            return (
              <View key={i} style={styles.shearItem}>
                <ThemedText style={styles.shearLabel}>
                  {layer.label} → {nextLayer.label}:
                </ThemedText>
                <ThemedText
                  style={[
                    styles.shearValue,
                    { color: shear.intensity === 'severe' ? '#FF0000' : shear.intensity === 'high' ? '#FFA500' : '#FFFF00' }
                  ]}
                >
                  {shear.intensity.toUpperCase()}
                </ThemedText>
                <ThemedText style={styles.shearDetail}>
                  {shear.speedShear.toFixed(2)} kts/m, {shear.directionShear.toFixed(1)}°/m
                </ThemedText>
              </View>
            );
          })}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <ThemedText style={styles.legendTitle}>Wind Speed Scale</ThemedText>
        <View style={styles.legendItems}>
          {[
            { label: '0-5 kts', color: '#87CEEB' },
            { label: '5-10 kts', color: '#4A90E2' },
            { label: '10-15 kts', color: '#2E7BCF' },
            { label: '15-20 kts', color: '#FFD700' },
            { label: '20-25 kts', color: '#FFA500' },
            { label: '25+ kts', color: '#FF4500' },
          ].map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <ThemedText style={styles.legendLabel}>{item.label}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

/**
 * MapLibre GL layer specification for layered wind field
 */
export function getLayeredWindFieldLayerSpec(
  windData: WindFieldPoint[],
  selectedLayers: number[] = [0, 10, 50]
): any[] {
  // Generate arrow symbols for each layer
  const layers: any[] = [];

  for (const altitude of selectedLayers) {
    const points = windData
      .map(point => {
        const layer = point.layers.find(l => l.altitude === altitude);
        if (!layer) return null;

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.longitude, point.latitude],
          },
          properties: {
            speed: layer.speed,
            direction: layer.direction,
            altitude: layer.altitude,
            label: layer.label,
            color: getWindSpeedColor(layer.speed),
          },
        };
      })
      .filter(Boolean);

    layers.push({
      id: `wind-field-${altitude}m`,
      type: 'symbol',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: points,
        },
      },
      layout: {
        'icon-image': 'wind-arrow', // Custom arrow icon
        'icon-size': [
          'interpolate',
          ['linear'],
          ['get', 'speed'],
          0, 0.5,
          25, 1.5,
        ],
        'icon-rotate': ['get', 'direction'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
      },
      paint: {
        'icon-opacity': Math.max(0.4, 1 - altitude / 100),
      },
    });
  }

  return layers;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  shearContainer: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  shearTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  shearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  shearLabel: {
    fontSize: 11,
    color: '#AAA',
    flex: 1,
  },
  shearValue: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 8,
  },
  shearDetail: {
    fontSize: 9,
    color: '#888',
  },
  legend: {
    marginTop: 8,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 9,
    color: '#AAA',
  },
});
