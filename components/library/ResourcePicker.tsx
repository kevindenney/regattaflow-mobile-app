/**
 * ResourcePicker — modal for selecting resources from the user's library
 * to link to a step's plan.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { useLibrary, useLibraryResources } from '@/hooks/useLibrary';
import { useInterest } from '@/providers/InterestProvider';
import { ResourceTypeIcon, getResourceTypeLabel } from './ResourceTypeIcon';
import type { LibraryResourceRecord } from '@/types/library';

interface ResourcePickerProps {
  visible: boolean;
  interestId: string | undefined;
  excludeIds?: string[];
  onSelect: (resources: LibraryResourceRecord[]) => void;
  onClose: () => void;
}

export function ResourcePicker({
  visible,
  interestId,
  excludeIds = [],
  onSelect,
  onClose,
}: ResourcePickerProps) {
  const { currentInterest } = useInterest();
  const resolvedInterestId = interestId || currentInterest?.id;
  const { data: library } = useLibrary(resolvedInterestId);
  const { data: allResources, isLoading } = useLibraryResources(library?.id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const availableResources = useMemo(() => {
    if (!allResources) return [];
    return allResources.filter((r) => !excludeIds.includes(r.id));
  }, [allResources, excludeIds]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDone = () => {
    const selected = availableResources.filter((r) => selectedIds.has(r.id));
    onSelect(selected);
    setSelectedIds(new Set());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Select Resources</Text>
          <Pressable onPress={handleDone} disabled={selectedIds.size === 0}>
            <Text style={[styles.doneText, selectedIds.size === 0 && styles.doneTextDisabled]}>
              Add ({selectedIds.size})
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
          </View>
        ) : availableResources.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="library-outline" size={48} color={IOS_COLORS.systemGray3} />
            <Text style={styles.emptyTitle}>Library Empty</Text>
            <Text style={styles.emptySubtitle}>
              Add learning resources to your library first.
            </Text>
            <Pressable
              style={styles.goToLibraryButton}
              onPress={() => {
                onClose();
                router.push('/library');
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.goToLibraryText}>Go to Library</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {availableResources.map((resource) => {
              const isSelected = selectedIds.has(resource.id);
              return (
                <Pressable
                  key={resource.id}
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => toggleSelection(resource.id)}
                >
                  <View style={styles.checkCircle}>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={IOS_COLORS.systemBlue} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={24} color={IOS_COLORS.systemGray3} />
                    )}
                  </View>
                  <View style={styles.iconWrapper}>
                    <ResourceTypeIcon type={resource.resource_type} size={20} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{resource.title}</Text>
                    {resource.author_or_creator && (
                      <Text style={styles.rowAuthor} numberOfLines={1}>
                        {resource.author_or_creator}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.rowType}>
                    {getResourceTypeLabel(resource.resource_type)}
                  </Text>
                </Pressable>
              );
            })}

            {/* Link to full Library Manager */}
            <Pressable
              style={styles.manageLibraryLink}
              onPress={() => {
                onClose();
                router.push('/library');
              }}
            >
              <Ionicons name="library-outline" size={16} color={IOS_COLORS.systemBlue} />
              <Text style={styles.manageLibraryText}>Manage Library</Text>
              <Ionicons name="chevron-forward" size={14} color={IOS_COLORS.systemBlue} />
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

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
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  doneTextDisabled: {
    color: IOS_COLORS.systemGray3,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
    padding: IOS_SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  emptySubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  goToLibraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: IOS_SPACING.sm,
  },
  goToLibraryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: IOS_SPACING.md,
    gap: IOS_SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: IOS_SPACING.sm,
    gap: IOS_SPACING.sm,
  },
  rowSelected: {
    backgroundColor: 'rgba(0,122,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.2)',
  },
  checkCircle: {
    width: 24,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  rowAuthor: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  rowType: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '500',
  },
  manageLibraryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: IOS_SPACING.md,
    marginTop: IOS_SPACING.sm,
  },
  manageLibraryText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
});
