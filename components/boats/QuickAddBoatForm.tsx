/**
 * QuickAddBoatForm Component
 * Inline form for quickly adding a boat (especially for crew scenario)
 * Minimal fields for fast boat creation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/providers/AuthProvider';
import { sailorBoatService } from '@/services/SailorBoatService';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

interface QuickAddBoatFormProps {
  visible: boolean;
  onClose: () => void;
  onBoatAdded: (boatId: string) => void; // Callback with new boat ID
}

interface BoatClass {
  id: string;
  name: string;
  class_association: string | null;
}

const logger = createLogger('QuickAddBoatForm');
export function QuickAddBoatForm({
  visible,
  onClose,
  onBoatAdded,
}: QuickAddBoatFormProps) {
  const { user } = useAuth();

  // Form state
  const [boatName, setBoatName] = useState('');
  const [sailNumber, setSailNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [ownershipType, setOwnershipType] = useState<
    'owned' | 'co_owned' | 'chartered' | 'club_boat' | 'crew'
  >('owned');

  // UI state
  const [classes, setClasses] = useState<BoatClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    if (visible) {
      loadClasses();
    }
  }, [visible]);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const { data, error } = await supabase
        .from('boat_classes')
        .select('id, name, class_association')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (err: any) {
      console.error('[QuickAddBoatForm] Error loading classes:', err);
      Alert.alert('Error', 'Failed to load boat classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSubmit = async () => {
    logger.debug('[QuickAddBoatForm] Submit clicked');

    // Validation
    if (!boatName.trim()) {
      console.warn('[QuickAddBoatForm] Validation failed: no boat name');
      Alert.alert('Required Field', 'Please enter a boat name');
      return;
    }
    if (!classId) {
      console.warn('[QuickAddBoatForm] Validation failed: no class selected');
      Alert.alert('Required Field', 'Please select a boat class');
      return;
    }

    if (!user) {
      console.error('[QuickAddBoatForm] No user found');
      Alert.alert('Error', 'You must be logged in to add a boat');
      return;
    }

    logger.debug('[QuickAddBoatForm] Creating boat:', {
      sail_number: sailNumber.trim() || undefined,
      ownership_type: ownershipType,
    });

    setLoading(true);

    try {
      const newBoat = await sailorBoatService.createBoat({
        sailor_id: user.id,
        class_id: classId,
        name: boatName.trim(),
        sail_number: sailNumber.trim() || undefined,
        ownership_type: ownershipType,
        is_primary: false, // Don't set as primary for quick add
      });

      logger.debug('[QuickAddBoatForm] Successfully created boat:', newBoat.id);

      Alert.alert(
        'Success!',
        `Added boat: ${boatName}${sailNumber ? ` (Sail #${sailNumber})` : ''}`
      );

      // Reset form
      setBoatName('');
      setSailNumber('');
      setClassId('');
      setOwnershipType('owned');

      // Call callback with new boat ID
      onBoatAdded(newBoat.id);

      // Close modal
      onClose();
    } catch (err: any) {
      if (err?.queuedForSync && err?.entity) {
        Alert.alert(
          'Offline',
          `${boatName} will be saved once you're back online. We'll sync this boat automatically.`
        );
        setBoatName('');
        setSailNumber('');
        setClassId('');
        setOwnershipType('owned');
        onClose();
      } else {
        console.error('[QuickAddBoatForm] Error creating boat:', err);
        console.error('[QuickAddBoatForm] Error details:', JSON.stringify(err, null, 2));

        // Handle specific error cases
        let errorMessage = err?.message || 'Failed to add boat';

        if (err?.code === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
          errorMessage = `You already have a ${boatName} with sail number ${sailNumber} in this class. Please use a different sail number or edit your existing boat.`;
        }

        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setBoatName('');
    setSailNumber('');
    setClassId('');
    setOwnershipType('owned');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Quick Add Boat</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loadingClasses ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0284c7" />
              <Text style={styles.loadingText}>Loading boat classes...</Text>
            </View>
          ) : (
            <>
              {/* Boat Name */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Boat Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={boatName}
                  onChangeText={setBoatName}
                  placeholder="e.g., Dragonfly, Blue Lightning"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  editable={!loading}
                />
              </View>

              {/* Sail Number */}
              <View style={styles.field}>
                <Text style={styles.label}>Sail Number</Text>
                <TextInput
                  value={sailNumber}
                  onChangeText={setSailNumber}
                  placeholder="e.g., 123, USA 456"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  editable={!loading}
                />
              </View>

              {/* Boat Class */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Boat Class <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={classId}
                    onValueChange={setClassId}
                    style={styles.picker}
                    enabled={!loading}
                  >
                    <Picker.Item label="Select a class..." value="" />
                    {classes.map((c) => (
                      <Picker.Item
                        key={c.id}
                        label={`${c.name}${c.class_association ? ` (${c.class_association})` : ''}`}
                        value={c.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Ownership Type */}
              <View style={styles.field}>
                <Text style={styles.label}>How do you use this boat?</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={ownershipType}
                    onValueChange={(value) =>
                      setOwnershipType(
                        value as
                          | 'owned'
                          | 'co_owned'
                          | 'chartered'
                          | 'club_boat'
                          | 'crew'
                      )
                    }
                    style={styles.picker}
                    enabled={!loading}
                  >
                    <Picker.Item label="I own this boat" value="owned" />
                    <Picker.Item label="Co-owned / Shared" value="co_owned" />
                    <Picker.Item label="Chartered / Rental" value="chartered" />
                    <Picker.Item label="Club boat" value="club_boat" />
                    <Picker.Item label="I crew on this boat" value="crew" />
                  </Picker>
                </View>
                <Text style={styles.helpText}>
                  {ownershipType === 'crew'
                    ? "You're racing as crew on someone else's boat"
                    : ownershipType === 'club_boat'
                      ? 'Boat owned by your sailing club'
                      : ownershipType === 'chartered'
                        ? 'Temporary rental or charter arrangement'
                        : ownershipType === 'co_owned'
                          ? 'You share ownership with others'
                          : 'You are the sole owner of this boat'}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[styles.button, styles.cancelButton]}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[
                    styles.button,
                    styles.submitButton,
                    loading && styles.submitButtonDisabled,
                  ]}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Add Boat</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#0284c7',
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
