/**
 * Add Boat Screen - Create new boat
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { sailorBoatService, type CreateBoatInput } from '@/src/services/SailorBoatService';
import { supabase } from '@/src/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

interface BoatClass {
  id: string;
  name: string;
  class_association?: string;
  type?: string;
}

export default function AddBoatScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [boatClasses, setBoatClasses] = useState<BoatClass[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [sailNumber, setSailNumber] = useState('');
  const [hullNumber, setHullNumber] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [manufacturer, setManufacturer] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [hullMaterial, setHullMaterial] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [ownershipType, setOwnershipType] = useState<'owned' | 'co_owned' | 'chartered' | 'club_boat' | 'crew'>('owned');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);

  useEffect(() => {
    loadBoatClasses();
  }, []);

  const loadBoatClasses = async () => {
    try {
      setLoadingClasses(true);
      const { data, error } = await supabase
        .from('boat_classes')
        .select('*')
        .order('name');

      if (error) throw error;
      setBoatClasses(data || []);
    } catch (error) {
      console.error('Error loading boat classes:', error);
      Alert.alert('Error', 'Failed to load boat classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    console.log('🚀 [AddBoat] Save button pressed');
    console.log('👤 [AddBoat] Current user:', user?.id);

    if (!user) {
      console.error('❌ [AddBoat] No user found');
      if (Platform.OS === 'web') {
        window.alert('Not authenticated. Please sign in.');
      } else {
        Alert.alert('Error', 'Not authenticated. Please sign in.');
      }
      return;
    }

    // Validation
    if (!name.trim()) {
      console.warn('⚠️ [AddBoat] Boat name is required');
      if (Platform.OS === 'web') {
        window.alert('Please enter a boat name');
      } else {
        Alert.alert('Required Field', 'Please enter a boat name');
      }
      return;
    }

    if (!selectedClassId) {
      console.warn('⚠️ [AddBoat] Boat class is required');
      if (Platform.OS === 'web') {
        window.alert('Please select a boat class');
      } else {
        Alert.alert('Required Field', 'Please select a boat class');
      }
      return;
    }

    try {
      setLoading(true);
      console.log('📝 [AddBoat] Creating boat with data:', {
        name: name.trim(),
        class_id: selectedClassId,
        sail_number: sailNumber.trim() || undefined,
      });

      const boatInput: CreateBoatInput = {
        sailor_id: user.id,
        class_id: selectedClassId,
        name: name.trim(),
        sail_number: sailNumber.trim() || undefined,
        hull_number: hullNumber.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        year_built: yearBuilt ? parseInt(yearBuilt) : undefined,
        hull_material: hullMaterial.trim() || undefined,
        is_primary: isPrimary,
        ownership_type: ownershipType,
        notes: notes.trim() || undefined,
      };

      console.log('🔄 [AddBoat] Calling sailorBoatService.createBoat...');

      // Add timeout to detect hanging requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000)
      );

      const boat = await Promise.race([
        sailorBoatService.createBoat(boatInput),
        timeoutPromise
      ]) as any;

      console.log('✅ [AddBoat] Boat created successfully:', boat.id);

      // TODO: Upload photo to Supabase storage if photoUri exists
      // For now, we'll skip photo upload as it requires storage bucket setup

      if (Platform.OS === 'web') {
        window.alert('Boat added successfully!');
        router.push(`/boat/${boat.id}`);
      } else {
        Alert.alert('Success', 'Boat added successfully', [
          {
            text: 'OK',
            onPress: () => router.push(`/boat/${boat.id}`),
          },
        ]);
      }
    } catch (error) {
      console.error('❌ [AddBoat] Error saving boat:', error);
      console.error('❌ [AddBoat] Error type:', typeof error);
      console.error('❌ [AddBoat] Error constructor:', error?.constructor?.name);
      console.error('❌ [AddBoat] Error keys:', error ? Object.keys(error) : 'null');

      // Try to extract Supabase error details
      const supabaseError = error as any;
      if (supabaseError?.message) {
        console.error('❌ [AddBoat] Supabase error message:', supabaseError.message);
      }
      if (supabaseError?.details) {
        console.error('❌ [AddBoat] Supabase error details:', supabaseError.details);
      }
      if (supabaseError?.hint) {
        console.error('❌ [AddBoat] Supabase error hint:', supabaseError.hint);
      }
      if (supabaseError?.code) {
        console.error('❌ [AddBoat] Supabase error code:', supabaseError.code);
      }

      console.error('❌ [AddBoat] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      const errorMessage = error instanceof Error ? error.message :
                          supabaseError?.message ||
                          'Unknown error';

      if (Platform.OS === 'web') {
        window.alert(`Failed to save boat: ${errorMessage}`);
      } else {
        Alert.alert('Error', `Failed to save boat: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const selectedClass = boatClasses.find(bc => bc.id === selectedClassId);

  if (loadingClasses) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading boat classes...</Text>
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
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Boat</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerButton}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photo Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Boat Photo</Text>
            <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={32} color="#94A3B8" />
                  <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Boat Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Dragonfly"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Boat Class *</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowClassPicker(!showClassPicker)}
              >
                <Text style={selectedClass ? styles.pickerText : styles.pickerPlaceholder}>
                  {selectedClass ? selectedClass.name : 'Select boat class'}
                </Text>
                <Ionicons
                  name={showClassPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showClassPicker && (
                <View style={styles.pickerOptions}>
                  <ScrollView style={styles.pickerScroll}>
                    {boatClasses.map((boatClass) => (
                      <TouchableOpacity
                        key={boatClass.id}
                        style={styles.pickerOption}
                        onPress={() => {
                          setSelectedClassId(boatClass.id);
                          setShowClassPicker(false);
                        }}
                      >
                        <Text style={styles.pickerOptionText}>{boatClass.name}</Text>
                        {boatClass.class_association && (
                          <Text style={styles.pickerOptionSubtext}>
                            {boatClass.class_association}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sail Number</Text>
              <TextInput
                style={styles.input}
                value={sailNumber}
                onChangeText={setSailNumber}
                placeholder="e.g., USA 123"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hull Number</Text>
              <TextInput
                style={styles.input}
                value={hullNumber}
                onChangeText={setHullNumber}
                placeholder="e.g., ABC12345"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Boat Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Boat Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Manufacturer</Text>
              <TextInput
                style={styles.input}
                value={manufacturer}
                onChangeText={setManufacturer}
                placeholder="e.g., North Sails"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Year Built</Text>
              <TextInput
                style={styles.input}
                value={yearBuilt}
                onChangeText={setYearBuilt}
                placeholder="e.g., 2020"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hull Material</Text>
              <TextInput
                style={styles.input}
                value={hullMaterial}
                onChangeText={setHullMaterial}
                placeholder="e.g., Carbon fiber"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Ownership */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ownership</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ownership Type</Text>
              <View style={styles.radioGroup}>
                {(['owned', 'co_owned', 'chartered', 'club_boat', 'crew'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() => setOwnershipType(type)}
                  >
                    <View style={styles.radio}>
                      {ownershipType === type && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsPrimary(!isPrimary)}
            >
              <View style={styles.checkbox}>
                {isPrimary && <Ionicons name="checkmark" size={18} color="#3B82F6" />}
              </View>
              <Text style={styles.checkboxLabel}>Set as primary boat for this class</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes about this boat..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.bottomSpacer} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  photoContainer: {
    alignSelf: 'center',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  pickerText: {
    fontSize: 16,
    color: '#1E293B',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#94A3B8',
  },
  pickerOptions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1E293B',
  },
  pickerOptionSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 16,
    color: '#1E293B',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  bottomSpacer: {
    height: 32,
  },
});
