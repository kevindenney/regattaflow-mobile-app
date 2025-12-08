/**
 * ActualRigSettings Component
 * 
 * Allows sailors to record what rig settings they actually used during a race,
 * compare with recommendations, and track what works over time.
 * 
 * Features:
 * - Record actual settings (e.g., "Uppers: 12 on Loos gauge")
 * - Compare with AI/guide recommendations
 * - Rate performance outcome (1-5)
 * - Add notes for future reference
 * - Track conditions match (did forecast match reality?)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Wrench,
  Save,
  Plus,
  Trash2,
  Star,
  StarOff,
  CheckCircle,
  AlertTriangle,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import type { RaceTuningRecommendation, RaceTuningSetting } from '@/services/RaceTuningService';

export interface ActualRigSetting {
  key: string;
  label: string;
  value: string;
  unit?: string;
}

export interface ActualRigSettingsData {
  settings: ActualRigSetting[];
  windActual?: { speed: number; direction: number };
  recordedAt: string;
  notes?: string;
  performanceRating?: number;
  conditionsMatchedForecast?: boolean;
}

interface ActualRigSettingsProps {
  /** Race ID for saving */
  raceId: string;
  /** Boat class for context */
  boatClassName?: string;
  /** Recommended settings from AI/guide (for comparison) */
  recommendation?: RaceTuningRecommendation | null;
  /** Forecast wind speed */
  forecastWindSpeed?: number;
  /** Existing actual settings (for editing) */
  existingSettings?: ActualRigSettingsData | null;
  /** Callback when settings are saved */
  onSave?: (data: ActualRigSettingsData) => void;
  /** Whether in compact/inline mode */
  compact?: boolean;
}

// Common rig setting presets for quick entry
const COMMON_SETTINGS = [
  { key: 'upper_shrouds', label: 'Upper Shrouds', placeholder: 'e.g., Loos 12' },
  { key: 'lower_shrouds', label: 'Lower Shrouds', placeholder: 'e.g., Loos 10' },
  { key: 'forestay', label: 'Forestay', placeholder: 'e.g., 3122mm' },
  { key: 'mast_rake', label: 'Mast Rake', placeholder: 'e.g., 122.5 cm' },
  { key: 'runners', label: 'Runners', placeholder: 'e.g., Mark #3' },
  { key: 'backstay', label: 'Backstay', placeholder: 'e.g., Light tension' },
];

