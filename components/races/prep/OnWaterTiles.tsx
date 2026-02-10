/**
 * OnWaterTiles - Tile components for the Race (OnWater) tab
 *
 * These tiles replace the old checklist row items and strategy cards.
 * Each tile wraps the PrepTile base component with domain-specific
 * props, body content, and hint logic.
 *
 * Sections:
 * - Pre-Departure (read-only reference from prep): PreDepSailsTile, PreDepRigTile
 * - Pre-Start Checks: RaceCommitteeTile, StartLineTile, CourseReconTile, CrewRolesTile, FinalCheckTile
 * - Your Race Plan (read-only reference from prep strategy): RacePlanStartTile, RacePlanUpwindTile
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Sailboat,
  Sliders,
  Radio,
  Flag,
  Compass,
  Users,
  CheckCircle,
  TrendingUp,
} from 'lucide-react-native';
import { PrepTile } from './PrepTile';

// ---------------------------------------------------------------------------
// Shared colors
// ---------------------------------------------------------------------------

const COLORS = {
  blue: '#007AFF',
  pink: '#FF2D55',
  purple: '#AF52DE',
  green: '#34C759',
  black: '#000000',
  gray: '#8E8E93',
  secondaryLabel: '#3C3C43',
};

// ===========================================================================
// PRE-DEPARTURE SECTION (read-only reference from prep)
// ===========================================================================

// ---------------------------------------------------------------------------
// PreDepSailsTile
// ---------------------------------------------------------------------------

interface PreDepSailsTileProps {
  isComplete: boolean;
  onPress: () => void;
  selectedSails?: string[];
}

export function PreDepSailsTile({
  isComplete,
  onPress,
  selectedSails,
}: PreDepSailsTileProps) {
  return (
    <PrepTile
      label="SAILS"
      icon={Sailboat}
      iconColor={COLORS.blue}
      isComplete={isComplete}
      onPress={onPress}
      hint="From prep"
    >
      {selectedSails && selectedSails.length > 0 ? (
        <Text style={styles.bodyText} numberOfLines={3}>
          {selectedSails.join(', ')}
        </Text>
      ) : (
        <Text style={styles.bodyPlaceholder} numberOfLines={1}>
          No sails selected
        </Text>
      )}
    </PrepTile>
  );
}

// ---------------------------------------------------------------------------
// PreDepRigTile
// ---------------------------------------------------------------------------

interface PreDepRigTileProps {
  isComplete: boolean;
  onPress: () => void;
  tuningSummary?: string;
}

export function PreDepRigTile({
  isComplete,
  onPress,
  tuningSummary,
}: PreDepRigTileProps) {
  return (
    <PrepTile
      label="RIG TUNE"
      icon={Sliders}
      iconColor={COLORS.blue}
      isComplete={isComplete}
      onPress={onPress}
      hint="From prep"
    >
      {tuningSummary ? (
        <Text style={styles.bodyText} numberOfLines={3}>
          {tuningSummary}
        </Text>
      ) : (
        <Text style={styles.bodyPlaceholder} numberOfLines={1}>
          No tuning set
        </Text>
      )}
    </PrepTile>
  );
}

// ===========================================================================
// PRE-START CHECKS SECTION
// ===========================================================================

// ---------------------------------------------------------------------------
// RaceCommitteeTile
// ---------------------------------------------------------------------------

interface RaceCommitteeTileProps {
  isComplete: boolean;
  onPress: () => void;
  checkedIn?: boolean;
  courseCode?: string;
}

export function RaceCommitteeTile({
  isComplete,
  onPress,
  checkedIn,
  courseCode,
}: RaceCommitteeTileProps) {
  const hint = isComplete ? 'Done' : 'Check in';

  const renderBody = () => {
    if (checkedIn && courseCode) {
      return (
        <View style={styles.bodyColumn}>
          <Text style={styles.bodyText} numberOfLines={1}>
            Checked in
          </Text>
          <Text style={styles.bodyText} numberOfLines={1}>
            {courseCode}
          </Text>
        </View>
      );
    }
    if (checkedIn) {
      return (
        <Text style={styles.bodyText} numberOfLines={1}>
          Checked in
        </Text>
      );
    }
    return (
      <Text style={styles.bodyPlaceholder} numberOfLines={1}>
        Check in with RC
      </Text>
    );
  };

  return (
    <PrepTile
      label="RACE COMM"
      icon={Radio}
      iconColor={COLORS.blue}
      isComplete={isComplete}
      onPress={onPress}
      hint={hint}
    >
      {renderBody()}
    </PrepTile>
  );
}

// ---------------------------------------------------------------------------
// StartLineTile
// ---------------------------------------------------------------------------

interface StartLineTileProps {
  isComplete: boolean;
  onPress: () => void;
  favoredEnd?: string;
  lineTime?: string;
}

export function StartLineTile({
  isComplete,
  onPress,
  favoredEnd,
  lineTime,
}: StartLineTileProps) {
  const hint = isComplete ? 'Line assessed' : 'Sail the line';

  return (
    <PrepTile
      label="START LINE"
      icon={Flag}
      iconColor={COLORS.pink}
      isComplete={isComplete}
      onPress={onPress}
      hint={hint}
    >
      {favoredEnd ? (
        <View style={styles.bodyColumn}>
          <Text style={styles.bodyText} numberOfLines={1}>
            {favoredEnd}
          </Text>
          {lineTime ? (
            <Text style={styles.bodyText} numberOfLines={1}>
              {lineTime}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.bodyPlaceholder} numberOfLines={1}>
          Sail the line
        </Text>
      )}
    </PrepTile>
  );
}

// ---------------------------------------------------------------------------
// CourseReconTile
// ---------------------------------------------------------------------------

interface CourseReconTileProps {
  isComplete: boolean;
  onPress: () => void;
  progress?: { current: number; total: number };
}

export function CourseReconTile({
  isComplete,
  onPress,
  progress,
}: CourseReconTileProps) {
  const hint = isComplete ? 'All observed' : 'Start recon';

  return (
    <PrepTile
      label="COURSE"
      icon={Compass}
      iconColor={COLORS.purple}
      isComplete={isComplete}
      onPress={onPress}
      hint={hint}
    >
      {progress ? (
        <View style={styles.bodyColumn}>
          <Text style={styles.progressCount}>
            {progress.current}
            <Text style={styles.progressSuffix}>/{progress.total}</Text>
          </Text>
          <Text style={styles.progressLabel} numberOfLines={1}>
            observed
          </Text>
        </View>
      ) : (
        <Text style={styles.bodyPlaceholder} numberOfLines={1}>
          Observe course
        </Text>
      )}
    </PrepTile>
  );
}

// ---------------------------------------------------------------------------
// CrewRolesTile
// ---------------------------------------------------------------------------

interface CrewRolesTileProps {
  isComplete: boolean;
  onPress: () => void;
}

export function CrewRolesTile({ isComplete, onPress }: CrewRolesTileProps) {
  const hint = isComplete ? 'Confirmed' : 'Confirm roles';

  return (
    <PrepTile
      label="CREW ROLES"
      icon={Users}
      iconColor={COLORS.blue}
      isComplete={isComplete}
      onPress={onPress}
      hint={hint}
    >
      {isComplete ? (
        <Text style={styles.bodyTextGreen} numberOfLines={1}>
          All confirmed
        </Text>
      ) : (
        <Text style={styles.bodyPlaceholder} numberOfLines={1}>
          Brief crew
        </Text>
      )}
    </PrepTile>
  );
}

// ---------------------------------------------------------------------------
// FinalCheckTile
// ---------------------------------------------------------------------------

interface FinalCheckTileProps {
  isComplete: boolean;
  onPress: () => void;
}

export function FinalCheckTile({ isComplete, onPress }: FinalCheckTileProps) {
  const hint = isComplete ? 'Ready to race' : 'Final check';

  return (
    <PrepTile
      label="FINAL CHECK"
      icon={CheckCircle}
      iconColor={COLORS.green}
      isComplete={isComplete}
      onPress={onPress}
      hint={hint}
    >
      {isComplete ? (
        <Text style={styles.bodyTextGreen} numberOfLines={1}>
          All systems go
        </Text>
      ) : (
        <Text style={styles.bodyPlaceholder} numberOfLines={1}>
          Run final check
        </Text>
      )}
    </PrepTile>
  );
}

// ===========================================================================
// YOUR RACE PLAN SECTION (read-only reference from prep strategy)
// ===========================================================================

// ---------------------------------------------------------------------------
// RacePlanStartTile
// ---------------------------------------------------------------------------

interface RacePlanStartTileProps {
  isComplete: boolean;
  onPress: () => void;
  summary?: string;
}

export function RacePlanStartTile({
  isComplete,
  onPress,
  summary,
}: RacePlanStartTileProps) {
  return (
    <PrepTile
      label="START"
      icon={Flag}
      iconColor={COLORS.pink}
      isComplete={!!summary}
      onPress={onPress}
      hint="Your plan"
    >
      {summary ? (
        <Text style={styles.bodyText} numberOfLines={3}>
          {summary}
        </Text>
      ) : (
        <Text style={styles.bodyPlaceholder} numberOfLines={1}>
          No plan set
        </Text>
      )}
    </PrepTile>
  );
}

// ---------------------------------------------------------------------------
// RacePlanUpwindTile
// ---------------------------------------------------------------------------

interface RacePlanUpwindTileProps {
  isComplete: boolean;
  onPress: () => void;
  summary?: string;
}

export function RacePlanUpwindTile({
  isComplete,
  onPress,
  summary,
}: RacePlanUpwindTileProps) {
  return (
    <PrepTile
      label="FIRST BEAT"
      icon={TrendingUp}
      iconColor={COLORS.pink}
      isComplete={!!summary}
      onPress={onPress}
      hint="Your plan"
    >
      {summary ? (
        <Text style={styles.bodyText} numberOfLines={3}>
          {summary}
        </Text>
      ) : (
        <Text style={styles.bodyPlaceholder} numberOfLines={1}>
          No plan set
        </Text>
      )}
    </PrepTile>
  );
}

// ===========================================================================
// Styles
// ===========================================================================

const styles = StyleSheet.create({
  bodyColumn: {
    alignItems: 'center',
    gap: 2,
  },
  bodyText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.black,
    textAlign: 'center',
  },
  bodyPlaceholder: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray,
    textAlign: 'center',
  },
  bodyTextGreen: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.green,
    textAlign: 'center',
  },
  progressCount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  progressSuffix: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },
});
