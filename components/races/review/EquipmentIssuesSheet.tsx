/**
 * EquipmentIssuesSheet - Bottom sheet for equipment issue management
 *
 * Shows past unresolved issues, common issue suggestions, and a text input
 * for adding new issues. Replaces the inline equipment input.
 *
 * Uses Actionsheet (Gluestack) matching RaceResultDetailSheet pattern.
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  Wrench,
  X,
  Plus,
  Check,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetScrollView,
} from '@/components/ui/actionsheet';
import type { EquipmentIssue } from '@/hooks/useEquipmentFlow';

// iOS System Colors
const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

// Common equipment issues sailors encounter
const SUGGESTED_ISSUES = [
  'Halyard needs replacing',
  'Batten pocket torn',
  'Shackle pin bent',
  'Control line frayed',
  'Rudder play / loose',
  'Spreader tape peeling',
  'Telltales missing',
  'Sail repair needed',
  'Winch needs servicing',
  'Tiller extension loose',
];

interface EquipmentIssuesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Unresolved issues from previous races */
  carryoverIssues: EquipmentIssue[];
  /** Issues noted for this race */
  currentRaceIssues: EquipmentIssue[];
  /** Add a new issue */
  onAddIssue: (description: string, priority?: 'high' | 'medium' | 'low') => Promise<void>;
  /** Resolve an issue */
  onResolveIssue: (issueId: string) => Promise<void>;
  /** Remove an issue */
  onRemoveIssue: (issueId: string) => Promise<void>;
  /** Race name for context */
  raceName?: string;
}

export function EquipmentIssuesSheet({
  isOpen,
  onClose,
  carryoverIssues,
  currentRaceIssues,
  onAddIssue,
  onResolveIssue,
  onRemoveIssue,
  raceName,
}: EquipmentIssuesSheetProps) {
  const [newIssue, setNewIssue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setNewIssue('');
    onClose();
  }, [onClose]);

  const handleAddIssue = useCallback(async (description: string) => {
    const trimmed = description.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      await onAddIssue(trimmed, selectedPriority);
      setNewIssue('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // error handled by parent
    } finally {
      setIsSaving(false);
    }
  }, [onAddIssue, selectedPriority]);

  const handleResolve = useCallback(async (issueId: string) => {
    setResolvingId(issueId);
    try {
      await onResolveIssue(issueId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // error handled by parent
    } finally {
      setResolvingId(null);
    }
  }, [onResolveIssue]);

  const handleSuggestionTap = useCallback((suggestion: string) => {
    setNewIssue(suggestion);
  }, []);

  const allIssues = [...currentRaceIssues, ...carryoverIssues];
  // Filter out suggestions that match existing issues
  const filteredSuggestions = SUGGESTED_ISSUES.filter(
    (s) => !allIssues.some((issue) => issue.description.toLowerCase() === s.toLowerCase())
  );

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="max-h-[85%]">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Wrench size={18} color={COLORS.blue} />
            <Text style={styles.title}>Equipment Notes</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <X size={20} color={COLORS.gray} />
          </Pressable>
        </View>

        <ActionsheetScrollView contentContainerClassName="pb-8">
          <View style={styles.content}>
            {/* Add New Issue */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ADD ISSUE</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe the issue..."
                  placeholderTextColor={COLORS.gray3}
                  value={newIssue}
                  onChangeText={setNewIssue}
                  onSubmitEditing={() => handleAddIssue(newIssue)}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  multiline
                  numberOfLines={2}
                  editable={!isSaving}
                />
              </View>

              {/* Priority selector */}
              <View style={styles.priorityRow}>
                <Text style={styles.priorityLabel}>Priority:</Text>
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <Pressable
                    key={p}
                    style={[
                      styles.priorityPill,
                      selectedPriority === p && styles.priorityPillActive,
                      selectedPriority === p && p === 'high' && styles.priorityPillHigh,
                      selectedPriority === p && p === 'medium' && styles.priorityPillMedium,
                      selectedPriority === p && p === 'low' && styles.priorityPillLow,
                    ]}
                    onPress={() => setSelectedPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityPillText,
                        selectedPriority === p && styles.priorityPillTextActive,
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Add button */}
              {newIssue.trim().length > 0 && (
                <Pressable
                  style={[styles.addButton, isSaving && styles.addButtonDisabled]}
                  onPress={() => handleAddIssue(newIssue)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Plus size={16} color="#FFFFFF" />
                      <Text style={styles.addButtonText}>Add Issue</Text>
                    </>
                  )}
                </Pressable>
              )}

              <Text style={styles.flowHint}>
                Issues will appear in your pre-race checklist for the next race
              </Text>
            </View>

            {/* Quick Suggestions */}
            {filteredSuggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>COMMON ISSUES</Text>
                <View style={styles.suggestionsGrid}>
                  {filteredSuggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      style={styles.suggestionChip}
                      onPress={() => handleSuggestionTap(suggestion)}
                    >
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {suggestion}
                      </Text>
                      <ChevronRight size={12} color={COLORS.gray3} />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Current Race Issues */}
            {currentRaceIssues.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  THIS RACE ({currentRaceIssues.length})
                </Text>
                {currentRaceIssues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    isResolving={resolvingId === issue.id}
                    onResolve={() => handleResolve(issue.id)}
                    onRemove={() => onRemoveIssue(issue.id)}
                  />
                ))}
              </View>
            )}

            {/* Carryover Issues from Previous Races */}
            {carryoverIssues.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  FROM PREVIOUS RACES ({carryoverIssues.length})
                </Text>
                {carryoverIssues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    isResolving={resolvingId === issue.id}
                    onResolve={() => handleResolve(issue.id)}
                    onRemove={() => onRemoveIssue(issue.id)}
                    showSource
                  />
                ))}
              </View>
            )}

            {/* Empty state */}
            {allIssues.length === 0 && !newIssue.trim() && (
              <View style={styles.emptyState}>
                <Check size={32} color={COLORS.green} />
                <Text style={styles.emptyTitle}>All clear</Text>
                <Text style={styles.emptySubtitle}>
                  No equipment issues noted. Add one above or tap a common issue.
                </Text>
              </View>
            )}
          </View>
        </ActionsheetScrollView>
      </ActionsheetContent>
    </Actionsheet>
  );
}