export function ActualRigSettings({
  raceId,
  boatClassName,
  recommendation,
  forecastWindSpeed,
  existingSettings,
  onSave,
  compact = false,
}: ActualRigSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(!compact && !existingSettings);
  const [isEditing, setIsEditing] = useState(!existingSettings);
  const [settings, setSettings] = useState<ActualRigSetting[]>(
    existingSettings?.settings || []
  );
  const [windActualSpeed, setWindActualSpeed] = useState<string>(
    existingSettings?.windActual?.speed?.toString() || ''
  );
  const [windActualDirection, setWindActualDirection] = useState<string>(
    existingSettings?.windActual?.direction?.toString() || ''
  );
  const [notes, setNotes] = useState(existingSettings?.notes || '');
  const [performanceRating, setPerformanceRating] = useState(
    existingSettings?.performanceRating || 0
  );
  const [conditionsMatched, setConditionsMatched] = useState(
    existingSettings?.conditionsMatchedForecast ?? true
  );

  // Initialize from recommendation if no existing settings
  useEffect(() => {
    if (!existingSettings && recommendation?.settings && settings.length === 0) {
      // Pre-fill with recommended values as starting point
      const prefilled = recommendation.settings.slice(0, 6).map(s => ({
        key: s.key,
        label: s.label,
        value: '', // Leave value empty for user to fill
        unit: extractUnit(s.value),
      }));
      setSettings(prefilled);
    }
  }, [recommendation, existingSettings]);

  const handleAddSetting = () => {
    setSettings([...settings, { key: '', label: '', value: '' }]);
  };

  const handleRemoveSetting = (index: number) => {
    setSettings(settings.filter((_, i) => i !== index));
  };

  const handleUpdateSetting = (
    index: number,
    field: keyof ActualRigSetting,
    value: string
  ) => {
    const updated = [...settings];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-generate key from label if not set
    if (field === 'label' && !updated[index].key) {
      updated[index].key = value.toLowerCase().replace(/\s+/g, '_');
    }
    
    setSettings(updated);
  };

  const handleQuickAdd = (preset: typeof COMMON_SETTINGS[0]) => {
    if (settings.find(s => s.key === preset.key)) {
      Alert.alert('Already Added', `${preset.label} is already in your list`);
      return;
    }
    
    // Check if recommendation has a suggested value
    const recommendedValue = recommendation?.settings.find(
      s => s.key === preset.key
    )?.value;
    
    setSettings([
      ...settings,
      {
        key: preset.key,
        label: preset.label,
        value: '', // User fills in actual value
      },
    ]);
  };

  const handleSave = () => {
    // Validate at least one setting has a value
    const filledSettings = settings.filter(s => s.value.trim());
    if (filledSettings.length === 0) {
      Alert.alert('No Settings', 'Please enter at least one rig setting');
      return;
    }

    const data: ActualRigSettingsData = {
      settings: filledSettings,
      windActual: windActualSpeed ? {
        speed: parseFloat(windActualSpeed),
        direction: windActualDirection ? parseInt(windActualDirection) : 0,
      } : undefined,
      recordedAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
      performanceRating: performanceRating || undefined,
      conditionsMatchedForecast: conditionsMatched,
    };

    onSave?.(data);
    setIsEditing(false);
  };

  const getRecommendedValue = (key: string): string | undefined => {
    return recommendation?.settings.find(s => s.key === key)?.value;
  };

  // Compact display mode (just shows summary)
  if (compact && !isExpanded) {
    const hasSettings = existingSettings && existingSettings.settings.length > 0;
    
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => setIsExpanded(true)}
      >
        <View style={styles.compactHeader}>
          <Wrench size={16} color={hasSettings ? '#059669' : '#9CA3AF'} />
          <Text style={[
            styles.compactTitle,
            hasSettings && styles.compactTitleFilled
          ]}>
            {hasSettings ? 'Rig Settings Recorded' : 'Record Rig Settings'}
          </Text>
          <ChevronDown size={16} color="#6B7280" />
        </View>
        {hasSettings && (
          <View style={styles.compactPreview}>
            {existingSettings.settings.slice(0, 3).map((s, i) => (
              <Text key={i} style={styles.compactPreviewText}>
                {s.label}: {s.value}
              </Text>
            ))}
            {existingSettings.settings.length > 3 && (
              <Text style={styles.compactMoreText}>
                +{existingSettings.settings.length - 3} more
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Wrench size={20} color="#059669" />
          <Text style={styles.title}>Actual Rig Settings</Text>
        </View>
        <View style={styles.headerRight}>
          {!isEditing && existingSettings && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Edit3 size={16} color="#3B82F6" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {compact && (
            <TouchableOpacity onPress={() => setIsExpanded(false)}>
              <ChevronUp size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          Record what you actually set on the boat
          {forecastWindSpeed && ` (forecast: ${forecastWindSpeed} kts)`}
        </Text>
      </View>

      {/* Quick Add Buttons */}
      {isEditing && (
        <View style={styles.quickAddSection}>
          <Text style={styles.quickAddLabel}>Quick Add:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.quickAddButtons}>
              {COMMON_SETTINGS.filter(
                p => !settings.find(s => s.key === p.key)
              ).map(preset => (
                <TouchableOpacity
                  key={preset.key}
                  style={styles.quickAddButton}
                  onPress={() => handleQuickAdd(preset)}
                >
                  <Plus size={12} color="#3B82F6" />
                  <Text style={styles.quickAddButtonText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Settings List */}
      <View style={styles.settingsList}>
        {settings.map((setting, index) => {
          const recommended = getRecommendedValue(setting.key);
          
          return (
            <View key={index} style={styles.settingRow}>
              {isEditing ? (
                <>
                  <View style={styles.settingInputs}>
                    <TextInput
                      style={styles.labelInput}
                      value={setting.label}
                      onChangeText={(v) => handleUpdateSetting(index, 'label', v)}
                      placeholder="Setting name"
                      placeholderTextColor="#9CA3AF"
                    />
                    <TextInput
                      style={styles.valueInput}
                      value={setting.value}
                      onChangeText={(v) => handleUpdateSetting(index, 'value', v)}
                      placeholder={
                        COMMON_SETTINGS.find(c => c.key === setting.key)?.placeholder ||
                        'Value'
                      }
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveSetting(index)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  {recommended && (
                    <View style={styles.recommendedHint}>
                      <Text style={styles.recommendedHintText}>
                        Recommended: {recommended}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.settingDisplay}>
                  <Text style={styles.settingLabel}>{setting.label}</Text>
                  <Text style={styles.settingValue}>{setting.value}</Text>
                  {recommended && setting.value !== recommended && (
                    <Text style={styles.settingDiff}>
                      (rec: {recommended})
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
        
        {isEditing && (
          <TouchableOpacity
            style={styles.addSettingButton}
            onPress={handleAddSetting}
          >
            <Plus size={16} color="#3B82F6" />
            <Text style={styles.addSettingText}>Add Custom Setting</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Actual Wind Conditions */}
      {isEditing && (
        <View style={styles.windSection}>
          <Text style={styles.sectionLabel}>Actual Wind Conditions</Text>
          <View style={styles.windInputs}>
            <View style={styles.windInput}>
              <Text style={styles.windInputLabel}>Speed (kts)</Text>
              <TextInput
                style={styles.windTextInput}
                value={windActualSpeed}
                onChangeText={setWindActualSpeed}
                placeholder={forecastWindSpeed?.toString() || '0'}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.windInput}>
              <Text style={styles.windInputLabel}>Direction (°)</Text>
              <TextInput
                style={styles.windTextInput}
                value={windActualDirection}
                onChangeText={setWindActualDirection}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.conditionsMatchToggle}
            onPress={() => setConditionsMatched(!conditionsMatched)}
          >
            {conditionsMatched ? (
              <CheckCircle size={18} color="#059669" />
            ) : (
              <AlertTriangle size={18} color="#F59E0B" />
            )}
            <Text style={styles.conditionsMatchText}>
              {conditionsMatched
                ? 'Conditions matched forecast'
                : 'Conditions differed from forecast'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Performance Rating */}
      <View style={styles.ratingSection}>
        <Text style={styles.sectionLabel}>How did this setup perform?</Text>
        <View style={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              onPress={() => isEditing && setPerformanceRating(rating)}
              disabled={!isEditing}
            >
              {rating <= performanceRating ? (
                <Star size={28} color="#F59E0B" fill="#F59E0B" />
              ) : (
                <StarOff size={28} color="#D1D5DB" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingHint}>
          {performanceRating === 0 && 'Tap to rate'}
          {performanceRating === 1 && 'Poor - try different settings'}
          {performanceRating === 2 && 'Below average'}
          {performanceRating === 3 && 'Average - room for improvement'}
          {performanceRating === 4 && 'Good - close to optimal'}
          {performanceRating === 5 && 'Excellent - keep these settings!'}
        </Text>
      </View>

      {/* Notes */}
      {isEditing && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionLabel}>Notes for Next Time</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g., Felt underpowered in lulls, try +2 on uppers next time..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      {/* Display notes in view mode */}
      {!isEditing && notes && (
        <View style={styles.notesDisplay}>
          <Text style={styles.notesDisplayLabel}>Notes:</Text>
          <Text style={styles.notesDisplayText}>{notes}</Text>
        </View>
      )}

      {/* Save Button */}
      {isEditing && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={18} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Rig Settings</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Extract unit from a value string (e.g., "Loos 12" -> "Loos gauge")
 */
function extractUnit(value: string): string | undefined {
  if (value.toLowerCase().includes('loos')) return 'Loos gauge';
  if (value.includes('mm')) return 'mm';
  if (value.includes('cm')) return 'cm';
  if (value.includes('"')) return 'inches';
  return undefined;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  infoBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#166534',
  },
  quickAddSection: {
    marginBottom: 12,
  },
  quickAddLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  quickAddButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  quickAddButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  settingsList: {
    gap: 8,
    marginBottom: 16,
  },
  settingRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  valueInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  removeButton: {
    padding: 8,
  },
  recommendedHint: {
    marginTop: 6,
  },
  recommendedHintText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  settingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  settingDiff: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  addSettingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3B82F6',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  addSettingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  windSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  windInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  windInput: {
    flex: 1,
  },
  windInputLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  windTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  conditionsMatchToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  conditionsMatchText: {
    fontSize: 13,
    color: '#374151',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  ratingHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  notesSection: {
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesDisplay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  notesDisplayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesDisplayText: {
    fontSize: 13,
    color: '#374151',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Compact styles
  compactContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactTitle: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  compactTitleFilled: {
    fontWeight: '600',
    color: '#059669',
  },
  compactPreview: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 2,
  },
  compactPreviewText: {
    fontSize: 12,
    color: '#374151',
  },
  compactMoreText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default ActualRigSettings;

