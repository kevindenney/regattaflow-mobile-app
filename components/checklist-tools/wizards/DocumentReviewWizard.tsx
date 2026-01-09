/**
 * DocumentReviewWizard
 *
 * Multi-purpose wizard for reviewing race documents (NOR, SI).
 * Shows uploaded document, extracts key info, and allows marking as reviewed.
 * If no document is uploaded, prompts user to upload one.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileText,
  Upload,
  ExternalLink,
  Clock,
  MapPin,
  Radio,
  Flag,
  AlertCircle,
  BookOpen,
  Check,
  Sailboat,
  Users,
  Shield,
  Link2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import { useRaceDocuments } from '@/hooks/useRaceDocuments';
import { useAuth } from '@/providers/AuthProvider';
import type { RaceDocumentType } from '@/services/RaceDocumentService';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#5856D6',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

// Document type configuration
interface DocumentTypeConfig {
  type: RaceDocumentType;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
  checkItems: {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const DOCUMENT_CONFIGS: Record<string, DocumentTypeConfig> = {
  nor_review: {
    type: 'nor',
    label: 'Notice of Race',
    shortLabel: 'NOR',
    description: 'Review the NOR for entry requirements, schedule, and race format',
    icon: <FileText size={32} color={IOS_COLORS.purple} />,
    checkItems: [
      {
        id: 'entry_requirements',
        label: 'Entry Requirements',
        description: 'Eligibility, membership, and registration requirements',
        icon: <Users size={20} color={IOS_COLORS.blue} />,
      },
      {
        id: 'schedule',
        label: 'Schedule & Dates',
        description: 'Race dates, registration deadlines, prize giving',
        icon: <Clock size={20} color={IOS_COLORS.orange} />,
      },
      {
        id: 'venue',
        label: 'Venue & Location',
        description: 'Race area, club facilities, launching',
        icon: <MapPin size={20} color={IOS_COLORS.green} />,
      },
      {
        id: 'equipment',
        label: 'Equipment Requirements',
        description: 'Required safety gear, restrictions, inspections',
        icon: <Shield size={20} color={IOS_COLORS.red} />,
      },
      {
        id: 'scoring',
        label: 'Scoring & Prizes',
        description: 'Scoring system, series scoring, trophies',
        icon: <Flag size={20} color={IOS_COLORS.purple} />,
      },
    ],
  },
  si_review: {
    type: 'sailing_instructions',
    label: 'Sailing Instructions',
    shortLabel: 'SI',
    description: 'Review the SI for course info, signals, and special procedures',
    icon: <Sailboat size={32} color={IOS_COLORS.blue} />,
    checkItems: [
      {
        id: 'signals',
        label: 'Race Signals',
        description: 'Starting signals, flag sequences, sound signals',
        icon: <Flag size={20} color={IOS_COLORS.orange} />,
      },
      {
        id: 'course',
        label: 'Course Configuration',
        description: 'Marks, rounding order, course changes',
        icon: <MapPin size={20} color={IOS_COLORS.blue} />,
      },
      {
        id: 'vhf',
        label: 'VHF & Communication',
        description: 'Race committee channel, emergency contacts',
        icon: <Radio size={20} color={IOS_COLORS.green} />,
      },
      {
        id: 'time_limits',
        label: 'Time Limits',
        description: 'Race time limit, mark time limits, finishing',
        icon: <Clock size={20} color={IOS_COLORS.purple} />,
      },
      {
        id: 'penalties',
        label: 'Penalties & Protests',
        description: 'Penalty turns, protest procedure, arbitration',
        icon: <AlertCircle size={20} color={IOS_COLORS.red} />,
      },
    ],
  },
};

type WizardStep = 'check_document' | 'review' | 'complete';

interface DocumentReviewWizardProps extends ChecklistToolProps {
  /** Optional venue for context */
  venue?: { id: string; name: string } | null;
}

