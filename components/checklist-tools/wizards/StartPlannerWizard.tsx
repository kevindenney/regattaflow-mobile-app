/**
 * StartPlannerWizard
 *
 * Multi-step wizard for developing start strategy for race preparation.
 * Builds a complete start game plan with contingencies.
 *
 * Steps:
 * 1. Line Bias - Calculate and visualize line bias from current wind
 * 2. Position Selection - Interactive start line with selectable zones
 * 3. Fleet Strategy - AI predicts where fleet will cluster
 * 4. Escape Routes - Plan escape options for each position
 * 5. Start Plan - Summary card with primary + backup positions
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
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Flag,
  Navigation,
  Clock,
  AlertTriangle,
  Users,
  Target,
  Sparkles,
  BookOpen,
  ArrowRight,
  Anchor,
  Sailboat,
  ShieldAlert,
  Check,
  Compass,
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
  pink: '#FF2D55',
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

type WizardStep = 'loading' | 'line_bias' | 'position' | 'fleet' | 'escape' | 'start_plan';

interface StartPlannerWizardProps extends ChecklistToolProps {
  venue?: SailingVenue | null;
  raceDate?: string | null;
  raceName?: string;
  raceStartTime?: string;
  raceDurationHours?: number;
}

// Start position types
type StartPosition = 'pin' | 'pin_third' | 'middle' | 'boat_third' | 'boat';

// Escape route type
interface EscapeRoute {
  position: StartPosition;
  routes: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export function StartPlannerWizard({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
  venue,
  raceDate,
  raceName,
  raceStartTime,
  raceDurationHours,
}: StartPlannerWizardProps) {
  const router = useRouter();

  // Use existing forecast check hook for wind data
  const {
    currentForecast,
    isLoadingForecast,
    forecastError,
  } = useForecastCheck({
    raceEventId,
    venue: venue || null,
    raceDate: raceDate || null,
    raceStartTime: raceStartTime || null,
    expectedDurationMinutes: raceDurationHours ? raceDurationHours * 60 : undefined,
  });

  // State
  const [step, setStep] = useState<WizardStep>('loading');
  const [selectedPosition, setSelectedPosition] = useState<StartPosition | null>(null);
  const [backupPosition, setBackupPosition] = useState<StartPosition | null>(null);
  const [aggressionLevel, setAggressionLevel] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [startPlan, setStartPlan] = useState<string | null>(null);

  // Determine initial step once forecast loads
  useEffect(() => {
    if (!isLoadingForecast && currentForecast) {
      setStep('line_bias');
    } else if (!isLoadingForecast && !currentForecast) {
      setStep('line_bias');
    }
  }, [isLoadingForecast, currentForecast]);

  // Calculate line bias from wind direction
  const lineBias = useMemo((): {
    favoredEnd: 'pin' | 'boat' | 'even';
    boatLengths: number;
    windDirection: string;
    description: string;
    recommendation: string;
  } => {
    if (!currentForecast?.raceWindow) {
      return {
        favoredEnd: 'even',
        boatLengths: 0,
        windDirection: 'N',
        description: 'Unable to calculate bias without forecast data',
        recommendation: 'Check wind direction on the water before committing',
      };
    }

    const windDir = currentForecast.raceWindow.windDirectionAtStart;

    // Simplified bias calculation - in reality this would need actual line bearing
    // For demo, assume typical W-E line orientation
    const cardinalMap: Record<string, number> = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
    };

    const windDeg = cardinalMap[windDir] || 0;

    // Assume line perpendicular to average wind
    // If wind is more from right, boat end favored; from left, pin favored
    const deviation = ((windDeg % 180) - 90);
    const boatLengthsAdvantage = Math.abs(deviation) / 10; // Rough estimate

    let favoredEnd: 'pin' | 'boat' | 'even';
    let description: string;
    let recommendation: string;

    if (Math.abs(deviation) < 5) {
      favoredEnd = 'even';
      description = 'Line appears square to the wind';
      recommendation = 'Choose position based on first beat strategy, not line bias';
    } else if (deviation > 0) {
      favoredEnd = 'boat';
      description = `Boat end favored by ~${boatLengthsAdvantage.toFixed(1)} boat lengths`;
      recommendation = 'Consider boat end start, but check on water to confirm';
    } else {
      favoredEnd = 'pin';
      description = `Pin end favored by ~${boatLengthsAdvantage.toFixed(1)} boat lengths`;
      recommendation = 'Consider pin end start, but check on water to confirm';
    }

    return {
      favoredEnd,
      boatLengths: boatLengthsAdvantage,
      windDirection: windDir,
      description,
      recommendation,
    };
  }, [currentForecast]);

  // Fleet clustering prediction
  const fleetPrediction = useMemo((): {
    pinCrowding: 'low' | 'medium' | 'high';
    middleCrowding: 'low' | 'medium' | 'high';
    boatCrowding: 'low' | 'medium' | 'high';
    recommendations: string[];
  } => {
    const bias = lineBias.favoredEnd;

    if (bias === 'pin') {
      return {
        pinCrowding: 'high',
        middleCrowding: 'medium',
        boatCrowding: 'low',
        recommendations: [
          'Expect crowd at pin - arrive early to hold position',
          'Middle may offer clear air with moderate bias advantage',
          'Boat end will be least crowded but gives up bias advantage',
        ],
      };
    } else if (bias === 'boat') {
      return {
        pinCrowding: 'low',
        middleCrowding: 'medium',
        boatCrowding: 'high',
        recommendations: [
          'Boat end will be crowded - timing and positioning critical',
          'Middle offers balance of position and clear air',
          'Pin will have space but you give up the bias',
        ],
      };
    } else {
      return {
        pinCrowding: 'medium',
        middleCrowding: 'medium',
        boatCrowding: 'medium',
        recommendations: [
          'Square line means fleet will spread more evenly',
          'Position based on first beat strategy, not line bias',
          'Clear air becomes the priority - avoid tight clusters',
        ],
      };
    }
  }, [lineBias]);

  // Escape routes for each position
  const escapeRoutes = useMemo((): EscapeRoute[] => [
    {
      position: 'pin',
      routes: [
        'Tack immediately to port for clear air',
        'Bear away below fleet if pinned',
        'Bail early (30 sec) if too crowded',
      ],
      riskLevel: lineBias.favoredEnd === 'pin' ? 'high' : 'medium',
    },
    {
      position: 'pin_third',
      routes: [
        'Tack onto port after initial acceleration',
        'Foot off for speed to leeward if trapped',
        'Work to weather side of nearby boats',
      ],
      riskLevel: 'medium',
    },
    {
      position: 'middle',
      routes: [
        'Sail toward favored side based on wind shifts',
        'Tack if trapped behind wall of boats',
        'Look for gaps in the line to punch through',
      ],
      riskLevel: 'low',
    },
    {
      position: 'boat_third',
      routes: [
        'Continue on starboard for clear air',
        'Tack to port if trapped by boats to leeward',
        'Use speed to work up to weather of line',
      ],
      riskLevel: 'medium',
    },
    {
      position: 'boat',
      routes: [
        'Continue on starboard into right side',
        'Tack immediately if fouled by committee boat',
        'Dial up if needed to protect position',
      ],
      riskLevel: lineBias.favoredEnd === 'boat' ? 'high' : 'medium',
    },
  ], [lineBias]);

  // Generate start plan
  const generateStartPlan = useCallback(async () => {
    setIsGeneratingPlan(true);

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const primaryPos = selectedPosition || 'middle';
    const backupPos = backupPosition || (primaryPos === 'pin' ? 'middle' : 'pin_third');
    const escape = escapeRoutes.find(e => e.position === primaryPos);

    const positionLabels: Record<StartPosition, string> = {
      pin: 'Pin End',
      pin_third: 'Pin Third',
      middle: 'Middle',
      boat_third: 'Boat Third',
      boat: 'Boat End',
    };

    const plan = `## Start Plan Card

**Primary Position:** ${positionLabels[primaryPos]}
**Backup Position:** ${positionLabels[backupPos]}
**Aggression Level:** ${aggressionLevel.charAt(0).toUpperCase() + aggressionLevel.slice(1)}

### Line Bias
${lineBias.description}
Wind Direction: ${lineBias.windDirection}

### Timing Plan

${aggressionLevel === 'conservative' ? `
- **Final approach:** 1:30 before gun
- **Target position:** 2-3 boat lengths from line
- **Acceleration:** Begin at 0:20, full speed by gun
- **Priority:** Clear air over position
` : aggressionLevel === 'aggressive' ? `
- **Final approach:** 0:45 before gun
- **Target position:** On the line, bow even with neighbors
- **Acceleration:** Begin at 0:10, hit line at full speed
- **Priority:** Position over clear air
` : `
- **Final approach:** 1:00 before gun
- **Target position:** 1 boat length from line
- **Acceleration:** Begin at 0:15, build to full speed
- **Priority:** Balance position and air
`}

### Escape Routes
${escape?.routes.map(r => `- ${r}`).join('\n') || 'Standard escape tactics apply'}

### Risk Assessment
**Risk Level:** ${escape?.riskLevel.toUpperCase() || 'MEDIUM'}

${escape?.riskLevel === 'high' ? `
Expect heavy traffic at ${positionLabels[primaryPos]}. Have backup plan ready.
Consider switching to ${positionLabels[backupPos]} if approach is compromised.
` : `
Moderate competition expected. Stay alert but execute your plan.
`}

### Crew Callouts
1. "1 minute - final approach"
2. "30 seconds - check position"
3. "15 seconds - trim for acceleration"
4. "10 seconds - sheet on"
5. "Gun - go mode!"`;

    setStartPlan(plan);
    setIsGeneratingPlan(false);
  }, [selectedPosition, backupPosition, aggressionLevel, lineBias, escapeRoutes]);

  // Navigate to learn module
  const handleLearnMore = useCallback(() => {
    onCancel();
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/learn',
        params: { courseSlug: 'perfect-start' },
      });
    }, 150);
  }, [router, onCancel]);

  // Navigate to edit race
  const handleEditRace = useCallback(() => {
    if (!raceEventId) return;
    onCancel();
    setTimeout(() => {
      router.push(`/race/edit/${raceEventId}`);
    }, 150);
  }, [raceEventId, onCancel, router]);

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
  const steps: WizardStep[] = ['line_bias', 'position', 'fleet', 'escape', 'start_plan'];
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

  // Get crowding color
  const getCrowdingColor = useCallback((level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return IOS_COLORS.green;
      case 'medium': return IOS_COLORS.orange;
      case 'high': return IOS_COLORS.red;
    }
  }, []);

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={IOS_COLORS.blue} />
      <Text style={styles.loadingText}>Loading wind data...</Text>
    </View>
  );

  // Render line bias step
  const renderLineBias = () => {
    if (!currentForecast?.raceWindow) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={IOS_COLORS.orange} />
          <Text style={styles.errorTitle}>Forecast Unavailable</Text>
          <Text style={styles.errorDescription}>
            Unable to calculate line bias without wind forecast.
          </Text>
          {raceEventId && (
            <Pressable style={styles.editRaceButton} onPress={handleEditRace}>
              <Text style={styles.editRaceButtonText}>Edit Race</Text>
              <ArrowRight size={16} color={IOS_COLORS.blue} />
            </Pressable>
          )}
        </View>
      );
    }

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        {/* Bias Overview Card */}
        <View style={styles.biasCard}>
          <View style={styles.biasHeader}>
            <View style={[
              styles.biasIconContainer,
              lineBias.favoredEnd === 'pin' && { backgroundColor: `${IOS_COLORS.green}20` },
              lineBias.favoredEnd === 'boat' && { backgroundColor: `${IOS_COLORS.blue}20` },
            ]}>
              <Flag size={32} color={
                lineBias.favoredEnd === 'pin' ? IOS_COLORS.green :
                lineBias.favoredEnd === 'boat' ? IOS_COLORS.blue :
                IOS_COLORS.gray
              } />
            </View>
            <View style={styles.biasInfo}>
              <Text style={styles.biasTitle}>
                {lineBias.favoredEnd === 'pin' ? 'Pin End Favored' :
                 lineBias.favoredEnd === 'boat' ? 'Boat End Favored' :
                 'Line Appears Square'}
              </Text>
              <Text style={styles.biasSubtitle}>
                Wind from {lineBias.windDirection}
              </Text>
            </View>
          </View>

          <Text style={styles.biasDescription}>{lineBias.description}</Text>
        </View>

        {/* Visual Line Representation */}
        <View style={styles.lineVisualization}>
          <View style={styles.lineContainer}>
            {/* Pin end */}
            <View style={styles.lineEnd}>
              <View style={[
                styles.lineMarker,
                lineBias.favoredEnd === 'pin' && styles.lineMarkerFavored
              ]}>
                <Anchor size={20} color={
                  lineBias.favoredEnd === 'pin' ? IOS_COLORS.secondaryBackground : IOS_COLORS.gray
                } />
              </View>
              <Text style={styles.lineLabel}>PIN</Text>
              {lineBias.favoredEnd === 'pin' && (
                <Text style={styles.favoredLabel}>+{lineBias.boatLengths.toFixed(1)} BL</Text>
              )}
            </View>

            {/* Line */}
            <View style={styles.startLine} />

            {/* Boat end */}
            <View style={styles.lineEnd}>
              <View style={[
                styles.lineMarker,
                lineBias.favoredEnd === 'boat' && styles.lineMarkerFavored
              ]}>
                <Sailboat size={20} color={
                  lineBias.favoredEnd === 'boat' ? IOS_COLORS.secondaryBackground : IOS_COLORS.gray
                } />
              </View>
              <Text style={styles.lineLabel}>BOAT</Text>
              {lineBias.favoredEnd === 'boat' && (
                <Text style={styles.favoredLabel}>+{lineBias.boatLengths.toFixed(1)} BL</Text>
              )}
            </View>
          </View>

          {/* Wind arrow */}
          <View style={styles.windIndicator}>
            <Compass size={16} color={IOS_COLORS.blue} />
            <Text style={styles.windText}>{lineBias.windDirection}</Text>
          </View>
        </View>

        {/* Recommendation */}
        <View style={styles.recommendationCard}>
          <Text style={styles.cardTitle}>Recommendation</Text>
          <Text style={styles.recommendationText}>{lineBias.recommendation}</Text>
        </View>

        {/* Caution */}
        <View style={styles.cautionCard}>
          <AlertTriangle size={20} color={IOS_COLORS.orange} />
          <Text style={styles.cautionText}>
            Always verify line bias on the water. Wind can shift between now and race start.
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Render position selection step
  const renderPosition = () => {
    const positions: { id: StartPosition; label: string }[] = [
      { id: 'pin', label: 'Pin End' },
      { id: 'pin_third', label: 'Pin Third' },
      { id: 'middle', label: 'Middle' },
      { id: 'boat_third', label: 'Boat Third' },
      { id: 'boat', label: 'Boat End' },
    ];

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <View style={styles.dataCard}>
          <Text style={styles.cardTitle}>Select Primary Position</Text>
          <Text style={styles.cardSubtitle}>
            Choose where you plan to start on the line
          </Text>
        </View>

        {/* Position selector */}
        <View style={styles.positionSelector}>
          {positions.map((pos) => (
            <Pressable
              key={pos.id}
              style={[
                styles.positionOption,
                selectedPosition === pos.id && styles.positionOptionSelected,
              ]}
              onPress={() => setSelectedPosition(pos.id)}
            >
              <View style={styles.positionContent}>
                <Text style={[
                  styles.positionLabel,
                  selectedPosition === pos.id && styles.positionLabelSelected,
                ]}>
                  {pos.label}
                </Text>
                {lineBias.favoredEnd === pos.id.replace('_third', '').replace('_', '') && (
                  <View style={styles.favoredBadge}>
                    <Text style={styles.favoredBadgeText}>Favored</Text>
                  </View>
                )}
              </View>
              {selectedPosition === pos.id && (
                <Check size={20} color={IOS_COLORS.blue} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Backup position */}
        <View style={styles.dataCard}>
          <Text style={styles.cardTitle}>Select Backup Position</Text>
          <Text style={styles.cardSubtitle}>
            If your primary approach is compromised
          </Text>

          <View style={styles.backupSelector}>
            {positions.filter(p => p.id !== selectedPosition).map((pos) => (
              <Pressable
                key={pos.id}
                style={[
                  styles.backupOption,
                  backupPosition === pos.id && styles.backupOptionSelected,
                ]}
                onPress={() => setBackupPosition(pos.id)}
              >
                <Text style={[
                  styles.backupLabel,
                  backupPosition === pos.id && styles.backupLabelSelected,
                ]}>
                  {pos.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Aggression level */}
        <View style={styles.dataCard}>
          <Text style={styles.cardTitle}>Aggression Level</Text>

          <View style={styles.aggressionSelector}>
            {(['conservative', 'moderate', 'aggressive'] as const).map((level) => (
              <Pressable
                key={level}
                style={[
                  styles.aggressionOption,
                  aggressionLevel === level && styles.aggressionOptionSelected,
                ]}
                onPress={() => setAggressionLevel(level)}
              >
                <Text style={[
                  styles.aggressionLabel,
                  aggressionLevel === level && styles.aggressionLabelSelected,
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  // Render fleet prediction step
  const renderFleet = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.dataCard}>
        <Text style={styles.cardTitle}>Fleet Clustering Prediction</Text>
        <Text style={styles.cardSubtitle}>
          Where the fleet is likely to concentrate
        </Text>
      </View>

      {/* Crowding visualization */}
      <View style={styles.crowdingCard}>
        <View style={styles.crowdingRow}>
          <View style={styles.crowdingItem}>
            <View style={[
              styles.crowdingDot,
              { backgroundColor: getCrowdingColor(fleetPrediction.pinCrowding) }
            ]} />
            <Text style={styles.crowdingLabel}>Pin</Text>
            <Text style={[
              styles.crowdingLevel,
              { color: getCrowdingColor(fleetPrediction.pinCrowding) }
            ]}>
              {fleetPrediction.pinCrowding}
            </Text>
          </View>

          <View style={styles.crowdingItem}>
            <View style={[
              styles.crowdingDot,
              { backgroundColor: getCrowdingColor(fleetPrediction.middleCrowding) }
            ]} />
            <Text style={styles.crowdingLabel}>Middle</Text>
            <Text style={[
              styles.crowdingLevel,
              { color: getCrowdingColor(fleetPrediction.middleCrowding) }
            ]}>
              {fleetPrediction.middleCrowding}
            </Text>
          </View>

          <View style={styles.crowdingItem}>
            <View style={[
              styles.crowdingDot,
              { backgroundColor: getCrowdingColor(fleetPrediction.boatCrowding) }
            ]} />
            <Text style={styles.crowdingLabel}>Boat</Text>
            <Text style={[
              styles.crowdingLevel,
              { color: getCrowdingColor(fleetPrediction.boatCrowding) }
            ]}>
              {fleetPrediction.boatCrowding}
            </Text>
          </View>
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.tipsCard}>
        <Text style={styles.cardTitle}>Strategic Insights</Text>
        {fleetPrediction.recommendations.map((rec, index) => (
          <View key={index} style={styles.tipItem}>
            <Text style={styles.tipBullet}>\u2022</Text>
            <Text style={styles.tipText}>{rec}</Text>
          </View>
        ))}
      </View>

      {/* Fleet size consideration */}
      <View style={styles.fleetSizeCard}>
        <Users size={24} color={IOS_COLORS.purple} />
        <View style={styles.fleetSizeContent}>
          <Text style={styles.fleetSizeTitle}>Fleet Size Matters</Text>
          <Text style={styles.fleetSizeText}>
            Larger fleets amplify crowding at favored end. In small fleets (&lt;15 boats),
            starting at the favored end is more achievable.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // Render escape routes step
  const renderEscape = () => {
    const selectedEscape = escapeRoutes.find(e => e.position === selectedPosition);

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <View style={styles.dataCard}>
          <Text style={styles.cardTitle}>Escape Routes</Text>
          <Text style={styles.cardSubtitle}>
            Plan your exit if the start goes wrong
          </Text>
        </View>

        {/* Primary position escape */}
        {selectedEscape && (
          <View style={styles.escapeCard}>
            <View style={styles.escapeHeader}>
              <ShieldAlert size={24} color={
                selectedEscape.riskLevel === 'high' ? IOS_COLORS.red :
                selectedEscape.riskLevel === 'medium' ? IOS_COLORS.orange :
                IOS_COLORS.green
              } />
              <View style={styles.escapeInfo}>
                <Text style={styles.escapeTitle}>
                  {selectedPosition === 'pin' ? 'Pin End' :
                   selectedPosition === 'pin_third' ? 'Pin Third' :
                   selectedPosition === 'middle' ? 'Middle' :
                   selectedPosition === 'boat_third' ? 'Boat Third' :
                   'Boat End'} Escapes
                </Text>
                <View style={[
                  styles.riskBadge,
                  { backgroundColor: `${getCrowdingColor(selectedEscape.riskLevel)}20` }
                ]}>
                  <Text style={[
                    styles.riskText,
                    { color: getCrowdingColor(selectedEscape.riskLevel) }
                  ]}>
                    {selectedEscape.riskLevel} risk
                  </Text>
                </View>
              </View>
            </View>

            {selectedEscape.routes.map((route, index) => (
              <View key={index} style={styles.escapeRoute}>
                <Text style={styles.escapeNumber}>{index + 1}</Text>
                <Text style={styles.escapeText}>{route}</Text>
              </View>
            ))}
          </View>
        )}

        {/* General escape tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.cardTitle}>General Escape Principles</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>\u2022</Text>
            <Text style={styles.tipText}>
              Bail early if position is compromised - don't fight a losing battle
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>\u2022</Text>
            <Text style={styles.tipText}>
              Speed is your friend - accelerate away from bad air
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>\u2022</Text>
            <Text style={styles.tipText}>
              Keep your head out of the boat - watch for gaps
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Render start plan step
  const renderStartPlan = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {!startPlan ? (
        <View style={styles.generateContainer}>
          <View style={styles.generateIcon}>
            <Sparkles size={48} color={IOS_COLORS.pink} />
          </View>
          <Text style={styles.generateTitle}>Generate Start Plan</Text>
          <Text style={styles.generateDescription}>
            Create a complete start plan with timing, position, and crew callouts.
          </Text>
          <Pressable
            style={[styles.generateButton, { backgroundColor: IOS_COLORS.pink }]}
            onPress={generateStartPlan}
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
            <Sparkles size={24} color={IOS_COLORS.pink} />
            <Text style={styles.briefTitle}>Start Plan Card</Text>
          </View>
          <View style={styles.briefContent}>
            <Text style={styles.briefText}>{startPlan}</Text>
          </View>

          {/* Learn more link */}
          <Pressable style={styles.learnMoreButton} onPress={handleLearnMore}>
            <BookOpen size={20} color={IOS_COLORS.blue} />
            <Text style={styles.learnMoreText}>Learn more about starting</Text>
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
      case 'line_bias':
        return renderLineBias();
      case 'position':
        return renderPosition();
      case 'fleet':
        return renderFleet();
      case 'escape':
        return renderEscape();
      case 'start_plan':
        return renderStartPlan();
      default:
        return null;
    }
  };

  // Step titles
  const stepTitles: Record<WizardStep, string> = {
    loading: 'Loading...',
    line_bias: 'Line Bias',
    position: 'Position Selection',
    fleet: 'Fleet Strategy',
    escape: 'Escape Routes',
    start_plan: 'Start Plan',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <X size={24} color={IOS_COLORS.label} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Start Strategy</Text>
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
            <Pressable style={styles.doneButton} onPress={onComplete}>
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
    backgroundColor: IOS_COLORS.pink,
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
  biasCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  biasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  biasIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${IOS_COLORS.gray}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  biasInfo: {
    flex: 1,
  },
  biasTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  biasSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  biasDescription: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  lineVisualization: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  lineEnd: {
    alignItems: 'center',
    width: 60,
  },
  lineMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${IOS_COLORS.gray}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineMarkerFavored: {
    backgroundColor: IOS_COLORS.blue,
  },
  lineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  favoredLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginTop: 4,
  },
  startLine: {
    flex: 1,
    height: 3,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: 12,
  },
  windIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  windText: {
    fontSize: 13,
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
  recommendationCard: {
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: 14,
    color: IOS_COLORS.blue,
    lineHeight: 20,
  },
  cautionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${IOS_COLORS.orange}10`,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  cautionText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.orange,
    lineHeight: 18,
  },
  dataCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  positionSelector: {
    gap: 8,
    marginBottom: 16,
  },
  positionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  positionOptionSelected: {
    borderColor: IOS_COLORS.blue,
  },
  positionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionLabel: {
    fontSize: 16,
    color: IOS_COLORS.label,
  },
  positionLabelSelected: {
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  favoredBadge: {
    backgroundColor: `${IOS_COLORS.green}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  favoredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  backupSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backupOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
  },
  backupOptionSelected: {
    backgroundColor: IOS_COLORS.blue,
  },
  backupLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  backupLabelSelected: {
    color: IOS_COLORS.secondaryBackground,
    fontWeight: '600',
  },
  aggressionSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  aggressionOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
    alignItems: 'center',
  },
  aggressionOptionSelected: {
    backgroundColor: IOS_COLORS.pink,
  },
  aggressionLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  aggressionLabelSelected: {
    color: IOS_COLORS.secondaryBackground,
    fontWeight: '600',
  },
  crowdingCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  crowdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  crowdingItem: {
    alignItems: 'center',
  },
  crowdingDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  crowdingLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
  },
  crowdingLevel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
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
  fleetSizeCard: {
    flexDirection: 'row',
    backgroundColor: `${IOS_COLORS.purple}10`,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  fleetSizeContent: {
    flex: 1,
  },
  fleetSizeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.purple,
    marginBottom: 4,
  },
  fleetSizeText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  escapeCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  escapeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  escapeInfo: {
    flex: 1,
  },
  escapeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 4,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  escapeRoute: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  escapeNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.blue,
    color: IOS_COLORS.secondaryBackground,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '600',
  },
  escapeText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
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
    backgroundColor: `${IOS_COLORS.pink}15`,
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
