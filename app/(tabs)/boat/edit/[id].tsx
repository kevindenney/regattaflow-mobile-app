/**
 * Edit Boat Screen - Update existing boat
 */

import { useAuth } from '@/providers/AuthProvider';
import {
  sailorBoatService,
  type SailorBoat,
  type UpdateBoatInput,
} from '@/services/SailorBoatService';
import { supabase } from '@/services/supabase';
import { DRAGON_HULL_MAKER_NAMES } from '@/constants/boatEquipment';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function EditBoatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [boatClasses, setBoatClasses] = useState<BoatClass[]>([]);
  const [boat, setBoat] = useState<SailorBoat | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [sailNumber, setSailNumber] = useState('');
  const [hullNumber, setHullNumber] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [manufacturer, setManufacturer] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [hullMaterial, setHullMaterial] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [status, setStatus] = useState<'active' | 'stored' | 'sold' | 'retired'>('active');
  const [ownershipType, setOwnershipType] = useState<'owned' | 'co_owned' | 'chartered' | 'club_boat' | 'crew'>('owned');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showManufacturerPicker, setShowManufacturerPicker] = useState(false);

  useEffect(() => {
    loadBoatClasses();
    loadBoatData();
  }, [id]);

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

  const loadBoatData = async () => {
    if (!id) return;

    try {
      setLoadingData(true);
      const boatData = await sailorBoatService.getBoat(id);

      if (!boatData) {
        Alert.alert('Error', 'Boat not found', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      setBoat(boatData);
      setName(boatData.name);
      setSailNumber(boatData.sail_number || '');
      setHullNumber(boatData.hull_number || '');
      setSelectedClassId(boatData.class_id);
      setManufacturer(boatData.manufacturer || '');
      setYearBuilt(boatData.year_built?.toString() || '');
      setHullMaterial(boatData.hull_material || '');
      setIsPrimary(boatData.is_primary);
      setStatus(boatData.status);
      setOwnershipType(boatData.ownership_type || 'owned');
      setNotes(boatData.notes || '');
      // TODO: Load photo from Supabase storage
    } catch (error) {
      console.error('Error loading boat:', error);
      Alert.alert('Error', 'Failed to load boat data');
    } finally {
      setLoadingData(false);
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
    if (!user || !id) return;

    // Validation
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a boat name');
      return;
    }

    if (!selectedClassId) {
      Alert.alert('Required Field', 'Please select a boat class');
      return;
    }

    try {
      setLoading(true);

      const updateInput: UpdateBoatInput = {
        name: name.trim(),
        sail_number: sailNumber.trim() || undefined,
        hull_number: hullNumber.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        year_built: yearBuilt ? parseInt(yearBuilt) : undefined,
        hull_material: hullMaterial.trim() || undefined,
        is_primary: isPrimary,
        status,
        ownership_type: ownershipType,
        notes: notes.trim() || undefined,
      };

      await sailorBoatService.updateBoat(id, updateInput);

      // TODO: Upload photo to Supabase storage if photoUri exists and changed
      // For now, we'll skip photo upload as it requires storage bucket setup

      Alert.alert('Success', 'Boat updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      if (error?.queuedForSync && error?.entity?.updates) {
        Alert.alert('Offline', 'Updates saved locally and will sync when you are back online.', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        console.error('Error updating boat:', error);
        Alert.alert('Error', 'Failed to update boat. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Boat',
      'Are you sure you want to delete this boat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!id) return;
              await sailorBoatService.deleteBoat(id);
              Alert.alert('Success', 'Boat deleted successfully', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/boat') },
              ]);
            } catch (error: any) {
              if (error?.queuedForSync) {
                Alert.alert('Offline', 'Boat deletion will complete once you are back online.', [
                  { text: 'OK', onPress: () => router.replace('/(tabs)/boat') },
                ]);
              } else {
                console.error('Error deleting boat:', error);
                Alert.alert('Error', 'Failed to delete boat');
              }
            }
          },
        },
      ]
    );
  };

  const selectedClass = boatClasses.find(bc => bc.id === selectedClassId);

  if (loadingData || loadingClasses) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading boat...</Text>
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
          <Text style={styles.headerTitle}>Edit Boat</Text>
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
              <View style={styles.disabledInput}>
                <Text style={styles.disabledText}>
                  {selectedClass?.name || 'Unknown Class'}
                </Text>
                <Ionicons name="lock-closed" size={16} color="#94A3B8" />
              </View>
              <Text style={styles.hint}>Boat class cannot be changed after creation</Text>
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
              <Text style={styles.label}>Hull Manufacturer</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowManufacturerPicker(!showManufacturerPicker)}
              >
                <Text style={manufacturer ? styles.pickerText : styles.pickerPlaceholder}>
                  {manufacturer || 'Select hull manufacturer'}
                </Text>
                <Ionicons
                  name={showManufacturerPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showManufacturerPicker && (
                <View style={styles.pickerOptions}>
                  <ScrollView style={styles.pickerScroll}>
                    {/* Option to clear selection */}
                    <TouchableOpacity
                      style={styles.pickerOption}
                      onPress={() => {
                        setManufacturer('');
                        setShowManufacturerPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, { color: '#94A3B8' }]}>
                        None / Other
                      </Text>
                    </TouchableOpacity>
                    {DRAGON_HULL_MAKER_NAMES.map((maker) => (
                      <TouchableOpacity
                        key={maker}
                        style={styles.pickerOption}
                        onPress={() => {
                          setManufacturer(maker);
                          setShowManufacturerPicker(false);
                        }}
                      >
                        <Text style={styles.pickerOptionText}>{maker}</Text>
                      </TouchableOpacity>
                    ))}
                    {/* Option for custom entry */}
                    <TouchableOpacity
                      style={[styles.pickerOption, { backgroundColor: '#F8FAFC' }]}
                      onPress={() => {
                        setShowManufacturerPicker(false);
                        // Keep manufacturer field editable for custom entry
                      }}
                    >
                      <Text style={[styles.pickerOptionText, { fontStyle: 'italic', color: '#3B82F6' }]}>
                        Enter custom manufacturer...
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

              {/* Allow custom text entry when not using picker */}
              {!showManufacturerPicker && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={manufacturer}
                  onChangeText={setManufacturer}
                  placeholder="Or type custom manufacturer"
                  placeholderTextColor="#94A3B8"
                />
              )}
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

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Boat Status</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowStatusPicker(!showStatusPicker)}
              >
                <Text style={styles.pickerText}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                <Ionicons
                  name={showStatusPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showStatusPicker && (
                <View style={styles.pickerOptions}>
                  {(['active', 'stored', 'sold', 'retired'] as const).map((statusOption) => (
                    <TouchableOpacity
                      key={statusOption}
                      style={styles.pickerOption}
                      onPress={() => {
                        setStatus(statusOption);
                        setShowStatusPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>
                        {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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

          {/* Delete Button */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete Boat</Text>
            </TouchableOpacity>
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
  disabledInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  disabledText: {
    fontSize: 16,
    color: '#64748B',
  },
  hint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  bottomSpacer: {
    height: 32,
  },
});
