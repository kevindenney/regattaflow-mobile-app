/**
 * StrategyModule
 *
 * Displays race strategy recommendations based on conditions.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Compass, ArrowUp, ArrowDown, Flag } from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface StrategyModuleProps extends ContentModuleProps<CardRaceData> {}

/**
 * Strategy content module
 */
function StrategyModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: StrategyModuleProps) {
  if (isCollapsed) {
    return null;
  }

  // Generate strategy tips based on phase
  const strategyTips = getStrategyTips(race, phase, raceType);

  return (
    <View style={styles.container}>
      {/* Strategy sections by area */}
      {strategyTips.map((section, index) => (
        <View key={index} style={styles.section}>
          <View style={styles.sectionHeader}>
            {section.icon}
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={styles.tipsList}>
            {section.tips.map((tip, tipIndex) => (
              <View key={tipIndex} style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {strategyTips.length === 0 && (
        <Text style={styles.noData}>
          Strategy recommendations will appear based on conditions
        </Text>
      )}
    </View>
  );
}

/**
 * Generate strategy tips based on race data and phase
 */
function getStrategyTips(
  race: CardRaceData,
  phase: string,
  raceType: string
): { title: string; icon: React.ReactNode; tips: string[] }[] {
  const tips: { title: string; icon: React.ReactNode; tips: string[] }[] = [];

  // Start strategy
  tips.push({
    title: 'Start',
    icon: <Flag size={14} color={IOS_COLORS.green} />,
    tips: [
      'Identify favored end of the line',
      'Plan approach for clean air',
      'Watch for current effects at the line',
    ],
  });

  // Upwind strategy
  if (race.wind) {
    const isLightAir = race.wind.speedMax < 10;
    tips.push({
      title: 'Upwind',
      icon: <ArrowUp size={14} color={IOS_COLORS.blue} />,
      tips: isLightAir
        ? [
            'Prioritize clear air over position',
            'Minimize maneuvers to maintain flow',
            'Look for persistent shifts',
          ]
        : [
            'Play the shifts, tack on headers',
            'Consider current when choosing side',
            'Maintain good boat speed through waves',
          ],
    });
  }

  // Downwind strategy
  tips.push({
    title: 'Downwind',
    icon: <ArrowDown size={14} color={IOS_COLORS.purple} />,
    tips: [
      'Sail hot angles in light air',
      'Protect position from behind',
      'Plan approach to leeward mark',
    ],
  });

  return tips;
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  tipsList: {
    gap: 6,
    paddingLeft: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: IOS_COLORS.blue,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  noData: {
    fontSize: 13,
    color: IOS_COLORS.gray2,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default StrategyModule;
