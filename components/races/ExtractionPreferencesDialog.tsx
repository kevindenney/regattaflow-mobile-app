/**
 * ExtractionPreferencesDialog
 * 
 * A dialog that appears before document extraction to let users specify:
 * 1. What information they want to extract
 * 2. Their boat class (for smart filtering)
 * 3. Extraction depth (quick vs comprehensive)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { X, Sailboat, Flag, Radio, MapPin, Clock, FileText, Zap, Settings } from 'lucide-react-native';

export interface ExtractionPreferences {
  // What to extract
  extractStartLines: boolean;
  extractStartTimes: boolean;
  extractVhfChannels: boolean;
  extractCourseMarks: boolean;
  extractProhibitedAreas: boolean;
  extractRules: boolean;
  extractAllClasses: boolean;  // vs just user's class
  
  // User context
  userBoatClass?: string;
  filterToMyClass: boolean;
  
  // Extraction depth
  comprehensiveMode: boolean;  // Extract everything vs quick mode
}

export const DEFAULT_PREFERENCES: ExtractionPreferences = {
  extractStartLines: true,
  extractStartTimes: true,
  extractVhfChannels: true,
  extractCourseMarks: true,
  extractProhibitedAreas: true,
  extractRules: true,
  extractAllClasses: false,
  filterToMyClass: true,
  comprehensiveMode: true,
};

interface ExtractionPreferencesDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (preferences: ExtractionPreferences) => void;
  userBoatClasses?: string[];  // Classes the user has registered
  documentPreview?: string;    // First few lines of document for context
  raceType?: 'fleet' | 'distance'; // Race type to customize UI
}

// Common boat classes for quick selection
const COMMON_BOAT_CLASSES = [
  'Dragon',
  'J/80',
  'J/70',
  'Etchells',
  'Ruffian',
  'Impala',
  'Flying Fifteen',
  'Sportsboat',
  'IRC Cruiser',
  'IRC Division 1',
  'IRC Division 2',
  'PHS Cruiser',
  'PHS Division A',
  'PHS Division B',
  'Laser/ILCA',
  '29er',
  '420',
  'Optimist',
];

export function ExtractionPreferencesDialog({
  visible,
  onClose,
  onConfirm,
  userBoatClasses = [],
  documentPreview,
  raceType,
}: ExtractionPreferencesDialogProps) {
  const [preferences, setPreferences] = useState<ExtractionPreferences>(DEFAULT_PREFERENCES);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedBoatClass, setSelectedBoatClass] = useState<string | undefined>(
    userBoatClasses[0] || undefined
  );

  // Reset to defaults when dialog opens
  useEffect(() => {
    if (visible) {
      setPreferences({
        ...DEFAULT_PREFERENCES,
        userBoatClass: userBoatClasses[0] || undefined,
      });
      setSelectedBoatClass(userBoatClasses[0] || undefined);
    }
  }, [visible, userBoatClasses]);

  const handleConfirm = () => {
    onConfirm({
      ...preferences,
      userBoatClass: selectedBoatClass,
    });
  };

  const togglePreference = (key: keyof ExtractionPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const PreferenceToggle = ({ 
    label, 
    description, 
    value, 
    onToggle, 
    icon: Icon 
  }: { 
    label: string; 
    description?: string; 
    value: boolean; 
    onToggle: () => void;
    icon?: any;
  }) => (
    <TouchableOpacity 
      style={[styles.preferenceRow, value && styles.preferenceRowActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.preferenceIcon}>
        {Icon && <Icon size={20} color={value ? '#3b82f6' : '#9ca3af'} />}
      </View>
      <View style={styles.preferenceText}>
        <Text style={[styles.preferenceLabel, value && styles.preferenceLabelActive]}>
          {label}
        </Text>
        {description && (
          <Text style={styles.preferenceDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
        thumbColor={value ? '#3b82f6' : '#f3f4f6'}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Extraction Preferences</Text>
              <Text style={styles.subtitle}>
                What information would you like to extract?
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Quick Mode Toggle */}
            <View style={styles.section}>
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    !preferences.comprehensiveMode && styles.modeButtonActive,
                  ]}
                  onPress={() => setPreferences(p => ({ ...p, comprehensiveMode: false }))}
                >
                  <Zap size={18} color={!preferences.comprehensiveMode ? '#fff' : '#6b7280'} />
                  <Text style={[
                    styles.modeButtonText,
                    !preferences.comprehensiveMode && styles.modeButtonTextActive,
                  ]}>
                    Quick
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    preferences.comprehensiveMode && styles.modeButtonActive,
                  ]}
                  onPress={() => setPreferences(p => ({ ...p, comprehensiveMode: true }))}
                >
                  <FileText size={18} color={preferences.comprehensiveMode ? '#fff' : '#6b7280'} />
                  <Text style={[
                    styles.modeButtonText,
                    preferences.comprehensiveMode && styles.modeButtonTextActive,
                  ]}>
                    Comprehensive
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modeDescription}>
                {preferences.comprehensiveMode 
                  ? 'Extract all available information including GPS coordinates, prohibited areas, and detailed rules.'
                  : 'Extract essential information: start times, VHF channels, and basic course details.'}
              </Text>
            </View>

            {/* Boat Class Selection */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Sailboat size={16} color="#3b82f6" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionTitle}>Your Boat Class / Division</Text>
                  </View>
                  <Text style={styles.sectionDescription}>
                    {raceType === 'distance' 
                      ? 'Optional: Select your division to highlight relevant start times and communications'
                      : 'We\'ll highlight information relevant to your class'}
                  </Text>
                </View>
                {raceType === 'distance' && (
                  <TouchableOpacity
                    onPress={() => setSelectedBoatClass(undefined)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: selectedBoatClass === undefined ? '#e0e7ff' : '#f3f4f6',
                      marginLeft: 8,
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: selectedBoatClass === undefined ? '#4338ca' : '#6b7280',
                    }}>
                      Skip
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.classScroll}
              >
                {(userBoatClasses.length > 0 ? userBoatClasses : COMMON_BOAT_CLASSES).map((boatClass) => (
                  <TouchableOpacity
                    key={boatClass}
                    style={[
                      styles.classChip,
                      selectedBoatClass === boatClass && styles.classChipActive,
                    ]}
                    onPress={() => setSelectedBoatClass(boatClass)}
                  >
                    <Text style={[
                      styles.classChipText,
                      selectedBoatClass === boatClass && styles.classChipTextActive,
                    ]}>
                      {boatClass}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {raceType === 'distance' && (
                <View style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: '#f0f9ff',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#bae6fd',
                }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#0369a1',
                    lineHeight: 18,
                  }}>
                    💡 <Text style={{ fontWeight: '600' }}>For distance races:</Text> Boat selection happens later when you register. This class selection is optional and only helps filter information during extraction. Your division (IRC Div 1/2, PHS A/B) will be determined by your boat's handicap rating.
                  </Text>
                </View>
              )}

              {selectedBoatClass && (
                <PreferenceToggle
                  label="Filter to my class only"
                  description="Show only start times and channels for my class"
                  value={preferences.filterToMyClass}
                  onToggle={() => togglePreference('filterToMyClass')}
                  icon={Flag}
                />
              )}
            </View>

            {/* What to Extract */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Settings size={16} color="#3b82f6" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Information to Extract</Text>
              </View>
              
              <PreferenceToggle
                label="Starting Lines & Times"
                description="Multiple start lines, class assignments, schedules"
                value={preferences.extractStartLines}
                onToggle={() => togglePreference('extractStartLines')}
                icon={Flag}
              />
              
              <PreferenceToggle
                label="VHF Channels"
                description="Race committee, safety, and class-specific channels"
                value={preferences.extractVhfChannels}
                onToggle={() => togglePreference('extractVhfChannels')}
                icon={Radio}
              />
              
              <PreferenceToggle
                label="Course Marks & Gates"
                description="Mark positions, GPS coordinates, rounding instructions"
                value={preferences.extractCourseMarks}
                onToggle={() => togglePreference('extractCourseMarks')}
                icon={MapPin}
              />
              
              {preferences.comprehensiveMode && (
                <>
                  <PreferenceToggle
                    label="Prohibited Areas"
                    description="TSS zones, military areas, exclusion zones"
                    value={preferences.extractProhibitedAreas}
                    onToggle={() => togglePreference('extractProhibitedAreas')}
                    icon={MapPin}
                  />
                  
                  <PreferenceToggle
                    label="Rules & Penalties"
                    description="Penalty systems, protest procedures, special rules"
                    value={preferences.extractRules}
                    onToggle={() => togglePreference('extractRules')}
                    icon={FileText}
                  />
                </>
              )}

              {!preferences.filterToMyClass && (
                <PreferenceToggle
                  label="All Class Start Times"
                  description="Include start times for all classes"
                  value={preferences.extractAllClasses}
                  onToggle={() => togglePreference('extractAllClasses')}
                  icon={Clock}
                />
              )}
            </View>

            {/* Document Preview (if available) */}
            {documentPreview && (
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Document Preview:</Text>
                <Text style={styles.previewText} numberOfLines={3}>
                  {documentPreview}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>
                Extract {preferences.comprehensiveMode ? 'All' : 'Quick'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  modeDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  classScroll: {
    marginBottom: 12,
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  classChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  classChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  classChipTextActive: {
    color: '#1d4ed8',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  preferenceRowActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  preferenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  preferenceLabelActive: {
    color: '#1d4ed8',
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  previewSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ExtractionPreferencesDialog;

