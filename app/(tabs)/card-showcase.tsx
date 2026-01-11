/**
 * Card Showcase Screen
 *
 * Preview the AppleRaceCard component in different states
 */

import { AppleRaceCard } from '@/components/races';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View, StyleSheet } from 'react-native';

export default function CardShowcaseScreen() {
  // Sample data for different card states
  // Sample forecast data for sparklines (6hr forecast, hourly)
  const windForecastSample = [8, 9, 11, 10, 8, 7, 6]; // Wind easing
  const tideForecastSample = [1.2, 1.8, 2.3, 2.5, 2.4, 2.0, 1.5]; // Rising to peak then falling

  const upcomingRace = {
    id: '1',
    name: 'Aberdeen Boat Club Four Peaks Race',
    venue: 'Hong Kong',
    clubName: 'Aberdeen Boat Club',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    startTime: '10:25 AM',
    wind: { direction: 'E', speedMin: 6, speedMax: 11 },
    tide: { state: 'rising' as const, height: 2.5 },
    vhfChannel: '72',
    raceStatus: 'future' as const,
    windForecast: windForecastSample,
    tideForecast: tideForecastSample,
    forecastNowIndex: 2, // "Now" is 2 hours into forecast
  };

  const nextRace = {
    id: '2',
    name: 'RHKYC Wednesday Evening Series',
    venue: 'Victoria Harbour',
    clubName: 'Royal Hong Kong Yacht Club',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    startTime: '6:30 PM',
    wind: { direction: 'SW', speedMin: 12, speedMax: 18 },
    tide: { state: 'ebbing' as const, height: 1.8 },
    vhfChannel: '77',
    raceStatus: 'next' as const,
    windForecast: [14, 16, 18, 17, 15, 13, 12], // Building then easing
    tideForecast: [2.2, 2.0, 1.8, 1.5, 1.2, 1.0, 0.9], // Falling
    forecastNowIndex: 1,
  };

  const completedRace = {
    id: '3',
    name: 'Spring Regatta - Race 4',
    venue: 'Deep Water Bay',
    clubName: 'Aberdeen Boat Club',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    startTime: '2:00 PM',
    wind: { direction: 'NE', speedMin: 8, speedMax: 14 },
    tide: { state: 'slack' as const, height: 2.1 },
    raceStatus: 'past' as const,
    results: {
      position: 3,
      fleetSize: 24,
      points: 3,
    },
  };

  const winningRace = {
    id: '4',
    name: 'Club Championship Final',
    venue: 'Tai Tam Bay',
    clubName: 'Aberdeen Boat Club',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '11:00 AM',
    wind: { direction: 'S', speedMin: 10, speedMax: 15 },
    tide: { state: 'flooding' as const, height: 1.5 },
    raceStatus: 'past' as const,
    results: {
      position: 1,
      fleetSize: 18,
      points: 1,
    },
  };

  const urgentRace = {
    id: '5',
    name: 'Weekend Sprint Series',
    venue: 'Middle Island',
    date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    startTime: '3:00 PM',
    wind: { direction: 'W', speedMin: 15, speedMax: 22 },
    tide: { state: 'low' as const, height: 0.8 },
    vhfChannel: '69',
    raceStatus: 'next' as const,
    windForecast: [18, 20, 22, 21, 19, 17], // Building to peak
    tideForecast: [0.6, 0.8, 1.0, 1.3, 1.6, 1.9], // Rising from low
    forecastNowIndex: 0, // "Now" is at start
  };

  const noDataRace = {
    id: '6',
    name: 'Upcoming Regatta',
    venue: 'TBD',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks away
    startTime: '10:00 AM',
    raceStatus: 'future' as const,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Apple-Style Race Card</Text>
        <Text style={styles.subtitle}>iOS Human Interface Guidelines Inspired</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Race (3 days)</Text>
          <AppleRaceCard {...upcomingRace} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Race (Tomorrow)</Text>
          <AppleRaceCard {...nextRace} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgent (Today)</Text>
          <AppleRaceCard {...urgentRace} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed - Podium Finish</Text>
          <AppleRaceCard {...completedRace} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed - Winner</Text>
          <AppleRaceCard {...winningRace} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loading State</Text>
          <AppleRaceCard {...upcomingRace} isLoading />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimal Data</Text>
          <AppleRaceCard {...noDataRace} />
        </View>

        <View style={styles.comparison}>
          <Text style={styles.comparisonTitle}>Design Improvements</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Single status indicator (no redundancy)</Text>
            <Text style={styles.bullet}>• Clear hierarchy - name/result prominent</Text>
            <Text style={styles.bullet}>• Compact inline conditions</Text>
            <Text style={styles.bullet}>• Semantic colors (iOS palette)</Text>
            <Text style={styles.bullet}>• State-aware adaptive layout</Text>
            <Text style={styles.bullet}>• SF Pro-style typography</Text>
            <Text style={styles.bullet}>• Subtle shadows and press states</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS system background
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#3C3C43',
    opacity: 0.6,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  comparison: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  comparisonTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  bulletList: {
    gap: 6,
  },
  bullet: {
    fontSize: 15,
    fontWeight: '400',
    color: '#3C3C43',
    lineHeight: 22,
  },
});
