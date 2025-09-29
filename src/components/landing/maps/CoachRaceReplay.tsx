import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// SVG imports temporarily disabled to fix app loading
// import Svg, {
//   Circle,
//   Path
// } from 'react-native-svg';

export function CoachRaceReplay() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#581C87', '#7C2D92', '#4C1D95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mapContainer}
      >
        {/* SVG Race Replay */}
        <Svg width="100%" height="100%" viewBox="0 0 400 300" style={styles.svg}>
          {/* Course marks */}
          <Circle cx="200" cy="70" r="4" fill="#FFD700" />
          <Circle cx="150" cy="230" r="4" fill="#FF4444" />
          <Circle cx="250" cy="230" r="4" fill="#FF4444" />

          {/* Student boat track (highlighted) */}
          <Path
            d="M 200 250 Q 160 180 200 70 Q 240 180 200 250"
            fill="none"
            stroke="#FF6B9D"
            strokeWidth="3"
          />

          {/* Other boats */}
          <Path
            d="M 190 250 Q 170 190 190 70 Q 210 190 190 250"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <Path
            d="M 210 250 Q 190 190 210 70 Q 230 190 210 250"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />

          {/* Analysis points */}
          <Circle cx="200" cy="150" r="6" fill="#FF6B9D" opacity="0.8" />
          <Circle cx="180" cy="200" r="6" fill="#FFD700" opacity="0.8" />
        </Svg>

        {/* Analysis overlay */}
        <View style={styles.overlayContainer}>
          {/* Student performance */}
          <View style={[styles.card, styles.studentCard]}>
            <Text style={styles.cardTitle}>STUDENT: SARAH</Text>
            <Text style={[styles.cardValue, { color: '#8B5CF6' }]}>2nd Place</Text>
            <Text style={[styles.cardSubtext, { color: '#10B981' }]}>+15% vs last race</Text>
          </View>

          {/* Analysis point 1 */}
          <View style={[styles.card, styles.analysisCard1]}>
            <Text style={styles.analysisTitle}>MARK ROUNDING</Text>
            <Text style={styles.analysisValue}>Excellent</Text>
            <Text style={styles.analysisDetail}>Tight turn, good speed</Text>
          </View>

          {/* Analysis point 2 */}
          <View style={[styles.card, styles.analysisCard2]}>
            <Text style={styles.analysisTitle}>UPWIND LEG</Text>
            <Text style={[styles.analysisValue, { color: '#F59E0B' }]}>Needs Work</Text>
            <Text style={styles.analysisDetail}>Tacking angles</Text>
          </View>

          {/* Overall performance */}
          <View style={[styles.card, styles.ratingCard]}>
            <Text style={styles.ratingLabel}>SESSION RATING</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="medal" size={20} color="#FCD34D" />
              <Text style={styles.ratingText}>8.5/10</Text>
            </View>
            <Text style={styles.ratingSubtext}>Excellent progress!</Text>
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
    opacity: 0.2,
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
  },
  studentCard: {
    top: 16,
    left: 16,
    minWidth: 140,
  },
  analysisCard1: {
    top: 16,
    right: 16,
    minWidth: 120,
  },
  analysisCard2: {
    top: 120,
    right: 60,
    minWidth: 120,
  },
  ratingCard: {
    bottom: 16,
    left: '50%',
    transform: [{ translateX: -80 }],
    backgroundColor: '#8B5CF6',
    minWidth: 160,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  analysisTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'center',
  },
  analysisDetail: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ratingSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
});