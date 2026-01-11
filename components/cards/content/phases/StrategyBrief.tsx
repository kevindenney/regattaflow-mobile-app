/**
 * StrategyBrief - Condensed Strategy Summary with Drill-Down
 *
 * Tufte principle: "Overview first, zoom and filter, then details on demand"
 *
 * Shows 3-5 key strategy points generated from conditions/venue data.
 * Tapping "Full Strategy" reveals the Tufte-style strategy screen.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, X } from 'lucide-react-native';

import { CardRaceData } from '../../types';
import { TufteStrategyScreen } from '@/components/races/strategy';
import type { StrategySectionId } from '@/types/raceStrategy';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

interface StrategyBriefProps {
  race: CardRaceData;
  onOpenStrategyDetail?: () => void;
}

/**
 * Generate strategy bullets based on race conditions
 * In production, this would be AI-generated
 */
function generateStrategyBullets(race: CardRaceData): string[] {
  const bullets: string[] = [];
  const wind = race.wind;
  const tide = race.tide;

  // Wind-based strategies
  if (wind) {
    // Direction-based
    if (wind.direction?.includes('N')) {
      bullets.push('Favor right side on first beat (northerly persistents)');
    } else if (wind.direction?.includes('E')) {
      bullets.push('Watch for oscillations from the east');
    } else if (wind.direction?.includes('S')) {
      bullets.push('Left side may pay on southerly shift');
    } else if (wind.direction?.includes('W')) {
      bullets.push('Westerly typically backs through the day');
    }

    // Strength-based
    if (wind.speedMax && wind.speedMax > 18) {
      bullets.push('Heavy air - reef early, power up gradually');
    } else if (wind.speedMin && wind.speedMin < 8) {
      bullets.push('Light air - prioritize clear air, minimize maneuvers');
    }

    // Gust differential
    if (wind.speedMax && wind.speedMin && (wind.speedMax - wind.speedMin) > 8) {
      bullets.push('High gust differential - sail in the puffs');
    }
  }

  // Tide-based strategies
  if (tide) {
    if (tide.state === 'flooding' || tide.state === 'rising') {
      bullets.push('Current favorable upwind - stay in main flow');
    } else if (tide.state === 'ebbing' || tide.state === 'falling') {
      bullets.push('Current adverse upwind - favor shallows');
    } else if (tide.state === 'slack') {
      bullets.push('Slack tide - focus on wind shifts, not current');
    }
  }

  // Add generic high-value strategies if we don't have enough
  if (bullets.length < 3) {
    bullets.push('Pin end likely favored at start');
  }
  if (bullets.length < 4) {
    bullets.push('Watch for persistent shifts after midday');
  }

  return bullets.slice(0, 5);
}

export function StrategyBrief({
  race,
  isExpanded = false,
  onOpenStrategyDetail,
}: StrategyBriefProps) {
  // State for Tufte-style strategy modal
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get strategy bullets (would be AI-generated in production)
  const strategyBullets = useMemo(() => generateStrategyBullets(race), [race]);

  // Handle opening strategy detail
  const handleOpenDetail = useCallback(() => {
    if (onOpenStrategyDetail) {
      onOpenStrategyDetail();
    } else {
      setShowDetailModal(true);
    }
  }, [onOpenStrategyDetail]);

  // Handle strategy section updates
  const handleUpdateSection = useCallback((sectionId: StrategySectionId, userPlan: string) => {
    console.log('Strategy updated:', sectionId, userPlan);
    // TODO: Persist to storage or sync with backend
  }, []);

  return (
    <>
      {/* Strategy Brief Card */}
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>STRATEGY BRIEF</Text>
          <Pressable style={styles.drillDownButton} onPress={handleOpenDetail}>
            <Text style={styles.drillDownText}>Full Strategy</Text>
            <ChevronRight size={14} color={IOS_COLORS.blue} />
          </Pressable>
        </View>

        {/* Strategy Bullets */}
        <View style={styles.briefContainer}>
          {strategyBullets.map((bullet, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>

        {/* Expandable hint */}
        {!isExpanded && strategyBullets.length > 3 && (
          <Text style={styles.expandHint}>
            Tap "Full Strategy" for detailed leg-by-leg tactics
          </Text>
        )}
      </View>

      {/* Tufte-Style Strategy Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <View style={styles.modalCloseBar}>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowDetailModal(false)}
            >
              <X size={24} color={IOS_COLORS.secondaryLabel} />
            </Pressable>
          </View>

          {/* Tufte Strategy Screen */}
          <TufteStrategyScreen
            raceName={race.name}
            raceDate={race.date ? new Date(race.date) : undefined}
            onUpdateSection={handleUpdateSection}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  drillDownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  drillDownText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // Brief Container
  briefContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.blue,
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletDot: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.blue,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },

  // Expand hint
  expandHint: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal - Tufte style
  modalContainer: {
    flex: 1,
    backgroundColor: '#F0EDE8', // TUFTE_BACKGROUND
  },
  modalCloseBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 50, // Safe area padding
    paddingBottom: 8,
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
});

export default StrategyBrief;
