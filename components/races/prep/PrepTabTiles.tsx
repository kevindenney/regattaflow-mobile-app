/**
 * PrepTabTiles - All tile components for the Prep (DaysBefore) tab.
 *
 * Each tile wraps PrepTile with the correct icon, color, label, hint,
 * and body content. Tiles are grouped by section:
 *   - Race Intel: Briefing, Weather
 *   - Equipment: Sails, Rig, Electronics, Safety
 *   - Crew & Logistics: Crew, Logistics
 *   - Strategy: Wind, Start, Upwind, Tide
 *   - Tactics: Tactics (conditional)
 *   - Race-type specific: Navigation, WatchSchedule, OffshoreSafety,
 *     WeatherRouting, Opponent, PreStartTactics, Rules,
 *     TeamSetup, ComboPlays, TeamComms
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  FileText,
  CloudSun,
  Sailboat,
  Wrench,
  Zap,
  Shield,
  Users,
  Car,
  Wind,
  Flag,
  TrendingUp,
  Anchor,
  Target,
  Compass,
  Clock,
  Eye,
  BookOpen,
  Radio,
  Check,
} from 'lucide-react-native';

import { PrepTile } from './PrepTile';
import { TinySparkline } from '@/components/shared/charts/TinySparkline';

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  // Body text when showing real data
  bodyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  // Body text when showing placeholder / empty state
  placeholder: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Large progress number
  progressCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  // Suffix beside progress number (e.g. "/3")
  progressSuffix: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3C3C43',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  // Large wind display
  windLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  // "Updated" orange badge
  updatedBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  updatedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Progress bar track
  progressBarTrack: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5EA',
    marginTop: 4,
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34C759',
  },
  // Safety "All clear" row
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  safetyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
  },
  // Crew status lines
  statusLine: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Small body text for sail names, tuning, etc.
  smallBody: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  // Complete simple body
  completeBody: {
    fontSize: 13,
    fontWeight: '500',
    color: '#34C759',
    textAlign: 'center',
  },
  // Weather tile body container
  weatherBody: {
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
  // Compact wind text for sparkline layout
  windCompact: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  // Tide row with sparkline + label
  tideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Tide state label
  tideLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0D9488',
    textAlign: 'center',
  },
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ProgressDisplay({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressCount}>{current}</Text>
      <Text style={styles.progressSuffix}>/{total}</Text>
    </View>
  );
}

/* ================================================================== */
/*  RACE INTEL SECTION                                                 */
/* ================================================================== */

/* ---- BriefingTile ------------------------------------------------ */

interface BriefingTileProps {
  isComplete: boolean;
  onPress: () => void;
  progress?: { current: number; total: number };
  summary?: string;
  /** Document names to review (e.g. ["NOR", "SI"]) */
  documentNames?: string[];
  /** Race name for context */
  raceName?: string;
}

export function BriefingTile({ isComplete, onPress, progress, summary, documentNames, raceName }: BriefingTileProps) {
  let body: React.ReactNode;
  if (isComplete && summary) {
    body = <Text style={styles.bodyText} numberOfLines={3}>{summary}</Text>;
  } else if (progress) {
    body = <ProgressDisplay current={progress.current} total={progress.total} />;
  } else if (documentNames && documentNames.length > 0) {
    body = (
      <>
        {documentNames.map((name, i) => (
          <Text key={i} style={styles.smallBody} numberOfLines={1}>{name}</Text>
        ))}
      </>
    );
  } else if (raceName) {
    body = <Text style={styles.placeholder} numberOfLines={2}>{raceName}</Text>;
  } else {
    body = <Text style={styles.placeholder}>Review docs</Text>;
  }

  return (
    <PrepTile
      label="BRIEFING"
      icon={FileText}
      iconColor="#AF52DE"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Start briefing'}
    >
      {body}
    </PrepTile>
  );
}

/* ---- WeatherTile ------------------------------------------------- */

