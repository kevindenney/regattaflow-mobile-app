/**
 * FirstBeatStrategyWizard
 *
 * Multi-step wizard for planning first beat (upwind) strategy.
 * Determines favored side and tactical approach for first beat.
 *
 * Steps:
 * 1. Beat Overview - Course visualization with wind/current overlay
 * 2. Side Selection - AI analysis of favored side factors
 * 3. Tack Selection - Recommend starting tack with rationale
 * 4. Laylines - When to approach, risk of overstanding
 * 5. Beat Plan - Visual beat path with decision points
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Navigation,
  Wind,
  Waves,
  AlertTriangle,
  Target,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  Compass,
  Map,
  Gauge,
  RotateCcw,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useForecastCheck } from '@/hooks/useForecastCheck';
import type { ChecklistItem } from '@/types/checklists';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import type { SailingVenue } from '@/lib/types/global-venues';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  yellow: '#FFCC00',
  teal: '#5AC8FA',
  indigo: '#5856D6',
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

// Helper: Convert cardinal direction to degrees
function cardinalToDegrees(cardinal: string): number {
  const map: Record<string, number> = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
    'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
    'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
  };
  return map[cardinal] ?? 0;
}

// Helper: Convert degrees to cardinal direction
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
  return directions[index];
}

// Helper: Determine current flow state from tide timing
function getCurrentFlowState(
  highTideTime: string | undefined,
  raceStartTime: string
): 'flooding' | 'ebbing' | 'slack' {
  if (!highTideTime) return 'slack';

  const parseTime = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const startMins = parseTime(raceStartTime);
  const highMins = parseTime(highTideTime);
  const diff = startMins - highMins;

  // Within 30 mins of high tide = slack
  if (Math.abs(diff) < 30) return 'slack';
  // After high tide = ebbing
  if (diff > 0 && diff < 360) return 'ebbing';
  // Before high tide = flooding
  return 'flooding';
}

// Helper: Get zone heuristics for wind and current
function getZoneHeuristics(
  windDegrees: number,
  currentDegrees: number | undefined,
  favoredSide: 'left' | 'right' | 'middle'
): { moreWind: 'left' | 'right' | null; lessCurrent: 'left' | 'right' | null; reason: string } {
  // Basic heuristics:
  // - Wind bends toward shore (shore side often has more pressure from geographic lift)
  // - Shallow water has less current (shore side often shallower)
  // - If current is cross-course, one side will have less adverse current

  let moreWind: 'left' | 'right' | null = null;
  let lessCurrent: 'left' | 'right' | null = null;
  let reason = '';

  // If current is flowing across the course (roughly E or W when wind is N-ish)
  if (currentDegrees !== undefined) {
    // Normalize to determine if current is left-to-right or right-to-left relative to wind
    const relativeAngle = ((currentDegrees - windDegrees) + 360) % 360;

    if (relativeAngle > 45 && relativeAngle < 135) {
      // Current flowing to the right of wind direction
      lessCurrent = 'left';
      reason = 'Current flowing right, left side has less adverse current';
    } else if (relativeAngle > 225 && relativeAngle < 315) {
      // Current flowing to the left of wind direction
      lessCurrent = 'right';
      reason = 'Current flowing left, right side has less adverse current';
    }
  }

  // For wind: assume shore effects create more pressure on the favored side
  // This is a simplification - real shore effects depend on geography
  if (favoredSide !== 'middle') {
    moreWind = favoredSide;
  }

  return { moreWind, lessCurrent, reason };
}

// First Beat Diagram Component
interface FirstBeatDiagramProps {
  windDirection: string;
  windDegrees?: number;
  windSpeed: number;
  currentDirection?: number;
  currentSpeed?: number;
  tideState: 'flooding' | 'ebbing' | 'slack';
  favoredSide: 'left' | 'right' | 'middle';
  favoredReason?: string;
}

function FirstBeatDiagram({
  windDirection,
  windDegrees,
  windSpeed,
  currentDirection,
  currentSpeed,
  tideState,
  favoredSide,
  favoredReason,
}: FirstBeatDiagramProps) {
  const width = 280;
  const height = 240;
  const padding = 20;

  // Calculate wind arrow rotation (wind comes FROM this direction, so arrows point opposite)
  const windRotation = (windDegrees ?? cardinalToDegrees(windDirection)) + 180;

  // Current arrow rotation (current flows TO this direction)
  const currentRotation = currentDirection ?? 90; // Default to east if unknown

  // Determine favored side shading
  const leftFavored = favoredSide === 'left';
  const rightFavored = favoredSide === 'right';

  // Get zone heuristics
  const zoneHints = getZoneHeuristics(
    windDegrees ?? cardinalToDegrees(windDirection),
    currentDirection,
    favoredSide
  );

  // Current strength color
  const currentColor = !currentSpeed || currentSpeed < 0.3 ? IOS_COLORS.gray
    : currentSpeed < 1 ? IOS_COLORS.teal
    : IOS_COLORS.orange;

  return (
    <View style={diagramStyles.container}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {/* Gradient for favored side */}
          <LinearGradient id="leftFade" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={IOS_COLORS.green} stopOpacity={leftFavored ? 0.15 : 0} />
            <Stop offset="1" stopColor={IOS_COLORS.green} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="rightFade" x1="1" y1="0" x2="0" y2="0">
            <Stop offset="0" stopColor={IOS_COLORS.blue} stopOpacity={rightFavored ? 0.15 : 0} />
            <Stop offset="1" stopColor={IOS_COLORS.blue} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Background with favored side shading */}
        <Rect x={padding} y={padding} width={(width - 2 * padding) / 2} height={height - 2 * padding} fill="url(#leftFade)" />
        <Rect x={width / 2} y={padding} width={(width - 2 * padding) / 2} height={height - 2 * padding} fill="url(#rightFade)" />

        {/* Windward Mark at TOP */}
        <Circle cx={width / 2} cy={padding + 15} r={10} fill={IOS_COLORS.red} opacity={0.2} />
        <Circle cx={width / 2} cy={padding + 15} r={6} fill={IOS_COLORS.red} />
        <Circle cx={width / 2} cy={padding + 15} r={3} fill="white" />

        {/* Wind arrows (3 arrows showing wind direction coming INTO the course) */}
        <G transform={`translate(${width / 2}, 70) rotate(${windRotation})`}>
          <Path d="M0,-12 L4,4 L0,0 L-4,4 Z" fill={IOS_COLORS.blue} />
        </G>
        <G transform={`translate(${width / 2 - 35}, 75) rotate(${windRotation})`}>
          <Path d="M0,-10 L3,3 L0,0 L-3,3 Z" fill={IOS_COLORS.blue} opacity={0.7} />
        </G>
        <G transform={`translate(${width / 2 + 35}, 75) rotate(${windRotation})`}>
          <Path d="M0,-10 L3,3 L0,0 L-3,3 Z" fill={IOS_COLORS.blue} opacity={0.7} />
        </G>

        {/* Course center line (dashed) */}
        <Line
          x1={width / 2}
          y1={padding + 30}
          x2={width / 2}
          y2={height - padding - 20}
          stroke={IOS_COLORS.separator}
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Current arrows (horizontal flow) */}
        {currentDirection !== undefined && (
          <>
            <G transform={`translate(${width / 2 - 50}, ${height / 2 + 10}) rotate(${currentRotation - 90})`}>
              <Path d="M-15,0 L10,0 M5,-4 L10,0 L5,4" stroke={currentColor} strokeWidth={2} fill="none" />
            </G>
            <G transform={`translate(${width / 2 + 50}, ${height / 2 + 10}) rotate(${currentRotation - 90})`}>
              <Path d="M-15,0 L10,0 M5,-4 L10,0 L5,4" stroke={currentColor} strokeWidth={2} fill="none" />
            </G>
          </>
        )}

        {/* Start line at BOTTOM */}
        <Line
          x1={padding + 20}
          y1={height - padding - 8}
          x2={width - padding - 20}
          y2={height - padding - 8}
          stroke={IOS_COLORS.green}
          strokeWidth={3}
        />

        {/* Side labels */}
        {/* Left label */}
        {/* Right label */}

        {/* Favored badge */}
        {favoredSide === 'left' && (
          <G transform={`translate(${padding + 30}, ${height / 2 - 20})`}>
            <Rect x={-25} y={-10} width={50} height={20} rx={4} fill={IOS_COLORS.green} />
          </G>
        )}
        {favoredSide === 'right' && (
          <G transform={`translate(${width - padding - 30}, ${height / 2 - 20})`}>
            <Rect x={-25} y={-10} width={50} height={20} rx={4} fill={IOS_COLORS.blue} />
          </G>
        )}
      </Svg>

      {/* Text labels (using RN Text for better rendering) */}
      <View style={diagramStyles.labelsContainer}>
        {/* Mark label */}
        <Text style={[diagramStyles.markLabel, { top: padding - 2 }]}>MARK</Text>

        {/* Wind label */}
        <View style={[diagramStyles.windLabelContainer, { top: 88 }]}>
          <Wind size={14} color={IOS_COLORS.blue} />
          <Text style={diagramStyles.windLabel}>{windSpeed} kts {windDirection}</Text>
        </View>

        {/* Current label */}
        {currentDirection !== undefined && (
          <View style={[diagramStyles.currentLabelContainer, { top: height / 2 + 30 }]}>
            <Waves size={14} color={currentColor} />
            <Text style={[diagramStyles.currentLabel, { color: currentColor }]}>
              {tideState.charAt(0).toUpperCase() + tideState.slice(1)} {currentSpeed ? `${currentSpeed.toFixed(1)}kt` : ''} {degreesToCardinal(currentDirection)}
            </Text>
          </View>
        )}

        {/* Side labels */}
        <Text style={[diagramStyles.sideLabel, { left: padding + 10, bottom: padding + 16 }]}>LEFT</Text>
        <Text style={[diagramStyles.sideLabel, { right: padding + 10, bottom: padding + 16 }]}>RIGHT</Text>

        {/* Start label */}
        <Text style={[diagramStyles.startLabel, { bottom: padding - 6 }]}>START</Text>

        {/* Favored badge text */}
        {favoredSide === 'left' && (
          <Text style={[diagramStyles.favoredBadge, { left: padding + 5, top: height / 2 - 26 }]}>FAVORED</Text>
        )}
        {favoredSide === 'right' && (
          <Text style={[diagramStyles.favoredBadge, { right: padding + 5, top: height / 2 - 26 }]}>FAVORED</Text>
        )}

        {/* Zone hints */}
        {zoneHints.moreWind && (
          <Text style={[
            diagramStyles.zoneHint,
            zoneHints.moreWind === 'left' ? { left: padding + 5 } : { right: padding + 5 },
            { top: height / 2 + 55 }
          ]}>
            More wind
          </Text>
        )}
        {zoneHints.lessCurrent && (
          <Text style={[
            diagramStyles.zoneHint,
            zoneHints.lessCurrent === 'left' ? { left: padding + 5 } : { right: padding + 5 },
            { top: height / 2 + 70 }
          ]}>
            Less current
          </Text>
        )}
      </View>
    </View>
  );
}

