/**
 * QuickAddBoatForm Component
 * Inline form for quickly adding a boat with optional sails
 * Uses iOS-friendly custom pickers instead of @react-native-picker/picker
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { sailorBoatService } from '@/services/SailorBoatService';
import { equipmentService } from '@/services/EquipmentService';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

interface QuickAddBoatFormProps {
  visible: boolean;
  onClose: () => void;
  onBoatAdded: (boatId: string) => void;
}

interface BoatClass {
  id: string;
  name: string;
  class_association: string | null;
}

// Sail categories for selection
const SAIL_CATEGORIES = [
  { id: 'mainsail', name: 'Mainsail', short: 'Main' },
  { id: 'jib', name: 'Jib', short: 'Jib' },
  { id: 'genoa', name: 'Genoa', short: 'Genoa' },
  { id: 'spinnaker', name: 'Spinnaker', short: 'Spin' },
  { id: 'code_zero', name: 'Code Zero', short: 'C0' },
] as const;

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
  const [selectedSails, setSelectedSails] = useState<string[]>(['mainsail']);

  // UI state
  const [classes, setClasses] = useState<BoatClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [showClassPicker, setShowClassPicker] = useState(false);

  // Get selected class object
  const selectedClass = classes.find((c) => c.id === classId);

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

  const toggleSail = (sailId: string) => {
    setSelectedSails((prev) =>
      prev.includes(sailId)
        ? prev.filter((s) => s !== sailId)
        : [...prev, sailId]
    );
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
      selectedSails,
    });

    setLoading(true);

    try {
      // Create the boat
      const newBoat = await sailorBoatService.createBoat({
        sailor_id: user.id,
        class_id: classId,
        name: boatName.trim(),
        sail_number: sailNumber.trim() || undefined,
        ownership_type: 'owned',
        is_primary: false,
      });

      logger.debug('[QuickAddBoatForm] Successfully created boat:', newBoat.id);

      // Create sails if any selected
      if (selectedSails.length > 0) {
        for (const sailCategory of selectedSails) {
          try {
            const sailName = SAIL_CATEGORIES.find((c) => c.id === sailCategory)?.name || sailCategory;
            await equipmentService.createEquipment({
              boat_id: newBoat.id,
              category: sailCategory,
              custom_name: sailName,
              condition_rating: 4, // Default to "Good"
              notes: 'Added during boat creation',
            });
            logger.debug(`[QuickAddBoatForm] Created sail: ${sailCategory}`);
          } catch (sailErr) {
            console.error(`[QuickAddBoatForm] Error creating ${sailCategory}:`, sailErr);
            // Continue creating other sails even if one fails
          }
        }
      }

      const sailsText = selectedSails.length > 0
        ? ` with ${selectedSails.length} sail${selectedSails.length > 1 ? 's' : ''}`
        : '';

      Alert.alert(
        'Success!',
        `Added boat: ${boatName}${sailNumber ? ` (Sail #${sailNumber})` : ''}${sailsText}`
      );

      // Reset form
      setBoatName('');
      setSailNumber('');
      setClassId('');
      setSelectedSails(['mainsail']);
      setShowClassPicker(false);

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
        setSelectedSails(['mainsail']);
        onClose();
      } else {
        console.error('[QuickAddBoatForm] Error creating boat:', err);
        console.error('[QuickAddBoatForm] Error details:', JSON.stringify(err, null, 2));

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
    setSelectedSails(['mainsail']);
    setShowClassPicker(false);
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
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
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

              {/* Boat Class - Custom Picker */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Boat Class <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setShowClassPicker(!showClassPicker)}
                  disabled={loading}
                >
                  <Text
                    style={selectedClass ? styles.pickerText : styles.pickerPlaceholder}
                  >
                    {selectedClass
                      ? `${selectedClass.name}${selectedClass.class_association ? ` (${selectedClass.class_association})` : ''}`
                      : 'Select a class...'}
                  </Text>
                  {showClassPicker ? (
                    <ChevronUp size={20} color="#6B7280" />
                  ) : (
                    <ChevronDown size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>

                {showClassPicker && (
                  <View style={styles.pickerOptions}>
                    <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                      {classes.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.pickerOption,
                            c.id === classId && styles.pickerOptionSelected,
                          ]}
                          onPress={() => {
                            setClassId(c.id);
                            setShowClassPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              c.id === classId && styles.pickerOptionTextSelected,
                            ]}
                          >
                            {c.name}
                          </Text>
                          {c.class_association && (
                            <Text style={styles.pickerOptionSubtext}>
                              {c.class_association}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Sails Selection */}
              <View style={styles.field}>
                <Text style={styles.label}>Sails</Text>
                <Text style={styles.helpText}>Select the sails this boat has</Text>
                <View style={styles.sailsRow}>
                  {SAIL_CATEGORIES.map((sail) => (
                    <TouchableOpacity
                      key={sail.id}
                      style={[
                        styles.sailPill,
                        selectedSails.includes(sail.id) && styles.sailPillSelected,
                      ]}
                      onPress={() => toggleSail(sail.id)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.sailPillText,
                          selectedSails.includes(sail.id) && styles.sailPillTextSelected,
                        ]}
                      >
                        {sail.short}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
            </ScrollView>
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
    marginBottom: 16,
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
  formScroll: {
    flexGrow: 0,
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
  // Custom Picker styles
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
    flex: 1,
  },
  pickerOptions: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerScroll: {
    flexGrow: 0,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  pickerOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  pickerOptionTextSelected: {
    color: '#0284c7',
    fontWeight: '600',
  },
  pickerOptionSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  // Sails selection
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  sailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sailPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sailPillSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  sailPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  sailPillTextSelected: {
    color: '#FFFFFF',
  },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingBottom: 8,
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