interface WeatherTileProps {
  isComplete: boolean;
  onPress: () => void;
  windDirection?: string;
  windSpeed?: string;
  changed?: boolean;
  /** Fallback wind info from race data */
  raceWind?: { direction: string; speedMin: number; speedMax: number };
  /** Wind speed sparkline data (hourly knots) */
  windSparkline?: number[];
  /** Tide height sparkline data (hourly metres) */
  tideSparkline?: number[];
  /** Tide state label (e.g. "HW 14:32") */
  tideLabel?: string;
}

/** Normalize a wind speed range string so lower value always comes first (e.g. "5-2" → "2-5") */
function normalizeWindRange(raw: string): string {
  const m = raw.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return raw;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  return a <= b ? `${a}-${b}` : `${b}-${a}`;
}

export function WeatherTile({
  isComplete, onPress, windDirection, windSpeed, changed,
  raceWind, windSparkline, tideSparkline, tideLabel,
}: WeatherTileProps) {
  const hasSparkline = windSparkline && windSparkline.length >= 3;
  const hasTide = tideSparkline && tideSparkline.length >= 3;

  let body: React.ReactNode;
  if (hasSparkline || (windDirection && windSpeed)) {
    // Rich view: wind summary + sparkline + tide
    const dir = windDirection || raceWind?.direction;
    const speed = windSpeed
      ? normalizeWindRange(windSpeed)
      : raceWind ? `${Math.min(raceWind.speedMin, raceWind.speedMax)}-${Math.max(raceWind.speedMin, raceWind.speedMax)}` : undefined;
    body = (
      <View style={styles.weatherBody}>
        {dir && speed ? (
          <Text style={styles.windCompact}>{dir} {speed}kt</Text>
        ) : dir ? (
          <Text style={styles.windCompact}>{dir}</Text>
        ) : null}
        {hasSparkline && (
          <TinySparkline
            data={windSparkline}
            width={100}
            height={18}
            color="#007AFF"
            variant="line"
            highlightPeak
          />
        )}
        {hasTide && (
          <View style={styles.tideRow}>
            <TinySparkline
              data={tideSparkline}
              width={50}
              height={12}
              color="#0D9488"
              variant="area"
              highlightPeak
            />
            {tideLabel && <Text style={styles.tideLabel}>{tideLabel}</Text>}
          </View>
        )}
        {!hasTide && tideLabel && (
          <Text style={styles.tideLabel}>{tideLabel}</Text>
        )}
        {changed && (
          <View style={styles.updatedBadge}>
            <Text style={styles.updatedBadgeText}>Updated</Text>
          </View>
        )}
      </View>
    );
  } else if (raceWind) {
    body = (
      <>
        <Text style={styles.windLarge}>{raceWind.direction}</Text>
        <Text style={styles.smallBody}>{Math.min(raceWind.speedMin, raceWind.speedMax)}-{Math.max(raceWind.speedMin, raceWind.speedMax)} kts</Text>
        {tideLabel && <Text style={styles.tideLabel}>{tideLabel}</Text>}
      </>
    );
  } else {
    body = <Text style={styles.placeholder}>Check forecast</Text>;
  }

  return (
    <PrepTile
      label="WEATHER"
      icon={CloudSun}
      iconColor="#007AFF"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Check forecast'}
    >
      {body}
    </PrepTile>
  );
}

/* ================================================================== */
/*  EQUIPMENT SECTION                                                  */
/* ================================================================== */

/* ---- SailsTile --------------------------------------------------- */

interface SailsTileProps {
  isComplete: boolean;
  onPress: () => void;
  selectedSails?: string[];
  progress?: { current: number; total: number };
  /** Boat class for context when no sails selected */
  boatClass?: string;
  /** Sail selection from intentions (mainsail, jib, spinnaker names) */
  sailSelection?: { mainsailName?: string; jibName?: string; spinnakerName?: string };
}

