/**
 * TufteAIExtractionSection Component
 *
 * Collapsible section for AI extraction.
 * Features:
 * - Collapsed by default with chevron indicator
 * - 3 input methods: Paste, Upload PDF, URL
 * - Inline progress during extraction
 * - Results auto-fill form fields
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ChevronRight, ChevronDown, Sparkles, FileText, Link, CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from './tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';
import type { RaceType } from '../RaceTypeSelector';
import type { ExtractedRaceData, ExtractedField } from '../ExtractionResults';
import { ComprehensiveRaceExtractionAgent } from '@/services/agents/ComprehensiveRaceExtractionAgent';
import { PDFExtractionService } from '@/services/PDFExtractionService';

// Transform extraction result to ExtractedRaceData format
function transformExtractionResult(result: any, raceType: RaceType): ExtractedRaceData {
  const createField = (
    label: string,
    value: string | undefined | null,
    confidence: 'high' | 'medium' | 'low' | 'missing' = 'medium'
  ): ExtractedField => ({
    label,
    value: value || '',
    confidence: value ? confidence : 'missing',
    editable: true,
  });

  // Helper to format schedule events
  const formatSchedule = (schedule: Array<{date: string; time: string; event: string; mandatory?: boolean}> | undefined) => {
    if (!schedule || schedule.length === 0) return undefined;
    return schedule
      .map(s => `${s.date} ${s.time}: ${s.event}${s.mandatory ? ' [MANDATORY]' : ''}`)
      .join('\n');
  };

  // Helper to format waypoints/peaks
  const formatWaypoints = (waypoints: Array<{name: string; notes?: string}> | undefined) => {
    if (!waypoints || waypoints.length === 0) return undefined;
    return waypoints.map((w, i) => `${i + 1}. ${w.name}`).join(', ');
  };

  // Helper to format prohibited areas
  const formatProhibitedAreas = (areas: Array<{name: string; description?: string}> | undefined) => {
    if (!areas || areas.length === 0) return undefined;
    return `${areas.length} areas: ${areas.map(a => a.name).join(', ')}`;
  };

  // Helper to format entry fees
  const formatEntryFees = (fees: Array<{type: string; amount: string}> | undefined) => {
    if (!fees || fees.length === 0) return undefined;
    return fees.map(f => `${f.type}: ${f.amount}`).join(', ');
  };

  // Get VHF channel from various sources
  const getVhfChannel = () => {
    if (result.vhfChannel) return result.vhfChannel;
    if (result.vhfChannels && result.vhfChannels.length > 0) {
      return result.vhfChannels.map((v: {channel: string; purpose?: string}) =>
        v.purpose ? `Ch ${v.channel} (${v.purpose})` : `Ch ${v.channel}`
      ).join(', ');
    }
    return undefined;
  };

  // Basic fields
  const basic: ExtractedField[] = [
    createField('Race Name', result.raceName || result.race_name, result.raceName ? 'high' : 'missing'),
    createField('Date', result.raceDate || result.date, result.raceDate || result.date ? 'high' : 'missing'),
    createField('Start Time', result.warningSignalTime || result.startTime || result.start_time, 'medium'),
    createField('Location', result.venue || result.location, result.venue ? 'high' : 'medium'),
    createField('Organizing Authority', result.organizingAuthority, 'medium'),
  ];

  // Timing fields - include schedule for multi-day events
  const timing: ExtractedField[] = [
    createField('First Warning', result.warningSignalTime || result.first_warning, 'medium'),
    createField('Race Series', result.raceSeriesName || result.race_series, 'medium'),
  ];

  // Add schedule if present (especially for distance races)
  if (result.schedule && result.schedule.length > 0) {
    timing.push(createField('Schedule', formatSchedule(result.schedule), 'high'));
  }

  // Type-specific course fields
  let course: ExtractedField[] = [];

  if (raceType === 'fleet') {
    course = [
      createField('Course Type', result.courseType || result.course_type, 'medium'),
      createField('Expected Fleet Size', result.expectedFleetSize?.toString(), 'low'),
      createField('Boat Class', result.boatClass || result.boat_class, result.boatClass ? 'high' : 'medium'),
    ];
  } else if (raceType === 'distance') {
    // Distance race fields
    course = [
      createField('Total Distance (nm)', result.totalDistanceNm?.toString() || result.approximateDistance, 'medium'),
      createField('Time Limit (hours)', result.timeLimitHours?.toString(), 'medium'),
      createField('Route Description', result.courseDescription || result.racingAreaDescription, 'medium'),
    ];

    // Add route waypoints/peaks if present
    if (result.routeWaypoints && result.routeWaypoints.length > 0) {
      course.push(createField('Route Waypoints', formatWaypoints(result.routeWaypoints), 'high'));
    }

    // Add start/finish areas
    if (result.startAreaName) {
      course.push(createField('Start Area', result.startAreaName, 'high'));
    }
    if (result.finishAreaName) {
      course.push(createField('Finish Area', result.finishAreaName, 'high'));
    }

    // Add prohibited areas
    if (result.prohibitedAreas && result.prohibitedAreas.length > 0) {
      course.push(createField('Prohibited Areas', formatProhibitedAreas(result.prohibitedAreas), 'high'));
    }

    // Add motoring division info
    if (result.motoringDivisionAvailable) {
      course.push(createField('Motoring Division', result.motoringDivisionRules || 'Available', 'medium'));
    }
  }

  // Conditions fields - enhanced
  const conditions: ExtractedField[] = [
    createField('VHF Channel', getVhfChannel(), 'medium'),
    createField('Weather Notes', result.expectedConditions, 'low'),
  ];

  // Add crew requirements for distance races
  if (result.minimumCrew) {
    conditions.push(createField('Minimum Crew', result.minimumCrew.toString(), 'high'));
  }
  if (result.crewRequirements) {
    conditions.push(createField('Crew Requirements', result.crewRequirements, 'high'));
  }

  // Add entry info
  if (result.entryFees && result.entryFees.length > 0) {
    conditions.push(createField('Entry Fees', formatEntryFees(result.entryFees), 'medium'));
  }
  if (result.entryDeadline) {
    conditions.push(createField('Entry Deadline', result.entryDeadline, 'medium'));
  }

  // Add scoring info for distance races
  if (result.scoringFormulaDescription) {
    conditions.push(createField('Scoring', result.scoringFormulaDescription, 'medium'));
  }

  return {
    basic,
    timing,
    course,
    conditions,
  };
}

export interface TufteAIExtractionSectionProps {
  /** Whether section is expanded */
  expanded: boolean;
  /** Toggle expanded state */
  onToggle: () => void;
  /** Callback when extraction completes successfully */
  onExtracted: (data: ExtractedRaceData, rawData?: any) => void;
  /** Currently selected race type */
  raceType: RaceType;
  /** Whether extraction is in progress (controlled externally) */
  isExtracting?: boolean;
  /** Set extraction state */
  setIsExtracting?: (value: boolean) => void;
}

