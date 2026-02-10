/**
 * LogisticsPlannerWizard
 *
 * An interactive wizard for planning race logistics:
 * - Transport (how you're getting there)
 * - Accommodation (where you're staying)
 * - Provisions (food/drink plan)
 *
 * Each item can have notes and be marked complete.
 * Saves state locally via the checklist system.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Check,
  Car,
  Home,
  UtensilsCrossed,
  Circle,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

interface LogisticsItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  placeholder: string;
  suggestions: string[];
}

const LOGISTICS_ITEMS: LogisticsItem[] = [
  {
    id: 'transport',
    label: 'Transport',
    description: 'How are you getting to the venue?',
    icon: Car,
    iconColor: IOS_COLORS.green,
    placeholder: 'e.g., Driving with boat trailer, departing 7am',
    suggestions: [
      'Drive with trailer',
      'Carpool with crew',
      'Boat kept at club',
      'Charter at venue',
    ],
  },
  {
    id: 'accommodation',
    label: 'Accommodation',
    description: 'Where are you staying?',
    icon: Home,
    iconColor: IOS_COLORS.blue,
    placeholder: 'e.g., Club house, arriving Friday evening',
    suggestions: [
      'Day trip - no accommodation',
      'Club accommodation',
      'Hotel nearby',
      'Camping at venue',
    ],
  },
  {
    id: 'food',
    label: 'Provisions',
    description: 'What food and drinks are you bringing?',
    icon: UtensilsCrossed,
    iconColor: IOS_COLORS.orange,
    placeholder: 'e.g., Packed lunch, energy bars, water bottles',
    suggestions: [
      'Pack lunches',
      'Buy at venue',
      'Club catering',
      'Crew bringing shared provisions',
    ],
  },
];

interface ItemState {
  done: boolean;
  notes: string;
  expanded: boolean;
}

interface LogisticsPlannerWizardProps extends ChecklistToolProps {
  /** Callback to toggle individual checklist items by id */
  onToggleItem?: (itemId: string) => void;
  /** Callback to complete an item with notes */
  onCompleteItem?: (itemId: string, notes?: string) => void;
  /** Callback to uncomplete an item */
  onUncompleteItem?: (itemId: string) => void;
  /** Map of already-completed logistics item ids */
  completedItems?: Record<string, boolean>;
  /** Existing notes for each logistics item (keyed by item id) */
  existingNotes?: Record<string, string>;
}

