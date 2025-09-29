import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// SVG imports removed temporarily

export function SailorRaceStrategyMap() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E3A8A', '#1E40AF', '#1E3A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mapContainer}
      >
        {/* SVG Race Course - Temporarily disabled */}
        {/* <Svg width="100%" height="100%" viewBox="0 0 400 300" style={styles.svg}>
          <Defs>
            <Pattern
              id="water-grid"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <Path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
            </Pattern>

            <Marker
              id="wind-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <Path d="M0,0 L0,6 L9,3 z" fill="#00FF88" />
            </Marker>
          </Defs>

          <Rect width="100%" height="100%" fill="url(#water-grid)" opacity="0.2" />
          <Circle cx="200" cy="80" r="4" fill="#FFD700" />
          <Circle cx="150" cy="220" r="4" fill="#FF4444" />
          <Circle cx="250" cy="220" r="4" fill="#FF4444" />

          <Line
            x1="350"
            y1="50"
            x2="350"
            y2="100"
            stroke="#00FF88"
            strokeWidth="3"
            markerEnd="url(#wind-arrow)"
          />

          <Path
            d="M 200 250 Q 180 200 200 80 Q 220 200 200 250"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
            strokeDasharray="3,3"
          />
        </Svg> */}

        {/* Placeholder for SVG content */}
        <View style={[styles.svg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 100 }}>
            Race Course Visualization
          </Text>
        </View>

        {/* Strategy overlay cards */}
        <View style={styles.overlayContainer}>
          {/* Wind card */}
          <View style={[styles.card, styles.windCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="wind" size={16} color="#3B82F6" />
              <Text style={styles.cardTitle}>WIND</Text>
            </View>
            <Text style={styles.cardValue}>12kt</Text>
            <Text style={styles.cardSubtext}>Steady →</Text>
          </View>

          {/* Tide card */}
          <View style={[styles.card, styles.tideCard]}>
            <Text style={styles.cardTitle}>TIDE</Text>
            <Text style={[styles.cardValue, { color: '#3B82F6' }]}>-0.8kt ↓</Text>
            <Text style={[styles.cardSubtext, { color: '#3B82F6' }]}>Ebb -1hr</Text>
          </View>

          {/* Strategy recommendation */}
          <View style={[styles.card, styles.strategyCard]}>
            <Text style={styles.recommendationLabel}>RECOMMENDED</Text>
            <Text style={styles.recommendationText}>Port Tack Start</Text>
            <Text style={styles.confidenceText}>85% confidence</Text>
          </View>

          {/* Start line indicator */}
          <View style={styles.startLine}>
            <View style={styles.startLineDot} />
            <Text style={styles.startLineText}>Start Line</Text>
          </View>

          {/* Mark 1 indicator */}
          <View style={styles.mark1}>
            <View style={styles.mark1Dot} />
            <Text style={styles.mark1Text}>Mark 1</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    padding: 24,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  overlayContainer: {
    flex: 1,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
  },
  windCard: {
    top: 16,
    right: 16,
  },
  tideCard: {
    top: 16,
    left: 16,
  },
  strategyCard: {
    bottom: 16,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#10B981',
    minWidth: 120,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#10B981',
    textAlign: 'center',
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  startLine: {
    position: 'absolute',
    bottom: 64,
    left: '25%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  startLineDot: {
    width: 12,
    height: 12,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    marginRight: 8,
  },
  startLineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  mark1: {
    position: 'absolute',
    top: 64,
    left: '50%',
    transform: [{ translateX: -40 }],
    flexDirection: 'row',
    alignItems: 'center',
  },
  mark1Dot: {
    width: 12,
    height: 12,
    backgroundColor: '#FCD34D',
    borderRadius: 6,
    marginRight: 8,
  },
  mark1Text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});