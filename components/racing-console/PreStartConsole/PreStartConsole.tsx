/**
 * Pre-Start Console
 *
 * Main racing tactical console for pre-start phase:
 * - AI Tactical Recommendations (top)
 * - Hero Map View with tactical layers (left/center)
 * - Telemetry Cards: Bias, Current, Clearance (right)
 * - Depth Safety Strip (bottom - positioned absolutely)
 *
 * Designed for iPad landscape and large phone displays
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { AITacticalChips } from '../AITacticalChips';
import { DepthSafetyStrip } from '../DepthSafetyStrip';
import { BiasAdvantageCard } from './BiasAdvantageCard';
import { WaterPushCard } from './WaterPushCard';
import { ClearanceOutlookCard } from './ClearanceOutlookCard';
import { TacticalMapView } from './TacticalMapView';
import type { AIChip } from '@/stores/raceConditionsStore';
import {
  Colors,
  Spacing,
  Components,
  ZIndex
} from '@/constants/RacingDesignSystem';

interface PreStartConsoleProps {
  startLineHeading?: number;
  startLineLength?: number;
  timeToStart?: number;
  boatSpeed?: number;
  courseHeading?: number;
  boatLength?: number;
  draft?: number;
  onChipExpand?: (chip: AIChip) => void;
}

export function PreStartConsole({
  startLineHeading = 0,
  startLineLength = 100,
  timeToStart = 10,
  boatSpeed = 5,
  courseHeading = 0,
  boatLength = 10,
  draft = 2.5,
  onChipExpand
}: PreStartConsoleProps) {
  const [expandedDepthStrip, setExpandedDepthStrip] = useState(false);

  const { width, height } = Dimensions.get('window');
  const isTablet = width >= 768;
  const isLandscape = width > height;

  // Layout calculations
  const useHorizontalLayout = isTablet && isLandscape;
  const mapHeight = useHorizontalLayout ? height - 200 : 400; // Account for chips and safety strip
  const telemetryWidth = useHorizontalLayout ? 360 : width - (Spacing.md * 2);

  return (
    <View style={styles.container}>
      {/* AI Tactical Chips - Top */}
      <View style={styles.chipsContainer}>
        <AITacticalChips
          onChipExpand={onChipExpand}
          maxHeight={160}
        />
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: Components.safetyStrip.height + Spacing.lg,
            flexDirection: useHorizontalLayout ? 'row' : 'column'
          }
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Map Hero Section */}
        <View style={[
          styles.mapContainer,
          {
            height: mapHeight,
            flex: useHorizontalLayout ? 1 : undefined,
            marginRight: useHorizontalLayout ? Spacing.md : 0,
            marginBottom: useHorizontalLayout ? 0 : Spacing.md
          }
        ]}>
          <TacticalMapView
            startLineHeading={startLineHeading}
            startLineLength={startLineLength}
            timeToStart={timeToStart}
          />
        </View>

        {/* Telemetry Cards Panel */}
        <View style={[
          styles.telemetryPanel,
          {
            width: useHorizontalLayout ? telemetryWidth : '100%'
          }
        ]}>
          {/* Card 1: Bias Advantage */}
          <View style={styles.cardContainer}>
            <BiasAdvantageCard
              startLineHeading={startLineHeading}
              lineLength={startLineLength}
              timeToStart={timeToStart}
            />
          </View>

          {/* Card 2: Water Push */}
          <View style={styles.cardContainer}>
            <WaterPushCard
              boatSpeed={boatSpeed}
              courseHeading={courseHeading}
              boatLength={boatLength}
            />
          </View>

          {/* Card 3: Clearance Outlook */}
          <View style={styles.cardContainer}>
            <ClearanceOutlookCard
              lookAheadDistance={1000}
              criticalClearance={2}
            />
          </View>
        </View>
      </ScrollView>

      {/* Depth Safety Strip - Bottom (Absolute Position) */}
      <DepthSafetyStrip
        onExpand={() => setExpandedDepthStrip(!expandedDepthStrip)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ui.background
  },

  chipsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
    backgroundColor: Colors.ui.surface,
    zIndex: ZIndex.chip
  },

  scrollContainer: {
    flex: 1
  },

  contentContainer: {
    padding: Spacing.md,
    gap: Spacing.md
  },

  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.ui.surface,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8
      },
      android: {
        elevation: 4
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }
    })
  },

  telemetryPanel: {
    gap: Spacing.md
  },

  cardContainer: {
    // Individual card spacing handled by gap above
  }
});