const diagramStyles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  labelsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  markLabel: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.red,
    letterSpacing: 0.5,
  },
  windLabelContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
  },
  windLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  currentLabelContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  sideLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.5,
  },
  startLabel: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.green,
    letterSpacing: 0.5,
  },
  favoredBadge: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  zoneHint: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
  },
});

type WizardStep = 'loading' | 'overview' | 'side_selection' | 'tack_selection' | 'laylines' | 'beat_plan';

interface FirstBeatStrategyWizardProps extends ChecklistToolProps {
  venue?: SailingVenue | null;
  raceDate?: string | null;
  raceName?: string;
  raceStartTime?: string;
  raceDurationHours?: number;
  onStrategyCapture?: (data: Record<string, string>) => void;
}

// Side selection type
type FavoredSide = 'left' | 'right' | 'middle';

// Commitment level
type CommitmentLevel = 'low' | 'medium' | 'high';

// Factor affecting side selection
interface SideFactor {
  name: string;
  favors: FavoredSide;
  weight: number;
  description: string;
}

export function FirstBeatStrategyWizard({
  item,
  regattaId,
  boatId,
  onComplete,
  onCancel,
  venue,
  raceDate,
  raceName,
  raceStartTime,
  raceDurationHours,
  onStrategyCapture,
}: FirstBeatStrategyWizardProps) {
  const router = useRouter();

  // Use existing forecast check hook for wind/tide data
  const {
    currentForecast,
    isLoadingForecast,
    forecastError,
  } = useForecastCheck({
    regattaId,
    venue: venue || null,
    raceDate: raceDate || null,
    raceStartTime: raceStartTime || null,
    expectedDurationMinutes: raceDurationHours ? raceDurationHours * 60 : undefined,
  });

  // State
  const [step, setStep] = useState<WizardStep>('loading');
  const [commitmentLevel, setCommitmentLevel] = useState<CommitmentLevel>('medium');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [beatPlan, setBeatPlan] = useState<string | null>(null);

  // Determine initial step once forecast loads
  useEffect(() => {
    if (!isLoadingForecast && currentForecast) {
      setStep('overview');
    } else if (!isLoadingForecast && !currentForecast) {
      setStep('overview');
    }
  }, [isLoadingForecast, currentForecast]);

  // Analyze factors for side selection
  const sideFactors = useMemo((): SideFactor[] => {
    if (!currentForecast?.raceWindow) {
      return [];
    }

    const rw = currentForecast.raceWindow;
    const factors: SideFactor[] = [];

    // Wind shift analysis (from hourly data)
    const hourlyWind = currentForecast.hourlyWind || [];
    if (hourlyWind.length >= 2) {
      const cardinalMap: Record<string, number> = {
        'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
        'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
        'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
        'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
      };

      const firstDir = cardinalMap[hourlyWind[0].direction || 'N'] || 0;
      const lastDir = cardinalMap[hourlyWind[hourlyWind.length - 1].direction || 'N'] || 0;
      let dirChange = lastDir - firstDir;
      if (dirChange > 180) dirChange -= 360;
      if (dirChange < -180) dirChange += 360;

      if (Math.abs(dirChange) > 10) {
        factors.push({
          name: 'Wind Shift Trend',
          favors: dirChange > 0 ? 'right' : 'left',
          weight: 0.8,
          description: `Wind expected to ${dirChange > 0 ? 'veer (shift right)' : 'back (shift left)'} during race`,
        });
      }
    }

    // Current/tide analysis
    if (currentForecast.highTide && currentForecast.lowTide) {
      const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const startTime = parseTime(raceStartTime || rw.raceStartTime);
      const highTime = parseTime(currentForecast.highTide.time);

      const isEbbing = Math.abs(startTime - highTime) < 180 && startTime > highTime - 60;

      factors.push({
        name: 'Current',
        favors: isEbbing ? 'left' : 'right', // Simplified - actual analysis would need venue-specific data
        weight: 0.5,
        description: isEbbing
          ? 'Ebbing current may favor left side of course'
          : 'Flooding current may favor right side of course',
      });
    }

    // Geographic factors (simplified - would need actual venue data)
    if (venue?.name) {
      const hasShoreLeft = venue.name.toLowerCase().includes('bay') ||
                          venue.name.toLowerCase().includes('harbor');
      if (hasShoreLeft) {
        factors.push({
          name: 'Geography',
          favors: 'left',
          weight: 0.3,
          description: 'Shore effects may provide wind bend on left side',
        });
      }
    }

    // Add fleet strategy factor
    factors.push({
      name: 'Fleet Strategy',
      favors: 'middle',
      weight: 0.4,
      description: 'Middle of course keeps options open and allows playing shifts',
    });

    return factors;
  }, [currentForecast, raceStartTime, venue]);

  // Calculate overall favored side
  const favoredSide = useMemo((): {
    side: FavoredSide;
    confidence: 'high' | 'medium' | 'low';
    description: string;
  } => {
    if (sideFactors.length === 0) {
      return {
        side: 'middle',
        confidence: 'low',
        description: 'Insufficient data to determine favored side',
      };
    }

    let leftScore = 0;
    let rightScore = 0;
    let middleScore = 0;

    sideFactors.forEach(factor => {
      if (factor.favors === 'left') leftScore += factor.weight;
      else if (factor.favors === 'right') rightScore += factor.weight;
      else middleScore += factor.weight;
    });

    const maxScore = Math.max(leftScore, rightScore, middleScore);
    const totalWeight = sideFactors.reduce((sum, f) => sum + f.weight, 0);
    const confidenceScore = maxScore / totalWeight;

    let side: FavoredSide;
    let description: string;

    if (leftScore === maxScore) {
      side = 'left';
      description = 'Multiple factors favor the left side of the course';
    } else if (rightScore === maxScore) {
      side = 'right';
      description = 'Multiple factors favor the right side of the course';
    } else {
      side = 'middle';
      description = 'Stay flexible and play shifts from the middle';
    }

    const confidence: 'high' | 'medium' | 'low' =
      confidenceScore > 0.6 ? 'high' :
      confidenceScore > 0.4 ? 'medium' : 'low';

    return { side, confidence, description };
  }, [sideFactors]);

  // Determine recommended starting tack
  const tackRecommendation = useMemo((): {
    tack: 'port' | 'starboard';
    reason: string;
    alternatives: string[];
  } => {
    const side = favoredSide.side;

    if (side === 'left') {
      return {
        tack: 'port',
        reason: 'Port tack points toward favored left side. Consider port tack start or early tack to port.',
        alternatives: [
          'Starboard start then tack to port when clear',
          'Port tack start if line allows (rare)',
        ],
      };
    } else if (side === 'right') {
      return {
        tack: 'starboard',
        reason: 'Starboard tack points toward favored right side. Continue on starboard after start.',
        alternatives: [
          'Start at boat end for immediate access to right',
          'Stay on starboard until lifted or at layline',
        ],
      };
    } else {
      return {
        tack: 'starboard',
        reason: 'No clear side preference. Start on starboard and be ready to tack on first shift.',
        alternatives: [
          'Sail to first shift then decide',
          'Stay in the middle for options',
        ],
      };
    }
  }, [favoredSide]);

  // Layline strategy
  const laylineStrategy = useMemo((): {
    approach: 'early' | 'standard' | 'late';
    overstandRisk: 'high' | 'medium' | 'low';
    tips: string[];
  } => {
    const hasShifts = sideFactors.some(f => f.name === 'Wind Shift Trend');

    if (hasShifts) {
      return {
        approach: 'late',
        overstandRisk: 'high',
        tips: [
          'Delay layline approach due to expected shifts',
          'Risk of overstanding is high - approach conservatively',
          'Watch boats ahead for shift confirmation',
          'Be prepared to tack short of layline if shift favors',
        ],
      };
    }

    if (commitmentLevel === 'high') {
      return {
        approach: 'early',
        overstandRisk: 'low',
        tips: [
          'Commit to your side - get to layline efficiently',
          'Small overstand is acceptable for safe rounding',
          'Avoid tacking duels near the mark',
        ],
      };
    }

    return {
      approach: 'standard',
      overstandRisk: 'medium',
      tips: [
        'Standard layline approach - neither too early nor too late',
        'Allow for minor windshifts but don\'t over-compensate',
        'Keep options open until final approach',
      ],
    };
  }, [sideFactors, commitmentLevel]);

  // Generate beat plan
  const generateBeatPlan = useCallback(async () => {
    setIsGeneratingPlan(true);

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const plan = `## First Beat Strategy Card

**Favored Side:** ${favoredSide.side.charAt(0).toUpperCase() + favoredSide.side.slice(1)}
**Confidence:** ${favoredSide.confidence}
**Commitment Level:** ${commitmentLevel}

### Starting Tack
**Recommendation:** ${tackRecommendation.tack.charAt(0).toUpperCase() + tackRecommendation.tack.slice(1)} tack
${tackRecommendation.reason}

### Strategic Factors

${sideFactors.map(f => `**${f.name}:** ${f.description} (favors ${f.favors})`).join('\n\n')}

### Beat Execution Plan

${commitmentLevel === 'high' ? `
**High Commitment Strategy:**
1. Get to favored side early and stay committed
2. Tack only when necessary (at layline or major header)
3. Accept some risk of overstanding for position
4. Avoid getting drawn into tacking duels
` : commitmentLevel === 'low' ? `
**Low Commitment Strategy:**
1. Stay in the middle third of the course
2. Tack on all significant headers (\u22655\u00b0)
3. Keep options open until final approach
4. React to shifts rather than predict them
` : `
**Moderate Commitment Strategy:**
1. Start toward favored side but stay flexible
2. Tack on clear headers but ride small lifts
3. Approach layline with one shift in hand
4. Balance prediction with reaction
`}

### Layline Approach
**Strategy:** ${laylineStrategy.approach} approach
**Overstand Risk:** ${laylineStrategy.overstandRisk}

${laylineStrategy.tips.map(tip => `- ${tip}`).join('\n')}

### Bail-Out Triggers

Switch strategy if you observe:
- Wind shift contrary to prediction (\u226510\u00b0)
- Fleet gaining on opposite side
- Current stronger than expected on one side
- Clear velocity difference across course

### Key Decision Points

1. **Off the line (0-2 min):** Confirm wind direction, assess fleet position
2. **Mid-beat:** Check against boats on opposite side
3. **Approaching layline:** Final commitment decision
4. **Layline:** Execute clean rounding, set up for next leg`;

    setBeatPlan(plan);
    setIsGeneratingPlan(false);
  }, [favoredSide, tackRecommendation, sideFactors, commitmentLevel, laylineStrategy]);

  // Navigate to learn module
  const handleLearnMore = useCallback(() => {
    onCancel();
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/learn',
        params: { courseSlug: 'winning-first-beat' },
      });
    }, 150);
  }, [router, onCancel]);

  // Navigate to edit race
  const handleEditRace = useCallback(() => {
    if (!regattaId) return;
    onCancel();
    setTimeout(() => {
      router.push(`/race/edit/${regattaId}`);
    }, 150);
  }, [regattaId, onCancel, router]);

  // Format race date
  const formatRaceDate = useCallback((dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
    } catch {
      return '';
    }
  }, []);

  // Step progress
  const steps: WizardStep[] = ['overview', 'side_selection', 'tack_selection', 'laylines', 'beat_plan'];
  const currentStepIndex = steps.indexOf(step);
  const progress = step === 'loading' ? 0 : (currentStepIndex + 1) / steps.length;

  // Navigation
  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  }, [currentStepIndex, steps]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  }, [currentStepIndex, steps]);

  // Handle completion with strategy capture
  const handleComplete = useCallback(() => {
    // Capture first beat strategy data before completing
    if (onStrategyCapture) {
      const strategyData: Record<string, string> = {};

      // Favored tack
      strategyData['upwind.favoredTack'] = `${tackRecommendation.tack.charAt(0).toUpperCase() + tackRecommendation.tack.slice(1)} tack - ${tackRecommendation.reason}`;

      // Favored side with confidence
      strategyData['upwind.favoredSide'] = `${favoredSide.side.charAt(0).toUpperCase() + favoredSide.side.slice(1)} side (${favoredSide.confidence} confidence) - ${favoredSide.description}`;

      // Commitment/layline approach
      const commitmentDescriptions: Record<CommitmentLevel, string> = {
        low: 'Play shifts, stay flexible, minimize risk',
        medium: 'Balanced approach, moderate commitment',
        high: 'Commit early, fewer tacks, maximize gain',
      };
      strategyData['upwind.laylineApproach'] = commitmentDescriptions[commitmentLevel];

      onStrategyCapture(strategyData);
    }

    onComplete();
  }, [onStrategyCapture, onComplete, tackRecommendation, favoredSide, commitmentLevel]);

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={IOS_COLORS.indigo} />
      <Text style={styles.loadingText}>Loading course data...</Text>
    </View>
  );

  // Render overview step
  const renderOverview = () => {
    if (!currentForecast?.raceWindow) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={IOS_COLORS.orange} />
          <Text style={styles.errorTitle}>Forecast Unavailable</Text>
          <Text style={styles.errorDescription}>
            Unable to analyze first beat without forecast data.
          </Text>
          {regattaId && (
            <Pressable style={styles.editRaceButton} onPress={handleEditRace}>
              <Text style={styles.editRaceButtonText}>Edit Race</Text>
              <ArrowRight size={16} color={IOS_COLORS.blue} />
            </Pressable>
          )}
        </View>
      );
    }

    const rw = currentForecast.raceWindow;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        {/* Beat Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={styles.overviewIconContainer}>
              <Map size={32} color={IOS_COLORS.indigo} />
            </View>
            <View style={styles.overviewInfo}>
              <Text style={styles.overviewTitle}>First Beat Analysis</Text>
              <Text style={styles.overviewSubtitle}>
                Plan your upwind strategy
              </Text>
            </View>
          </View>

          {/* First Beat Diagram with wind, current, and strategy */}
          <FirstBeatDiagram
            windDirection={rw.windDirectionAtStart}
            windDegrees={rw.windDirectionDegreesAtStart}
            windSpeed={rw.windAtStart}
            currentDirection={rw.currentDirectionAtStart}
            currentSpeed={rw.currentSpeedAtStart}
            tideState={getCurrentFlowState(currentForecast.highTide?.time, rw.raceStartTime)}
            favoredSide={favoredSide.side}
            favoredReason={favoredSide.description}
          />
        </View>

        {/* Conditions summary */}
        <View style={styles.conditionsCard}>
          <Text style={styles.cardTitle}>Current Conditions</Text>

          <View style={styles.conditionRow}>
            <Wind size={20} color={IOS_COLORS.blue} />
            <Text style={styles.conditionLabel}>Wind</Text>
            <Text style={styles.conditionValue}>
              {rw.windAtStart.toFixed(0)} kts {rw.windDirectionAtStart}
            </Text>
          </View>

          {currentForecast.highTide && (
            <View style={styles.conditionRow}>
              <Waves size={20} color={IOS_COLORS.teal} />
              <Text style={styles.conditionLabel}>Tide</Text>
              <Text style={styles.conditionValue}>
                High at {currentForecast.highTide.time}
              </Text>
            </View>
          )}
        </View>

        {/* Quick insight */}
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            This wizard will help you determine which side of the course to favor
            on the first beat, based on wind shifts, current, and other factors.
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Render side selection step
  const renderSideSelection = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Favored side card */}
      <View style={styles.favoredCard}>
        <View style={styles.favoredHeader}>
          <View style={[
            styles.favoredIconContainer,
            favoredSide.side === 'left' && { backgroundColor: `${IOS_COLORS.green}20` },
            favoredSide.side === 'right' && { backgroundColor: `${IOS_COLORS.blue}20` },
          ]}>
            {favoredSide.side === 'left' ? (
              <ArrowUpLeft size={32} color={IOS_COLORS.green} />
            ) : favoredSide.side === 'right' ? (
              <ArrowUpRight size={32} color={IOS_COLORS.blue} />
            ) : (
              <Navigation size={32} color={IOS_COLORS.gray} />
            )}
          </View>
          <View style={styles.favoredInfo}>
            <Text style={styles.favoredTitle}>
              {favoredSide.side === 'left' ? 'Left Side Favored' :
               favoredSide.side === 'right' ? 'Right Side Favored' :
               'Stay Flexible'}
            </Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {favoredSide.confidence} confidence
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.favoredDescription}>{favoredSide.description}</Text>
      </View>

      {/* Factors breakdown */}
      <View style={styles.dataCard}>
        <Text style={styles.cardTitle}>Contributing Factors</Text>

        {sideFactors.length > 0 ? (
          sideFactors.map((factor, index) => (
            <View key={index} style={styles.factorRow}>
              <View style={styles.factorInfo}>
                <Text style={styles.factorName}>{factor.name}</Text>
                <Text style={styles.factorDesc}>{factor.description}</Text>
              </View>
              <View style={[
                styles.factorBadge,
                factor.favors === 'left' && { backgroundColor: `${IOS_COLORS.green}20` },
                factor.favors === 'right' && { backgroundColor: `${IOS_COLORS.blue}20` },
              ]}>
                <Text style={[
                  styles.factorFavors,
                  factor.favors === 'left' && { color: IOS_COLORS.green },
                  factor.favors === 'right' && { color: IOS_COLORS.blue },
                ]}>
                  {factor.favors}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noFactorsText}>
            No clear factors identified. Stay flexible and react to conditions.
          </Text>
        )}
      </View>

      {/* Commitment level selector */}
      <View style={styles.dataCard}>
        <Text style={styles.cardTitle}>Commitment Level</Text>
        <Text style={styles.cardSubtitle}>
          How strongly should you commit to the favored side?
        </Text>

        <View style={styles.commitmentSelector}>
          {(['low', 'medium', 'high'] as CommitmentLevel[]).map((level) => (
            <Pressable
              key={level}
              style={[
                styles.commitmentOption,
                commitmentLevel === level && styles.commitmentOptionSelected,
              ]}
              onPress={() => setCommitmentLevel(level)}
            >
              <Gauge size={20} color={
                commitmentLevel === level ? IOS_COLORS.secondaryBackground : IOS_COLORS.gray
              } />
              <Text style={[
                styles.commitmentLabel,
                commitmentLevel === level && styles.commitmentLabelSelected,
              ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.commitmentHint}>
          {commitmentLevel === 'low' ? 'Stay in middle, play all shifts' :
           commitmentLevel === 'high' ? 'Commit early, minimize tacks' :
           'Balance commitment with flexibility'}
        </Text>
      </View>
    </ScrollView>
  );

  // Render tack selection step
  const renderTackSelection = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Tack recommendation card */}
      <View style={styles.tackCard}>
        <View style={styles.tackHeader}>
          <View style={[
            styles.tackIconContainer,
            tackRecommendation.tack === 'port' && { backgroundColor: `${IOS_COLORS.green}20` },
            tackRecommendation.tack === 'starboard' && { backgroundColor: `${IOS_COLORS.blue}20` },
          ]}>
            <RotateCcw
              size={32}
              color={tackRecommendation.tack === 'port' ? IOS_COLORS.green : IOS_COLORS.blue}
              style={{ transform: [{ scaleX: tackRecommendation.tack === 'starboard' ? -1 : 1 }] }}
            />
          </View>
          <View style={styles.tackInfo}>
            <Text style={styles.tackTitle}>
              {tackRecommendation.tack.charAt(0).toUpperCase() + tackRecommendation.tack.slice(1)} Tack
            </Text>
            <Text style={styles.tackSubtitle}>Recommended starting tack</Text>
          </View>
        </View>

        <Text style={styles.tackReason}>{tackRecommendation.reason}</Text>
      </View>

      {/* Alternatives */}
      <View style={styles.dataCard}>
        <Text style={styles.cardTitle}>Alternative Approaches</Text>

        {tackRecommendation.alternatives.map((alt, index) => (
          <View key={index} style={styles.alternativeRow}>
            <Text style={styles.alternativeNumber}>{index + 1}</Text>
            <Text style={styles.alternativeText}>{alt}</Text>
          </View>
        ))}
      </View>

      {/* Tack selection tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.cardTitle}>Execution Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>\u2022</Text>
          <Text style={styles.tipText}>
            Don't chase the fleet - stick to your pre-race analysis
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>\u2022</Text>
          <Text style={styles.tipText}>
            First major header may be your tack signal
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>\u2022</Text>
          <Text style={styles.tipText}>
            Clear air matters more than perfect side in first 2 minutes
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // Render laylines step
  const renderLaylines = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Layline strategy card */}
      <View style={styles.laylineCard}>
        <View style={styles.laylineHeader}>
          <Target size={24} color={IOS_COLORS.red} />
          <Text style={styles.laylineTitle}>Layline Approach Strategy</Text>
        </View>

        <View style={styles.laylineInfo}>
          <View style={styles.laylineItem}>
            <Text style={styles.laylineLabel}>Approach</Text>
            <Text style={styles.laylineValue}>
              {laylineStrategy.approach.charAt(0).toUpperCase() + laylineStrategy.approach.slice(1)}
            </Text>
          </View>
          <View style={styles.laylineItem}>
            <Text style={styles.laylineLabel}>Overstand Risk</Text>
            <Text style={[
              styles.laylineValue,
              laylineStrategy.overstandRisk === 'high' && { color: IOS_COLORS.red },
              laylineStrategy.overstandRisk === 'low' && { color: IOS_COLORS.green },
            ]}>
              {laylineStrategy.overstandRisk.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Layline tips */}
      <View style={styles.dataCard}>
        <Text style={styles.cardTitle}>Layline Guidelines</Text>

        {laylineStrategy.tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Text style={styles.tipBullet}>\u2022</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* General layline wisdom */}
      <View style={styles.wisdomCard}>
        <AlertTriangle size={20} color={IOS_COLORS.orange} />
        <View style={styles.wisdomContent}>
          <Text style={styles.wisdomTitle}>Layline Wisdom</Text>
          <Text style={styles.wisdomText}>
            In shifty conditions, approaching the layline early is the biggest mistake
            you can make. Every shift on the layline costs you double.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // Render beat plan step
  const renderBeatPlan = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {!beatPlan ? (
        <View style={styles.generateContainer}>
          <View style={styles.generateIcon}>
            <Sparkles size={48} color={IOS_COLORS.indigo} />
          </View>
          <Text style={styles.generateTitle}>Generate Beat Plan</Text>
          <Text style={styles.generateDescription}>
            Create a complete first beat strategy with decision points and bail-out triggers.
          </Text>
          <Pressable
            style={[styles.generateButton, { backgroundColor: IOS_COLORS.indigo }]}
            onPress={generateBeatPlan}
            disabled={isGeneratingPlan}
          >
            {isGeneratingPlan ? (
              <ActivityIndicator size="small" color={IOS_COLORS.secondaryBackground} />
            ) : (
              <>
                <Sparkles size={20} color={IOS_COLORS.secondaryBackground} />
                <Text style={styles.generateButtonText}>Generate Plan</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.briefContainer}>
          <View style={styles.briefHeader}>
            <Sparkles size={24} color={IOS_COLORS.indigo} />
            <Text style={styles.briefTitle}>First Beat Strategy Card</Text>
          </View>
          <View style={styles.briefContent}>
            <Text style={styles.briefText}>{beatPlan}</Text>
          </View>

          {/* Learn more link */}
          <Pressable style={styles.learnMoreButton} onPress={handleLearnMore}>
            <BookOpen size={20} color={IOS_COLORS.blue} />
            <Text style={styles.learnMoreText}>Learn more about upwind tactics</Text>
            <ChevronRight size={20} color={IOS_COLORS.blue} />
          </Pressable>
        </View>
      )}
    </ScrollView>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (step) {
      case 'loading':
        return renderLoading();
      case 'overview':
        return renderOverview();
      case 'side_selection':
        return renderSideSelection();
      case 'tack_selection':
        return renderTackSelection();
      case 'laylines':
        return renderLaylines();
      case 'beat_plan':
        return renderBeatPlan();
      default:
        return null;
    }
  };

  // Step titles
  const stepTitles: Record<WizardStep, string> = {
    loading: 'Loading...',
    overview: 'Beat Overview',
    side_selection: 'Side Selection',
    tack_selection: 'Tack Selection',
    laylines: 'Laylines',
    beat_plan: 'Beat Plan',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <X size={24} color={IOS_COLORS.label} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>First Beat Strategy</Text>
          {raceName && <Text style={styles.headerSubtitle}>{raceName}</Text>}
          {raceDate && <Text style={styles.headerDate}>{formatRaceDate(raceDate)}</Text>}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>{stepTitles[step]}</Text>
        {step !== 'loading' && (
          <Text style={styles.stepProgress}>
            {currentStepIndex + 1} of {steps.length}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Footer navigation */}
      {step !== 'loading' && (
        <View style={styles.footer}>
          {currentStepIndex > 0 ? (
            <Pressable style={styles.backButton} onPress={goBack}>
              <ChevronLeft size={20} color={IOS_COLORS.blue} />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )}

          {currentStepIndex < steps.length - 1 ? (
            <Pressable style={styles.nextButton} onPress={goNext}>
              <Text style={styles.nextButtonText}>Next</Text>
              <ChevronRight size={20} color={IOS_COLORS.secondaryBackground} />
            </Pressable>
          ) : (
            <Pressable style={styles.doneButton} onPress={handleComplete}>
              <CheckCircle2 size={20} color={IOS_COLORS.secondaryBackground} />
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  headerDate: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    height: 3,
    backgroundColor: IOS_COLORS.separator,
  },
  progressBar: {
    height: '100%',
    backgroundColor: IOS_COLORS.indigo,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  stepText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  stepProgress: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 16,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  editRaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    gap: 8,
  },
  editRaceButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  overviewCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${IOS_COLORS.indigo}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  overviewInfo: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  overviewSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  beatDiagram: {
    backgroundColor: IOS_COLORS.background,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  windArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  windLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  beatPath: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'space-between',
  },
  startLine: {
    width: 120,
    height: 3,
    backgroundColor: IOS_COLORS.green,
    alignItems: 'center',
  },
  startText: {
    fontSize: 10,
    color: IOS_COLORS.green,
    marginTop: 4,
  },
  beatTrack: {
    width: 2,
    flex: 1,
    backgroundColor: IOS_COLORS.separator,
  },
  windwardMark: {
    alignItems: 'center',
  },
  markText: {
    fontSize: 10,
    color: IOS_COLORS.red,
    marginTop: 4,
  },
  sideLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  sideLabel: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },
  conditionsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  conditionLabel: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  conditionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  insightCard: {
    backgroundColor: `${IOS_COLORS.indigo}10`,
    borderRadius: 12,
    padding: 16,
  },
  insightText: {
    fontSize: 14,
    color: IOS_COLORS.indigo,
    lineHeight: 20,
  },
  favoredCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  favoredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  favoredIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${IOS_COLORS.gray}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoredInfo: {
    flex: 1,
  },
  favoredTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  confidenceBadge: {
    backgroundColor: IOS_COLORS.separator,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'capitalize',
  },
  favoredDescription: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  dataCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  factorInfo: {
    flex: 1,
  },
  factorName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  factorDesc: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  factorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: IOS_COLORS.separator,
  },
  factorFavors: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: IOS_COLORS.gray,
  },
  noFactorsText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  commitmentSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  commitmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
    gap: 6,
  },
  commitmentOptionSelected: {
    backgroundColor: IOS_COLORS.indigo,
  },
  commitmentLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  commitmentLabelSelected: {
    color: IOS_COLORS.secondaryBackground,
    fontWeight: '600',
  },
  commitmentHint: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  tackCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tackIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tackInfo: {
    flex: 1,
  },
  tackTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tackSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  tackReason: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  alternativeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  alternativeNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.separator,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '600',
  },
  alternativeText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: IOS_COLORS.blue,
    marginRight: 8,
    width: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  laylineCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  laylineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  laylineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  laylineInfo: {
    flexDirection: 'row',
    gap: 32,
  },
  laylineItem: {
    flex: 1,
  },
  laylineLabel: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    marginBottom: 4,
  },
  laylineValue: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textTransform: 'capitalize',
  },
  wisdomCard: {
    flexDirection: 'row',
    backgroundColor: `${IOS_COLORS.orange}10`,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  wisdomContent: {
    flex: 1,
  },
  wisdomTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.orange,
    marginBottom: 4,
  },
  wisdomText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  generateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  generateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${IOS_COLORS.indigo}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  generateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  generateDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryBackground,
  },
  briefContainer: {
    flex: 1,
  },
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  briefTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  briefContent: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  briefText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 22,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  learnMoreText: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.blue,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  footerSpacer: {
    width: 80,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  backButtonText: {
    fontSize: 15,
    color: IOS_COLORS.blue,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.blue,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 4,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryBackground,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.green,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryBackground,
  },
});