export function DocumentReviewWizard({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
  venue,
}: DocumentReviewWizardProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Get document config based on tool ID
  const config = DOCUMENT_CONFIGS[item.toolId || 'nor_review'];

  // State
  const [step, setStep] = useState<WizardStep>('check_document');
  const [completedChecks, setCompletedChecks] = useState<Set<string>>(new Set());
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);

  // Load documents for this race
  const {
    documents,
    documentsForDisplay,
    loading: docsLoading,
    upload,
    addFromUrl,
    typePickerVisible,
    selectType,
    dismissTypePicker,
  } = useRaceDocuments({
    raceId: raceEventId,
    userId: user?.id,
  });

  // Find document of this type
  const document = useMemo(() => {
    return documentsForDisplay.find((doc) => doc.type === config.type);
  }, [documentsForDisplay, config.type]);

  // Auto-advance to review if document exists
  useEffect(() => {
    if (!docsLoading && document && step === 'check_document') {
      setStep('review');
    }
  }, [docsLoading, document, step]);

  // Progress calculation
  const progress = completedChecks.size / config.checkItems.length;
  const allChecksComplete = completedChecks.size === config.checkItems.length;

  // Toggle a check item
  const toggleCheck = useCallback((checkId: string) => {
    setCompletedChecks((prev) => {
      const next = new Set(prev);
      if (next.has(checkId)) {
        next.delete(checkId);
      } else {
        next.add(checkId);
      }
      return next;
    });
  }, []);

  // Handle document upload
  const handleUpload = useCallback(async () => {
    // Pre-select the correct document type based on the wizard config
    await upload(config.type);
    // After upload completes, the useEffect will advance to review step
  }, [upload, config.type]);

  // Handle URL submission
  const handleUrlSubmit = useCallback(async () => {
    if (!urlValue.trim()) return;

    setIsSubmittingUrl(true);
    try {
      const success = await addFromUrl(urlValue.trim(), config.type);
      if (success) {
        setUrlValue('');
        setShowUrlInput(false);
        // The useEffect will advance to review step when document is loaded
      }
    } finally {
      setIsSubmittingUrl(false);
    }
  }, [urlValue, addFromUrl, config.type]);

  // Handle opening document
  const handleOpenDocument = useCallback(() => {
    if (document?.url) {
      Linking.openURL(document.url);
    }
  }, [document?.url]);

  // Handle learn more
  const handleLearnMore = useCallback(() => {
    if (item.learningModuleSlug) {
      router.push({
        pathname: '/(tabs)/learn',
        params: {
          courseSlug: item.learningModuleSlug,
          lessonId: item.learningModuleId,
        },
      });
      onCancel();
    }
  }, [item.learningModuleSlug, item.learningModuleId, router, onCancel]);

  // Handle complete
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Render based on step
  const renderContent = () => {
    switch (step) {
      case 'check_document':
        return renderCheckDocument();
      case 'review':
        return renderReview();
      case 'complete':
        return renderComplete();
      default:
        return null;
    }
  };

  const renderCheckDocument = () => (
    <KeyboardAvoidingView
      style={styles.centeredContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {docsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Checking documents...</Text>
        </View>
      ) : showUrlInput ? (
        // URL Input Mode
        <View style={styles.urlInputContainer}>
          <View style={styles.iconCircle}>
            <Link2 size={32} color={IOS_COLORS.blue} />
          </View>
          <Text style={styles.centeredTitle}>
            Add {config.shortLabel} URL
          </Text>
          <Text style={styles.centeredDescription}>
            Paste the link to the {config.label} document.
          </Text>

          <View style={styles.urlInputWrapper}>
            <TextInput
              style={styles.urlInput}
              placeholder={`https://example.com/${config.shortLabel.toLowerCase()}.pdf`}
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
              value={urlValue}
              onChangeText={setUrlValue}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleUrlSubmit}
              editable={!isSubmittingUrl}
            />
          </View>

          <Pressable
            style={[
              styles.uploadButton,
              (!urlValue.trim() || isSubmittingUrl) && styles.uploadButtonDisabled,
            ]}
            onPress={handleUrlSubmit}
            disabled={!urlValue.trim() || isSubmittingUrl}
          >
            {isSubmittingUrl ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={20} color="#FFFFFF" />
            )}
            <Text style={styles.uploadButtonText}>
              {isSubmittingUrl ? 'Adding...' : 'Add Document'}
            </Text>
          </Pressable>

          <Pressable style={styles.skipButton} onPress={() => setShowUrlInput(false)}>
            <Text style={styles.skipButtonText}>Back</Text>
          </Pressable>
        </View>
      ) : (
        // Default: Upload/URL Choice
        <>
          <View style={styles.iconCircle}>{config.icon}</View>
          <Text style={styles.centeredTitle}>
            No {config.shortLabel} Found
          </Text>
          <Text style={styles.centeredDescription}>
            Upload or link the {config.label} to review key information.
          </Text>

          <Pressable style={styles.uploadButton} onPress={handleUpload}>
            <Upload size={20} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>
              Upload {config.shortLabel}
            </Text>
          </Pressable>

          <Pressable style={styles.urlLinkButton} onPress={() => setShowUrlInput(true)}>
            <Link2 size={18} color={IOS_COLORS.blue} />
            <Text style={styles.urlLinkButtonText}>
              Add from URL
            </Text>
          </Pressable>

          <Pressable style={styles.skipButton} onPress={() => setStep('review')}>
            <Text style={styles.skipButtonText}>
              Review without document
            </Text>
          </Pressable>
        </>
      )}
    </KeyboardAvoidingView>
  );

  const renderReview = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={styles.scrollContentInner}
    >
      {/* Document Card */}
      {document && (
        <Pressable style={styles.documentCard} onPress={handleOpenDocument}>
          <View style={styles.documentIconContainer}>
            <FileText size={24} color={IOS_COLORS.purple} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName} numberOfLines={1}>
              {document.name}
            </Text>
            <Text style={styles.documentMeta}>
              Uploaded {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'recently'}
            </Text>
          </View>
          <ExternalLink size={20} color={IOS_COLORS.blue} />
        </Pressable>
      )}

      {/* No document warning */}
      {!document && (
        <Pressable style={styles.warningCard} onPress={handleUpload}>
          <AlertTriangle size={20} color={IOS_COLORS.orange} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>
              No {config.shortLabel} uploaded
            </Text>
            <Text style={styles.warningDescription}>
              Tap to upload the document for easier review
            </Text>
          </View>
          <Upload size={18} color={IOS_COLORS.orange} />
        </Pressable>
      )}

      {/* Check Items */}
      <Text style={styles.sectionTitle}>Review Checklist</Text>
      <Text style={styles.sectionDescription}>
        {item.description || config.description}
      </Text>

      <View style={styles.checklistContainer}>
        {config.checkItems.map((checkItem) => {
          const isChecked = completedChecks.has(checkItem.id);

          return (
            <Pressable
              key={checkItem.id}
              style={[
                styles.checkItem,
                isChecked && styles.checkItemChecked,
              ]}
              onPress={() => toggleCheck(checkItem.id)}
            >
              <View style={styles.checkItemIcon}>{checkItem.icon}</View>
              <View style={styles.checkItemContent}>
                <Text
                  style={[
                    styles.checkItemLabel,
                    isChecked && styles.checkItemLabelChecked,
                  ]}
                >
                  {checkItem.label}
                </Text>
                <Text style={styles.checkItemDescription}>
                  {checkItem.description}
                </Text>
              </View>
              <View style={styles.checkItemCheckbox}>
                {isChecked ? (
                  <CheckCircle2 size={24} color={IOS_COLORS.green} />
                ) : (
                  <Circle size={24} color={IOS_COLORS.gray} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Quick Tips */}
      {item.quickTips && item.quickTips.length > 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Quick Tips</Text>
          {item.quickTips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderComplete = () => (
    <View style={styles.centeredContainer}>
      <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
        <CheckCircle2 size={32} color={IOS_COLORS.green} />
      </View>
      <Text style={styles.centeredTitle}>
        {config.shortLabel} Review Complete
      </Text>
      <Text style={styles.centeredDescription}>
        You've reviewed the {config.label}. The key information has been noted for race day.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={IOS_COLORS.gray} />
        </Pressable>
        <Text style={styles.headerTitle}>{config.shortLabel} Review</Text>
        <View style={styles.headerRight}>
          {item.learningModuleSlug && (
            <Pressable style={styles.learnIconButton} onPress={handleLearnMore}>
              <BookOpen size={20} color={IOS_COLORS.purple} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      {step === 'review' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
                allChecksComplete && styles.progressComplete,
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedChecks.size} of {config.checkItems.length} reviewed
          </Text>
        </View>
      )}

      {/* Content */}
      {renderContent()}

      {/* Bottom Action */}
      {step === 'review' && (
        <View style={styles.bottomAction}>
          <Pressable
            style={[
              styles.primaryButton,
              allChecksComplete
                ? styles.primaryButtonSuccess
                : styles.primaryButtonWarning,
            ]}
            onPress={handleComplete}
          >
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {allChecksComplete
                ? 'Complete Review'
                : 'Mark as Reviewed'}
            </Text>
          </Pressable>
        </View>
      )}

      {step === 'complete' && (
        <View style={styles.bottomAction}>
          <Pressable
            style={[styles.primaryButton, styles.primaryButtonSuccess]}
            onPress={handleComplete}
          >
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  learnIconButton: {
    padding: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    gap: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: IOS_COLORS.separator,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 2,
  },
  progressComplete: {
    backgroundColor: IOS_COLORS.green,
  },
  progressText: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  // Centered container (for no doc / complete states)
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${IOS_COLORS.purple}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconCircleSuccess: {
    backgroundColor: `${IOS_COLORS.green}15`,
  },
  centeredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 12,
    textAlign: 'center',
  },
  centeredDescription: {
    fontSize: 16,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.blue,
    gap: 10,
    marginBottom: 16,
  },
  uploadButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    fontSize: 15,
    color: IOS_COLORS.blue,
    fontWeight: '500',
  },
  // URL Input styles
  urlInputContainer: {
    alignItems: 'center',
    width: '100%',
  },
  urlInputWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  urlInput: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: IOS_COLORS.label,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
  },
  urlLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: `${IOS_COLORS.blue}10`,
    gap: 8,
    marginBottom: 8,
  },
  urlLinkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  // Document card
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  documentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: `${IOS_COLORS.purple}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  // Warning card
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: `${IOS_COLORS.orange}10`,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.orange}30`,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.orange,
    marginBottom: 2,
  },
  warningDescription: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  // Section
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 22,
    marginBottom: 16,
  },
  // Checklist
  checklistContainer: {
    gap: 10,
    marginBottom: 24,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    gap: 12,
  },
  checkItemChecked: {
    backgroundColor: `${IOS_COLORS.green}08`,
  },
  checkItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkItemContent: {
    flex: 1,
  },
  checkItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  checkItemLabelChecked: {
    color: IOS_COLORS.secondaryLabel,
  },
  checkItemDescription: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  checkItemCheckbox: {
    width: 24,
    height: 24,
  },
  // Tips
  tipsContainer: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.blue,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  // Bottom action
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.blue,
    gap: 8,
  },
  primaryButtonSuccess: {
    backgroundColor: IOS_COLORS.green,
  },
  primaryButtonWarning: {
    backgroundColor: IOS_COLORS.orange,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DocumentReviewWizard;
