/**
 * FlagQuickReference
 * Shows flag meanings when viewing start schedules
 * Integrates learning content from the Learn section
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Flag definitions from learning content
const FLAG_DEFINITIONS: Record<string, { color: string; name: string; description: string }> = {
  // International Code flags commonly used in sailing
  A: { color: '#0066CC', name: 'Alpha', description: 'Diver down; keep clear' },
  B: { color: '#CC0000', name: 'Bravo', description: 'Dangerous cargo' },
  C: { color: '#0066CC', name: 'Charlie', description: 'Yes/Affirmative' },
  D: { color: '#FFCC00', name: 'Delta', description: 'Keep clear, maneuvering with difficulty' },
  E: { color: '#0066CC', name: 'Echo', description: 'Altering course to starboard' },
  F: { color: '#CC0000', name: 'Foxtrot', description: 'Disabled, communicate with me' },
  G: { color: '#FFCC00', name: 'Golf', description: 'I require a pilot' },
  H: { color: '#CC0000', name: 'Hotel', description: 'Pilot on board' },
  I: { color: '#FFCC00', name: 'India (I Flag)', description: 'Round-the-Ends Rule: If OCS in last minute, must sail around an end to restart' },
  J: { color: '#0066CC', name: 'Juliet', description: 'On fire, keep clear' },
  K: { color: '#FFCC00', name: 'Kilo', description: 'I wish to communicate' },
  L: { color: '#000000', name: 'Lima', description: 'Stop your vessel instantly' },
  M: { color: '#0066CC', name: 'Mike', description: 'My vessel is stopped' },
  N: { color: '#0066CC', name: 'November', description: 'No/Negative' },
  O: { color: '#CC0000', name: 'Oscar', description: 'Man overboard' },
  P: { color: '#0066CC', name: 'Papa (P Flag)', description: 'Preparatory Signal: Standard prep flag, return behind line if OCS' },
  Q: { color: '#FFCC00', name: 'Quebec', description: 'Request pratique' },
  R: { color: '#CC0000', name: 'Romeo', description: 'No meaning in racing' },
  S: { color: '#0066CC', name: 'Sierra', description: 'Shortened Course' },
  T: { color: '#CC0000', name: 'Tango', description: 'Keep clear, engaged in trawling' },
  U: { color: '#CC0000', name: 'Uniform (U Flag)', description: 'Black flag rule with general recall protection' },
  V: { color: '#0066CC', name: 'Victor', description: 'Require assistance' },
  W: { color: '#0066CC', name: 'Whiskey', description: 'Require medical assistance' },
  X: { color: '#FFFFFF', name: 'X-Ray', description: 'Individual Recall: One or more boats OCS' },
  Y: { color: '#FFCC00', name: 'Yankee', description: 'I am dragging anchor' },
  Z: { color: '#FF3366', name: 'Zulu (Z Flag)', description: '20% Penalty Rule: OCS in last minute = 20% scoring penalty' },
  // Numeric pennants
  '0': { color: '#FFCC00', name: 'Numeral 0', description: 'Numeral pennant zero' },
  '1': { color: '#FFFFFF', name: 'Numeral 1', description: 'Numeral pennant one' },
  '2': { color: '#0066CC', name: 'Numeral 2', description: 'Numeral pennant two' },
  '3': { color: '#CC0000', name: 'Numeral 3', description: 'Numeral pennant three' },
  '4': { color: '#FFFFFF', name: 'Numeral 4', description: 'Numeral pennant four' },
  '5': { color: '#FFCC00', name: 'Numeral 5', description: 'Numeral pennant five' },
  '6': { color: '#000000', name: 'Numeral 6', description: 'Numeral pennant six (Naval 6)' },
  '7': { color: '#FFCC00', name: 'Numeral 7', description: 'Numeral pennant seven' },
  '8': { color: '#CC0000', name: 'Numeral 8', description: 'Numeral pennant eight' },
  '9': { color: '#FFCC00', name: 'Numeral 9', description: 'Numeral pennant nine' },
  // Special racing flags
  BLACK: { color: '#000000', name: 'Black Flag', description: 'Disqualification Rule: OCS in last minute = immediate DSQ' },
  ORANGE: { color: '#FF6B00', name: 'Orange Flag', description: 'Race Committee boat is on station' },
};

// Common racing flags to highlight
const RACING_FLAGS = ['P', 'I', 'Z', 'U', 'X', 'S', 'BLACK'];

interface FlagQuickReferenceProps {
  /** Current flag being displayed (to highlight in reference) */
  highlightFlag?: string;
  /** Compact mode shows just an info button */
  compact?: boolean;
}