export function SailsTile({ isComplete, onPress, selectedSails, progress, boatClass, sailSelection }: SailsTileProps) {
  let body: React.ReactNode;
  if (selectedSails && selectedSails.length > 0) {
    body = <Text style={styles.smallBody} numberOfLines={3}>{selectedSails.join(', ')}</Text>;
  } else if (sailSelection && (sailSelection.mainsailName || sailSelection.jibName || sailSelection.spinnakerName)) {
    const names = [sailSelection.mainsailName, sailSelection.jibName, sailSelection.spinnakerName].filter(Boolean);
    body = (
      <>
        {names.map((name, i) => (
          <Text key={i} style={styles.smallBody} numberOfLines={1}>{name}</Text>
        ))}
      </>
    );
  } else if (progress) {
    body = <ProgressDisplay current={progress.current} total={progress.total} />;
  } else if (boatClass) {
    body = (
      <>
        <Text style={styles.placeholder} numberOfLines={1}>{boatClass}</Text>
        <Text style={styles.statusLine}>Select sails</Text>
      </>
    );
  } else {
    body = <Text style={styles.placeholder}>Inspect &amp; select</Text>;
  }

  return (
    <PrepTile
      label="SAILS"
      icon={Sailboat}
      iconColor="#FF9500"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to edit' : 'Select sails'}
    >
      {body}
    </PrepTile>
  );
}

/* ---- RigTile ----------------------------------------------------- */

interface RigTileProps {
  isComplete: boolean;
  onPress: () => void;
  tuningSummary?: string;
  progress?: { current: number; total: number };
  /** Number of adjusted rig settings */
  adjustedCount?: number;
  /** Key setting names that have been adjusted (first 2-3) */
  adjustedSettings?: string[];
}

export function RigTile({ isComplete, onPress, tuningSummary, progress, adjustedCount, adjustedSettings }: RigTileProps) {
  let body: React.ReactNode;
  if (tuningSummary) {
    body = <Text style={styles.smallBody} numberOfLines={3}>{tuningSummary}</Text>;
  } else if (adjustedCount && adjustedCount > 0 && adjustedSettings && adjustedSettings.length > 0) {
    body = (
      <>
        <Text style={styles.progressCount}>{adjustedCount}</Text>
        <Text style={styles.statusLine}>
          {adjustedSettings.slice(0, 2).join(', ')}
          {adjustedCount > 2 ? ` +${adjustedCount - 2}` : ''}
        </Text>
      </>
    );
  } else if (progress) {
    body = <ProgressDisplay current={progress.current} total={progress.total} />;
  } else {
    body = <Text style={styles.placeholder}>Inspect &amp; tune</Text>;
  }

  return (
    <PrepTile
      label="RIG"
      icon={Wrench}
      iconColor="#FF9500"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to edit' : 'Tune rig'}
    >
      {body}
    </PrepTile>
  );
}

/* ---- ElectronicsTile --------------------------------------------- */

interface ElectronicsTileProps {
  isComplete: boolean;
  onPress: () => void;
  chargedCount?: number;
  totalCount?: number;
}

export function ElectronicsTile({ isComplete, onPress, chargedCount, totalCount }: ElectronicsTileProps) {
  let body: React.ReactNode;
  if (chargedCount != null && totalCount != null && totalCount > 0) {
    const pct = Math.round((chargedCount / totalCount) * 100);
    body = (
      <>
        <View style={styles.progressRow}>
          <Text style={styles.progressCount}>{chargedCount}</Text>
          <Text style={styles.progressSuffix}>/{totalCount}</Text>
        </View>
        <Text style={styles.placeholder}>charged</Text>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
        </View>
      </>
    );
  } else {
    body = <Text style={styles.placeholder}>Check devices</Text>;
  }

  return (
    <PrepTile
      label="ELECTRONICS"
      icon={Zap}
      iconColor="#FF9500"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'All charged' : 'Check devices'}
    >
      {body}
    </PrepTile>
  );
}

/* ---- SafetyTile -------------------------------------------------- */

interface SafetyTileProps {
  isComplete: boolean;
  onPress: () => void;
  itemCount?: number;
}

export function SafetyTile({ isComplete, onPress, itemCount }: SafetyTileProps) {
  let body: React.ReactNode;
  if (isComplete) {
    body = (
      <View style={styles.safetyRow}>
        <Check size={14} color="#34C759" strokeWidth={3} />
        <Text style={styles.safetyText}>All clear</Text>
      </View>
    );
  } else if (itemCount != null) {
    body = <Text style={styles.placeholder}>{itemCount} items to check</Text>;
  } else {
    body = <Text style={styles.placeholder}>Run check</Text>;
  }

  return (
    <PrepTile
      label="SAFETY"
      icon={Shield}
      iconColor="#FF3B30"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Safety check'}
    >
      {body}
    </PrepTile>
  );
}