export function LogisticsPlannerWizard({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
  onToggleItem,
  onCompleteItem,
  onUncompleteItem,
  completedItems,
  existingNotes,
}: LogisticsPlannerWizardProps) {
  // Initialize state from any pre-completed items and existing notes
  const [items, setItems] = useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {};
    for (const li of LOGISTICS_ITEMS) {
      initial[li.id] = {
        done: completedItems?.[li.id] ?? false,
        notes: existingNotes?.[li.id] ?? '',
        expanded: true,
      };
    }
    return initial;
  });

  const toggleDone = useCallback((id: string) => {
    setItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], done: !prev[id].done },
    }));
  }, []);

  const setNotes = useCallback((id: string, notes: string) => {
    setItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], notes },
    }));
  }, []);

  const selectSuggestion = useCallback((id: string, suggestion: string) => {
    setItems((prev) => {
      const existing = prev[id].notes;
      // Toggle: if suggestion is already in notes, remove it; otherwise add it
      const lines = existing ? existing.split('\n').filter(Boolean) : [];
      const idx = lines.indexOf(suggestion);
      let newLines: string[];
      if (idx >= 0) {
        newLines = lines.filter((_, i) => i !== idx);
      } else {
        newLines = [...lines, suggestion];
      }
      return {
        ...prev,
        [id]: { ...prev[id], notes: newLines.join('\n') },
      };
    });
  }, []);

  // An item is "arranged" if the user toggled it done OR entered any notes/selections
  const isArranged = useCallback((id: string) => {
    const state = items[id];
    return state.done || state.notes.trim().length > 0;
  }, [items]);

  const completedCount = LOGISTICS_ITEMS.filter((li) => isArranged(li.id)).length;
  const totalCount = LOGISTICS_ITEMS.length;

  const handleSave = useCallback(() => {
    // Save each logistics item - treat items with notes as complete
    if (onCompleteItem) {
      for (const li of LOGISTICS_ITEMS) {
        const arranged = isArranged(li.id);
        const wasComplete = completedItems?.[li.id] ?? false;
        const notes = items[li.id].notes.trim();
        const hadNotes = existingNotes?.[li.id] ?? '';

        if (arranged) {
          // Save if newly arranged or notes changed
          if (!wasComplete || notes !== hadNotes) {
            onCompleteItem(li.id, notes || undefined);
          }
        } else if (wasComplete && onUncompleteItem) {
          // User cleared an item that was previously complete
          onUncompleteItem(li.id);
        }
      }
    }
    onComplete();
  }, [items, isArranged, completedItems, existingNotes, onCompleteItem, onUncompleteItem, onComplete]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={IOS_COLORS.blue} />
          <Text style={styles.backText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Plan Logistics</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryIcon}>
          <Car size={24} color={IOS_COLORS.green} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryTitle}>Travel & Logistics</Text>
          <Text style={styles.summarySubtitle}>
            {completedCount} of {totalCount} arranged
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {LOGISTICS_ITEMS.map((li) => {
          const state = items[li.id];
          const arranged = isArranged(li.id);
          const Icon = li.icon;
          return (
            <View key={li.id} style={[styles.itemCard, arranged && styles.itemCardDone]}>
              {/* Item header row */}
              <Pressable
                style={styles.itemHeader}
                onPress={() => toggleDone(li.id)}
              >
                <View style={[styles.itemIconBg, { backgroundColor: `${li.iconColor}15` }]}>
                  <Icon size={20} color={li.iconColor} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemLabel}>{li.label}</Text>
                  <Text style={styles.itemDescription}>{li.description}</Text>
                </View>
                {arranged ? (
                  <CheckCircle2 size={24} color={IOS_COLORS.green} />
                ) : (
                  <Circle size={24} color={IOS_COLORS.gray} />
                )}
              </Pressable>

              {/* Quick suggestions */}
              <View style={styles.suggestionsRow}>
                {li.suggestions.map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.suggestionChip,
                      state.notes.includes(s) && styles.suggestionChipActive,
                    ]}
                    onPress={() => selectSuggestion(li.id, s)}
                  >
                    <Text
                      style={[
                        styles.suggestionText,
                        state.notes.includes(s) && styles.suggestionTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Notes input */}
              <View style={styles.notesSection}>
                <View style={styles.notesHeader}>
                  <MessageSquare size={14} color={IOS_COLORS.gray} />
                  <Text style={styles.notesLabel}>Notes</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  placeholder={li.placeholder}
                  placeholderTextColor={IOS_COLORS.gray}
                  value={state.notes}
                  onChangeText={(text) => setNotes(li.id, text)}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomAction}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {completedCount === totalCount ? 'All Set!' : `Save (${completedCount}/${totalCount})`}
          </Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  backText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 80,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    gap: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  summarySubtitle: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  itemCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  itemCardDone: {
    backgroundColor: `${IOS_COLORS.green}05`,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.green}25`,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  itemDescription: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 52,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
  },
  suggestionChipActive: {
    backgroundColor: `${IOS_COLORS.blue}15`,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  suggestionTextActive: {
    color: IOS_COLORS.blue,
  },
  notesSection: {
    paddingLeft: 52,
    gap: 6,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.3,
  },
  notesInput: {
    fontSize: 14,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 8,
    padding: 10,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.green,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LogisticsPlannerWizard;
