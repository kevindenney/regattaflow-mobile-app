/**
 * Racing Console Live Demo
 *
 * Comprehensive demo showing the complete Racing Tactical Console
 * with live mock data updates, tactical zones, and AI recommendations.
 *
 * Access at: http://localhost:8081/racing-console-live-demo
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PreStartConsole } from '@/components/racing-console/PreStartConsole';
import { useRaceConditions } from '@/stores/raceConditionsStore';
import {
  generateMockRacingScenario,
  createLiveDataSimulator
} from '@/services/MockRacingDataService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/RacingDesignSystem';

export default function RacingConsoleLiveDemo() {
  const [isLive, setIsLive] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Get store actions
  const updateEnvironment = useRaceConditions(state => state.updateEnvironment);
  const setPosition = useRaceConditions(state => state.setPosition);
  const setCourse = useRaceConditions(state => state.setCourse);
  const setFleet = useRaceConditions(state => state.setFleet);
  const setTacticalZones = useRaceConditions(state => state.setTacticalZones);
  const addAIChip = useRaceConditions(state => state.addAIChip);
  const clearAIChips = useRaceConditions(state => state.clearAIChips);

  // Initialize with mock data on mount
  useEffect(() => {
    loadMockData();
  }, []);

  // Setup live data simulator
  useEffect(() => {
    if (!isLive) return;

    const cleanup = createLiveDataSimulator((data) => {
      // Update all store data
      setPosition(data.position);
      updateEnvironment({
        wind: data.wind,
        current: data.current,
        tide: data.tide,
        depth: data.depth
      });
      setCourse(data.course);
      setFleet(data.fleet);
      setTacticalZones(data.tacticalZones);

      // Update AI chips (replace all for demo)
      clearAIChips();
      data.aiChips.forEach(chip => addAIChip(chip));

      setUpdateCount(prev => prev + 1);
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds

    return cleanup;
  }, [isLive]);

  const loadMockData = () => {
    const scenario = generateMockRacingScenario();

    setPosition(scenario.position);
    updateEnvironment({
      wind: scenario.wind,
      current: scenario.current,
      tide: scenario.tide,
      depth: scenario.depth
    });
    setCourse(scenario.course);
    setFleet(scenario.fleet);
    setTacticalZones(scenario.tacticalZones);

    clearAIChips();
    scenario.aiChips.forEach(chip => addAIChip(chip));

    setUpdateCount(0);
    setLastUpdate(new Date());
  };

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  const resetData = () => {
    setIsLive(false);
    loadMockData();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="robot"
            size={32}
            color={Colors.text.inverse}
          />
          <View>
            <Text style={styles.title}>Racing Tactical Console</Text>
            <Text style={styles.subtitle}>Live Demo with Mock Data</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              isLive && styles.controlButtonActive
            ]}
            onPress={toggleLive}
          >
            <MaterialCommunityIcons
              name={isLive ? 'pause' : 'play'}
              size={20}
              color={isLive ? Colors.status.safe : Colors.text.inverse}
            />
            <Text style={[
              styles.controlButtonText,
              isLive && styles.controlButtonTextActive
            ]}>
              {isLive ? 'Live' : 'Paused'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={resetData}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={Colors.text.inverse}
            />
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <MaterialCommunityIcons
            name="update"
            size={16}
            color={isLive ? Colors.status.safe : Colors.text.secondary}
          />
          <Text style={styles.statusText}>
            Updates: {updateCount}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color={Colors.text.secondary}
          />
          <Text style={styles.statusText}>
            Last: {lastUpdate.toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isLive ? Colors.status.safe : Colors.status.caution }
          ]} />
          <Text style={styles.statusText}>
            {isLive ? 'Streaming' : 'Static'}
          </Text>
        </View>
      </View>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>📍 Demo Features</Text>
        <Text style={styles.infoText}>
          • Real-time environmental data updates{'\n'}
          • 5 tactical zones with color coding{'\n'}
          • AI recommendations from racing skills{'\n'}
          • Interactive telemetry cards{'\n'}
          • Depth safety monitoring{'\n'}
          • Start line bias analysis{'\n'}
          • Current impact visualization
        </Text>
      </View>

      {/* Main Console */}
      <PreStartConsole
        startLineHeading={45}
        startLineLength={150}
        timeToStart={10}
        boatSpeed={6}
        courseHeading={50}
        boatLength={10}
        draft={2.5}
        onChipExpand={(chip) => {
          console.log('Chip expanded:', chip.title);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ui.surface
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.primary.blue,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary.blue + 'CC'
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md
  },

  title: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse
  },

  subtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.inverse,
    opacity: 0.9
  },

  controls: {
    flexDirection: 'row',
    gap: Spacing.sm
  },

  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.blue + 'CC',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.text.inverse + '40'
  },

  controlButtonActive: {
    backgroundColor: Colors.ui.background,
    borderColor: Colors.status.safe
  },

  controlButtonText: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.inverse
  },

  controlButtonTextActive: {
    color: Colors.status.safe
  },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: Spacing.sm,
    backgroundColor: Colors.ui.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border
  },

  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },

  statusText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.mono
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },

  infoPanel: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primary.blue + '10',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary.blue + '40',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.blue
  },

  infoTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm
  },

  infoText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.bodySmall
  }
});
