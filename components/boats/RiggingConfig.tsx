import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface RiggingPreset {
  id: string;
  name: string;
  conditions: string;
  isFavorite: boolean;
  settings: {
    mastRake: string;
    shroudTension: string;
    forestayTension: string;
    spreaderLength: string;
    spreaderAngle: string;
    outhaul: string;
    cunningham: string;
    vangs: string;
  };
}

interface RiggingConfigProps {
  boatId: string;
}

// Mock data
const MOCK_PRESETS: RiggingPreset[] = [
  {
    id: '1',
    name: 'Light Air (0-8 knots)',
    conditions: 'Flat water, 0-8 knots',
    isFavorite: true,
    settings: {
      mastRake: '23.5°',
      shroudTension: '280 lbs',
      forestayTension: '320 lbs',
      spreaderLength: '15.5"',
      spreaderAngle: '8°',
      outhaul: 'Loose (2" from black band)',
      cunningham: 'Off',
      vangs: 'Light tension',
    },
  },
  {
    id: '2',
    name: 'Medium Air (8-15 knots)',
    conditions: 'Chop, 8-15 knots',
    isFavorite: true,
    settings: {
      mastRake: '23.0°',
      shroudTension: '340 lbs',
      forestayTension: '380 lbs',
      spreaderLength: '15.5"',
      spreaderAngle: '8°',
      outhaul: 'Medium (1" from black band)',
      cunningham: 'Light wrinkles removed',
      vangs: 'Medium tension',
    },
  },
  {
    id: '3',
    name: 'Heavy Air (15+ knots)',
    conditions: 'Waves, 15+ knots',
    isFavorite: false,
    settings: {
      mastRake: '22.5°',
      shroudTension: '400 lbs',
      forestayTension: '440 lbs',
      spreaderLength: '15.5"',
      spreaderAngle: '8°',
      outhaul: 'Max (at black band)',
      cunningham: 'Heavy wrinkles removed',
      vangs: 'Max tension',
    },
  },
];

const VENUE_PRESETS = [
  { id: 'v1', name: 'Victoria Harbour Setup', venue: 'RHKYC' },
  { id: 'v2', name: 'Port Shelter Heavy Air', venue: 'HHYC' },
];

export function RiggingConfig({ boatId }: RiggingConfigProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>('1');
  const [editMode, setEditMode] = useState(false);

  const currentPreset = MOCK_PRESETS.find((p) => p.id === selectedPreset);

  return (
    <View style={styles.container}>
      {/* Mast Info Header */}
      <View style={styles.mastInfo}>
        <View style={styles.mastHeader}>
          <Ionicons name="hardware-chip-outline" size={24} color="#3B82F6" />
          <View style={styles.mastDetails}>
            <Text style={styles.mastTitle}>North Sails Pro Mast</Text>
            <Text style={styles.mastMeta}>Carbon fiber • Dragon class spec</Text>
          </View>
        </View>
        <View style={styles.mastSpecs}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Length</Text>
            <Text style={styles.specValue}>9.0m</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Weight</Text>
            <Text style={styles.specValue}>12.5kg</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Bend</Text>
            <Text style={styles.specValue}>Medium</Text>
          </View>
        </View>
      </View>

      {/* Venue Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Venue Presets</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.venueScroll}
        >
          {VENUE_PRESETS.map((preset) => (
            <TouchableOpacity key={preset.id} style={styles.venueCard}>
              <Ionicons name="location" size={16} color="#3B82F6" />
              <Text style={styles.venueName}>{preset.name}</Text>
              <Text style={styles.venueLocation}>{preset.venue}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addVenueCard}>
            <Ionicons name="add-circle-outline" size={20} color="#64748B" />
            <Text style={styles.addVenueText}>Add Venue Setup</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Condition Presets */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tuning Presets</Text>
          <TouchableOpacity>
            <Ionicons name="add-circle" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <View style={styles.presetList}>
          {MOCK_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetCard,
                selectedPreset === preset.id && styles.presetCardActive,
              ]}
              onPress={() => setSelectedPreset(preset.id)}
            >
              <View style={styles.presetHeader}>
                <Text
                  style={[
                    styles.presetName,
                    selectedPreset === preset.id && styles.presetNameActive,
                  ]}
                >
                  {preset.name}
                </Text>
                {preset.isFavorite && (
                  <Ionicons name="star" size={16} color="#F59E0B" />
                )}
              </View>
              <Text style={styles.presetConditions}>{preset.conditions}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Current Settings */}
      {currentPreset && (
        <ScrollView style={styles.settingsContainer}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Current Setup Values</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditMode(!editMode)}
            >
              <Ionicons
                name={editMode ? 'checkmark-circle' : 'create-outline'}
                size={20}
                color="#3B82F6"
              />
              <Text style={styles.editButtonText}>
                {editMode ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsGrid}>
            {Object.entries(currentPreset.settings).map(([key, value]) => (
              <View key={key} style={styles.settingItem}>
                <Text style={styles.settingLabel}>
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())}
                </Text>
                {editMode ? (
                  <TextInput
                    style={styles.settingInput}
                    value={value}
                    placeholder="Enter value"
                  />
                ) : (
                  <Text style={styles.settingValue}>{value}</Text>
                )}
              </View>
            ))}
          </View>

          {editMode && (
            <View style={styles.saveActions}>
              <TouchableOpacity style={styles.saveAsPresetButton}>
                <Ionicons name="bookmark-outline" size={18} color="#3B82F6" />
                <Text style={styles.saveAsPresetText}>Save as New Preset</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mastInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mastDetails: {
    flex: 1,
  },
  mastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  mastMeta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  mastSpecs: {
    flexDirection: 'row',
    gap: 24,
  },
  specItem: {
    gap: 2,
  },
  specLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  venueScroll: {
    gap: 12,
  },
  venueCard: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    minWidth: 140,
    gap: 4,
  },
  venueName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  venueLocation: {
    fontSize: 11,
    color: '#64748B',
  },
  addVenueCard: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    minWidth: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  addVenueText: {
    fontSize: 12,
    color: '#64748B',
  },
  presetList: {
    gap: 8,
  },
  presetCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  presetNameActive: {
    color: '#3B82F6',
  },
  presetConditions: {
    fontSize: 12,
    color: '#64748B',
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 16,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
  },
  settingsGrid: {
    gap: 12,
  },
  settingItem: {
    gap: 6,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
  },
  settingInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  saveActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveAsPresetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  saveAsPresetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