/* ================================================================== */
/*  CREW & LOGISTICS SECTION                                           */
/* ================================================================== */

/* ---- CrewTile ---------------------------------------------------- */

interface CrewTileProps {
  isComplete: boolean;
  onPress: () => void;
  progress?: { current: number; total: number };
  /** Crew member names to display */
  crewNames?: string[];
  /** Whether crew has been confirmed via the wizard */
  isConfirmed?: boolean;
}

export function CrewTile({ isComplete, onPress, progress, crewNames, isConfirmed }: CrewTileProps) {
  const hasNames = crewNames && crewNames.length > 0;

  let body: React.ReactNode;
  if (hasNames) {
    const displayNames = crewNames.slice(0, 3);
    const remaining = crewNames.length - 3;
    body = (
      <>
        {displayNames.map((name, i) => (
          <Text key={i} style={styles.smallBody} numberOfLines={1}>{name}</Text>
        ))}
        {remaining > 0 && (
          <Text style={styles.statusLine}>+{remaining} more</Text>
        )}
        <Text style={[styles.statusLine, isConfirmed ? { color: '#34C759' } : { color: '#FF9500' }]}>
          {isConfirmed ? 'Confirmed' : 'Possible'}
        </Text>
      </>
    );
  } else if (progress) {
    body = <ProgressDisplay current={progress.current} total={progress.total} />;
  } else {
    body = <Text style={styles.placeholder}>Confirm crew</Text>;
  }

  return (
    <PrepTile
      label="CREW"
      icon={Users}
      iconColor="#007AFF"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'All set' : 'Manage crew'}
    >
      {body}
    </PrepTile>
  );
}

/* ---- LogisticsTile ----------------------------------------------- */

interface LogisticsTileProps {
  isComplete: boolean;
  onPress: () => void;
  progress?: { current: number; total: number };
  transportNotes?: string;
  accommodationNotes?: string;
  foodNotes?: string;
}

export function LogisticsTile({ isComplete, onPress, progress, transportNotes, accommodationNotes, foodNotes }: LogisticsTileProps) {
  // Extract first line of notes as a summary label
  const getSummary = (notes?: string) => notes?.split('\n')[0]?.trim();
  const transport = getSummary(transportNotes);
  const accommodation = getSummary(accommodationNotes);
  const food = getSummary(foodNotes);
  const hasDetails = transport || accommodation || food;

  let body: React.ReactNode;
  if (hasDetails) {
    body = (
      <>
        {transport && <Text style={styles.smallBody} numberOfLines={1}>{transport}</Text>}
        {accommodation && <Text style={styles.smallBody} numberOfLines={1}>{accommodation}</Text>}
        {food && <Text style={styles.smallBody} numberOfLines={1}>{food}</Text>}
      </>
    );
  } else if (progress) {
    body = <ProgressDisplay current={progress.current} total={progress.total} />;
  } else {
    body = <Text style={styles.placeholder}>Plan logistics</Text>;
  }

  return (
    <PrepTile
      label="LOGISTICS"
      icon={Car}
      iconColor="#34C759"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'All arranged' : 'Plan logistics'}
    >
      {body}
    </PrepTile>
  );
}

/* ================================================================== */
/*  STRATEGY SECTION                                                   */
/* ================================================================== */

/* ---- WindStrategyTile -------------------------------------------- */

interface WindStrategyTileProps {
  isComplete: boolean;
  onPress: () => void;
  direction?: string;
  shiftPattern?: string;
}

export function WindStrategyTile({ isComplete, onPress, direction, shiftPattern }: WindStrategyTileProps) {
  let body: React.ReactNode;
  if (direction) {
    body = (
      <>
        <Text style={styles.smallBody}>{direction}</Text>
        {shiftPattern && <Text style={styles.smallBody}>{shiftPattern}</Text>}
      </>
    );
  } else {
    body = <Text style={styles.placeholder}>Set wind plan</Text>;
  }

  return (
    <PrepTile
      label="WIND"
      icon={Wind}
      iconColor="#007AFF"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Plan wind'}
    >
      {body}
    </PrepTile>
  );
}

