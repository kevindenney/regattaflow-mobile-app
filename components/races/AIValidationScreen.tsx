/**
 * AI Validation Screen Component
 * Allows users to review and correct AI-extracted race data before creation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
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
  courseDescription?: string;  // Full course description
  potentialCourses?: Array<string>;  // List of possible courses

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
  vhfChannel?: string;  // Legacy single channel field
  vhfChannels?: Array<{
    channel: string;
    purpose: string;      // e.g., "Inner Starting Line", "Outer Starting Line", "Safety"
    classes?: string[];   // Which classes use this channel
  }>;
  safetyChannel?: string;
  raceOfficer?: string;

  // === WEATHER (legacy - not displayed, weather fetched dynamically from coordinates) ===
  expectedWindSpeedMin?: number;
  expectedWindSpeedMax?: number;
  
  // === START AREA ===
  startAreaName?: string;
  startAreaDescription?: string;
  
  // === MULTIPLE START LINES ===
  startLines?: Array<{
    name: string;
    description?: string;
    classes: string[];
    vhfChannel?: string;
    marks?: {
      starboardEnd?: string;
      portEnd?: string;
    };
    direction?: string;
    startTimes?: Array<{
      class: string;
      flag: string;
      time: string;
    }>;
  }>;
  
  // === RACING AREA ===
  racingAreaName?: string;
  racingAreaDescription?: string;
  approximateDistance?: string;
  
  // === PROHIBITED AREAS ===
  prohibitedAreas?: Array<{
    name: string;
    description?: string;
    coordinates?: Array<{ lat: number; lng: number }>;
    consequence?: string;
  }>;
  
  // === COURSE GATES ===
  gates?: Array<{
    name: string;
    description?: string;
    orientation?: string;
    portMark?: string;
    starboardMark?: string;
    canShortenHere?: boolean;
  }>;
  
  // === FINISH AREA ===
  finishAreaName?: string;
  finishAreaDescription?: string;

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
  onConfirm: (validatedData: ExtractedData) => void | Promise<void>;
  onCancel: () => void;
  userBoatClass?: string;  // For smart filtering
  filterToUserClass?: boolean;  // Whether to filter by default
}

// Helper to check if a class name matches (case-insensitive, partial match)
const classMatches = (classes: string[] | undefined, targetClass: string): boolean => {
  if (!classes || classes.length === 0) return false;
  const target = targetClass.toLowerCase();
  return classes.some(c => 
    c.toLowerCase().includes(target) || 
    target.includes(c.toLowerCase())
  );
};

// Filter start lines to show relevant ones first
const filterStartLines = (
  startLines: ExtractedData['startLines'], 
  userClass: string | undefined,
  filterEnabled: boolean
) => {
  if (!startLines || !userClass || !filterEnabled) return startLines;
  
  // Sort: matching classes first, then others
  return [...startLines].sort((a, b) => {
    const aMatches = classMatches(a.classes, userClass);
    const bMatches = classMatches(b.classes, userClass);
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return 0;
  });
};

export function AIValidationScreen({
  extractedData,
  confidenceScores = {},
  onConfirm,
  onCancel,
  userBoatClass,
  filterToUserClass = false,
}: AIValidationScreenProps) {
  const [data, setData] = useState<ExtractedData>(extractedData);
  
  // Debug logging for start/finish fields
  useEffect(() => {
    console.log('[AIValidationScreen] Received extracted data:', {
      startAreaName: extractedData?.startAreaName,
      startAreaDescription: extractedData?.startAreaDescription,
      finishAreaName: extractedData?.finishAreaName,
      finishAreaDescription: extractedData?.finishAreaDescription,
      startLines: extractedData?.startLines,
    });
  }, [extractedData]);
  const [showMyClassOnly, setShowMyClassOnly] = useState(filterToUserClass);

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
      ],
    },
    {
      title: 'Communications',
      fields: [
        { key: 'vhfChannel', label: 'VHF Channel', placeholder: 'e.g., 72', isVhfChannels: true },
        { key: 'raceOfficer', label: 'Race Officer', placeholder: 'Officer name' },
      ],
    },
    {
      title: 'Rules & Scoring',
      fields: [
        { key: 'scoringSystem', label: 'Scoring System', placeholder: 'e.g., Low Point' },
        { key: 'penaltySystem', label: 'Penalty System', placeholder: 'e.g., One-Turn Penalty' },
      ],
    },
    {
      title: 'Course Information',
      fields: [
        { key: 'courseArea', label: 'Course Area', placeholder: 'e.g., Harbour, Port Shelter' },
        { key: 'courseDescription', label: 'Course Description', placeholder: 'Full course description', multiline: true },
        { key: 'courseSelectionCriteria', label: 'Course Selection Criteria', placeholder: 'How course is selected', multiline: true },
      ],
    },
    {
      title: 'Start & Finish',
      fields: [
        { key: 'startAreaName', label: 'Start Area Name', placeholder: 'e.g., Inner Starting Line' },
        { key: 'finishAreaName', label: 'Finish Area Name', placeholder: 'e.g., Club Finishing Line' },
        { key: 'finishAreaDescription', label: 'Finish Area Description', placeholder: 'How boats finish', multiline: true },
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
          <Text style={styles.subtitle}>Review data, then click "Confirm & Create" below</Text>
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

        {/* Action Banner */}
        <View style={styles.actionBanner}>
          <CheckCircle size={20} color="#059669" strokeWidth={2} />
          <View style={styles.actionBannerText}>
            <Text style={styles.actionBannerTitle}>Ready to Apply</Text>
            <Text style={styles.actionBannerSubtitle}>
              Review the fields below, make any edits, then scroll down and click "Confirm & Create"
            </Text>
          </View>
        </View>

        {/* Field Groups */}
        {fieldGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.fieldGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.fields.map((field) => {
              // Special handling for VHF channels - supports array or string
              if (field.isVhfChannels) {
                const vhfChannels = data.vhfChannels;
                const legacyChannel = data.vhfChannel;
                
                // If we have an array of channels, render them nicely
                if (vhfChannels && Array.isArray(vhfChannels) && vhfChannels.length > 0) {
                  return (
                    <View key={field.key} style={styles.vhfChannelsContainer}>
                      <Text style={styles.fieldLabel}>VHF Channels</Text>
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>
                          {Math.round((confidenceScores[field.key] || 0.95) * 100)}%
                        </Text>
                      </View>
                      {vhfChannels.map((vhf, idx) => (
                        <View key={idx} style={styles.vhfChannelCard}>
                          <View style={styles.vhfChannelHeader}>
                            <Text style={styles.vhfChannelNumber}>Ch {vhf.channel}</Text>
                            <Text style={styles.vhfChannelPurpose}>{vhf.purpose}</Text>
                          </View>
                          {vhf.classes && vhf.classes.length > 0 && (
                            <Text style={styles.vhfChannelClasses}>
                              Classes: {vhf.classes.join(', ')}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  );
                }
                
                // Fall back to legacy single channel display
                const displayValue = typeof legacyChannel === 'string' 
                  ? legacyChannel 
                  : typeof legacyChannel === 'object' && legacyChannel !== null
                    ? JSON.stringify(legacyChannel)
                    : '';
                    
                return (
                  <EditableField
                    key={field.key}
                    label={field.label}
                    value={displayValue}
                    confidence={confidenceScores[field.key]}
                    onValueChange={(value) => handleFieldChange(field.key, value)}
                    placeholder={field.placeholder}
                    multiline={field.multiline}
                  />
                );
              }
              
              // Standard field rendering
              return (
                <EditableField
                  key={field.key}
                  label={field.label}
                  value={String(data[field.key] || '')}
                  confidence={confidenceScores[field.key]}
                  onValueChange={(value) => handleFieldChange(field.key, value)}
                  placeholder={field.placeholder}
                  multiline={field.multiline}
                />
              );
            })}
          </View>
        ))}

        {/* Multiple Start Lines */}
        {data.startLines && data.startLines.length > 0 && (
          <View style={styles.fieldGroup}>
            <View style={styles.startLinesHeader}>
              <Text style={styles.groupTitle}>🏁 Starting Lines ({data.startLines.length})</Text>
              {userBoatClass && (
                <TouchableOpacity
                  style={[styles.filterToggle, showMyClassOnly && styles.filterToggleActive]}
                  onPress={() => setShowMyClassOnly(!showMyClassOnly)}
                >
                  <Text style={[styles.filterToggleText, showMyClassOnly && styles.filterToggleTextActive]}>
                    {showMyClassOnly ? `Showing: ${userBoatClass}` : 'Show All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {filterStartLines(data.startLines, userBoatClass, showMyClassOnly).map((line, index) => {
              const isMyLine = userBoatClass && classMatches(line.classes, userBoatClass);
              
              return (
                <View key={index} style={[styles.startLineCard, isMyLine && styles.startLineCardHighlighted]}>
                  <View style={styles.startLineHeader}>
                    <View style={styles.startLineNameContainer}>
                      <Text style={styles.startLineName}>{line.name}</Text>
                      {isMyLine && (
                        <Text style={styles.myLineBadge}>YOUR LINE</Text>
                      )}
                    </View>
                    {line.vhfChannel && (
                      <Text style={styles.startLineVhf}>VHF {line.vhfChannel}</Text>
                    )}
                  </View>
                  
                  {line.description && (
                    <Text style={styles.startLineDescription}>{line.description}</Text>
                  )}
                  
                  {line.marks && (line.marks.starboardEnd || line.marks.portEnd) && (
                    <View style={styles.startLineMarks}>
                      {line.marks.starboardEnd && (
                        <Text style={styles.startLineMark}>▶ Starboard: {line.marks.starboardEnd}</Text>
                      )}
                      {line.marks.portEnd && (
                        <Text style={styles.startLineMark}>◀ Port: {line.marks.portEnd}</Text>
                      )}
                      {line.direction && (
                        <Text style={styles.startLineDirection}>Direction: {line.direction}</Text>
                      )}
                    </View>
                  )}
                  
                  {line.classes && line.classes.length > 0 && (
                    <View style={styles.startLineClasses}>
                      <Text style={styles.startLineClassesLabel}>Classes on this line:</Text>
                      <Text style={styles.startLineClassesList}>
                        {line.classes.map((cls, i) => (
                          <Text key={i}>
                            {i > 0 && ', '}
                            <Text style={userBoatClass && cls.toLowerCase().includes(userBoatClass.toLowerCase()) ? styles.highlightedClass : undefined}>
                              {cls}
                            </Text>
                          </Text>
                        ))}
                      </Text>
                    </View>
                  )}
                  
                  {line.startTimes && line.startTimes.length > 0 && (
                    <View style={styles.startTimesContainer}>
                      <Text style={styles.startTimesLabel}>Start Schedule:</Text>
                      {(showMyClassOnly && userBoatClass
                        ? line.startTimes.filter(st => 
                            st.class.toLowerCase().includes(userBoatClass.toLowerCase()) ||
                            userBoatClass.toLowerCase().includes(st.class.toLowerCase())
                          )
                        : line.startTimes.slice(0, 5)
                      ).map((st, stIndex) => {
                        const isMyClass = userBoatClass && (
                          st.class.toLowerCase().includes(userBoatClass.toLowerCase()) ||
                          userBoatClass.toLowerCase().includes(st.class.toLowerCase())
                        );
                        return (
                          <View key={stIndex} style={[styles.startTimeRow, isMyClass && styles.startTimeRowHighlighted]}>
                            <Text style={[styles.startTimeClass, isMyClass && styles.startTimeClassHighlighted]}>
                              {st.class}
                            </Text>
                            <Text style={styles.startTimeFlag}>{st.flag}</Text>
                            <Text style={[styles.startTimeTime, isMyClass && styles.startTimeTimeHighlighted]}>
                              {st.time}
                            </Text>
                          </View>
                        );
                      })}
                      {!showMyClassOnly && line.startTimes.length > 5 && (
                        <Text style={styles.startTimesMore}>
                          +{line.startTimes.length - 5} more classes...
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Course Gates */}
        {data.gates && data.gates.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.groupTitle}>🚪 Course Gates ({data.gates.length})</Text>
            
            {data.gates.map((gate, index) => (
              <View key={index} style={styles.gateCard}>
                <Text style={styles.gateName}>{gate.name}</Text>
                {gate.orientation && (
                  <Text style={styles.gateOrientation}>Orientation: {gate.orientation}</Text>
                )}
                {gate.description && (
                  <Text style={styles.gateDescription}>{gate.description}</Text>
                )}
                {gate.canShortenHere && (
                  <Text style={styles.gateShorten}>⚠️ Possible shortened course finish</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Prohibited Areas */}
        {data.prohibitedAreas && data.prohibitedAreas.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.groupTitle}>⛔ Prohibited Areas ({data.prohibitedAreas.length})</Text>
            
            {data.prohibitedAreas.map((area, index) => (
              <View key={index} style={styles.prohibitedAreaCard}>
                <Text style={styles.prohibitedAreaName}>{area.name}</Text>
                {area.description && (
                  <Text style={styles.prohibitedAreaDescription}>{area.description}</Text>
                )}
                {area.consequence && (
                  <Text style={styles.prohibitedAreaConsequence}>⚠️ {area.consequence}</Text>
                )}
                {area.coordinates && area.coordinates.length > 0 && (
                  <Text style={styles.prohibitedAreaCoords}>
                    📍 {area.coordinates.length} coordinate points
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Potential Courses */}
        {data.potentialCourses && data.potentialCourses.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.groupTitle}>📋 Potential Courses ({data.potentialCourses.length})</Text>
            {data.potentialCourses.map((course, index) => (
              <View key={index} style={styles.courseCard}>
                <Text style={styles.courseName}>{course}</Text>
              </View>
            ))}
          </View>
        )}

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
    paddingBottom: 100, // Extra space so content doesn't hide behind footer
  },
  summaryContainer: {
    marginBottom: 16,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#6ee7b7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  actionBannerText: {
    flex: 1,
  },
  actionBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 4,
  },
  actionBannerSubtitle: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
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
    paddingBottom: Platform.OS === 'web' ? 80 : 16, // Extra padding for tab bar on web
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
  // VHF Channels styles
  vhfChannelsContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  confidenceBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  vhfChannelCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  vhfChannelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vhfChannelNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vhfChannelPurpose: {
    fontSize: 14,
    fontWeight: '500',
    color: '#15803d',
    flex: 1,
  },
  vhfChannelClasses: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 6,
    paddingLeft: 4,
  },
  // Start Lines styles
  startLinesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterToggleActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterToggleTextActive: {
    color: '#1d4ed8',
  },
  startLineCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  startLineCardHighlighted: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
    borderWidth: 2,
  },
  startLineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  startLineNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  startLineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
  },
  myLineBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#22c55e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  startLineVhf: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  startLineDescription: {
    fontSize: 13,
    color: '#78350f',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  startLineMarks: {
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  startLineMark: {
    fontSize: 13,
    color: '#78350f',
    marginBottom: 2,
  },
  startLineDirection: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    marginTop: 4,
  },
  startLineClasses: {
    marginBottom: 8,
  },
  startLineClassesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 2,
  },
  startLineClassesList: {
    fontSize: 13,
    color: '#78350f',
  },
  startTimesContainer: {
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    padding: 8,
  },
  startTimesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 6,
  },
  startTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  startTimeClass: {
    flex: 2,
    fontSize: 13,
    color: '#78350f',
  },
  startTimeFlag: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
  },
  startTimeTime: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#78350f',
    textAlign: 'right',
  },
  startTimesMore: {
    fontSize: 12,
    color: '#b45309',
    fontStyle: 'italic',
    marginTop: 4,
  },
  startTimeRowHighlighted: {
    backgroundColor: '#dcfce7',
    borderRadius: 4,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  startTimeClassHighlighted: {
    fontWeight: '700',
    color: '#15803d',
  },
  startTimeTimeHighlighted: {
    fontWeight: '700',
    color: '#15803d',
  },
  highlightedClass: {
    fontWeight: '700',
    color: '#15803d',
  },
  // Gate styles
  gateCard: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  gateName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  gateOrientation: {
    fontSize: 13,
    color: '#3b82f6',
  },
  gateDescription: {
    fontSize: 13,
    color: '#1e3a8a',
    marginTop: 4,
  },
  gateShorten: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: '500',
    marginTop: 6,
  },
  // Prohibited Areas styles
  prohibitedAreaCard: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  prohibitedAreaName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  prohibitedAreaDescription: {
    fontSize: 13,
    color: '#7f1d1d',
  },
  prohibitedAreaConsequence: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    marginTop: 6,
  },
  prohibitedAreaCoords: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  // Course styles
  courseCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
  },
});
