/**
 * Add Race Timeline Card
 *
 * CTA card for adding new races, displayed in the race carousel.
 * Supports multiple form factors: full, simple, and compact.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Plus, Calendar, X } from 'lucide-react-native';

export interface AddRaceTimelineCardProps {
  /** Callback when add race is pressed */
  onAddRace: () => void;
  /** Callback when import calendar is pressed */
  onImportCalendar: () => void;
  /** Whether the user has real races (affects messaging) */
  hasRealRaces: boolean;
  /** Callback to dismiss the card */
  onDismiss?: () => void;
  /** Use compact mode (just icon + text) */
  isCompact?: boolean;
  /** Custom card width */
  cardWidth?: number;
  /** Custom card height */
  cardHeight?: number;
}

/**
 * Add Race Timeline Card Component
 */
export function AddRaceTimelineCard({
  onAddRace,
  onImportCalendar,
  hasRealRaces,
  onDismiss,
  isCompact = false,
  cardWidth,
  cardHeight,
}: AddRaceTimelineCardProps) {
  const height = cardHeight ?? 180;

  // Compact mode: just show a simple add button card
  if (isCompact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactCard,
          cardWidth ? { width: cardWidth, height } : null,
        ]}
        onPress={onAddRace}
        accessibilityRole="button"
        accessibilityLabel="Add a new race"
        activeOpacity={0.85}
      >
        <Plus color="#047857" size={cardWidth ? 32 : 24} />
        <Text style={styles.compactText}>Add Race</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.cardSimple,
        cardWidth ? { width: cardWidth, height } : null,
      ]}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessibilityLabel="Dismiss this card"
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color="#94A3B8" size={16} />
        </TouchableOpacity>
      )}
      <View>
        <Text style={styles.titleSimple}>Add your next race</Text>
        <Text style={styles.copySimple}>
          Import race docs or draw your racing area
        </Text>
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.primaryButtonSimple}
          onPress={onAddRace}
          accessibilityRole="button"
          accessibilityLabel="Add a new race"
          activeOpacity={0.9}
        >
          <Plus color="#FFFFFF" size={16} />
          <Text style={styles.primaryButtonTextSimple}>Add race</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButtonSimple}
          onPress={onImportCalendar}
          accessibilityRole="button"
          accessibilityLabel="Import race calendar"
          activeOpacity={0.85}
        >
          <Calendar color="#047857" size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardSimple: {
    width: 160,
    height: 180,
    backgroundColor: '#F8FFFB',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  titleSimple: {
    fontSize: 15,
    fontWeight: '700',
    color: '#042F2E',
    marginBottom: 4,
    paddingRight: 20,
  },
  copySimple: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonSimple: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 4,
  },
  primaryButtonTextSimple: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButtonSimple: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#FFFFFF',
  },
  compactCard: {
    width: 100,
    height: 100,
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
});

export default AddRaceTimelineCard;
