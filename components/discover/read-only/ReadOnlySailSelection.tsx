/**
 * ReadOnlySailSelection Component
 *
 * Displays sailor's sail selection in read-only mode.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Anchor, Wind } from 'lucide-react-native';
import { SailSelectionIntention } from '@/types/raceIntentions';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface ReadOnlySailSelectionProps {
  sailSelection?: SailSelectionIntention;
}

/**
 * Sail card component
 */
function SailCard({
  label,
  name,
  color,
}: {
  label: string;
  name: string;
  color: string;
}) {
  return (
    <View style={styles.sailCard}>
      <View style={[styles.sailIconContainer, { backgroundColor: `${color}20` }]}>
        <Anchor size={18} color={color} />
      </View>
      <View style={styles.sailInfo}>
        <Text style={styles.sailLabel}>{label}</Text>
        <Text style={styles.sailName} numberOfLines={1}>{name}</Text>
      </View>
    </View>
  );
}

export function ReadOnlySailSelection({
  sailSelection,
}: ReadOnlySailSelectionProps) {
  if (!sailSelection) {
    return (
      <Text style={styles.emptyText}>No sail selection shared</Text>
    );
  }

  const hasMainsail = Boolean(sailSelection.mainsail || sailSelection.mainsailName);
  const hasJib = Boolean(sailSelection.jib || sailSelection.jibName);
  const hasSpinnaker = Boolean(sailSelection.spinnaker || sailSelection.spinnakerName);
  const hasNotes = Boolean(sailSelection.notes?.trim());
  const hasWindRange = Boolean(sailSelection.windRangeContext?.trim());

  const hasSails = hasMainsail || hasJib || hasSpinnaker;

  if (!hasSails && !hasNotes) {
    return (
      <Text style={styles.emptyText}>No sail selection shared</Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Wind Range Context */}
      {hasWindRange && (
        <View style={styles.windRangeContainer}>
          <Wind size={14} color={IOS_COLORS.systemBlue} />
          <Text style={styles.windRangeText}>
            Optimized for: {sailSelection.windRangeContext}
          </Text>
        </View>
      )}

      {/* Sail Cards */}
      {hasSails && (
        <View style={styles.sailsGrid}>
          {hasMainsail && (
            <SailCard
              label="Mainsail"
              name={sailSelection.mainsailName || 'Selected'}
              color={IOS_COLORS.systemBlue}
            />
          )}
          {hasJib && (
            <SailCard
              label="Jib/Genoa"
              name={sailSelection.jibName || 'Selected'}
              color={IOS_COLORS.systemGreen}
            />
          )}
          {hasSpinnaker && (
            <SailCard
              label="Spinnaker"
              name={sailSelection.spinnakerName || 'Selected'}
              color={IOS_COLORS.systemOrange}
            />
          )}
        </View>
      )}

      {/* Selection Notes */}
      {hasNotes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{sailSelection.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  windRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${IOS_COLORS.systemBlue}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  windRangeText: {
    fontSize: 14,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  sailsGrid: {
    gap: 10,
  },
  sailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: IOS_COLORS.systemGray6,
    padding: 12,
    borderRadius: 10,
  },
  sailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sailInfo: {
    flex: 1,
  },
  sailLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 2,
  },
  sailName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  notesSection: {
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 10,
    padding: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
});

export default ReadOnlySailSelection;
