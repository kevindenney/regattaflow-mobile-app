/**
 * FocusConceptPicker — lets the sailor link Playbook concepts
 * to a race as focus areas for deliberate practice on race day.
 *
 * Opened from the Plan tab, displays linked concepts on the Racing tab.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  BookOpen,
  Check,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';
import { useInterest } from '@/providers/InterestProvider';
import { usePlaybook, usePlaybookConcepts } from '@/hooks/usePlaybook';
import type { PlaybookConceptRecord } from '@/types/playbook';
import type { RaceFocusConcept } from '@/types/raceIntentions';

const IOS_COLORS = {
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
};

interface FocusConceptPickerProps {
  /** Currently linked focus concepts */
  existingConcepts: RaceFocusConcept[];
  /** Callback to save updated concepts */
  onSave: (concepts: RaceFocusConcept[]) => void;
  /** Close the picker */
  onClose: () => void;
}

export function FocusConceptPicker({
  existingConcepts,
  onSave,
  onClose,
}: FocusConceptPickerProps) {
  const { currentInterest } = useInterest();
  const interestId = currentInterest?.id;
  const { data: playbook } = usePlaybook(interestId);
  const { data: concepts, isLoading } = usePlaybookConcepts(playbook?.id, interestId);

  const [selectedConcepts, setSelectedConcepts] = useState<RaceFocusConcept[]>(existingConcepts);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingReminder, setEditingReminder] = useState<string | null>(null);
  const [reminderText, setReminderText] = useState('');

  // Filter concepts by search
  const filteredConcepts = useMemo(() => {
    if (!concepts) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return concepts;
    return concepts.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.body_md?.toLowerCase().includes(q)
    );
  }, [concepts, searchQuery]);

  // Check if a concept is already selected
  const isSelected = useCallback(
    (conceptId: string) => selectedConcepts.some((c) => c.conceptId === conceptId),
    [selectedConcepts]
  );

  // Toggle a concept selection
  const handleToggle = useCallback(
    (concept: PlaybookConceptRecord) => {
      if (isSelected(concept.id)) {
        setSelectedConcepts((prev) => prev.filter((c) => c.conceptId !== concept.id));
      } else {
        const newFocus: RaceFocusConcept = {
          conceptId: concept.id,
          title: concept.title,
          slug: concept.slug,
          linkedAt: new Date().toISOString(),
        };
        setSelectedConcepts((prev) => [...prev, newFocus]);
        // Open reminder editor for newly added concept
        setEditingReminder(concept.id);
        setReminderText('');
      }
    },
    [isSelected]
  );

  // Save reminder for a concept
  const handleSaveReminder = useCallback(
    (conceptId: string) => {
      setSelectedConcepts((prev) =>
        prev.map((c) =>
          c.conceptId === conceptId
            ? { ...c, reminder: reminderText.trim() || undefined }
            : c
        )
      );
      setEditingReminder(null);
      setReminderText('');
    },
    [reminderText]
  );

  // Remove a linked concept
  const handleRemove = useCallback((conceptId: string) => {
    setSelectedConcepts((prev) => prev.filter((c) => c.conceptId !== conceptId));
  }, []);

  // Save and close
  const handleDone = useCallback(() => {
    onSave(selectedConcepts);
    onClose();
  }, [selectedConcepts, onSave, onClose]);

  // Extract first sentence from body_md as a preview
  const getConceptPreview = (bodyMd: string): string => {
    const firstLine = bodyMd.split('\n').find((l) => l.trim() && !l.startsWith('#'));
    if (!firstLine) return '';
    const firstSentence = firstLine.split(/[.!?]/)[0];
    return firstSentence ? firstSentence.trim().slice(0, 100) : '';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BookOpen size={20} color={IOS_COLORS.blue} />
          <Text style={styles.headerTitle}>Focus Concepts</Text>
        </View>
        <Pressable onPress={handleDone} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        Pick concepts from your Playbook to practice during this race
      </Text>

      {/* Selected concepts */}
      {selectedConcepts.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.sectionLabel}>LINKED TO THIS RACE</Text>
          {selectedConcepts.map((fc) => (
            <View key={fc.conceptId} style={styles.selectedCard}>
              <View style={styles.selectedCardHeader}>
                <Check size={16} color={IOS_COLORS.green} />
                <Text style={styles.selectedTitle} numberOfLines={1}>
                  {fc.title}
                </Text>
                <Pressable onPress={() => handleRemove(fc.conceptId)} hitSlop={8}>
                  <Trash2 size={14} color={IOS_COLORS.red} />
                </Pressable>
              </View>
              {editingReminder === fc.conceptId ? (
                <View>
                  <View style={styles.reminderInputRow}>
                    <TextInput
                      style={styles.reminderInput}
                      value={reminderText}
                      onChangeText={setReminderText}
                      placeholder="Race-day reminder (e.g., 'Look for shifts early')"
                      placeholderTextColor={IOS_COLORS.gray}
                      autoFocus
                      maxLength={120}
                      onSubmitEditing={() => handleSaveReminder(fc.conceptId)}
                      returnKeyType="done"
                    />
                    <Pressable onPress={() => handleSaveReminder(fc.conceptId)} hitSlop={8}>
                      <Check size={16} color={IOS_COLORS.blue} />
                    </Pressable>
                  </View>
                  <Text style={{ fontSize: 11, color: reminderText.length >= 110 ? IOS_COLORS.orange : IOS_COLORS.gray, textAlign: 'right', marginTop: 2, marginRight: 30 }}>
                    {reminderText.length}/120
                  </Text>
                </View>
              ) : fc.reminder ? (
                <Pressable
                  onPress={() => {
                    setEditingReminder(fc.conceptId);
                    setReminderText(fc.reminder || '');
                  }}
                >
                  <Text style={styles.reminderText}>"{fc.reminder}"</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    setEditingReminder(fc.conceptId);
                    setReminderText('');
                  }}
                >
                  <Text style={styles.addReminderText}>+ Add race-day reminder</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={16} color={IOS_COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search concepts..."
          placeholderTextColor={IOS_COLORS.gray}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <X size={14} color={IOS_COLORS.gray} />
          </Pressable>
        )}
      </View>

      {/* Concept list */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={IOS_COLORS.blue} />
            <Text style={styles.loadingText}>Loading concepts...</Text>
          </View>
        ) : filteredConcepts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BookOpen size={24} color={IOS_COLORS.gray} />
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No concepts match your search'
                : 'No concepts in your Playbook yet. Add concepts from the Playbook tab to link them here.'}
            </Text>
          </View>
        ) : (
          filteredConcepts.map((concept) => {
            const selected = isSelected(concept.id);
            const preview = getConceptPreview(concept.body_md || '');
            return (
              <Pressable
                key={concept.id}
                style={[styles.conceptRow, selected && styles.conceptRowSelected]}
                onPress={() => handleToggle(concept)}
              >
                <View style={[styles.conceptCheck, selected && styles.conceptCheckSelected]}>
                  {selected && <Check size={12} color="#FFFFFF" />}
                </View>
                <View style={styles.conceptContent}>
                  <Text style={styles.conceptTitle} numberOfLines={1}>
                    {concept.title}
                  </Text>
                  {preview ? (
                    <Text style={styles.conceptPreview} numberOfLines={2}>
                      {preview}
                    </Text>
                  ) : null}
                </View>
                <ChevronRight size={14} color={IOS_COLORS.gray3} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  doneButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 16,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    lineHeight: 19,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
    marginBottom: 4,
  },
  selectedSection: {
    gap: 6,
  },
  selectedCard: {
    backgroundColor: `${IOS_COLORS.green}10`,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.green}30`,
  },
  selectedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  reminderInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 24,
  },
  reminderInput: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  reminderText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: IOS_COLORS.secondaryLabel,
    marginLeft: 24,
  },
  addReminderText: {
    fontSize: 13,
    color: IOS_COLORS.blue,
    marginLeft: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
    padding: 0,
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  conceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  conceptRowSelected: {
    backgroundColor: `${IOS_COLORS.blue}06`,
  },
  conceptCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptCheckSelected: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  conceptContent: {
    flex: 1,
    gap: 2,
  },
  conceptTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  conceptPreview: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    lineHeight: 17,
  },
});