type InputMethod = 'paste' | 'upload' | 'url';

export function TufteAIExtractionSection({
  expanded,
  onToggle,
  onExtracted,
  raceType,
  isExtracting: externalIsExtracting,
  setIsExtracting: externalSetIsExtracting,
}: TufteAIExtractionSectionProps) {
  const [activeMethod, setActiveMethod] = useState<InputMethod>('paste');
  const [pasteContent, setPasteContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [internalIsExtracting, setInternalIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionComplete, setExtractionComplete] = useState(false);

  const isExtracting = externalIsExtracting ?? internalIsExtracting;
  const setIsExtracting = externalSetIsExtracting ?? setInternalIsExtracting;

  const handleMethodSelect = useCallback((method: InputMethod) => {
    setActiveMethod(method);
    setError(null);
  }, []);

  const handleFilePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedFile(result.assets[0]);
        setError(null);
      }
    } catch (err) {
      setError('Failed to select file');
    }
  }, []);

  const canExtract = useCallback(() => {
    if (activeMethod === 'paste') return pasteContent.trim().length > 20;
    if (activeMethod === 'upload') return selectedFile !== null;
    if (activeMethod === 'url') return urlContent.trim().startsWith('http');
    return false;
  }, [activeMethod, pasteContent, urlContent, selectedFile]);

  const handleExtract = useCallback(async () => {
    if (!canExtract() || isExtracting) return;

    setIsExtracting(true);
    setError(null);

    try {
      let textContent = '';

      // Extract text based on input method
      if (activeMethod === 'paste') {
        textContent = pasteContent.trim();
      } else if (activeMethod === 'upload' && selectedFile) {
        // Extract text from uploaded PDF
        const pdfResult = await PDFExtractionService.extractText(selectedFile.uri, {
          maxPages: 50,
        });

        if (!pdfResult.success || !pdfResult.text) {
          throw new Error(pdfResult.error || 'Failed to extract text from PDF');
        }
        textContent = pdfResult.text;
      } else if (activeMethod === 'url' && urlContent.trim()) {
        const url = urlContent.trim();

        // Check if URL is a PDF
        const isPdfUrl = url.toLowerCase().includes('.pdf') ||
                         url.toLowerCase().includes('pdf=') ||
                         url.includes('_files/ugd/'); // Wix PDF pattern

        if (isPdfUrl) {
          // Use server-side PDF text extraction (works on all platforms including native)
          const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
          const extractUrl = `${supabaseUrl}/functions/v1/extract-pdf-text`;

          try {
            const extractResponse = await fetch(extractUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url }),
            });

            const extractResult = await extractResponse.json();

            if (!extractResponse.ok || !extractResult.success) {
              throw new Error(extractResult.error || `Failed to extract PDF text: ${extractResponse.status}`);
            }

            textContent = extractResult.text;
          } catch (pdfError: any) {
            console.error('[TufteAIExtractionSection] PDF extraction failed:', pdfError);
            throw new Error(`PDF extraction failed: ${pdfError.message}`);
          }
        } else {
          // Non-PDF URL - try direct fetch
          try {
            const response = await fetch(url);
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('pdf')) {
              throw new Error('This URL returns a PDF. Please use the PDF upload option or enter a direct webpage URL.');
            }

            textContent = await response.text();
          } catch (fetchError: any) {
            if (fetchError.message?.includes('PDF')) {
              throw fetchError;
            }
            throw new Error(
              'Could not fetch content from this URL.\n\n' +
              'Try: Copy text and use "Paste Text", or download PDF and use "PDF" upload.'
            );
          }
        }
      }

      if (!textContent || textContent.length < 20) {
        throw new Error('Not enough content to extract race details');
      }

      // Call the AI extraction agent
      const agent = new ComprehensiveRaceExtractionAgent();
      const result = await agent.extractRaceDetails(textContent);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to extract race details');
      }

      // Transform result to ExtractedRaceData format
      const extractedData = transformExtractionResult(result.data, raceType);

      setExtractionComplete(true);
      onExtracted(extractedData, result.data);

      // Collapse after short delay to show success state
      setTimeout(() => {
        onToggle();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  }, [canExtract, isExtracting, setIsExtracting, onExtracted, onToggle, activeMethod, pasteContent, urlContent, selectedFile, raceType]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="AI extraction section"
      >
        <View style={styles.headerLeft}>
          <Sparkles size={16} color={TUFTE_FORM_COLORS.aiAccent} />
          <Text style={styles.headerLabel}>AI EXTRACTION</Text>
          <Text style={styles.headerOptional}>(optional)</Text>
          {extractionComplete && (
            <CheckCircle size={14} color={TUFTE_FORM_COLORS.success} style={styles.successIcon} />
          )}
        </View>
        {expanded ? (
          <ChevronDown size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
        ) : (
          <ChevronRight size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
        )}
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.content}>
          {/* Method Tabs */}
          <View style={styles.methodTabs}>
            <Pressable
              style={[styles.methodTab, activeMethod === 'paste' && styles.methodTabActive]}
              onPress={() => handleMethodSelect('paste')}
            >
              <Text style={[styles.methodTabText, activeMethod === 'paste' && styles.methodTabTextActive]}>
                Paste Text
              </Text>
            </Pressable>
            <Pressable
              style={[styles.methodTab, activeMethod === 'upload' && styles.methodTabActive]}
              onPress={() => handleMethodSelect('upload')}
            >
              <FileText size={14} color={activeMethod === 'upload' ? IOS_COLORS.blue : TUFTE_FORM_COLORS.secondaryLabel} />
              <Text style={[styles.methodTabText, activeMethod === 'upload' && styles.methodTabTextActive]}>
                PDF
              </Text>
            </Pressable>
            <Pressable
              style={[styles.methodTab, activeMethod === 'url' && styles.methodTabActive]}
              onPress={() => handleMethodSelect('url')}
            >
              <Link size={14} color={activeMethod === 'url' ? IOS_COLORS.blue : TUFTE_FORM_COLORS.secondaryLabel} />
              <Text style={[styles.methodTabText, activeMethod === 'url' && styles.methodTabTextActive]}>
                URL
              </Text>
            </Pressable>
          </View>

          {/* Input Area */}
          {activeMethod === 'paste' && (
            <TextInput
              style={styles.textArea}
              value={pasteContent}
              onChangeText={setPasteContent}
              placeholder="Paste race notice, sailing instructions, or any text containing race details..."
              placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
              multiline
              textAlignVertical="top"
            />
          )}

          {activeMethod === 'upload' && (
            <Pressable style={styles.uploadArea} onPress={handleFilePick}>
              <FileText size={24} color={TUFTE_FORM_COLORS.secondaryLabel} />
              <Text style={styles.uploadText}>
                {selectedFile ? selectedFile.name : 'Tap to select PDF'}
              </Text>
              {selectedFile && (
                <Text style={styles.uploadHint}>Tap again to change</Text>
              )}
            </Pressable>
          )}

          {activeMethod === 'url' && (
            <TextInput
              style={styles.urlInput}
              value={urlContent}
              onChangeText={setUrlContent}
              placeholder="https://example.com/notice-of-race.pdf"
              placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          )}

          {/* Error */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Extract Button */}
          <Pressable
            style={[styles.extractButton, (!canExtract() || isExtracting) && styles.extractButtonDisabled]}
            onPress={handleExtract}
            disabled={!canExtract() || isExtracting}
          >
            {isExtracting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.extractButtonText}>Extract Race Details</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.hint}>
            AI will extract race name, date, location, and other details automatically.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: TUFTE_FORM_SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TUFTE_FORM_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1.2,
  },
  headerOptional: {
    fontSize: 11,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  successIcon: {
    marginLeft: 4,
  },
  content: {
    paddingTop: TUFTE_FORM_SPACING.md,
    gap: TUFTE_FORM_SPACING.md,
  },
  methodTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: TUFTE_FORM_COLORS.inputBackgroundDisabled,
    borderRadius: 8,
  },
  methodTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  methodTabTextActive: {
    color: IOS_COLORS.blue,
  },
  textArea: {
    backgroundColor: TUFTE_FORM_COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: TUFTE_FORM_COLORS.label,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  uploadArea: {
    backgroundColor: TUFTE_FORM_COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 15,
    color: TUFTE_FORM_COLORS.label,
  },
  uploadHint: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  urlInput: {
    backgroundColor: TUFTE_FORM_COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: TUFTE_FORM_COLORS.label,
  },
  errorText: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.error,
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TUFTE_FORM_COLORS.aiAccent,
    paddingVertical: 12,
    borderRadius: 8,
  },
  extractButtonDisabled: {
    opacity: 0.5,
  },
  extractButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});

export default TufteAIExtractionSection;
