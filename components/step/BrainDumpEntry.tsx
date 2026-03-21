/**
 * BrainDumpEntry — Unstructured "dump first, structure later" entry for steps.
 *
 * Single large text area with real-time URL detection, people pill extraction,
 * and a "Structure with AI" CTA. Replaces the old blank 4Q form as the default
 * entry point for new steps.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import { BrainDumpPreview } from './BrainDumpPreview';
import {
  parseBrainDump,
  enrichUrls,
  type ParsedBrainDump,
} from '@/services/ai/BrainDumpAIService';
import type { ExtractedUrl, BrainDumpData } from '@/types/step-detail';

interface BrainDumpEntryProps {
  /** Existing brain dump data (if resuming a draft) */
  initialData?: BrainDumpData;
  /** Called when the user wants to skip to the empty 4Q plan */
  onSkipToPlan: (currentDump: BrainDumpData) => void;
  /** Called when the user taps "Structure with AI" */
  onStructureWithAI: (brainDump: BrainDumpData) => void;
  /** Called on every text change for auto-save */
  onDraftChange?: (brainDump: BrainDumpData) => void;
  /** Whether AI structuring is in progress */
  isStructuring?: boolean;
}

export function BrainDumpEntry({
  initialData,
  onSkipToPlan,
  onStructureWithAI,
  onDraftChange,
  isStructuring = false,
}: BrainDumpEntryProps) {
  const [text, setText] = useState(initialData?.raw_text ?? '');
  const [parsed, setParsed] = useState<ParsedBrainDump>({
    extracted_urls: initialData?.extracted_urls ?? [],
    extracted_people: initialData?.extracted_people ?? [],
    extracted_topics: initialData?.extracted_topics ?? [],
  });
  const [enrichedUrls, setEnrichedUrls] = useState<ExtractedUrl[]>(
    initialData?.extracted_urls ?? [],
  );
  const [isEnriching, setIsEnriching] = useState(false);

  const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enrichTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse text on change (debounced 300ms)
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);

    if (parseTimerRef.current) clearTimeout(parseTimerRef.current);
    parseTimerRef.current = setTimeout(() => {
      const result = parseBrainDump(newText);
      setParsed(result);

      // If new URLs detected, enrich them (debounced further)
      if (result.extracted_urls.length > 0) {
        if (enrichTimerRef.current) clearTimeout(enrichTimerRef.current);
        enrichTimerRef.current = setTimeout(async () => {
          setIsEnriching(true);
          try {
            const enriched = await enrichUrls(result.extracted_urls);
            setEnrichedUrls(enriched);
          } catch {
            setEnrichedUrls(result.extracted_urls);
          } finally {
            setIsEnriching(false);
          }
        }, 500);
      } else {
        setEnrichedUrls([]);
      }
    }, 300);

    // Auto-save draft (debounced 800ms)
    if (onDraftChange) {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        const result = parseBrainDump(newText);
        onDraftChange({
          raw_text: newText,
          extracted_urls: result.extracted_urls,
          extracted_people: result.extracted_people,
          extracted_topics: result.extracted_topics,
          source_step_id: initialData?.source_step_id,
          source_review_notes: initialData?.source_review_notes,
          created_at: initialData?.created_at ?? new Date().toISOString(),
        });
      }, 800);
    }
  }, [initialData, onDraftChange]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (parseTimerRef.current) clearTimeout(parseTimerRef.current);
      if (enrichTimerRef.current) clearTimeout(enrichTimerRef.current);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  const buildBrainDumpData = useCallback((): BrainDumpData => {
    const latest = parseBrainDump(text);
    return {
      raw_text: text,
      extracted_urls: enrichedUrls.length > 0 ? enrichedUrls : latest.extracted_urls,
      extracted_people: latest.extracted_people,
      extracted_topics: latest.extracted_topics,
      source_step_id: initialData?.source_step_id,
      source_review_notes: initialData?.source_review_notes,
      created_at: initialData?.created_at ?? new Date().toISOString(),
    };
  }, [text, enrichedUrls, initialData]);

  const handleStructure = useCallback(() => {
    onStructureWithAI(buildBrainDumpData());
  }, [onStructureWithAI, buildBrainDumpData]);

  const handleRemoveUrl = useCallback((urlToRemove: string) => {
    setEnrichedUrls((prev) => prev.filter((u) => u.url !== urlToRemove));
    // Also remove from text
    setText((prev) => prev.replace(urlToRemove, '').replace(/\n{3,}/g, '\n\n').trim());
  }, []);

  const hasContent = text.trim().length > 0;
  const displayUrls = enrichedUrls.length > 0 ? enrichedUrls : parsed.extracted_urls;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Seed card from previous step */}
      {initialData?.source_review_notes && (
        <View style={styles.seedCard}>
          <View style={styles.seedHeader}>
            <Ionicons name="arrow-redo-outline" size={14} color={STEP_COLORS.coral} />
            <Text style={styles.seedLabel}>From your last session</Text>
          </View>
          <Text style={styles.seedText}>{initialData.source_review_notes}</Text>
        </View>
      )}

      {/* Main text area */}
      <View style={styles.textAreaWrapper}>
        <TextInput
          style={styles.textArea}
          value={text}
          onChangeText={handleTextChange}
          placeholder={"What's on your mind? Paste links, jot notes from last session, mention who you're practicing with..."}
          placeholderTextColor={STEP_COLORS.tertiaryLabel}
          multiline
          textAlignVertical="top"
          autoFocus={!initialData?.raw_text}
        />
      </View>

      {/* Detected URLs */}
      {displayUrls.length > 0 && (
        <View style={styles.section}>
          <BrainDumpPreview urls={displayUrls} onRemove={handleRemoveUrl} />
          {isEnriching && (
            <View style={styles.enrichingRow}>
              <ActivityIndicator size="small" color={STEP_COLORS.accent} />
              <Text style={styles.enrichingText}>Fetching link details...</Text>
            </View>
          )}
        </View>
      )}

      {/* Detected people */}
      {parsed.extracted_people.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={14} color={STEP_COLORS.secondaryLabel} />
            <Text style={styles.sectionLabel}>People Mentioned</Text>
          </View>
          <View style={styles.pillRow}>
            {parsed.extracted_people.map((name) => (
              <View key={name} style={styles.personPill}>
                <Ionicons name="person" size={12} color={STEP_COLORS.accent} />
                <Text style={styles.personPillText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Detected topics */}
      {parsed.extracted_topics.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={14} color={STEP_COLORS.secondaryLabel} />
            <Text style={styles.sectionLabel}>Topics Detected</Text>
          </View>
          <View style={styles.pillRow}>
            {parsed.extracted_topics.map((topic) => (
              <View key={topic} style={styles.topicPill}>
                <Text style={styles.topicPillText}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.structureButton, (!hasContent || isStructuring) && styles.structureButtonDisabled]}
          onPress={handleStructure}
          disabled={!hasContent || isStructuring}
        >
          {isStructuring ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="sparkles"
              size={18}
              color={hasContent ? '#FFFFFF' : IOS_COLORS.systemGray3}
            />
          )}
          <Text
            style={[
              styles.structureButtonText,
              (!hasContent || isStructuring) && styles.structureButtonTextDisabled,
            ]}
          >
            {isStructuring ? 'Structuring...' : 'Structure with AI'}
          </Text>
        </Pressable>

        <Pressable style={styles.skipButton} onPress={() => onSkipToPlan(buildBrainDumpData())} disabled={isStructuring}>
          <Text style={styles.skipButtonText}>Skip to plan</Text>
          <Ionicons name="arrow-forward" size={16} color={STEP_COLORS.secondaryLabel} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: IOS_SPACING.md,
    paddingBottom: 100,
    gap: IOS_SPACING.md,
  },
  seedCard: {
    backgroundColor: STEP_COLORS.coralLight,
    borderRadius: 12,
    padding: IOS_SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(216,149,117,0.20)',
  },
  seedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  seedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: STEP_COLORS.coral,
    letterSpacing: 0.3,
  },
  seedText: {
    fontSize: 14,
    color: STEP_COLORS.label,
    lineHeight: 20,
  },
  textAreaWrapper: {
    backgroundColor: STEP_COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STEP_COLORS.cardBorder,
    overflow: 'hidden',
  },
  textArea: {
    fontSize: 15,
    color: STEP_COLORS.label,
    padding: IOS_SPACING.md,
    minHeight: 180,
    lineHeight: 22,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        resize: 'vertical',
      } as any,
    }),
  },
  section: {
    gap: IOS_SPACING.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: STEP_COLORS.secondaryLabel,
    letterSpacing: 0.3,
  },
  enrichingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  enrichingText: {
    fontSize: 12,
    color: STEP_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.xs,
  },
  personPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEP_COLORS.accentLight,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  personPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: STEP_COLORS.accent,
  },
  topicPill: {
    backgroundColor: 'rgba(175,82,222,0.08)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topicPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.systemPurple,
  },
  actions: {
    gap: IOS_SPACING.sm,
    marginTop: IOS_SPACING.sm,
  },
  structureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEP_COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(61,138,90,0.25)' } as any,
      default: {
        shadowColor: STEP_COLORS.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  structureButtonDisabled: {
    backgroundColor: IOS_COLORS.systemGray5,
    ...Platform.select({
      web: { boxShadow: 'none' } as any,
      default: {
        shadowOpacity: 0,
        elevation: 0,
      },
    }),
  },
  structureButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  structureButtonTextDisabled: {
    color: IOS_COLORS.systemGray3,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: STEP_COLORS.secondaryLabel,
  },
});
