/**
 * Quick Log Button Component
 * Floating action button for quick log entries from race console
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Plus,
  X,
  Flag,
  Wind,
  AlertTriangle,
  Megaphone,
  MapPin,
  FileText,
  Timer,
} from 'lucide-react-native';
import { committeeLogService, LogCategory } from '@/services/CommitteeLogService';

interface QuickLogButtonProps {
  regattaId: string;
  raceNumber?: number;
  onLogCreated?: () => void;
}

interface QuickAction {
  id: string;
  icon: any;
  label: string;
  color: string;
  category: LogCategory;
  eventType: string;
  title: string;
  requiresDescription: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'general_recall',
    icon: Flag,
    label: 'General Recall',
    color: '#F59E0B',
    category: 'signal',
    eventType: 'general_recall',
    title: 'General Recall',
    requiresDescription: false,
  },
  {
    id: 'individual_recall',
    icon: Flag,
    label: 'Individual Recall',
    color: '#EF4444',
    category: 'signal',
    eventType: 'individual_recall',
    title: 'Individual Recall',
    requiresDescription: true,
  },
  {
    id: 'postponement',
    icon: Timer,
    label: 'Postponement',
    color: '#6B7280',
    category: 'signal',
    eventType: 'postponement',
    title: 'Race Postponed',
    requiresDescription: false,
  },
  {
    id: 'course_change',
    icon: MapPin,
    label: 'Course Change',
    color: '#3B82F6',
    category: 'course',
    eventType: 'course_change',
    title: 'Course Changed',
    requiresDescription: true,
  },
  {
    id: 'shortened',
    icon: MapPin,
    label: 'Shortened',
    color: '#8B5CF6',
    category: 'course',
    eventType: 'shortened',
    title: 'Course Shortened',
    requiresDescription: false,
  },
  {
    id: 'weather',
    icon: Wind,
    label: 'Weather',
    color: '#0EA5E9',
    category: 'weather',
    eventType: 'conditions',
    title: 'Weather Update',
    requiresDescription: true,
  },
  {
    id: 'incident',
    icon: AlertTriangle,
    label: 'Incident',
    color: '#DC2626',
    category: 'incident',
    eventType: 'on_water_incident',
    title: 'Incident Reported',
    requiresDescription: true,
  },
  {
    id: 'announcement',
    icon: Megaphone,
    label: 'Announcement',
    color: '#7C3AED',
    category: 'announcement',
    eventType: 'public_announcement',
    title: 'Announcement',
    requiresDescription: true,
  },
];

export function QuickLogButton({ regattaId, raceNumber, onLogCreated }: QuickLogButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleActionSelect = async (action: QuickAction) => {
    if (action.requiresDescription) {
      setSelectedAction(action);
      setShowDescriptionModal(true);
      setIsOpen(false);
    } else {
      await createLogEntry(action);
    }
  };

  const createLogEntry = async (action: QuickAction, desc?: string) => {
    setSubmitting(true);
    try {
      const flagsConfig: Record<string, { flags: string[]; signals: number }> = {
        general_recall: { flags: ['First Substitute'], signals: 2 },
        individual_recall: { flags: ['X'], signals: 1 },
        postponement: { flags: ['AP'], signals: 2 },
        course_change: { flags: ['C'], signals: 1 },
        shortened: { flags: ['S'], signals: 2 },
      };

      const flags = flagsConfig[action.eventType] || { flags: [], signals: 0 };

      await committeeLogService.createEntry({
        regatta_id: regattaId,
        race_number: raceNumber,
        category: action.category,
        event_type: action.eventType,
        title: action.title,
        description: desc,
        flags_displayed: flags.flags,
        sound_signals: flags.signals,
      });

      setIsOpen(false);
      setShowDescriptionModal(false);
      setDescription('');
      setSelectedAction(null);
      onLogCreated?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to create log entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDescription = () => {
    if (selectedAction && description.trim()) {
      createLogEntry(selectedAction, description);
    } else {
      Alert.alert('Required', 'Please enter a description');
    }
  };

  return (
    <>
      {/* Main FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <FileText size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Quick Actions Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.actionsContainer}>
            <View style={styles.actionsHeader}>
              <Text style={styles.actionsTitle}>Quick Log</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.actionsGrid}>
              <View style={styles.gridRow}>
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.actionButton}
                      onPress={() => handleActionSelect(action)}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                        <Icon size={24} color={action.color} />
                      </View>
                      <Text style={styles.actionLabel}>{action.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {raceNumber && (
              <Text style={styles.raceHint}>Race {raceNumber}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Description Input Modal */}
      <Modal
        visible={showDescriptionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.descriptionOverlay}>
          <View style={styles.descriptionContainer}>
            <View style={styles.descriptionHeader}>
              <Text style={styles.descriptionTitle}>
                {selectedAction?.title || 'Add Details'}
              </Text>
              <TouchableOpacity onPress={() => setShowDescriptionModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.descriptionInput}
              placeholder="Enter details..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitDescription}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Saving...' : 'Log Entry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  actionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  actionsGrid: {
    maxHeight: 300,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
  },
  raceHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
  },
  descriptionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  descriptionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  descriptionInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 120,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default QuickLogButton;

