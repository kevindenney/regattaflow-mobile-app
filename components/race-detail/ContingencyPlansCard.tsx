/**
 * Contingency Plans Card
 * Shows scenario-based contingency plans for race conditions
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, Spacing } from '@/constants/designSystem';

interface ContingencyScenario {
  scenario: string;
  trigger: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

interface ContingencyPlansCardProps {
  raceId: string;
  scenarios?: ContingencyScenario[];
}

const DEFAULT_SCENARIOS: ContingencyScenario[] = [
  {
    scenario: 'Wind shifts left 10°+',
    trigger: 'Persistent wind direction change',
    action: 'Tack immediately and protect left side of course',
    priority: 'high',
  },
  {
    scenario: 'Current reverses',
    trigger: 'Tide changes during race',
    action: 'Favor port tack and adjust laylines accordingly',
    priority: 'high',
  },
  {
    scenario: 'Wind drops below 8 knots',
    trigger: 'Light air conditions develop',
    action: 'Prioritize clear air over position, sail more conservatively',
    priority: 'medium',
  },
  {
    scenario: 'General recall',
    trigger: 'OCS or black flag',
    action: 'Conservative restart, ensure clean start over aggressive position',
    priority: 'high',
  },
  {
    scenario: 'Wind increases above 20 knots',
    trigger: 'Heavy weather develops',
    action: 'Reef if needed, focus on boat handling and safety',
    priority: 'high',
  },
];

export function ContingencyPlansCard({ raceId, scenarios = DEFAULT_SCENARIOS }: ContingencyPlansCardProps) {
  const getPriorityColor = (priority: ContingencyScenario['priority']) => {
    switch (priority) {
      case 'high':
        return colors.danger[600];
      case 'medium':
        return colors.warning[600];
      case 'low':
        return colors.info[600];
    }
  };

  const getPriorityIcon = (priority: ContingencyScenario['priority']) => {
    switch (priority) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'alert';
      case 'low':
        return 'information';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="shield-alert" size={24} color={colors.warning[600]} />
          <Text style={styles.title}>Contingency Plans</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{scenarios.length} scenarios</Text>
        </View>
      </View>

      <ScrollView style={styles.scenariosList} showsVerticalScrollIndicator={false}>
        {scenarios.map((scenario, index) => (
          <View key={index} style={styles.scenarioCard}>
            {/* Priority Indicator */}
            <View style={styles.scenarioHeader}>
              <MaterialCommunityIcons
                name={getPriorityIcon(scenario.priority)}
                size={20}
                color={getPriorityColor(scenario.priority)}
              />
              <Text style={styles.scenarioTitle}>{scenario.scenario}</Text>
            </View>

            {/* Trigger */}
            <View style={styles.triggerSection}>
              <Text style={styles.triggerLabel}>Trigger:</Text>
              <Text style={styles.triggerText}>{scenario.trigger}</Text>
            </View>

            {/* Action */}
            <View style={styles.actionSection}>
              <MaterialCommunityIcons name="arrow-right-bold" size={16} color={colors.primary[600]} />
              <Text style={styles.actionText}>{scenario.action}</Text>
            </View>

            {/* Priority Badge */}
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(scenario.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(scenario.priority) }]}>
                {scenario.priority.toUpperCase()} PRIORITY
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  badge: {
    backgroundColor: colors.warning[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning[700],
  },
  scenariosList: {
    maxHeight: 400,
  },
  scenarioCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  triggerSection: {
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.md,
  },
  triggerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 2,
  },
  triggerText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: colors.primary[50],
    padding: Spacing.sm,
    borderRadius: 6,
    marginBottom: Spacing.sm,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    lineHeight: 20,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
