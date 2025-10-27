/**
 * Create Tuning Setup Form
 * Modal form for creating rig and sail tuning configurations
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CreateTuningSetupFormProps {
  visible: boolean;
  boatId: string;
  classId: string;
  onClose: () => void;
  onSubmit: (setup: TuningSetupFormData) => void;
}

export interface TuningSetupFormData {
  name: string;
  description?: string;
  windMin?: number;
  windMax?: number;
  waveConditions?: string[];
  venueName?: string;
  rigSettings: {
    mastRake?: string;
    shroudTension?: string;
    forestay?: string;
    backstay?: string;
  };
  sailSettings: {
    outhaul?: string;
    cunningham?: string;
    vang?: string;
    traveler?: string;
  };
}

const WAVE_CONDITIONS = [
  { value: 'flat', label: 'Flat', icon: 'remove' },
  { value: 'ripple', label: 'Ripple', icon: 'pulse' },
  { value: 'chop', label: 'Chop', icon: 'stats-chart' },
  { value: 'swell', label: 'Swell', icon: 'trending-up' },
  { value: 'confused', label: 'Confused', icon: 'shuffle' },
];

export function CreateTuningSetupForm({
  visible,
  boatId,
  classId,
  onClose,
  onSubmit,
}: CreateTuningSetupFormProps) {
  const [formData, setFormData] = useState<TuningSetupFormData>({
    name: '',
    rigSettings: {},
    sailSettings: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedWaveConditions, setSelectedWaveConditions] = useState<string[]>([]);

  const toggleWaveCondition = (condition: string) => {
    if (selectedWaveConditions.includes(condition)) {
      setSelectedWaveConditions(selectedWaveConditions.filter((c) => c !== condition));
    } else {
      setSelectedWaveConditions([...selectedWaveConditions, condition]);
    }
  };

  const handleSubmit = () => {
    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Configuration name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    onSubmit({
      ...formData,
      waveConditions: selectedWaveConditions.length > 0 ? selectedWaveConditions : undefined,
    });

    // Reset form
    setFormData({
      name: '',
      rigSettings: {},
      sailSettings: {},
    });
    setSelectedWaveConditions([]);
    setErrors({});
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      rigSettings: {},
      sailSettings: {},
    });
    setSelectedWaveConditions([]);
    setErrors({});
    onClose();
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
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Tuning Setup</Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Configuration Name */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Configuration Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="e.g., Heavy Air Setup or Light Wind Hong Kong"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What conditions is this setup optimized for?"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Wind Range */}
          <View style={styles.section}>
            <Text style={styles.label}>Wind Range (knots)</Text>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>Min</Text>
                <TextInput
                  style={styles.rangeField}
                  placeholder="6"
                  keyboardType="number-pad"
                  value={formData.windMin?.toString()}
                  onChangeText={(text) =>
                    setFormData({ ...formData, windMin: parseInt(text) || undefined })
                  }
                />
              </View>
              <View style={styles.rangeDivider} />
              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>Max</Text>
                <TextInput
                  style={styles.rangeField}
                  placeholder="12"
                  keyboardType="number-pad"
                  value={formData.windMax?.toString()}
                  onChangeText={(text) =>
                    setFormData({ ...formData, windMax: parseInt(text) || undefined })
                  }
                />
              </View>
            </View>
          </View>

          {/* Wave Conditions */}
          <View style={styles.section}>
            <Text style={styles.label}>Wave Conditions</Text>
            <View style={styles.waveGrid}>
              {WAVE_CONDITIONS.map((wave) => (
                <TouchableOpacity
                  key={wave.value}
                  style={[
                    styles.waveButton,
                    selectedWaveConditions.includes(wave.value) && styles.waveButtonActive,
                  ]}
                  onPress={() => toggleWaveCondition(wave.value)}
                >
                  <Ionicons
                    name={wave.icon as any}
                    size={20}
                    color={
                      selectedWaveConditions.includes(wave.value) ? '#3B82F6' : '#64748B'
                    }
                  />
                  <Text
                    style={[
                      styles.waveButtonText,
                      selectedWaveConditions.includes(wave.value) && styles.waveButtonTextActive,
                    ]}
                  >
                    {wave.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Venue */}
          <View style={styles.section}>
            <Text style={styles.label}>Venue (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Royal Hong Kong Yacht Club"
              value={formData.venueName}
              onChangeText={(text) => setFormData({ ...formData, venueName: text })}
            />
          </View>

          {/* Rig Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="construct" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Rig Settings</Text>
            </View>

            <View style={styles.settingsGrid}>
              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Mast Rake</Text>
                <TextInput
                  style={styles.settingInput}
                  placeholder="e.g., 28"
                  value={formData.rigSettings.mastRake}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      rigSettings: { ...formData.rigSettings, mastRake: text },
                    })
                  }
                />
              </View>

              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Shroud Tension</Text>
                <TextInput
                  style={styles.settingInput}
                  placeholder="e.g., 350 lbs"
                  value={formData.rigSettings.shroudTension}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      rigSettings: { ...formData.rigSettings, shroudTension: text },
                    })
                  }
                />
              </View>

              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Forestay</Text>
                <TextInput
                  style={styles.settingInput}
                  placeholder="e.g., tight"
                  value={formData.rigSettings.forestay}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      rigSettings: { ...formData.rigSettings, forestay: text },
                    })
                  }
                />
              </View>

              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Backstay</Text>
                <TextInput
                  style={styles.settingInput}
                  placeholder="e.g., max"
                  value={formData.rigSettings.backstay}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      rigSettings: { ...formData.rigSettings, backstay: text },
                    })
                  }
                />
              </View>
            </View>
          </View>

          {/* Sail Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="boat" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Sail Settings</Text>
            </View>

            <View style={styles.settingsGrid}>
              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Outhaul</Text>
                <TextInput
                  style={styles.settingInput}
                  placeholder="e.g., maximum"
                  value={formData.sailSettings.outhaul}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      sailSettings: { ...formData.sailSettings, outhaul: text },
                    })
                  }
                />
              </View>

              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Cunningham</Text>
                <TextInput
                  style={styles.settingInput}
                  placeholder="e.g., heavy"
                  value={formData.sailSettings.cunningham}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      sailSettings: { ...formData.sailSettings, cunningham: text },
                    })
                  }
                />
              </View>

              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Vang</Text>
                <TextInput
                  style={styles.settingInput}
                  placeholder="e.g., tight"
                  value={formData.sailSettings.vang}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      sailSettings: { ...formData.sailSettings, vang: text },
                    })
                  }
                />
              </View>

              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Traveler</Text>
                <TextInput
                  style={styles.settingInput}
                  placeholder="e.g., down 6 inches"
                  value={formData.sailSettings.traveler}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      sailSettings: { ...formData.sailSettings, traveler: text },
                    })
                  }
                />
              </View>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cancelButton: {
    width: 80,
  },
  cancelText: {
    fontSize: 16,
    color: '#64748B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  saveButton: {
    width: 80,
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
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
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  rangeInput: {
    flex: 1,
    gap: 6,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rangeField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1E293B',
  },
  rangeDivider: {
    width: 12,
    height: 2,
    backgroundColor: '#CBD5E1',
  },
  waveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  waveButton: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  waveButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  waveButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  waveButtonTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  settingsGrid: {
    gap: 16,
  },
  settingField: {
    gap: 6,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  settingInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  bottomPadding: {
    height: 40,
  },
});