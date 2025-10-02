/**
 * Add Race Screen - Quick race entry form
 * Allows sailors to quickly add upcoming races to their calendar
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AddRaceScreen() {
  const { user } = useAuth();
  const [raceName, setRaceName] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [saving, setSaving] = useState(false);

  // Mock classes - should come from user's boats
  const classes = ['Dragon', 'Laser', 'J/70', 'Optimist', '420'];

  const handleSave = async () => {
    // Validation
    if (!raceName.trim()) {
      Alert.alert('Required', 'Please enter a race name');
      return;
    }
    if (!venue.trim()) {
      Alert.alert('Required', 'Please enter a venue');
      return;
    }
    if (!startDate.trim()) {
      Alert.alert('Required', 'Please enter a start date');
      return;
    }
    if (!selectedClass) {
      Alert.alert('Required', 'Please select a class');
      return;
    }

    try {
      setSaving(true);
      // TODO: Save to Supabase
      console.log('Saving race:', { raceName, venue, startDate, endDate, selectedClass });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Success',
        'Race added to your calendar',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving race:', error);
      Alert.alert('Error', 'Failed to save race. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Race</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Race Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Race Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={raceName}
              onChangeText={setRaceName}
              placeholder="e.g., Hong Kong Dragon Championship 2025"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Venue */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Venue <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithIcon}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#64748B" />
              <TextInput
                style={styles.inputText}
                value={venue}
                onChangeText={setVenue}
                placeholder="Search for venue..."
                placeholderTextColor="#94A3B8"
              />
            </View>
            <Text style={styles.hint}>
              Start typing to search our global venue database
            </Text>
          </View>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={styles.dateGroup}>
              <Text style={styles.label}>
                Start Date <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <MaterialCommunityIcons name="calendar" size={20} color="#64748B" />
                <TextInput
                  style={styles.inputText}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.label}>End Date</Text>
              <View style={styles.inputWithIcon}>
                <MaterialCommunityIcons name="calendar" size={20} color="#64748B" />
                <TextInput
                  style={styles.inputText}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* Class Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Class <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.classGrid}>
              {classes.map((className) => (
                <TouchableOpacity
                  key={className}
                  style={[
                    styles.classChip,
                    selectedClass === className && styles.classChipSelected,
                  ]}
                  onPress={() => setSelectedClass(className)}
                >
                  <MaterialCommunityIcons
                    name="sail-boat"
                    size={18}
                    color={selectedClass === className ? '#3B82F6' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.classChipText,
                      selectedClass === className && styles.classChipTextSelected,
                    ]}
                  >
                    {className}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>After Saving</Text>
            <View style={styles.quickActionCard}>
              <MaterialCommunityIcons name="upload" size={24} color="#3B82F6" />
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Upload Documents</Text>
                <Text style={styles.quickActionSubtitle}>
                  Sailing instructions, NOR, course diagrams
                </Text>
              </View>
            </View>
            <View style={styles.quickActionCard}>
              <MaterialCommunityIcons name="brain" size={24} color="#3B82F6" />
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Generate Strategy</Text>
                <Text style={styles.quickActionSubtitle}>
                  AI-powered race planning and tactics
                </Text>
              </View>
            </View>
            <View style={styles.quickActionCard}>
              <MaterialCommunityIcons name="account-group" size={24} color="#3B82F6" />
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Assign Crew</Text>
                <Text style={styles.quickActionSubtitle}>
                  Set crew positions and contacts
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateGroup: {
    flex: 1,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  classChipSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  classChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  classChipTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  quickActionsSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
});