/**
 * InteractiveChecklist
 *
 * An expandable checklist with sub-items for detailed equipment checks.
 * Used for items that need multiple sub-tasks to be verified.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  BookOpen,
  Info,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { ChecklistItem } from '@/types/checklists';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  gray6: '#1C1C1E',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

interface SubItem {
  id: string;
  label: string;
  description?: string;
}

interface InteractiveChecklistProps extends ChecklistToolProps {
  // Additional props can be added here
}

export function InteractiveChecklist({
  item,
  raceEventId,
  onComplete,
  onCancel,
}: InteractiveChecklistProps) {
  const router = useRouter();

  // Extract sub-items from tool config or use defaults
  const subItems: SubItem[] = useMemo(() => {
    if (item.toolConfig?.subItems) {
      return item.toolConfig.subItems as SubItem[];
    }
    // Default sub-items if none provided
    return [
      { id: 'item1', label: 'Item 1', description: 'Description for item 1' },
      { id: 'item2', label: 'Item 2', description: 'Description for item 2' },
    ];
  }, [item.toolConfig]);

  // Track completed sub-items
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const progress = completedItems.size / subItems.length;
  const allComplete = completedItems.size === subItems.length;

  const toggleItem = useCallback((itemId: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItem((prev) => (prev === itemId ? null : itemId));
  }, []);

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

  const handleDone = useCallback(() => {
    onComplete();
  }, [onComplete]);

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
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item.label}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              allComplete && styles.progressComplete,
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {completedItems.size} of {subItems.length} complete
        </Text>
      </View>

      {/* Description */}
      {item.description && (
        <View style={styles.descriptionContainer}>
          <Info size={16} color={IOS_COLORS.gray} />
          <Text style={styles.description}>{item.description}</Text>
        </View>
      )}

      {/* Sub-items List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {subItems.map((subItem, index) => {
          const isCompleted = completedItems.has(subItem.id);
          const isExpanded = expandedItem === subItem.id;

          return (
            <View key={subItem.id} style={styles.itemWrapper}>
              <Pressable
                style={[
                  styles.itemRow,
                  isCompleted && styles.itemRowCompleted,
                ]}
                onPress={() => toggleItem(subItem.id)}
              >
                <View style={styles.checkbox}>
                  {isCompleted ? (
                    <CheckCircle2 size={24} color={IOS_COLORS.green} />
                  ) : (
                    <Circle size={24} color={IOS_COLORS.gray} />
                  )}
                </View>
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemLabel,
                      isCompleted && styles.itemLabelCompleted,
                    ]}
                  >
                    {subItem.label}
                  </Text>
                  {subItem.description && !isExpanded && (
                    <Text style={styles.itemHint} numberOfLines={1}>
                      {subItem.description}
                    </Text>
                  )}
                </View>
                {subItem.description && (
                  <Pressable
                    style={styles.expandButton}
                    onPress={() => toggleExpanded(subItem.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Info
                      size={18}
                      color={isExpanded ? IOS_COLORS.blue : IOS_COLORS.gray}
                    />
                  </Pressable>
                )}
              </Pressable>

              {/* Expanded Description */}
              {isExpanded && subItem.description && (
                <View style={styles.expandedContent}>
                  <Text style={styles.expandedText}>{subItem.description}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {item.learningModuleSlug && (
          <Pressable style={styles.learnButton} onPress={handleLearnMore}>
            <BookOpen size={16} color={IOS_COLORS.purple} />
            <Text style={styles.learnButtonText}>Learn More</Text>
            <ChevronRight size={16} color={IOS_COLORS.purple} />
          </Pressable>
        )}
        <Pressable
          style={[styles.doneButton, !allComplete && styles.doneButtonDisabled]}
          onPress={handleDone}
        >
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.doneButtonText}>
            {allComplete ? 'Mark Complete' : `${subItems.length - completedItems.size} Remaining`}
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
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 80,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  progressBar: {
    height: 6,
    backgroundColor: IOS_COLORS.separator,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 3,
  },
  progressComplete: {
    backgroundColor: IOS_COLORS.green,
  },
  progressText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: `${IOS_COLORS.blue}08`,
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  itemWrapper: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  itemRowCompleted: {
    backgroundColor: `${IOS_COLORS.green}08`,
  },
  checkbox: {
    width: 24,
    height: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  itemLabelCompleted: {
    color: IOS_COLORS.secondaryLabel,
  },
  itemHint: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },
  expandButton: {
    padding: 4,
  },
  expandedContent: {
    paddingHorizontal: 52,
    paddingBottom: 16,
    paddingTop: 0,
  },
  expandedText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  bottomActions: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    gap: 10,
  },
  learnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.purple}15`,
    gap: 6,
  },
  learnButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.purple,
    flex: 1,
    textAlign: 'center',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.green,
    gap: 8,
  },
  doneButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default InteractiveChecklist;