// ─── Issue Row ────────────────────────────────────────────────────────────

function IssueRow({
  issue,
  isResolving,
  onResolve,
  onRemove,
  showSource,
}: {
  issue: EquipmentIssue;
  isResolving: boolean;
  onResolve: () => void;
  onRemove: () => void;
  showSource?: boolean;
}) {
  const priorityColor =
    issue.priority === 'high'
      ? COLORS.red
      : issue.priority === 'medium'
        ? COLORS.orange
        : COLORS.gray;

  return (
    <View style={styles.issueRow}>
      <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
      <View style={styles.issueContent}>
        <Text style={styles.issueDescription}>{issue.description}</Text>
        {showSource && (
          <View style={styles.issueMetaRow}>
            <Clock size={10} color={COLORS.gray} />
            <Text style={styles.issueMeta}>{issue.fromRaceName}</Text>
          </View>
        )}
      </View>
      <View style={styles.issueActions}>
        <Pressable
          style={styles.resolveButton}
          onPress={onResolve}
          disabled={isResolving}
        >
          {isResolving ? (
            <ActivityIndicator size="small" color={COLORS.green} />
          ) : (
            <Check size={16} color={COLORS.green} />
          )}
        </Pressable>
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <X size={14} color={COLORS.gray} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.label,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    gap: 24,
  },

  // Sections
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Input
  inputRow: {
    gap: 8,
  },
  textInput: {
    backgroundColor: COLORS.gray6,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.label,
    minHeight: 56,
    textAlignVertical: 'top',
  },

  // Priority pills
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    marginRight: 4,
  },
  priorityPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.gray6,
  },
  priorityPillActive: {
    backgroundColor: COLORS.blue,
  },
  priorityPillHigh: {
    backgroundColor: COLORS.red,
  },
  priorityPillMedium: {
    backgroundColor: COLORS.orange,
  },
  priorityPillLow: {
    backgroundColor: COLORS.green,
  },
  priorityPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  priorityPillTextActive: {
    color: '#FFFFFF',
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  flowHint: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.orange,
    fontStyle: 'italic',
  },

  // Suggestions
  suggestionsGrid: {
    gap: 6,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.label,
  },

  // Issue rows
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  issueContent: {
    flex: 1,
    gap: 2,
  },
  issueDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.label,
  },
  issueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  issueMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.gray,
  },
  issueActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resolveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EquipmentIssuesSheet;