/* ---- StartStrategyTile ------------------------------------------- */

interface StartStrategyTileProps {
  isComplete: boolean;
  onPress: () => void;
  favoredEnd?: string;
  approach?: string;
}

export function StartStrategyTile({ isComplete, onPress, favoredEnd, approach }: StartStrategyTileProps) {
  let body: React.ReactNode;
  if (favoredEnd) {
    body = (
      <>
        <Text style={styles.smallBody}>{favoredEnd}</Text>
        {approach && <Text style={styles.smallBody}>{approach}</Text>}
      </>
    );
  } else {
    body = <Text style={styles.placeholder}>Set start plan</Text>;
  }

  return (
    <PrepTile
      label="START"
      icon={Flag}
      iconColor="#FF2D55"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Plan start'}
    >
      {body}
    </PrepTile>
  );
}

/* ---- UpwindTile -------------------------------------------------- */

interface UpwindTileProps {
  isComplete: boolean;
  onPress: () => void;
  favoredSide?: string;
  shiftExpectation?: string;
}

export function UpwindTile({ isComplete, onPress, favoredSide, shiftExpectation }: UpwindTileProps) {
  let body: React.ReactNode;
  if (favoredSide) {
    body = (
      <>
        <Text style={styles.smallBody}>{favoredSide}</Text>
        {shiftExpectation && <Text style={styles.smallBody}>{shiftExpectation}</Text>}
      </>
    );
  } else {
    body = <Text style={styles.placeholder}>Set approach</Text>;
  }

  return (
    <PrepTile
      label="UPWIND"
      icon={TrendingUp}
      iconColor="#FF2D55"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Plan upwind'}
    >
      {body}
    </PrepTile>
  );
}

/* ---- TideStrategyTile -------------------------------------------- */

interface TideStrategyTileProps {
  isComplete: boolean;
  onPress: () => void;
  tideState?: string;
  strategy?: string;
}

export function TideStrategyTile({ isComplete, onPress, tideState, strategy }: TideStrategyTileProps) {
  let body: React.ReactNode;
  if (tideState) {
    body = (
      <>
        <Text style={styles.smallBody}>{tideState}</Text>
        {strategy && <Text style={styles.smallBody}>{strategy}</Text>}
      </>
    );
  } else {
    body = <Text style={styles.placeholder}>Check tide</Text>;
  }

  return (
    <PrepTile
      label="TIDE"
      icon={Anchor}
      iconColor="#0D9488"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Plan tide'}
    >
      {body}
    </PrepTile>
  );
}

/* ================================================================== */
/*  TACTICS SECTION (conditional)                                      */
/* ================================================================== */

interface TacticsTileProps {
  isComplete: boolean;
  onPress: () => void;
}

export function TacticsTile({ isComplete, onPress }: TacticsTileProps) {
  const body = isComplete
    ? <Text style={styles.completeBody}>Discussed with crew</Text>
    : <Text style={styles.placeholder}>Brief your crew</Text>;

  return (
    <PrepTile
      label="TACTICS"
      icon={Target}
      iconColor="#FF2D55"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Reviewed' : 'Review tactics'}
    >
      {body}
    </PrepTile>
  );
}

/* ================================================================== */
/*  RACE-TYPE SPECIFIC TILES                                           */
/* ================================================================== */

/* ---- Distance Race tiles ----------------------------------------- */

interface SimpleTileProps {
  isComplete: boolean;
  onPress: () => void;
}

export function NavigationTile({ isComplete, onPress }: SimpleTileProps) {
  return (
    <PrepTile
      label="NAVIGATION"
      icon={Compass}
      iconColor="#5856D6"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Plan route'}
    >
      {isComplete
        ? <Text style={styles.completeBody}>Route planned</Text>
        : <Text style={styles.placeholder}>Plan route</Text>}
    </PrepTile>
  );
}

