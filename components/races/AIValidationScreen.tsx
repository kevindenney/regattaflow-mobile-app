/**
 * AI Validation Screen Component
 * Allows users to review and correct AI-extracted race data before creation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { ValidationSummary } from './ValidationSummary';
import { EditableField } from './EditableField';

export interface ExtractedData {
  // === BASIC INFORMATION ===
  raceName?: string;
  raceSeriesName?: string | null;
  raceDate?: string;
  venue?: string;
  venueVariant?: string | null;
  description?: string;

  // === TIMING & SCHEDULE ===
  warningSignalTime?: string;
  racesPerDay?: number;
  raceNumber?: number;
  totalRacesInSeries?: number;

  // === GOVERNING RULES ===
  racingRulesSystem?: string;
  prescriptions?: string;
  classRules?: string;
  ssiReference?: string;
  courseAttachmentReference?: string;

  // === ELIGIBILITY & ENTRY ===
  eligibilityRequirements?: string;
  entryFormUrl?: string;
  entryDeadline?: string;
  signOnRequirement?: string;
  crewListRequirement?: string;
  safetyBriefingRequired?: boolean;

  // === CLASS & FLEET ===
  boatClass?: string;
  classDivisions?: Array<{ name: string; fleet_size: number }>;

  // === SCORING ===
  scoringSystem?: string;
  seriesRacesRequired?: number;
  discardsPolicy?: string;

  // === COURSE & VENUE ===
  courseArea?: string;
  courseSelectionCriteria?: string;

  // === SAFETY ===
  safetyRequirements?: string;
  safetyConsequences?: string;

  // === INSURANCE ===
  insuranceRequired?: boolean;
  minimumInsuranceCoverage?: string;

  // === PRIZES ===
  prizesDescription?: string;

  // === ADDITIONAL INFO ===
  organizer?: string;
  classSecretary?: string;
  specialDesignations?: Array<string>;

  // === COMMUNICATIONS ===
  vhfChannel?: string;
  safetyChannel?: string;
  raceOfficer?: string;

  // === WEATHER (legacy) ===
  expectedWindSpeedMin?: number;
  expectedWindSpeedMax?: number;
  startAreaName?: string;

  // === GPS MARKS & COURSE LAYOUT ===
  marks?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    type: string;
    color?: string;
    shape?: string;
  }>;
  racingArea?: {
    type: 'rectangle' | 'polygon';
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };

  // === CONFIDENCE SCORES ===
  confidenceScores?: {
    raceName?: number;
    raceDate?: number;
    venue?: number;
    overall?: number;
    [key: string]: number | undefined;
  };

  // Allow additional fields
  [key: string]: any;
}

// Multi-race extraction response
export interface MultiRaceExtractedData {
  multipleRaces: boolean;
  races: ExtractedData[];
  documentType: 'NOR' | 'SI' | 'CALENDAR' | 'AMENDMENT' | 'OTHER';
  organizingAuthority?: string | null;
  overallConfidence: number;
}

export interface FieldConfidenceMap {
  [key: string]: number; // 0.0 to 1.0
}

interface AIValidationScreenProps {
  extractedData: ExtractedData;
  confidenceScores?: FieldConfidenceMap;
  onConfirm: (validatedData: ExtractedData) => void;
  onCancel: () => void;
}

export function AIValidationScreen({
  extractedData,
  confidenceScores = {},
  onConfirm,
  onCancel,
}: AIValidationScreenProps) {
  const [data, setData] = useState<ExtractedData>(extractedData);

  // Calculate validation statistics
  const getValidationStats = () => {
    const fields = Object.keys(data);
    const totalFields = fields.length;

    let highConfidence = 0;
    let mediumConfidence = 0;
    let lowConfidence = 0;
    let missingFields = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    fields.forEach(key => {
      const value = data[key];
      const confidence = confidenceScores[key] || 0.5;

      if (!value || value === '' || value === null || value === undefined) {
        missingFields++;
      } else {
        totalConfidence += confidence;
        confidenceCount++;

        if (confidence >= 0.8) {
          highConfidence++;
        } else if (confidence >= 0.5) {
          mediumConfidence++;
        } else {
          lowConfidence++;
        }
      }
    });

    const overallConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    return {
      totalFields,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      missingFields,
      overallConfidence,
    };
  };

  const stats = getValidationStats();

  const handleFieldChange = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirm = () => {
    // Check if critical fields are filled
    const criticalFields = ['raceName', 'raceDate', 'venue'];
    const missingCritical = criticalFields.filter(field => !data[field]);

    if (missingCritical.length > 0) {
      Alert.alert(
        'Missing Required Fields',
        `Please provide: ${missingCritical.join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    onConfirm(data);
  };

  // Define field groups for better organization
  const fieldGroups = [
    {
      title: 'Basic Information',
      fields: [
        { key: 'raceName', label: 'Race Name', placeholder: 'Enter race name' },
        { key: 'raceDate', label: 'Race Date', placeholder: 'YYYY-MM-DD' },
        { key: 'venue', label: 'Venue', placeholder: 'Enter venue name' },
        { key: 'description', label: 'Description', placeholder: 'Race description', multiline: true },
      ],
    },
    {
      title: 'Timing & Schedule',
      fields: [
        { key: 'warningSignalTime', label: 'Warning Signal Time', placeholder: 'HH:MM' },
        { key: 'startAreaName', label: 'Start Area', placeholder: 'Start area name' },
      ],
    },
    {
      title: 'Communications',
      fields: [
        { key: 'vhfChannel', label: 'VHF Channel', placeholder: 'e.g., 72' },
        { key: 'raceOfficer', label: 'Race Officer', placeholder: 'Officer name' },
      ],
    },
    {
      title: 'Conditions',
      fields: [
        { key: 'expectedWindSpeedMin', label: 'Min Wind Speed (kts)', placeholder: 'e.g., 10' },
        { key: 'expectedWindSpeedMax', label: 'Max Wind Speed (kts)', placeholder: 'e.g., 18' },
      ],
    },
    {
      title: 'Rules & Scoring',
      fields: [
        { key: 'scoringSystem', label: 'Scoring System', placeholder: 'e.g., Low Point' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <ArrowLeft size={24} color="#6b7280" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Verify Extracted Data</Text>
          <Text style={styles.subtitle}>Review and correct AI-extracted information</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Validation Summary */}
        <View style={styles.summaryContainer}>
          <ValidationSummary {...stats} />
        </View>

        {/* Field Groups */}
        {fieldGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.fieldGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.fields.map((field) => (
              <EditableField
                key={field.key}
                label={field.label}
                value={String(data[field.key] || '')}
                confidence={confidenceScores[field.key]}
                onValueChange={(value) => handleFieldChange(field.key, value)}
                placeholder={field.placeholder}
                multiline={field.multiline}
              />
            ))}
          </View>
        ))}

        {/* Course Marks & Racing Area */}
        {(data.marks && data.marks.length > 0) || data.racingArea ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.groupTitle}>📍 Course Marks & Racing Area</Text>

            {/* Extracted Marks */}
            {data.marks && data.marks.length > 0 && (
              <View style={styles.marksContainer}>
                <Text style={styles.marksLabel}>
                  Extracted Course Marks ({data.marks.length})
                </Text>
                {data.marks.map((mark, index) => (
                  <View key={index} style={styles.markCard}>
                    <View style={styles.markHeader}>
                      <Text style={styles.markName}>{mark.name}</Text>
                      <Text style={styles.markType}>{mark.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.markCoords}>
                      📍 {mark.latitude.toFixed(6)}°, {mark.longitude.toFixed(6)}°
                    </Text>
                    {mark.color && (
                      <Text style={styles.markDetail}>🎨 {mark.color}</Text>
                    )}
                    {mark.shape && (
                      <Text style={styles.markDetail}>⚓ {mark.shape}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Racing Area Bounds */}
            {data.racingArea && (
              <View style={styles.racingAreaContainer}>
                <Text style={styles.marksLabel}>Racing Area Boundaries</Text>
                <View style={styles.boundsGrid}>
                  <View style={styles.boundItem}>
                    <Text style={styles.boundLabel}>North:</Text>
                    <Text style={styles.boundValue}>
                      {data.racingArea.bounds.north.toFixed(6)}°
                    </Text>
                  </View>
                  <View style={styles.boundItem}>
                    <Text style={styles.boundLabel}>South:</Text>
                    <Text style={styles.boundValue}>
                      {data.racingArea.bounds.south.toFixed(6)}°
                    </Text>
                  </View>
                  <View style={styles.boundItem}>
                    <Text style={styles.boundLabel}>East:</Text>
                    <Text style={styles.boundValue}>
                      {data.racingArea.bounds.east.toFixed(6)}°
                    </Text>
                  </View>
                  <View style={styles.boundItem}>
                    <Text style={styles.boundLabel}>West:</Text>
                    <Text style={styles.boundValue}>
                      {data.racingArea.bounds.west.toFixed(6)}°
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.marksNote}>
              💡 These marks will be saved and available for map visualization in the Strategy tab.
            </Text>
          </View>
        ) : null}

        {/* Helpful tip */}
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 <Text style={styles.tipBold}>Tip:</Text> You can always edit these details later from the race detail page.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleConfirm}
          style={styles.confirmButton}
        >
          <CheckCircle size={20} color="#ffffff" strokeWidth={2} />
          <Text style={styles.confirmButtonText}>Confirm & Create</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  fieldGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  tipBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 16,
  },
  tipText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  tipBold: {
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  marksContainer: {
    marginTop: 12,
  },
  marksLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  markCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  markHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  markName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e40af',
  },
  markType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  markCoords: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  markDetail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  racingAreaContainer: {
    marginTop: 16,
  },
  boundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  boundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '47%',
  },
  boundLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 6,
  },
  boundValue: {
    fontSize: 13,
    color: '#1e293b',
    fontFamily: 'monospace',
  },
  marksNote: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
