/**
 * Edit Race Screen - Reuses add race form logic with pre-filled data
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ActivityIndicator,
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

export default function EditRaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [raceName, setRaceName] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock classes - should come from user's boats
  const classes = ['Dragon', 'Laser', 'J/70', 'Optimist', '420'];

  useEffect(() => {
    loadRaceData();
  }, [id]);

  const loadRaceData = async () => {
    try {
      setLoading(true);

      // Fetch race details from Supabase
      const { data: regattaData, error } = await supabase
        .from('regattas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading race:', error);
        if (Platform.OS === 'web') {
          alert('Failed to load race data');
        } else {
          Alert.alert('Error', 'Failed to load race data');
        }
        router.back();
        return;
      }

      if (!regattaData) {
        if (Platform.OS === 'web') {
          alert('Race not found');
        } else {
          Alert.alert('Error', 'Race not found');
        }
        router.back();
        return;
      }

      // Populate form fields
      setRaceName(regattaData.name || '');
      setVenue(regattaData.metadata?.venue_name || '');
      setSelectedClass(regattaData.metadata?.class || '');

      // Format dates from ISO to MM/DD/YYYY
      const formatDate = (isoDate: string): string => {
        if (!isoDate) return '';
        try {
          const date = new Date(isoDate);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        } catch {
          return '';
        }
      };

      if (regattaData.start_date) {
        setStartDate(formatDate(regattaData.start_date));
      }
      if (regattaData.end_date) {
        setEndDate(formatDate(regattaData.end_date));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading race:', error);
      if (Platform.OS === 'web') {
        alert('An unexpected error occurred');
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
      router.back();
    }
  };

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

      // Parse dates from MM/DD/YYYY to ISO format
      const parseDate = (dateStr: string): string | null => {
        if (!dateStr.trim()) return null;
        try {
          const [month, day, year] = dateStr.split('/');
          return new Date(`${year}-${month}-${day}`).toISOString();
        } catch {
          return null;
        }
      };

      const parsedStartDate = parseDate(startDate);
      if (!parsedStartDate) {
        Alert.alert('Invalid Date', 'Please enter start date in MM/DD/YYYY format');
        setSaving(false);
        return;
      }

      const parsedEndDate = endDate.trim() ? parseDate(endDate) : null;
      if (endDate.trim() && !parsedEndDate) {
        Alert.alert('Invalid Date', 'Please enter end date in MM/DD/YYYY format');
        setSaving(false);
        return;
      }

      // Update in Supabase
      const { error } = await supabase
        .from('regattas')
        .update({
          name: raceName.trim(),
          start_date: parsedStartDate,
          end_date: parsedEndDate,
          metadata: {
            class: selectedClass,
            venue_name: venue.trim(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        setSaving(false);

        // Provide user-friendly error messages
        if (error.code === '23505') {
          Alert.alert('Duplicate Race', 'A race with this name already exists.');
        } else if (error.code === '23503') {
          Alert.alert('Invalid Data', 'Please check that all fields are valid.');
        } else if (error.message.includes('permission')) {
          Alert.alert('Permission Denied', 'You do not have permission to update this race.');
        } else {
          Alert.alert('Error', `Failed to update race: ${error.message}`);
        }
        return;
      }

      setSaving(false);

      // Success - navigate back to race detail
      if (Platform.OS === 'web') {
        alert('Race updated successfully');
        router.back();
      } else {
        Alert.alert(
          'Success',
          'Race updated successfully',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error updating race:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading race details...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Edit Race</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
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
});
