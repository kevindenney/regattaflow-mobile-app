/**
 * AIExtractionStep Component
 *
 * Handles the AI extraction flow within AddRaceDialog
 * Wraps AIQuickEntry, ExtractionProgress, and ExtractionResults
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { ArrowLeft, PenLine } from 'lucide-react-native';
import { Typography, Spacing, BorderRadius, colors } from '@/constants/designSystem';
import { RaceType, RACE_TYPE_COLORS, RaceTypeBadge } from '../RaceTypeSelector';
import { AIQuickEntry, InputMethod } from '../AIQuickEntry';
import { ExtractionProgress, ExtractionStep } from '../ExtractionProgress';
import { ExtractionResults, ExtractedRaceData, ExtractedField } from '../ExtractionResults';
import { ComprehensiveRaceExtractionAgent } from '@/services/agents/ComprehensiveRaceExtractionAgent';
import { PDFExtractionService } from '@/services/PDFExtractionService';

type ExtractionState = 'input' | 'extracting' | 'results';

interface AIExtractionStepProps {
  raceType: RaceType;
  onExtracted: (data: ExtractedRaceData) => void;
  onManualEntry: () => void;
  onCancel: () => void;
}

export function AIExtractionStep({
  raceType,
  onExtracted,
  onManualEntry,
  onCancel,
}: AIExtractionStepProps) {
  const [state, setState] = useState<ExtractionState>('input');
  const [extractionStep, setExtractionStep] = useState<ExtractionStep>('parsing');
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedRaceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const typeColors = RACE_TYPE_COLORS[raceType];

  // Handle AI extraction
  const handleExtract = useCallback(async (method: InputMethod, content: string | File) => {
    setIsLoading(true);
    setState('extracting');
    setExtractionStep('parsing');
    setExtractionProgress(0);

    try {
      let textContent = '';

      // Handle different input methods
      if (method === 'upload' && content instanceof File) {
        setExtractionStep('parsing');
        setExtractionProgress(10);

        // For File uploads, we need to create a blob URL for PDF.js
        // content here is actually a URI string from DocumentPicker, not a File object
        const fileUri = typeof content === 'string' ? content : URL.createObjectURL(content);

        // Extract text from PDF
        const pdfResult = await PDFExtractionService.extractText(
          fileUri,
          {
            maxPages: 50,
            onProgress: (progress) => setExtractionProgress(Math.min(30, 10 + progress * 0.2)),
          }
        );

        // Clean up blob URL if we created one
        if (typeof content !== 'string') {
          URL.revokeObjectURL(fileUri);
        }

        if (!pdfResult.success || !pdfResult.text) {
          throw new Error(pdfResult.error || 'Failed to extract text from PDF');
        }
        textContent = pdfResult.text;
      } else if (method === 'url' && typeof content === 'string') {
        setExtractionStep('parsing');
        setExtractionProgress(10);

        // Check if URL is a PDF
        const isPdfUrl = content.toLowerCase().includes('.pdf') ||
                         content.toLowerCase().includes('pdf=') ||
                         content.includes('_files/ugd/'); // Wix PDF pattern

        if (isPdfUrl) {
          // Use pdf-proxy edge function to fetch PDF (avoids CORS issues)
          try {
            const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
            const proxyUrl = `${supabaseUrl}/functions/v1/pdf-proxy?url=${encodeURIComponent(content)}`;

            setExtractionProgress(15);
            const proxyResponse = await fetch(proxyUrl, {
              headers: {
                'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
              },
            });

            if (!proxyResponse.ok) {
              const errorData = await proxyResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to fetch PDF: ${proxyResponse.status}`);
            }

            // Get PDF as blob
            const pdfBlob = await proxyResponse.blob();
            const blobUrl = URL.createObjectURL(pdfBlob);

            setExtractionProgress(20);

            // Extract text from PDF using PDFExtractionService
            const pdfResult = await PDFExtractionService.extractText(blobUrl, {
              maxPages: 50,
              onProgress: (progress) => setExtractionProgress(Math.min(30, 20 + progress * 0.1)),
            });

            // Clean up blob URL
            URL.revokeObjectURL(blobUrl);

            if (!pdfResult.success || !pdfResult.text) {
              throw new Error(pdfResult.error || 'Failed to extract text from PDF');
            }

            textContent = pdfResult.text;
          } catch (pdfError: any) {
            console.error('[AIExtractionStep] PDF extraction failed:', pdfError);
            // Provide helpful error message
            throw new Error(
              `Could not extract text from this PDF URL. ${pdfError.message}\n\n` +
              'Tip: Try downloading the PDF and using the "Upload PDF" option instead.'
            );
          }
        } else {
          // Non-PDF URL - try direct fetch (may fail due to CORS)
          try {
            const response = await fetch(content);
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('pdf')) {
              // Content-type indicates PDF but URL didn't - use pdf-proxy
              throw new Error('PDF_DETECTED');
            }

            textContent = await response.text();
          } catch (fetchError: any) {
            if (fetchError.message === 'PDF_DETECTED') {
              throw new Error(
                'This URL returns a PDF file. Please use the "Upload PDF" option or enter a direct link to a webpage instead.'
              );
            }
            // If direct fetch fails due to CORS, provide helpful message
            console.error('[AIExtractionStep] URL fetch failed:', fetchError);
            throw new Error(
              `Could not fetch content from this URL (likely blocked by CORS).\n\n` +
              'Try one of these options:\n' +
              '• Copy the text from the webpage and use "Paste Text"\n' +
              '• If it\'s a PDF, download it and use "Upload PDF"'
            );
          }
        }
      } else if (typeof content === 'string') {
        textContent = content;
      }

      setExtractionProgress(30);
      setExtractionStep('extracting_basic');

      // Call the extraction agent
      const agent = new ComprehensiveRaceExtractionAgent();

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExtractionProgress((prev) => {
          if (prev >= 90) return prev;
          const newProgress = prev + 5;

          // Update step based on progress
          if (newProgress >= 40 && newProgress < 55) {
            setExtractionStep('extracting_basic');
          } else if (newProgress >= 55 && newProgress < 70) {
            setExtractionStep('extracting_course');
          } else if (newProgress >= 70 && newProgress < 85) {
            setExtractionStep('extracting_weather');
          } else if (newProgress >= 85) {
            setExtractionStep('validating');
          }

          return newProgress;
        });
      }, 500);

      const result = await agent.extractRaceDetails(textContent);

      clearInterval(progressInterval);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to extract race details');
      }

      setExtractionProgress(100);
      setExtractionStep('complete');

      // Transform result to ExtractedRaceData format
      const transformedData = transformExtractionResult(result.data, raceType);
      setExtractedData(transformedData);

      // Small delay to show completion
      setTimeout(() => {
        setState('results');
        setIsLoading(false);
      }, 500);

    } catch (error) {
      console.error('Extraction error:', error);
      setIsLoading(false);
      setState('input');
      Alert.alert(
        'Extraction Failed',
        'Unable to extract race details. Please try again or enter manually.',
        [
          { text: 'Try Again', style: 'cancel' },
          { text: 'Enter Manually', onPress: onManualEntry },
        ]
      );
    }
  }, [raceType, onManualEntry]);

  // Handle field changes in results
  const handleFieldChange = useCallback((
    section: keyof ExtractedRaceData,
    index: number,
    value: string
  ) => {
    if (!extractedData) return;

    setExtractedData((prev) => {
      if (!prev) return prev;
      const sectionData = prev[section];
      if (!Array.isArray(sectionData)) return prev;

      const newSection = [...sectionData];
      newSection[index] = { ...newSection[index], value };

      return { ...prev, [section]: newSection };
    });
  }, [extractedData]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (extractedData) {
      onExtracted(extractedData);
    }
  }, [extractedData, onExtracted]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setState('input');
    setExtractedData(null);
    setExtractionProgress(0);
    setExtractionStep('parsing');
  }, []);

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      {state === 'input' && (
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <RaceTypeBadge type={raceType} />
          </View>
          <Pressable onPress={onManualEntry} style={styles.manualButton}>
            <PenLine size={16} color={colors.text.secondary} />
            <Text style={styles.manualButtonText}>Manual</Text>
          </Pressable>
        </View>
      )}

      {/* Content based on state */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {state === 'input' && (
          <AIQuickEntry
            onExtract={handleExtract}
            onManualEntry={onManualEntry}
            loading={isLoading}
          />
        )}

        {state === 'extracting' && (
          <ExtractionProgress
            currentStep={extractionStep}
            progress={extractionProgress}
          />
        )}

        {state === 'results' && extractedData && (
          <ExtractionResults
            data={extractedData}
            onFieldChange={handleFieldChange}
            onConfirm={handleConfirm}
            onRetry={handleRetry}
          />
        )}
      </ScrollView>
    </View>
  );
}

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

  // Basic fields common to all race types
  const basic: ExtractedField[] = [
    createField('Race Name', result.raceName || result.race_name, result.raceName ? 'high' : 'missing'),
    createField('Date', result.date || result.raceDate, result.date ? 'high' : 'missing'),
    createField('Start Time', result.startTime || result.start_time, result.startTime ? 'high' : 'medium'),
    createField('Location', result.venue || result.location, result.venue ? 'high' : 'medium'),
    createField('VHF Channel', result.vhfChannel || result.vhf_channel, 'medium'),
  ];

  // Timing fields
  const timing: ExtractedField[] = [
    createField('First Warning', result.firstWarning || result.first_warning, 'medium'),
    createField('Race Series', result.raceSeries || result.race_series, 'medium'),
    createField('Event', result.event || result.eventName, 'medium'),
  ];

  // Type-specific course fields
  let course: ExtractedField[] = [];

  if (raceType === 'fleet') {
    course = [
      createField('Course Type', result.courseType || result.course_type, 'medium'),
      createField('Number of Laps', result.numberOfLaps?.toString() || result.laps?.toString(), 'medium'),
      createField('Expected Fleet Size', result.fleetSize?.toString() || result.expected_fleet_size?.toString(), 'low'),
      createField('Boat Class', result.boatClass || result.boat_class, result.boatClass ? 'high' : 'medium'),
    ];
  } else if (raceType === 'distance') {
    course = [
      createField('Total Distance (nm)', result.totalDistance?.toString() || result.distance_nm?.toString(), 'medium'),
      createField('Time Limit (hours)', result.timeLimit?.toString() || result.time_limit_hours?.toString(), 'medium'),
      createField('Route Description', result.routeDescription || result.route, 'medium'),
      createField('Start/Finish Same', result.startFinishSame ? 'Yes' : 'No', 'low'),
    ];
  } else if (raceType === 'match') {
    course = [
      createField('Opponent', result.opponent || result.opponent_name, 'medium'),
      createField('Round', result.round?.toString() || result.match_round?.toString(), 'medium'),
      createField('Total Rounds', result.totalRounds?.toString(), 'low'),
      createField('Series Format', result.seriesFormat || result.series_format, 'medium'),
      createField('On-Water Umpire', result.hasUmpire ? 'Yes' : 'No', 'low'),
    ];
  } else if (raceType === 'team') {
    course = [
      createField('Your Team', result.yourTeam || result.your_team_name, 'medium'),
      createField('Opponent Team', result.opponentTeam || result.opponent_team_name, 'medium'),
      createField('Heat Number', result.heatNumber?.toString() || result.heat_number?.toString(), 'medium'),
      createField('Team Size', result.teamSize?.toString() || result.team_size?.toString(), 'medium'),
      createField('Team Members', result.teamMembers || '', 'low'),
    ];
  }

  // Conditions fields
  const conditions: ExtractedField[] = [
    createField('Wind Forecast', result.windForecast || result.wind, 'medium'),
    createField('Tide State', result.tideState || result.tide, 'medium'),
    createField('Weather Notes', result.weatherNotes || result.conditions, 'low'),
  ];

  return {
    basic,
    timing,
    course,
    conditions,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: Spacing.xs,
  },
  manualButtonText: {
    ...Typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
});

export default AIExtractionStep;
