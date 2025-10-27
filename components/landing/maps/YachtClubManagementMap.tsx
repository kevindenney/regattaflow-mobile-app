import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Rect,
  Circle,
  Path,
  G
} from 'react-native-svg';

export function YachtClubManagementMap() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#064E3B', '#065F46', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mapContainer}
      >
        {/* SVG Race Course Overview */}
        <Svg width="100%" height="100%" viewBox="0 0 400 300" style={styles.svg}>
          {/* Harbor outline */}
          <Path
            d="M 50 250 Q 100 200 200 250 Q 300 200 350 250"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />

          {/* Course A */}
          <G id="course-a">
            <Circle cx="150" cy="80" r="3" fill="#FFD700" />
            <Circle cx="120" cy="180" r="3" fill="#FF4444" />
            <Circle cx="180" cy="180" r="3" fill="#FF4444" />
          </G>

          {/* Course B */}
          <G id="course-b">
            <Circle cx="280" cy="90" r="3" fill="#FFD700" />
            <Circle cx="250" cy="190" r="3" fill="#FF4444" />
            <Circle cx="310" cy="190" r="3" fill="#FF4444" />
          </G>
        </Svg>

        {/* Management dashboard cards */}
        <View style={styles.overlayContainer}>
          {/* Live race status */}
          <View style={[styles.card, styles.raceStatusCard]}>
            <Text style={styles.cardTitle}>RACE STATUS</Text>
            <Text style={[styles.cardValue, { color: '#10B981' }]}>Race 3 Active</Text>
            <Text style={styles.cardSubtext}>24 boats racing</Text>
          </View>

          {/* Weather monitoring */}
          <View style={[styles.card, styles.weatherCard]}>
            <Text style={styles.cardTitle}>CONDITIONS</Text>
            <Text style={[styles.cardValue, { color: '#3B82F6' }]}>Perfect</Text>
            <Text style={[styles.cardSubtext, { color: '#10B981' }]}>15kt SW, Flat</Text>
          </View>

          {/* Live scoring */}
          <View style={[styles.card, styles.leaderboardCard]}>
            <Text style={styles.cardTitle}>LEADERBOARD</Text>
            <View style={styles.leaderboard}>
              <View style={styles.leaderboardRow}>
                <Text style={styles.boatName}>USA 123</Text>
                <Text style={[styles.position, { color: '#10B981' }]}>1st</Text>
              </View>
              <View style={styles.leaderboardRow}>
                <Text style={styles.boatName}>GBR 456</Text>
                <Text style={styles.position}>2nd</Text>
              </View>
              <View style={styles.leaderboardRow}>
                <Text style={styles.boatName}>AUS 789</Text>
                <Text style={styles.position}>3rd</Text>
              </View>
            </View>
          </View>

          {/* Course management */}
          <View style={[styles.card, styles.courseCard]}>
            <Text style={styles.courseLabel}>COURSE ACTIVE</Text>
            <Text style={styles.courseText}>Windward/Leeward</Text>
            <Text style={styles.courseDistance}>2.1nm course</Text>
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
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : {
          boxShadow: '0px 2px',
          elevation: 4,
        }
    ),
  },
  raceStatusCard: {
    top: 16,
    left: 16,
    minWidth: 140,
  },
  weatherCard: {
    top: 16,
    right: 16,
    minWidth: 140,
  },
  leaderboardCard: {
    bottom: 16,
    left: 16,
    minWidth: 160,
  },
  courseCard: {
    bottom: 16,
    right: 16,
    backgroundColor: '#10B981',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
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
  leaderboard: {
    gap: 4,
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boatName: {
    fontSize: 14,
    color: '#1F2937',
  },
  position: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  courseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  courseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  courseDistance: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});