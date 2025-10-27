/**
 * Protest Filing Modal
 * Interface for filing and managing protests during races
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';

interface RaceEntry {
  id: string;
  sail_number: string;
  entry_number: string;
  entry_class: string;
}

interface ProtestModalProps {
  visible: boolean;
  regattaId: string;
  raceNumber: number;
  entries: RaceEntry[];
  userId?: string;
  onClose: () => void;
  onSubmit?: () => void;
}

const PROTEST_TYPES = [
  { value: 'boat_to_boat', label: 'Boat to Boat', description: 'Incident between two boats' },
  { value: 'boat_to_rc', label: 'Boat to RC', description: 'Boat protests race committee' },
  { value: 'rc_to_boat', label: 'RC to Boat', description: 'Race committee protests a boat' },
  { value: 'redress', label: 'Request for Redress', description: 'Request for redress due to external factors' },
  { value: 'measurement', label: 'Measurement', description: 'Equipment or measurement protest' },
];

const COMMON_RULES = [
  'Rule 10 - On Opposite Tacks',
  'Rule 11 - On the Same Tack, Overlapped',
  'Rule 12 - On the Same Tack, Not Overlapped',
  'Rule 13 - While Tacking',
  'Rule 14 - Avoiding Contact',
  'Rule 15 - Acquiring Right of Way',
  'Rule 16 - Changing Course',
  'Rule 17 - On the Same Tack; Proper Course',
  'Rule 18 - Mark-Room',
  'Rule 19 - Room to Pass an Obstruction',
  'Rule 20 - Room to Tack at an Obstruction',
  'Rule 30.1 - I Flag Rule',
  'Rule 30.2 - Z Flag Rule',
  'Rule 30.3 - U Flag Rule',
  'Rule 30.4 - Black Flag Rule',
];

export default function ProtestModal({
  visible,
  regattaId,
  raceNumber,
  entries,
  userId,
  onClose,
  onSubmit,
}: ProtestModalProps) {
  const [protestType, setProtestType] = useState('boat_to_boat');
  const [protestorEntryId, setProtestorEntryId] = useState('');
  const [protesteeEntryId, setProtesteeEntryId] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [description, setDescription] = useState('');
  const [rulesCited, setRulesCited] = useState<string[]>([]);
  const [witnesses, setWitnesses] = useState('');
  const [hailGiven, setHailGiven] = useState(false);
  const [redFlagDisplayed, setRedFlagDisplayed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!protestType) {
      Alert.alert('Error', 'Please select a protest type');
      return;
    }

    if (protestType === 'boat_to_boat' && (!protestorEntryId || !protesteeEntryId)) {
      Alert.alert('Error', 'Please select both protestor and protestee');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the incident');
      return;
    }

    setSubmitting(true);

    try {
      const protestData = {
        regatta_id: regattaId,
        race_number: raceNumber,
        protest_type: protestType,
        protestor_entry_id: protestorEntryId || null,
        protestee_entry_id: protesteeEntryId || null,
        incident_time: incidentTime ? new Date(incidentTime).toISOString() : null,
        incident_location: incidentLocation.trim() || null,
        description: description.trim(),
        rules_cited: rulesCited.length > 0 ? rulesCited : null,
        witnesses: witnesses ? witnesses.split(',').map(w => w.trim()) : null,
        hail_given: hailGiven,
        red_flag_displayed: redFlagDisplayed,
        filed_by: userId,
        status: 'filed',
      };

      const { error } = await supabase.from('race_protests').insert(protestData);

      if (error) throw error;

      Alert.alert('Success', 'Protest filed successfully');
      resetForm();
      onSubmit?.();
      onClose();
    } catch (error) {
      console.error('Error filing protest:', error);
      Alert.alert('Error', 'Could not file protest. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setProtestType('boat_to_boat');
    setProtestorEntryId('');
    setProtesteeEntryId('');
    setIncidentTime('');
    setIncidentLocation('');
    setDescription('');
    setRulesCited([]);
    setWitnesses('');
    setHailGiven(false);
    setRedFlagDisplayed(false);
  };

  const toggleRule = (rule: string) => {
    setRulesCited(prev =>
      prev.includes(rule)
        ? prev.filter(r => r !== rule)
        : [...prev, rule]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>File Protest</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* Protest Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Protest Type</Text>
            {PROTEST_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.optionCard,
                  protestType === type.value && styles.selectedOptionCard,
                ]}
                onPress={() => setProtestType(type.value)}
              >
                <View style={styles.optionHeader}>
                  <View style={[
                    styles.radio,
                    protestType === type.value && styles.radioSelected,
                  ]} />
                  <Text style={styles.optionLabel}>{type.label}</Text>
                </View>
                <Text style={styles.optionDescription}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Parties (for boat-to-boat protests) */}
          {(protestType === 'boat_to_boat' || protestType === 'boat_to_rc') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Protestor</Text>
              <View style={styles.pickerContainer}>
                {entries.map(entry => (
                  <TouchableOpacity
                    key={entry.id}
                    style={[
                      styles.entryOption,
                      protestorEntryId === entry.id && styles.selectedEntry,
                    ]}
                    onPress={() => setProtestorEntryId(entry.id)}
                  >
                    <Text style={styles.sailNumber}>{entry.sail_number}</Text>
                    <Text style={styles.entryNumber}>#{entry.entry_number}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {(protestType === 'boat_to_boat' || protestType === 'rc_to_boat') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Protestee</Text>
              <View style={styles.pickerContainer}>
                {entries.map(entry => (
                  <TouchableOpacity
                    key={entry.id}
                    style={[
                      styles.entryOption,
                      protesteeEntryId === entry.id && styles.selectedEntry,
                    ]}
                    onPress={() => setProtesteeEntryId(entry.id)}
                  >
                    <Text style={styles.sailNumber}>{entry.sail_number}</Text>
                    <Text style={styles.entryNumber}>#{entry.entry_number}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Incident Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incident Location</Text>
            <TextInput
              style={styles.input}
              value={incidentLocation}
              onChangeText={setIncidentLocation}
              placeholder="e.g., Mark 2 rounding, Start line"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what happened in detail..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Rules Cited */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rules Cited (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rulesScroll}>
              {COMMON_RULES.map(rule => (
                <TouchableOpacity
                  key={rule}
                  style={[
                    styles.ruleChip,
                    rulesCited.includes(rule) && styles.ruleChipSelected,
                  ]}
                  onPress={() => toggleRule(rule)}
                >
                  <Text style={[
                    styles.ruleChipText,
                    rulesCited.includes(rule) && styles.ruleChipTextSelected,
                  ]}>
                    {rule}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Witnesses */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Witnesses (Optional)</Text>
            <TextInput
              style={styles.input}
              value={witnesses}
              onChangeText={setWitnesses}
              placeholder="Comma-separated names"
              placeholderTextColor="#999"
            />
          </View>

          {/* Procedural Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Procedural Requirements</Text>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setHailGiven(!hailGiven)}
            >
              <View style={[styles.checkbox, hailGiven && styles.checkboxChecked]}>
                {hailGiven && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Hail was given at the time of incident</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRedFlagDisplayed(!redFlagDisplayed)}
            >
              <View style={[styles.checkbox, redFlagDisplayed && styles.checkboxChecked]}>
                {redFlagDisplayed && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Red protest flag was displayed at first opportunity</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'File Protest'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  optionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedOptionCard: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 10,
  },
  radioSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 30,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  entryOption: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedEntry: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  sailNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryNumber: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  rulesScroll: {
    marginTop: 5,
  },
  ruleChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ruleChipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  ruleChipText: {
    fontSize: 13,
    color: '#666',
  },
  ruleChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
