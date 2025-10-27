/**
 * Course Setup Prompt Component
 * Post-extraction guidance: Helps users add course marks after AI extraction
 * Phase 2 of RHKYC Implementation Roadmap
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MapPin, Layout, Calendar, X } from 'lucide-react-native';

interface ExtractedMark {
  name: string;
  type: string;
}

interface CourseSetupPromptProps {
  visible: boolean;
  raceName: string;
  raceId: string;
  racingAreaName?: string; // From AI extraction (e.g., "Port Shelter")
  extractedMarks?: ExtractedMark[]; // From AI extraction
  venueId?: string;
  onQuickDraw: () => void;
  onLoadTemplate: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function CourseSetupPrompt({
  visible,
  raceName,
  raceId,
  racingAreaName,
  extractedMarks = [],
  venueId,
  onQuickDraw,
  onLoadTemplate,
  onSkip,
  onClose,
}: CourseSetupPromptProps) {
  const hasMarks = extractedMarks.length > 0;
  const hasRacingArea = !!racingAreaName;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onSkip}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Course Marks</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Race Info */}
            <View style={styles.raceInfo}>
              <Text style={styles.raceName}>{raceName}</Text>
              {hasRacingArea && (
                <View style={styles.racingAreaBadge}>
                  <MapPin size={14} color="#0284c7" />
                  <Text style={styles.racingAreaText}>
                    Racing Area: {racingAreaName}
                  </Text>
                </View>
              )}
            </View>

            {/* AI Extraction Summary */}
            {hasMarks && (
              <View style={styles.extractionSummary}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryIcon}>✓</Text>
                  <Text style={styles.summaryText}>
                    AI found {extractedMarks.length} mark{extractedMarks.length !== 1 ? 's' : ''}:{' '}
                    {extractedMarks.map(m => m.name).join(', ')}
                  </Text>
                </View>
                <Text style={styles.summaryNote}>
                  GPS coordinates not available - needs manual placement
                </Text>
              </View>
            )}

            {/* Option 1: Quick Draw Mode */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={onQuickDraw}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <View style={styles.iconCircle}>
                  <Layout size={24} color="#0284c7" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>🎨 Quick Draw Mode</Text>
                  <Text style={styles.optionDescription}>
                    Tap the map to place marks
                  </Text>
                  <Text style={styles.optionTime}>~2 minutes</Text>
                </View>
              </View>
              {hasRacingArea && (
                <View style={styles.intelligenceBadge}>
                  <Text style={styles.intelligenceText}>
                    ✨ Map will auto-center on {racingAreaName}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Option 2: Load Template */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={onLoadTemplate}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <View style={styles.iconCircle}>
                  <Calendar size={24} color="#0284c7" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>
                    📋 Load Venue Template
                  </Text>
                  <Text style={styles.optionDescription}>
                    Windward/Leeward, Olympic, Triangle courses
                  </Text>
                  <Text style={styles.optionTime}>~30 seconds</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Skip Option */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
            >
              <Text style={styles.skipText}>Skip for Now</Text>
              <Text style={styles.skipSubtext}>You can add marks later from the Strategy tab</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  raceInfo: {
    marginBottom: 20,
  },
  raceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  racingAreaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  racingAreaText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0284c7',
  },
  extractionSummary: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  summaryIcon: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
    flex: 1,
  },
  summaryNote: {
    fontSize: 12,
    color: '#16a34a',
    marginLeft: 26,
    fontStyle: 'italic',
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDisabled: {
    backgroundColor: '#f1f5f9',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  optionTitleDisabled: {
    color: '#64748b',
  },
  optionDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  optionDescriptionDisabled: {
    color: '#94a3b8',
  },
  optionTime: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '500',
  },
  comingSoonBadge: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  intelligenceBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  intelligenceText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  skipSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