export function WatchScheduleTile({ isComplete, onPress }: SimpleTileProps) {
  return (
    <PrepTile
      label="WATCHES"
      icon={Clock}
      iconColor="#FF9500"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Set schedule'}
    >
      {isComplete
        ? <Text style={styles.completeBody}>Schedule set</Text>
        : <Text style={styles.placeholder}>Set schedule</Text>}
    </PrepTile>
  );
}

export function OffshoreSafetyTile({ isComplete, onPress }: SimpleTileProps) {
  return (
    <PrepTile
      label="OFFSHORE"
      icon={Shield}
      iconColor="#FF3B30"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Check equipment'}
    >
      {isComplete
        ? <Text style={styles.completeBody}>All checked</Text>
        : <Text style={styles.placeholder}>Check equipment</Text>}
    </PrepTile>
  );
}

export function WeatherRoutingTile({ isComplete, onPress }: SimpleTileProps) {
  return (
    <PrepTile
      label="ROUTING"
      icon={CloudSun}
      iconColor="#007AFF"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Check routing'}
    >
      {isComplete
        ? <Text style={styles.completeBody}>Route optimized</Text>
        : <Text style={styles.placeholder}>Check routing</Text>}
    </PrepTile>
  );
}

/* ---- Match Race tiles -------------------------------------------- */

export function OpponentTile({ isComplete, onPress }: SimpleTileProps) {
  return (
    <PrepTile
      label="OPPONENT"
      icon={Eye}
      iconColor="#AF52DE"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Study opponent'}
    >
      {isComplete
        ? <Text style={styles.completeBody}>Review complete</Text>
        : <Text style={styles.placeholder}>Study opponent</Text>}
    </PrepTile>
  );
}

export function PreStartTacticsTile({ isComplete, onPress }: SimpleTileProps) {
  return (
    <PrepTile
      label="PRE-START"
      icon={Flag}
      iconColor="#FF2D55"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Plan entry'}
    >
      {isComplete
        ? <Text style={styles.completeBody}>Tactics planned</Text>
        : <Text style={styles.placeholder}>Plan entry</Text>}
    </PrepTile>
  );
}

export function RulesTile({ isComplete, onPress }: SimpleTileProps) {
  return (
    <PrepTile
      label="RULES"
      icon={BookOpen}
      iconColor="#5856D6"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Review rules'}
    >
      {isComplete
        ? <Text style={styles.completeBody}>Rules reviewed</Text>
        : <Text style={styles.placeholder}>Review rules</Text>}
    </PrepTile>
  );
}

/* ---- Team Race tiles --------------------------------------------- */

export function TeamSetupTile({ isComplete, onPress }: SimpleTileProps) {
  return (
    <PrepTile
      label="TEAM"
      icon={Users}
      iconColor="#007AFF"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Set up team'}
    >
      {isComplete
        ? <Text style={styles.completeBody}>Positions set</Text>
        : <Text style={styles.placeholder}>Set up team</Text>}
    </PrepTile>
  );
}

export function ComboPlaysTile({ isComplete, onPress }: SimpleTileProps) {
  return (
    <PrepTile
      label="COMBOS"
      icon={Target}
      iconColor="#FF2D55"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Review plays'}
    >
      {isComplete
        ? <Text style={styles.completeBody}>Plays reviewed</Text>
        : <Text style={styles.placeholder}>Review plays</Text>}
    </PrepTile>
  );
}

export function TeamCommsTile({ isComplete, onPress }: SimpleTileProps) {
  return (
    <PrepTile
      label="COMMS"
      icon={Radio}
      iconColor="#007AFF"
      isComplete={isComplete}
      onPress={onPress}
      hint={isComplete ? 'Tap to review' : 'Confirm signals'}
    >
      {isComplete
        ? <Text style={styles.completeBody}>Signals confirmed</Text>
        : <Text style={styles.placeholder}>Confirm signals</Text>}
    </PrepTile>
  );
}

/* ================================================================== */
/*  COURSE MAP TILE (re-exported from dedicated file)                  */
/* ================================================================== */

export { CourseMapTile } from './CourseMapTile';
