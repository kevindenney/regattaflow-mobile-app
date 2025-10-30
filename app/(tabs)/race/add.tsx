/**
 * Add Race Screen - Quick race entry form
 * Allows sailors to quickly add upcoming races to their calendar
 */

import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ComprehensiveRaceExtractionAgent } from '@/services/agents/ComprehensiveRaceExtractionAgent';
import { PDFExtractionService } from '@/services/PDFExtractionService';
import { createLogger } from '@/lib/utils/logger';

type DocumentType = 'nor' | 'si' | 'other';

export default function AddRaceScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ courseId?: string; courseName?: string }>();
  const initialCourseId =
    typeof params?.courseId === 'string' && params.courseId.length > 0
      ? params.courseId
      : undefined;
  const initialCourseName =
    typeof params?.courseName === 'string' && params.courseName.length > 0
      ? params.courseName
      : undefined;
  const [raceName, setRaceName] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [saving, setSaving] = useState(false);

  // AI Quick Entry state
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [currentDocType, setCurrentDocType] = useState<DocumentType | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock classes - should come from user's boats
  const classes = ['Dragon', 'Laser', 'J/70', 'Optimist', '420'];

  const getDocTypeName = (type: DocumentType): string => {
    switch (type) {
      case 'nor':
        return 'Notice of Race';
      case 'si':
        return 'Sailing Instructions';
      case 'other':
        return 'Other Documents';
      default:
        return 'Document';
    }
  };

  const populateFormFromExtraction = (data: any) => {

    // Populate race name
    if (data.raceName) {
      setRaceName(data.raceName);
      logger.debug('[PopulateForm] Set race name:', data.raceName);
    }

    // Populate venue
    if (data.venue) {
      setVenue(data.venue);
      logger.debug('[PopulateForm] Set venue:', data.venue);
    }

    // Populate start date
    if (data.raceDate) {
      try {
        const date = new Date(data.raceDate);
        const formatted = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
        setStartDate(formatted);
        logger.debug('[PopulateForm] Set start date:', formatted);
      } catch (error) {
        console.error('[PopulateForm] Error formatting date:', error);
      }
    }

    // Try to extract class from divisions or description
    if (data.classDivisions && data.classDivisions.length > 0) {
      const firstClass = data.classDivisions[0].name;
      // Check if it matches one of our predefined classes
      const matchingClass = classes.find(c =>
        firstClass.toLowerCase().includes(c.toLowerCase())
      );
      if (matchingClass) {
        setSelectedClass(matchingClass);
        logger.debug('[PopulateForm] Set class:', matchingClass);
      }
    }
  };

  const handleDocumentUpload = async (docType: DocumentType) => {
    try {
      // On web, we need to use a different approach
      if (Platform.OS === 'web') {
        // Create a file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.txt,image/*';

        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;

          logger.debug('[Upload] Selected file:', file.name, file.type);

          // Show processing indicator
          setIsProcessing(true);
          setCurrentDocType(docType);

          try {
            let extractedText = '';

            // Extract text based on file type
            if (file.type === 'application/pdf') {
              logger.debug('[Upload] Processing PDF...');
              // Create a URL for the file
              const fileUrl = URL.createObjectURL(file);

              // Extract text from PDF
              const pdfResult = await PDFExtractionService.extractText(fileUrl, {
                onProgress: (progress, currentPage, totalPages) => {
                  logger.debug(`[Upload] PDF extraction progress: ${progress.toFixed(0)}% (page ${currentPage}/${totalPages})`);
                },
              });

              // Clean up the URL
              URL.revokeObjectURL(fileUrl);

              if (!pdfResult.success || !pdfResult.text) {
                throw new Error(pdfResult.error || 'Failed to extract text from PDF');
              }

              extractedText = pdfResult.text;
              logger.debug('[Upload] PDF text extracted, length:', extractedText.length);
            } else if (file.type === 'text/plain') {
              logger.debug('[Upload] Processing text file...');
              // Read text file
              extractedText = await file.text();
              logger.debug('[Upload] Text file read, length:', extractedText.length);
            } else {
              throw new Error('Unsupported file type. Please upload a PDF or text file.');
            }

            // Use AI to extract race details
            logger.debug('[Upload] Extracting race details with AI...');
            const agent = new ComprehensiveRaceExtractionAgent();
            const result = await agent.extractRaceDetails(extractedText);

            logger.debug('[Upload] AI extraction result:', result);

            if (!result.success || !result.data) {
              throw new Error(result.error || 'Failed to extract race details from document');
            }

            // Populate form fields
            populateFormFromExtraction(result.data);

            setIsProcessing(false);
            setCurrentDocType(null);

            const fieldsPopulated = [];
            if (result.data.raceName) fieldsPopulated.push('race name');
            if (result.data.venue) fieldsPopulated.push('venue');
            if (result.data.raceDate) fieldsPopulated.push('date');
            if (result.data.classDivisions) fieldsPopulated.push('class');

            alert(`${getDocTypeName(docType)} processed successfully!\n\n✓ AI extracted: ${fieldsPopulated.join(', ')}\n✓ Confidence: ${Math.round((result.confidence || 0) * 100)}%\n\nReview the fields below and make any necessary adjustments.`);
          } catch (error: any) {
            console.error('[Upload] Processing error:', error);
            setIsProcessing(false);
            setCurrentDocType(null);
            alert(`Failed to process ${getDocTypeName(docType)}:\n\n${error.message}\n\nPlease try pasting the text directly instead.`);
          }
        };

        input.click();
      } else {
        // Mobile platform - use DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'text/plain', 'image/*'],
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          return;
        }

        const file = result.assets[0];
        logger.debug('[Upload] Selected file:', file);

        // Show processing indicator
        setIsProcessing(true);
        setCurrentDocType(docType);

        try {
          let extractedText = '';

          // Extract text from file
          if (file.mimeType === 'application/pdf') {
            const pdfResult = await PDFExtractionService.extractText(file.uri);
            if (!pdfResult.success || !pdfResult.text) {
              throw new Error(pdfResult.error || 'Failed to extract text from PDF');
            }
            extractedText = pdfResult.text;
          } else if (file.mimeType === 'text/plain') {
            // Read text file (would need FileSystem)
            throw new Error('Text file reading not yet implemented on mobile. Please use the paste option instead.');
          } else {
            throw new Error('Unsupported file type');
          }

          // Use AI to extract race details
          const agent = new ComprehensiveRaceExtractionAgent();
          const aiResult = await agent.extractRaceDetails(extractedText);

          if (!aiResult.success || !aiResult.data) {
            throw new Error(aiResult.error || 'Failed to extract race details');
          }

          // Populate form fields
          populateFormFromExtraction(aiResult.data);

          setIsProcessing(false);
          setCurrentDocType(null);

          Alert.alert(
            'Success',
            `${getDocTypeName(docType)} processed successfully! AI extracted race details. Review the fields below.`
          );
        } catch (error: any) {
          console.error('[Upload] Mobile processing error:', error);
          setIsProcessing(false);
          setCurrentDocType(null);
          Alert.alert('Error', `Failed to process document: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      if (Platform.OS === 'web') {
        alert('Failed to upload document. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to upload document. Please try again.');
      }
      setIsProcessing(false);
      setCurrentDocType(null);
    }
  };

  const handlePasteText = (docType: DocumentType) => {
    setCurrentDocType(docType);
    setPastedText('');
    setShowPasteModal(true);
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      if (Platform.OS === 'web') {
        alert('Please paste some text to process.');
      } else {
        Alert.alert('Empty Text', 'Please paste some text to process.');
      }
      return;
    }

    setShowPasteModal(false);
    setIsProcessing(true);

    try {
      logger.debug('[PasteText] Processing text, length:', pastedText.length);

      // Use AI to extract race details
      const agent = new ComprehensiveRaceExtractionAgent();
      const result = await agent.extractRaceDetails(pastedText);

      logger.debug('[PasteText] AI extraction result:', result);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to extract race details from text');
      }

      // Populate form fields
      populateFormFromExtraction(result.data);

      setIsProcessing(false);
      setCurrentDocType(null);

      const fieldsPopulated = [];
      if (result.data.raceName) fieldsPopulated.push('race name');
      if (result.data.venue) fieldsPopulated.push('venue');
      if (result.data.raceDate) fieldsPopulated.push('date');
      if (result.data.classDivisions) fieldsPopulated.push('class');

      const message = `${getDocTypeName(currentDocType!)} text processed successfully!\n\n✓ AI extracted: ${fieldsPopulated.join(', ')}\n✓ Confidence: ${Math.round((result.confidence || 0) * 100)}%\n\nReview the fields below and make any necessary adjustments.`;

      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Text Processed', message);
      }
    } catch (error: any) {
      console.error('[PasteText] Processing error:', error);
      setIsProcessing(false);
      setCurrentDocType(null);

      const message = `Failed to process text:\n\n${error.message}\n\nPlease check the text format and try again.`;

      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const handleQuickEntryPress = (docType: DocumentType) => {
    setCurrentDocType(docType);
    setShowOptionsModal(true);
  };

  const handleUploadOption = () => {
    setShowOptionsModal(false);
    if (currentDocType) {
      handleDocumentUpload(currentDocType);
    }
  };

  const handlePasteOption = () => {
    setShowOptionsModal(false);
    if (currentDocType) {
      handlePasteText(currentDocType);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!raceName.trim()) {
      Alert.alert('Required', 'Please enter a race name');
      return;
    }
    if (!venue.trim()) {
      Alert.alert('Required', 'Please enter a venue');
      return;
    }
    if (!startDate.trim()) {
      Alert.alert('Required', 'Please enter a start date');
      return;
    }
    if (!selectedClass) {
      Alert.alert('Required', 'Please select a class');
      return;
    }

    try {
      setSaving(true);

      // Parse dates from MM/DD/YYYY to ISO format
      const parseDate = (dateStr: string): string | null => {
        if (!dateStr.trim()) return null;
        try {
          const [month, day, year] = dateStr.split('/');
          return new Date(`${year}-${month}-${day}`).toISOString();
        } catch {
          return null;
        }
      };

      const parsedStartDate = parseDate(startDate);
      if (!parsedStartDate) {
        Alert.alert('Invalid Date', 'Please enter start date in MM/DD/YYYY format');
        setSaving(false);
        return;
      }

      const parsedEndDate = endDate.trim() ? parseDate(endDate) : null;
      if (endDate.trim() && !parsedEndDate) {
        Alert.alert('Invalid Date', 'Please enter end date in MM/DD/YYYY format');
        setSaving(false);
        return;
      }

      // Save to Supabase
      // Note: location field is a PostGIS geometry type, so we store venue name in metadata
      const { data, error } = await supabase
        .from('regattas')
        .insert({
          name: raceName.trim(),
          start_date: parsedStartDate,
          end_date: parsedEndDate,
          created_by: user?.id,
          status: 'planned',
          metadata: {
            class: selectedClass,
            venue_name: venue.trim(),
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        setSaving(false);

        // Provide user-friendly error messages
        if (error.code === '23505') {
          Alert.alert('Duplicate Race', 'A race with this name already exists.');
        } else if (error.code === '23503') {
          Alert.alert('Invalid Data', 'Please check that all fields are valid.');
        } else if (error.message.includes('permission')) {
          Alert.alert('Permission Denied', 'You do not have permission to create races.');
        } else {
          Alert.alert('Error', `Failed to save race: ${error.message}`);
        }
        return;
      }

      if (!data) {
        setSaving(false);
        Alert.alert('Error', 'Race was saved but no ID was returned.');
        return;
      }

      setSaving(false);

      // Success - navigate to race detail
      // Note: Alert.alert doesn't work on web, so we navigate directly
      const navigateToRace = () => {
        const params: Record<string, string> = { id: data.id };
        if (initialCourseId) {
          params.courseId = initialCourseId;
        }
        router.push({ pathname: '/race/[id]', params } as any);
      };

      if (Platform.OS === 'web') {
        // On web, navigate immediately
        navigateToRace();
      } else {
        // On mobile, show native alert with options
        Alert.alert(
          'Success',
          'Race added to your calendar',
          [
            {
              text: 'View Race',
              onPress: navigateToRace,
            },
            {
              text: 'Add Another',
              style: 'cancel',
              onPress: () => {
                // Clear form
                setRaceName('');
                setVenue('');
                setStartDate('');
                setEndDate('');
                setSelectedClass('');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving race:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Race</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {initialCourseId && (
            <View style={styles.courseBanner}>
              <Ionicons name="map-outline" size={20} color="#0369A1" style={styles.courseBannerIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.courseBannerTitle}>Course ready to apply</Text>
                <Text style={styles.courseBannerText}>
                  {initialCourseName
                    ? `We'll open the course selector after saving so you can apply ${initialCourseName}.`
                    : 'We will open the course selector after saving so you can apply this course layout.'}
                </Text>
              </View>
            </View>
          )}

          {/* AI Quick Entry Section */}
          <View style={styles.aiQuickEntrySection}>
            <View style={styles.aiQuickEntryHeader}>
              <MaterialCommunityIcons name="star-shooting" size={24} color="#3B82F6" />
              <Text style={styles.aiQuickEntryTitle}>AI Quick Entry</Text>
            </View>
            <Text style={styles.aiQuickEntrySubtitle}>
              Upload PDF/document or paste text. AI will automatically extract and fill all fields below.
            </Text>

            <View style={styles.aiBoxContainer}>
              {/* Notice of Race Box */}
              <TouchableOpacity
                style={styles.aiBox}
                onPress={() => handleQuickEntryPress('nor')}
                disabled={isProcessing}
              >
                {isProcessing && currentDocType === 'nor' ? (
                  <ActivityIndicator size="large" color="#3B82F6" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="file-document-outline" size={32} color="#3B82F6" />
                    <Text style={styles.aiBoxTitle}>Notice of Race</Text>
                    <Text style={styles.aiBoxSubtitle}>Upload or paste NOR</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Sailing Instructions Box */}
              <TouchableOpacity
                style={styles.aiBox}
                onPress={() => handleQuickEntryPress('si')}
                disabled={isProcessing}
              >
                {isProcessing && currentDocType === 'si' ? (
                  <ActivityIndicator size="large" color="#3B82F6" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={32} color="#3B82F6" />
                    <Text style={styles.aiBoxTitle}>Sailing Instructions</Text>
                    <Text style={styles.aiBoxSubtitle}>Upload or paste SIs</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Other Documents Box */}
              <TouchableOpacity
                style={styles.aiBox}
                onPress={() => handleQuickEntryPress('other')}
                disabled={isProcessing}
              >
                {isProcessing && currentDocType === 'other' ? (
                  <ActivityIndicator size="large" color="#3B82F6" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="folder-multiple-outline" size={32} color="#3B82F6" />
                    <Text style={styles.aiBoxTitle}>Other Documents</Text>
                    <Text style={styles.aiBoxSubtitle}>Courses, amendments, etc.</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Race Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Race Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={raceName}
              onChangeText={setRaceName}
              placeholder="e.g., Hong Kong Dragon Championship 2025"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Venue */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Venue <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithIcon}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#64748B" />
              <TextInput
                style={styles.inputText}
                value={venue}
                onChangeText={setVenue}
                placeholder="Search for venue..."
                placeholderTextColor="#94A3B8"
              />
            </View>
            <Text style={styles.hint}>
              Start typing to search our global venue database
            </Text>
          </View>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={styles.dateGroup}>
              <Text style={styles.label}>
                Start Date <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <MaterialCommunityIcons name="calendar" size={20} color="#64748B" />
                <TextInput
                  style={styles.inputText}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.label}>End Date</Text>
              <View style={styles.inputWithIcon}>
                <MaterialCommunityIcons name="calendar" size={20} color="#64748B" />
                <TextInput
                  style={styles.inputText}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* Class Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Class <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.classGrid}>
              {classes.map((className) => (
                <TouchableOpacity
                  key={className}
                  style={[
                    styles.classChip,
                    selectedClass === className && styles.classChipSelected,
                  ]}
                  onPress={() => setSelectedClass(className)}
                >
                  <MaterialCommunityIcons
                    name="sail-boat"
                    size={18}
                    color={selectedClass === className ? '#3B82F6' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.classChipText,
                      selectedClass === className && styles.classChipTextSelected,
                    ]}
                  >
                    {className}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>After Saving</Text>
            <View style={styles.quickActionCard}>
              <MaterialCommunityIcons name="upload" size={24} color="#3B82F6" />
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Upload Documents</Text>
                <Text style={styles.quickActionSubtitle}>
                  Sailing instructions, NOR, course diagrams
                </Text>
              </View>
            </View>
            <View style={styles.quickActionCard}>
              <MaterialCommunityIcons name="brain" size={24} color="#3B82F6" />
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Generate Strategy</Text>
                <Text style={styles.quickActionSubtitle}>
                  AI-powered race planning and tactics
                </Text>
              </View>
            </View>
            <View style={styles.quickActionCard}>
              <MaterialCommunityIcons name="account-group" size={24} color="#3B82F6" />
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Assign Crew</Text>
                <Text style={styles.quickActionSubtitle}>
                  Set crew positions and contacts
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Options Modal */}
        <Modal
          visible={showOptionsModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.optionsModalContent}>
              <Text style={styles.optionsModalTitle}>
                {currentDocType && getDocTypeName(currentDocType)}
              </Text>
              <Text style={styles.optionsModalSubtitle}>Choose an option:</Text>

              <TouchableOpacity style={styles.optionButton} onPress={handleUploadOption}>
                <MaterialCommunityIcons name="file-upload-outline" size={24} color="#3B82F6" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Upload PDF/Document</Text>
                  <Text style={styles.optionSubtitle}>Select a file from your device</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={handlePasteOption}>
                <MaterialCommunityIcons name="content-paste" size={24} color="#3B82F6" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Paste Text</Text>
                  <Text style={styles.optionSubtitle}>Paste text directly into a field</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButtonCancel}
                onPress={() => setShowOptionsModal(false)}
              >
                <Text style={styles.optionCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Paste Text Modal */}
        <Modal
          visible={showPasteModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPasteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Paste {currentDocType && getDocTypeName(currentDocType)}
                </Text>
                <TouchableOpacity onPress={() => setShowPasteModal(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.pasteTextInput}
                multiline
                numberOfLines={10}
                placeholder="Paste your text here..."
                placeholderTextColor="#94A3B8"
                value={pastedText}
                onChangeText={setPastedText}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setShowPasteModal(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonSubmit}
                  onPress={handlePasteSubmit}
                >
                  <Text style={styles.modalButtonSubmitText}>Process with AI</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const logger = createLogger('add');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  courseBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  courseBannerIcon: {
    marginTop: 2,
  },
  courseBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  courseBannerText: {
    fontSize: 12,
    color: '#1E3A8A',
    marginTop: 4,
    lineHeight: 16,
  },
  formGroup: {
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateGroup: {
    flex: 1,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  classChipSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  classChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  classChipTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  quickActionsSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  aiQuickEntrySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiQuickEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiQuickEntryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  aiQuickEntrySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  aiBoxContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  aiBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  aiBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  aiBoxSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  pasteTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  modalButtonSubmit: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalButtonSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  optionsModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  optionsModalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  optionButtonCancel: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  optionCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
});