export function FlagQuickReference({ highlightFlag, compact = true }: FlagQuickReferenceProps) {
  const [showModal, setShowModal] = useState(false);

  if (compact) {
    return (
      <>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={styles.infoButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="help-circle-outline" size={18} color="#6b7280" />
          <Text style={styles.infoButtonText}>Flag Guide</Text>
        </TouchableOpacity>

        <Modal
          visible={showModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🏁 Racing Flag Reference</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.flagList}>
                {/* Racing flags section */}
                <Text style={styles.sectionTitle}>Common Racing Flags</Text>
                {RACING_FLAGS.map((flagId) => {
                  const flag = FLAG_DEFINITIONS[flagId];
                  if (!flag) return null;
                  const isHighlighted = highlightFlag?.toUpperCase() === flagId;
                  return (
                    <View
                      key={flagId}
                      style={[styles.flagRow, isHighlighted && styles.flagRowHighlighted]}
                    >
                      <View style={[styles.flagSwatch, { backgroundColor: flag.color }]}>
                        <Text style={styles.flagLetter}>{flagId === 'BLACK' ? 'B' : flagId}</Text>
                      </View>
                      <View style={styles.flagInfo}>
                        <Text style={styles.flagName}>{flag.name}</Text>
                        <Text style={styles.flagDescription}>{flag.description}</Text>
                      </View>
                    </View>
                  );
                })}

                {/* Class flags info */}
                <Text style={styles.sectionTitle}>Class Flags</Text>
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color="#3b82f6" />
                  <Text style={styles.infoText}>
                    Class flags are assigned by the race committee. Common examples:{'\n'}
                    • D = Dragon{'\n'}
                    • J = J/80{'\n'}
                    • G = Etchells{'\n'}
                    The flag letter in your start schedule indicates your class.
                  </Text>
                </View>

                {/* Starting sequence reminder */}
                <Text style={styles.sectionTitle}>Standard Start Sequence</Text>
                <View style={styles.sequenceBox}>
                  <View style={styles.sequenceRow}>
                    <Text style={styles.sequenceTime}>5 min</Text>
                    <Text style={styles.sequenceDesc}>Warning: Class flag UP + 1 sound</Text>
                  </View>
                  <View style={styles.sequenceRow}>
                    <Text style={styles.sequenceTime}>4 min</Text>
                    <Text style={styles.sequenceDesc}>Preparatory: P/I/Z/Black UP + 1 sound</Text>
                  </View>
                  <View style={styles.sequenceRow}>
                    <Text style={styles.sequenceTime}>1 min</Text>
                    <Text style={styles.sequenceDesc}>One minute: P flag DOWN + 1 long sound</Text>
                  </View>
                  <View style={styles.sequenceRow}>
                    <Text style={styles.sequenceTime}>0</Text>
                    <Text style={styles.sequenceDesc}>Start: Class flag DOWN + 1 sound</Text>
                  </View>
                </View>

                {/* Link to full learning */}
                <TouchableOpacity style={styles.learnMoreButton}>
                  <Ionicons name="school-outline" size={20} color="#2563eb" />
                  <Text style={styles.learnMoreText}>Open Full Starting Sequence Lesson</Text>
                  <Ionicons name="chevron-forward" size={16} color="#2563eb" />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Non-compact mode - full inline reference
  return (
    <View style={styles.inlineReference}>
      <Text style={styles.inlineTitle}>Flag Reference</Text>
      {RACING_FLAGS.slice(0, 4).map((flagId) => {
        const flag = FLAG_DEFINITIONS[flagId];
        if (!flag) return null;
        return (
          <View key={flagId} style={styles.inlineFlagRow}>
            <View style={[styles.inlineFlagSwatch, { backgroundColor: flag.color }]}>
              <Text style={styles.inlineFlagLetter}>{flagId}</Text>
            </View>
            <Text style={styles.inlineFlagDesc} numberOfLines={1}>
              {flag.description}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Inline flag tooltip - shows meaning when tapping a flag letter
 */
export function FlagTooltip({ flag }: { flag: string }) {
  const flagDef = FLAG_DEFINITIONS[flag.toUpperCase()];
  if (!flagDef) return null;

  return (
    <View style={styles.tooltip}>
      <View style={[styles.tooltipSwatch, { backgroundColor: flagDef.color }]}>
        <Text style={styles.tooltipLetter}>{flag}</Text>
      </View>
      <View>
        <Text style={styles.tooltipName}>{flagDef.name}</Text>
        <Text style={styles.tooltipDesc}>{flagDef.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact button
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  infoButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...(Platform.OS === 'web' ? { boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  // Flag list
  flagList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  flagRowHighlighted: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  flagSwatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  flagLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  flagInfo: {
    flex: 1,
  },
  flagName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  flagDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },

  // Sequence box
  sequenceBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  sequenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sequenceTime: {
    width: 50,
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  sequenceDesc: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
  },

  // Learn more button
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 32,
    padding: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },

  // Inline reference
  inlineReference: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
  },
  inlineTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  inlineFlagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  inlineFlagSwatch: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineFlagLetter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  inlineFlagDesc: {
    flex: 1,
    fontSize: 12,
    color: '#4b5563',
  },

  // Tooltip
  tooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1f2937',
    padding: 10,
    borderRadius: 8,
  },
  tooltipSwatch: {
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  tooltipName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  tooltipDesc: {
    fontSize: 11,
    color: '#d1d5db',
    maxWidth: 200,
  },
});

export default FlagQuickReference;

