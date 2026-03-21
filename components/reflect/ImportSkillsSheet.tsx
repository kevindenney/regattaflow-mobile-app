/**
 * ImportSkillsSheet — Modal for importing skills from library resources,
 * URLs, or pasted text via AI extraction with a review-before-create flow.
 *
 * Mode selector: "From Library" | "From URL" | "From Text"
 * Phase state machine: input → extracting → review → saving
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { detectSourcePlatform } from '@/lib/utils/detectPlatform';
import { useLibrary, useLibraryResources } from '@/hooks/useLibrary';
import { useInterest } from '@/providers/InterestProvider';
import { useSkillGoals } from '@/hooks/useSkillGoals';
import {
  extractSkillsFromResource,
  extractSkillsFromUrl,
  extractSkillsFromText,
} from '@/services/ai/SkillExtractionService';
import { SkillReviewList } from './SkillReviewList';
import type { ReviewableSkill } from './SkillReviewList';
import type { ExtractedSkill } from '@/services/ai/SkillExtractionService';
import type { CreateSkillGoalInput } from '@/types/skill-goal';
import type { LibraryResourceRecord } from '@/types/library';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ImportMode = 'library' | 'url' | 'text';
type Phase = 'input' | 'extracting' | 'review' | 'saving';

interface ImportSkillsSheetProps {
  visible: boolean;
  onClose: () => void;
}

const MODE_LABELS: Record<ImportMode, { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  library: { label: 'Library', icon: 'library-outline' },
  url: { label: 'URL', icon: 'link-outline' },
  text: { label: 'Text', icon: 'document-text-outline' },
};

const TEXT_MAX_CHARS = 5000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImportSkillsSheet({ visible, onClose }: ImportSkillsSheetProps) {
  const { currentInterest } = useInterest();
  const interestName = currentInterest?.name || 'general';
  const interestId = currentInterest?.id;
  const { data: library } = useLibrary(interestId);
  const { data: allResources } = useLibraryResources(library?.id);
  const { skillGoals, addGoalsBatch } = useSkillGoals();

  // State
  const [mode, setMode] = useState<ImportMode>('library');
  const [phase, setPhase] = useState<Phase>('input');

  // Library mode
  const [selectedResource, setSelectedResource] = useState<LibraryResourceRecord | null>(null);

  // URL mode
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);

  // Text mode
  const [textInput, setTextInput] = useState('');

  // Review phase
  const [reviewSkills, setReviewSkills] = useState<ReviewableSkill[]>([]);
  const [sourceSummary, setSourceSummary] = useState('');

  // Existing skill titles for duplicate detection
  const existingTitles = useMemo(
    () => new Set(skillGoals.map((g) => g.title.toLowerCase().trim())),
    [skillGoals],
  );

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  const resetState = useCallback(() => {
    setMode('library');
    setPhase('input');
    setSelectedResource(null);
    setUrlInput('');
    setUrlTitle('');
    setDetectedPlatform(null);
    setTextInput('');
    setReviewSkills([]);
    setSourceSummary('');
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // ---------------------------------------------------------------------------
  // URL auto-detect
  // ---------------------------------------------------------------------------

  const handleUrlChange = useCallback((text: string) => {
    setUrlInput(text);
    setDetectedPlatform(detectSourcePlatform(text));
  }, []);

  // ---------------------------------------------------------------------------
  // Build reviewable skills from extraction result
  // ---------------------------------------------------------------------------

  const buildReviewSkills = useCallback(
    (skills: ExtractedSkill[]): ReviewableSkill[] =>
      skills.map((s, i) => {
        const alreadyExists = existingTitles.has(s.title.toLowerCase().trim());
        return {
          ...s,
          key: `${i}-${s.title}`,
          selected: !alreadyExists,
          alreadyExists,
        };
      }),
    [existingTitles],
  );

  // ---------------------------------------------------------------------------
  // Extract
  // ---------------------------------------------------------------------------

  const canExtract = useMemo(() => {
    if (mode === 'library') return !!selectedResource;
    if (mode === 'url') return !!urlInput.trim();
    if (mode === 'text') return textInput.trim().length > 20;
    return false;
  }, [mode, selectedResource, urlInput, textInput]);

  const handleExtract = useCallback(async () => {
    setPhase('extracting');
    try {
      let result;
      if (mode === 'library' && selectedResource) {
        result = await extractSkillsFromResource(
          {
            title: selectedResource.title,
            author: selectedResource.author_or_creator,
            description: selectedResource.description,
            url: selectedResource.url,
            resource_type: selectedResource.resource_type,
            metadata: selectedResource.metadata,
          },
          interestName,
        );
      } else if (mode === 'url') {
        result = await extractSkillsFromUrl(
          urlInput.trim(),
          urlTitle.trim() || undefined,
          interestName,
        );
      } else if (mode === 'text') {
        result = await extractSkillsFromText(textInput.trim(), interestName);
      }

      if (!result || result.skills.length === 0) {
        showAlert(
          'No Skills Found',
          'Could not extract skills. Try pasting specific content or adding manually.',
        );
        setPhase('input');
        return;
      }

      setReviewSkills(buildReviewSkills(result.skills));
      setSourceSummary(result.source_summary);
      setPhase('review');
    } catch (err: any) {
      showAlert('Extraction Failed', err?.message || 'Something went wrong.');
      setPhase('input');
    }
  }, [mode, selectedResource, urlInput, urlTitle, textInput, interestName, buildReviewSkills]);

  // ---------------------------------------------------------------------------
  // Review actions
  // ---------------------------------------------------------------------------

  const handleToggle = useCallback((key: string) => {
    setReviewSkills((prev) =>
      prev.map((s) => (s.key === key && !s.alreadyExists ? { ...s, selected: !s.selected } : s)),
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    setReviewSkills((prev) => {
      const selectableCount = prev.filter((s) => !s.alreadyExists).length;
      const selectedCount = prev.filter((s) => s.selected && !s.alreadyExists).length;
      const allSelected = selectedCount === selectableCount;
      return prev.map((s) =>
        s.alreadyExists ? s : { ...s, selected: !allSelected },
      );
    });
  }, []);

  const handleEditTitle = useCallback((key: string, newTitle: string) => {
    setReviewSkills((prev) =>
      prev.map((s) => (s.key === key ? { ...s, title: newTitle } : s)),
    );
  }, []);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const selectedForImport = useMemo(
    () => reviewSkills.filter((s) => s.selected && !s.alreadyExists),
    [reviewSkills],
  );

  const allAlreadyTracked = useMemo(
    () => reviewSkills.length > 0 && reviewSkills.every((s) => s.alreadyExists),
    [reviewSkills],
  );

  const handleSave = useCallback(async () => {
    if (selectedForImport.length === 0) return;
    setPhase('saving');

    const inputs: CreateSkillGoalInput[] = selectedForImport.map((s) => ({
      title: s.title,
      description: s.description || undefined,
      category: s.category || undefined,
      source_type: mode === 'library' ? 'from_resource' as const : 'ai_generated' as const,
      source_resource_id: mode === 'library' && selectedResource ? selectedResource.id : undefined,
      source_url: mode === 'url' ? urlInput.trim() : undefined,
    }));

    try {
      await addGoalsBatch.mutateAsync(inputs);
      handleClose();
    } catch (err: any) {
      showAlert('Save Failed', err?.message || 'Could not save skills.');
      setPhase('review');
    }
  }, [selectedForImport, mode, selectedResource, urlInput, addGoalsBatch, handleClose]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderModeSelector = () => (
    <View style={styles.modeRow}>
      {(['library', 'url', 'text'] as ImportMode[]).map((m) => {
        const { label, icon } = MODE_LABELS[m];
        const active = mode === m;
        return (
          <Pressable
            key={m}
            style={[styles.modeTab, active && styles.modeTabActive]}
            onPress={() => setMode(m)}
          >
            <Ionicons name={icon} size={16} color={active ? IOS_COLORS.systemBlue : IOS_COLORS.secondaryLabel} />
            <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderLibraryInput = () => {
    const resources = allResources || [];
    if (resources.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={32} color={IOS_COLORS.systemGray3} />
          <Text style={styles.emptyText}>No resources in your library yet.</Text>
          <Text style={styles.emptyHint}>Add resources in the Library tab, or try importing from a URL or text.</Text>
        </View>
      );
    }

    return (
      <View style={styles.resourceList}>
        {resources.map((r) => {
          const isSelected = selectedResource?.id === r.id;
          return (
            <Pressable
              key={r.id}
              style={[styles.resourceRow, isSelected && styles.resourceRowSelected]}
              onPress={() => setSelectedResource(isSelected ? null : r)}
            >
              <Ionicons
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={isSelected ? IOS_COLORS.systemBlue : IOS_COLORS.systemGray3}
              />
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle} numberOfLines={1}>{r.title}</Text>
                {r.author_or_creator && (
                  <Text style={styles.resourceAuthor} numberOfLines={1}>{r.author_or_creator}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderUrlInput = () => (
    <View style={styles.inputSection}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>URL</Text>
        <TextInput
          style={styles.input}
          value={urlInput}
          onChangeText={handleUrlChange}
          placeholder="https://..."
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {detectedPlatform && (
          <Text style={styles.detectedText}>Detected: {detectedPlatform}</Text>
        )}
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Title (optional)</Text>
        <TextInput
          style={styles.input}
          value={urlTitle}
          onChangeText={setUrlTitle}
          placeholder="e.g., Dragon Racing Guide"
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
        />
      </View>
    </View>
  );

  const renderTextInput = () => (
    <View style={styles.inputSection}>
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>Content</Text>
          <Text style={styles.charCount}>
            {textInput.length}/{TEXT_MAX_CHARS}
          </Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={textInput}
          onChangeText={(t) => setTextInput(t.slice(0, TEXT_MAX_CHARS))}
          placeholder="Paste a table of contents, chapter outline, competency list, or course description..."
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          multiline
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const isExtracting = phase === 'extracting';
  const isSaving = phase === 'saving';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {phase === 'review' || phase === 'saving' ? 'Review Skills' : 'Import Skills'}
          </Text>
          {phase === 'review' ? (
            <Pressable onPress={() => setPhase('input')}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : (
            <View style={{ width: 50 }} />
          )}
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Input phase */}
          {(phase === 'input' || phase === 'extracting') && (
            <>
              {renderModeSelector()}

              {mode === 'library' && renderLibraryInput()}
              {mode === 'url' && renderUrlInput()}
              {mode === 'text' && renderTextInput()}

              {/* Extract button */}
              <Pressable
                style={[styles.extractButton, (!canExtract || isExtracting) && styles.extractButtonDisabled]}
                onPress={handleExtract}
                disabled={!canExtract || isExtracting}
              >
                {isExtracting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                    <Text style={styles.extractButtonText}>Extract Skills</Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          {/* Review phase */}
          {(phase === 'review' || phase === 'saving') && (
            <>
              {allAlreadyTracked ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle" size={40} color={IOS_COLORS.systemGreen} />
                  <Text style={styles.emptyText}>All extracted skills are already tracked.</Text>
                  <Text style={styles.emptyHint}>
                    You're already tracking all the skills from this source.
                  </Text>
                </View>
              ) : (
                <>
                  <SkillReviewList
                    skills={reviewSkills}
                    sourceSummary={sourceSummary}
                    onToggle={handleToggle}
                    onToggleAll={handleToggleAll}
                    onEditTitle={handleEditTitle}
                  />

                  {/* Add button */}
                  <Pressable
                    style={[
                      styles.addButton,
                      (selectedForImport.length === 0 || isSaving) && styles.addButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={selectedForImport.length === 0 || isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.addButtonText}>
                        Add {selectedForImport.length} Skill{selectedForImport.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </Pressable>
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.systemGray4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  cancelText: {
    fontSize: 17,
    color: IOS_COLORS.systemBlue,
    minWidth: 50,
  },
  backText: {
    fontSize: 17,
    color: IOS_COLORS.systemBlue,
    minWidth: 50,
    textAlign: 'right',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: IOS_SPACING.md,
    gap: IOS_SPACING.md,
    paddingBottom: 100,
  },
  // Mode selector
  modeRow: {
    flexDirection: 'row',
    gap: IOS_SPACING.xs,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray4,
  },
  modeTabActive: {
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderColor: IOS_COLORS.systemBlue,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  modeTabTextActive: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  // Inputs
  inputSection: {
    gap: IOS_SPACING.md,
  },
  field: {
    gap: IOS_SPACING.xs,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  charCount: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray4,
    padding: IOS_SPACING.sm,
    fontSize: 16,
    color: IOS_COLORS.label,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  textArea: {
    minHeight: 140,
  },
  detectedText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
    marginTop: 4,
  },
  // Resource list (library mode)
  resourceList: {
    gap: IOS_SPACING.xs,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: IOS_SPACING.sm,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray5,
  },
  resourceRowSelected: {
    backgroundColor: 'rgba(0,122,255,0.06)',
    borderColor: 'rgba(0,122,255,0.2)',
  },
  resourceInfo: {
    flex: 1,
    gap: 1,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  resourceAuthor: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: IOS_SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  // Extract button
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.systemPurple,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: IOS_SPACING.sm,
  },
  extractButtonDisabled: {
    backgroundColor: IOS_COLORS.systemGray4,
  },
  extractButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Add button
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: IOS_SPACING.sm,
  },
  addButtonDisabled: {
    backgroundColor: IOS_COLORS.systemGray4,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
